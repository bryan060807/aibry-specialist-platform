import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";
import ts from "typescript";

const modulesPromise = importApplicationModules();

async function importApplicationModules() {
  const outputRoot = mkdtempSync(join(tmpdir(), "asos-application-service-test-"));
  const modulePaths = [
    "lib/domain/case.ts",
    "lib/domain/authority.ts",
    "lib/domain/execution.ts",
    "lib/domain/specialists.ts",
    "lib/kernel/case-kernel.ts",
    "lib/application/ports/authority-resolution.ts",
    "lib/application/ports/case-persistence.ts",
    "lib/application/ports/command-execution.ts",
    "lib/application/case-application-service.ts",
  ];

  for (const modulePath of modulePaths) {
    const source = readFileSync(new URL(`../${modulePath}`, import.meta.url), "utf8");
    const output = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.ES2022,
        target: ts.ScriptTarget.ES2022,
      },
      fileName: modulePath,
      reportDiagnostics: true,
    });
    const errorDiagnostics = output.diagnostics?.filter(
      (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
    );

    assert.deepEqual(errorDiagnostics, []);

    const outputPath = join(outputRoot, modulePath.replace(/\.ts$/, ".js"));
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, addJsExtensions(output.outputText));
  }

  const [service, authority] = await Promise.all([
    import(pathToFileURL(join(outputRoot, "lib/application/case-application-service.js")).href),
    import(pathToFileURL(join(outputRoot, "lib/domain/authority.js")).href),
  ]);

  return { ...service, ...authority };
}

function addJsExtensions(source) {
  return source.replace(
    /(from\s+["'])(\.\.?\/[^"']+?)(["'];?)/g,
    (match, prefix, specifier, suffix) => {
      if (/\.[cm]?js$/.test(specifier)) {
        return match;
      }

      return `${prefix}${specifier}.js${suffix}`;
    },
  );
}

function project(overrides = {}) {
  return {
    sourceOfTruth: "catalog-os",
    externalProjectId: "catalog-project-42",
    externalProjectKey: "CAT-42",
    canonicalUrl: "catalog://project/42",
    snapshotId: "snapshot-42",
    ...overrides,
  };
}

function request(overrides = {}) {
  return {
    objective: "Apply a governed catalog change.",
    requestedAt: "2026-07-16T10:00:00.000Z",
    scope: "catalog-project-42 only",
    ...overrides,
  };
}

function input(overrides = {}) {
  return {
    caseId: "case-application-1",
    title: "Governed application case",
    request: request(),
    project: project(),
    specialistId: "admitter",
    stageId: "apply",
    requestedAction: "create_record",
    ...overrides,
  };
}

function fixedClock() {
  let tick = 0;

  return {
    now() {
      tick += 1;
      return `2026-07-16T10:00:0${tick}.000Z`;
    },
  };
}

class MemoryCasePersistence {
  constructor(options = {}) {
    this.current = options.current;
    this.version = options.version ?? (options.current ? "v1" : undefined);
    this.saveCount = 0;
    this.loadCount = 0;
    this.throwOnLoad = options.throwOnLoad;
    this.throwOnSave = new Set(options.throwOnSave ?? []);
    this.conflictOnSave = new Set(options.conflictOnSave ?? []);
  }

  async load() {
    this.loadCount += 1;

    if (this.throwOnLoad) {
      throw new Error("load unavailable");
    }

    if (!this.current || !this.version) {
      return undefined;
    }

    return {
      record: this.current,
      version: this.version,
    };
  }

  async save(record, expectedVersion) {
    this.saveCount += 1;

    if (this.throwOnSave.has(this.saveCount)) {
      throw new Error(`save ${this.saveCount} unavailable`);
    }

    if (this.conflictOnSave.has(this.saveCount) || expectedVersion !== this.version) {
      return {
        ok: false,
        conflict: {
          kind: "version_conflict",
          current: this.current && this.version
            ? { record: this.current, version: this.version }
            : undefined,
        },
      };
    }

    this.current = record;
    this.version = `v${this.saveCount}`;

    return {
      ok: true,
      value: {
        record,
        version: this.version,
      },
    };
  }
}

async function createService({
  authority,
  persistence = new MemoryCasePersistence(),
  executor,
} = {}) {
  const { createCaseApplicationService, evaluateAuthority } = await modulesPromise;

  return {
    service: createCaseApplicationService({
      authority: authority ?? trustedAllowAuthority(evaluateAuthority),
      cases: persistence,
      executor: executor ?? successfulExecutor(input()),
      clock: fixedClock(),
    }),
    persistence,
  };
}

function trustedAllowAuthority(evaluateAuthority) {
  return {
    async resolve(authorityInput) {
      return evaluateAuthority({
        ...authorityInput,
        hasHumanAuthorization: true,
        isWithinApprovedScope: true,
      });
    },
  };
}

function trustedKernelAuthority(evaluateAuthority) {
  return {
    async resolve(authorityInput) {
      return evaluateAuthority(authorityInput);
    },
  };
}

function successfulExecutor(runInput, overrides = {}) {
  const calls = [];

  return {
    calls,
    async execute(command) {
      calls.push(command);
      return executionFor(command, runInput, overrides);
    },
  };
}

function executionFor(command, runInput, overrides = {}) {
  const executionId = `execution:${command.authorityDecisionId}`;
  const evidence = overrides.evidence ?? [
    evidenceFor(command, runInput, executionId, overrides.evidenceMetadata ?? {}),
  ];

  return {
    id: overrides.executionId ?? executionId,
    schemaVersion: "asos-execution.v1",
    specialistId: overrides.specialistId ?? runInput.specialistId,
    stageId: overrides.stageId ?? runInput.stageId,
    project: overrides.project ?? runInput.project,
    status: overrides.status ?? "completed",
    objective: runInput.request.objective,
    scope: runInput.request.scope,
    createdAt: "2026-07-16T10:00:00.000Z",
    updatedAt: "2026-07-16T10:00:01.000Z",
    result: overrides.result ?? {
      outcome: overrides.outcome ?? "applied",
      summary: overrides.summary ?? "Governed work completed with bound evidence.",
      evidence,
      completedAt: "2026-07-16T10:00:02.000Z",
    },
  };
}

function evidenceFor(command, runInput, executionId, metadataOverrides = {}) {
  return {
    id: "evidence-application-1",
    kind: "change",
    summary: "Bound evidence for governed execution.",
    recordedAt: "2026-07-16T10:00:02.000Z",
    metadata: {
      caseId: runInput.caseId,
      projectExternalProjectId: runInput.project.externalProjectId,
      specialistId: runInput.specialistId,
      stageId: runInput.stageId,
      authorityDecisionId: command.authorityDecisionId,
      commandId: `command:${command.authorityDecisionId}`,
      executionId,
      idempotencyKey: command.idempotencyKey,
      ...metadataOverrides,
    },
  };
}

test("caller cannot spoof authority through the public API", async () => {
  const { evaluateAuthority } = await modulesPromise;
  const captured = [];
  const executor = successfulExecutor(input());
  const { service } = await createService({
    authority: {
      async resolve(authorityInput) {
        captured.push(authorityInput);
        return evaluateAuthority(authorityInput);
      },
    },
    executor,
  });

  const result = await service.run({
    ...input(),
    hasHumanAuthorization: true,
    currentStatus: "authorized",
    isWithinApprovedScope: true,
  });

  assert.equal(result.ok, false);
  assert.equal(result.error.code, "authority_denied");
  assert.equal(captured[0].hasHumanAuthorization, false);
  assert.equal(captured[0].currentStatus, "authorized");
  assert.equal(captured[0].isWithinApprovedScope, undefined);
  assert.equal(executor.calls.length, 0);
});

test("trusted denial blocks execution", async () => {
  const { evaluateAuthority } = await modulesPromise;
  const runInput = input({
    caseId: "case-denied",
    specialistId: "archivist",
    stageId: "apply",
    requestedAction: undefined,
  });
  const executor = successfulExecutor(runInput);
  const { service } = await createService({
    authority: trustedKernelAuthority(evaluateAuthority),
    executor,
  });

  const result = await service.run(runInput);

  assert.equal(result.ok, false);
  assert.equal(result.error.code, "authority_denied");
  assert.equal(result.value.record.status, "blocked");
  assert.equal(executor.calls.length, 0);
});

test("authorized execution with evidence closes successfully", async () => {
  const runInput = input({ caseId: "case-success" });
  const executor = successfulExecutor(runInput);
  const { service } = await createService({ executor });

  const result = await service.run(runInput);

  assert.equal(result.ok, true);
  assert.equal(result.value.case.record.status, "closed");
  assert.equal(result.value.outcome.result, "successful");
  assert.deepEqual(result.value.case.record.executionIds, [result.detail.executionId]);
  assert.deepEqual(result.value.case.record.evidenceIds, ["evidence-application-1"]);
  assert.equal(executor.calls.length, 1);
  assert.deepEqual(Object.keys(executor.calls[0]).sort(), [
    "authorityDecisionId",
    "caseId",
    "idempotencyKey",
  ]);
});

test("duplicate retry does not execute twice after completion is persisted", async () => {
  const runInput = input({ caseId: "case-duplicate" });
  const executor = successfulExecutor(runInput);
  const { service } = await createService({ executor });

  const first = await service.run(runInput);
  const second = await service.run(runInput);

  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.equal(second.detail.recovered, true);
  assert.equal(executor.calls.length, 1);
});

test("recovers after execution completed but later persistence failed", async () => {
  const runInput = input({ caseId: "case-recover" });
  const persistence = new MemoryCasePersistence({ throwOnSave: [3] });
  const completedCommands = new Map();
  let sideEffects = 0;
  const executor = {
    calls: [],
    async execute(command) {
      this.calls.push(command);

      if (!completedCommands.has(command.idempotencyKey)) {
        sideEffects += 1;
        completedCommands.set(command.idempotencyKey, executionFor(command, runInput));
      }

      return completedCommands.get(command.idempotencyKey);
    },
  };
  const { service } = await createService({ persistence, executor });

  const first = await service.run(runInput);
  const second = await service.run(runInput);

  assert.equal(first.ok, false);
  assert.equal(first.error.code, "persistence_failure");
  assert.equal(second.ok, true);
  assert.equal(second.value.case.record.status, "closed");
  assert.equal(executor.calls.length, 2);
  assert.equal(sideEffects, 1);
});

test("optimistic concurrency conflict is structured", async () => {
  const runInput = input({ caseId: "case-conflict" });
  const persistence = new MemoryCasePersistence({ conflictOnSave: [2] });
  const executor = successfulExecutor(runInput);
  const { service } = await createService({ persistence, executor });

  const result = await service.run(runInput);

  assert.equal(result.ok, false);
  assert.equal(result.error.code, "persistence_conflict");
  assert.equal(result.conflict.kind, "version_conflict");
  assert.equal(executor.calls.length, 0);
});

test("mismatched execution and evidence bindings are rejected", async (t) => {
  const cases = [
    ["case", { evidenceMetadata: { caseId: "wrong-case" } }],
    ["project", { project: project({ externalProjectId: "wrong-project" }) }],
    ["specialist", { specialistId: "manager" }],
    ["stage", { stageId: "validate" }],
    ["decision", { evidenceMetadata: { authorityDecisionId: "wrong-decision" } }],
    ["execution", { executionId: "wrong-execution" }],
    ["command", { evidenceMetadata: { commandId: "wrong-command" } }],
    ["idempotency", { evidenceMetadata: { idempotencyKey: "wrong-key" } }],
  ];

  for (const [name, overrides] of cases) {
    await t.test(name, async () => {
      const runInput = input({ caseId: `case-mismatch-${name}` });
      const executor = successfulExecutor(runInput, overrides);
      const { service } = await createService({ executor });

      const result = await service.run(runInput);

      assert.equal(result.ok, false);
      assert.equal(result.error.code, "invalid_execution_binding");
    });
  }
});

test("failed or cancelled execution cannot close successful", async (t) => {
  for (const [status, outcome] of [
    ["failed", "failed"],
    ["cancelled", "cancelled"],
  ]) {
    await t.test(status, async () => {
      const runInput = input({ caseId: `case-${status}` });
      const executor = successfulExecutor(runInput, {
        status,
        outcome,
        summary: `Execution ${status}.`,
        evidence: [],
      });
      const { service } = await createService({ executor });

      const result = await service.run(runInput);

      assert.equal(result.ok, true);
      assert.equal(result.value.case.record.status, "closed");
      assert.equal(result.value.outcome.result, "failed");
      assert.notEqual(result.value.outcome.result, "successful");
    });
  }
});

test("authority, persistence, and execution exceptions become structured failures", async (t) => {
  await t.test("authority", async () => {
    const executor = successfulExecutor(input({ caseId: "case-authority-throws" }));
    const { service } = await createService({
      authority: {
        async resolve() {
          throw new Error("authority unavailable");
        },
      },
      executor,
    });

    const result = await service.run(input({ caseId: "case-authority-throws" }));

    assert.equal(result.ok, false);
    assert.equal(result.error.code, "authority_failure");
    assert.equal(executor.calls.length, 0);
  });

  await t.test("persistence load", async () => {
    const { service } = await createService({
      persistence: new MemoryCasePersistence({ throwOnLoad: true }),
    });
    const result = await service.run(input({ caseId: "case-load-throws" }));

    assert.equal(result.ok, false);
    assert.equal(result.error.code, "persistence_failure");
  });

  await t.test("persistence save", async () => {
    const { service } = await createService({
      persistence: new MemoryCasePersistence({ throwOnSave: [1] }),
    });
    const result = await service.run(input({ caseId: "case-save-throws" }));

    assert.equal(result.ok, false);
    assert.equal(result.error.code, "persistence_failure");
  });

  await t.test("execution", async () => {
    const { service } = await createService({
      executor: {
        async execute() {
          throw new Error("execution unavailable");
        },
      },
    });
    const result = await service.run(input({ caseId: "case-execution-throws" }));

    assert.equal(result.ok, false);
    assert.equal(result.error.code, "execution_failure");
  });
});

test("service remains provider independent and exposes no spoofable authority fields", () => {
  const source = readFileSync(
    new URL("../lib/application/case-application-service.ts", import.meta.url),
    "utf8",
  );
  const publicInput = source.match(/export type RunGovernedCaseInput[\s\S]*?\n\};/)?.[0] ?? "";

  assert.doesNotMatch(publicInput, /\b(?:hasHumanAuthorization|currentStatus|isWithinApprovedScope|decision|status)\b/);
  assert.doesNotMatch(source, /\b(?:openai|anthropic|gpt|claude|model|http|fetch|axios|postgres|sqlite|drizzle|prisma|database|db)\b/i);
  assert.match(source, /TrustedAuthorityResolver/);
  assert.match(source, /VersionedCasePersistence/);
  assert.match(source, /IdempotentCaseCommandExecutor/);
});
