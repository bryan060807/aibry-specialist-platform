import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";
import ts from "typescript";

const kernelModulePromise = importKernelModule();

async function importKernelModule() {
  const outputRoot = mkdtempSync(join(tmpdir(), "asos-kernel-test-"));
  const modulePaths = [
    "lib/domain/case.ts",
    "lib/domain/authority.ts",
    "lib/domain/execution.ts",
    "lib/domain/specialists.ts",
    "lib/kernel/case-kernel.ts",
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

  return import(pathToFileURL(join(outputRoot, "lib/kernel/case-kernel.js")).href);
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

function request(overrides = {}) {
  return {
    objective: "Admit project with governed authority.",
    requestedAt: "2026-07-15T12:00:00.000Z",
    ...overrides,
  };
}

function projectRef(overrides = {}) {
  return {
    sourceOfTruth: "catalog-os",
    externalProjectId: "catalog-project-1",
    externalProjectKey: "CAT-1",
    ...overrides,
  };
}

async function openCaseFor(specialistId, project = projectRef()) {
  const { processCaseStep } = await kernelModulePromise;
  const opened = processCaseStep({
    step: {
      type: "open_case",
      id: `case-${specialistId}`,
      title: "Governed catalog operation",
      request: request(),
      project,
      specialistId,
      openedAt: "2026-07-15T12:00:00.000Z",
    },
  });

  assert.equal(opened.ok, true);
  assert.equal(opened.value.project, project);
  assert.equal(Object.isFrozen(opened.value), true);

  return opened.value;
}

async function evaluateApply(record, hasHumanAuthorization, decisionId = "decision-apply") {
  const { processCaseStep } = await kernelModulePromise;

  return processCaseStep({
    caseRecord: record,
    step: {
      type: "evaluate_authority",
      decisionId,
      requestedStageId: "apply",
      currentStatus: "authorized",
      hasHumanAuthorization,
      decidedAt: "2026-07-15T12:01:00.000Z",
    },
  });
}

test("Archivist denied apply returns a structured conflict and attaches no execution", async () => {
  const { processCaseStep } = await kernelModulePromise;
  const record = await openCaseFor("archivist");
  const evaluated = await evaluateApply(record, true, "decision-archivist-apply");

  assert.equal(evaluated.ok, true);
  assert.equal(evaluated.detail.authorityResult.decision, "deny");
  assert.equal(evaluated.detail.authorityResult.reasonCode, "stage_prohibited");
  assert.equal(evaluated.value.status, "blocked");

  const attached = processCaseStep({
    caseRecord: evaluated.value,
    step: {
      type: "attach_execution",
      executionId: "execution-archivist-apply",
      authorityDecisionId: "decision-archivist-apply",
      attachedAt: "2026-07-15T12:02:00.000Z",
    },
  });

  assert.equal(attached.ok, false);
  assert.equal(attached.error.code, "authority_decision_not_allowed");
  assert.deepEqual(attached.value.executionIds, []);
});

test("Project Admitter apply is blocked before human authorization", async () => {
  const { processCaseStep } = await kernelModulePromise;
  const record = await openCaseFor("admitter");
  const evaluated = await evaluateApply(record, false, "decision-admitter-blocked");

  assert.equal(evaluated.ok, true);
  assert.equal(evaluated.detail.authorityResult.decision, "require_human_authorization");
  assert.equal(evaluated.value.status, "waiting_for_authority");

  const attached = processCaseStep({
    caseRecord: evaluated.value,
    step: {
      type: "attach_execution",
      executionId: "execution-before-human",
      authorityDecisionId: "decision-admitter-blocked",
      attachedAt: "2026-07-15T12:02:00.000Z",
    },
  });

  assert.equal(attached.ok, false);
  assert.equal(attached.error.code, "authority_decision_not_allowed");
  assert.deepEqual(attached.value.executionIds, []);
});

test("Project Admitter apply is allowed after human authorization", async () => {
  const { processCaseStep } = await kernelModulePromise;
  const project = projectRef({ externalProjectId: "catalog-project-authorized" });
  const record = await openCaseFor("admitter", project);
  const evaluated = await evaluateApply(record, true, "decision-admitter-allowed");

  assert.equal(evaluated.ok, true);
  assert.equal(evaluated.detail.authorityResult.decision, "allow");
  assert.equal(evaluated.value.status, "authorized");
  assert.equal(evaluated.value.project, project);

  const attached = processCaseStep({
    caseRecord: evaluated.value,
    step: {
      type: "attach_execution",
      executionId: "execution-after-human",
      authorityDecisionId: "decision-admitter-allowed",
      attachedAt: "2026-07-15T12:02:00.000Z",
    },
  });

  assert.equal(attached.ok, true);
  assert.equal(attached.value.status, "in_progress");
  assert.deepEqual(attached.value.executionIds, ["execution-after-human"]);
});

test("evidence attachment supports successful closure", async () => {
  const { processCaseStep } = await kernelModulePromise;
  const record = await openCaseFor("admitter");
  const evidenced = processCaseStep({
    caseRecord: record,
    step: {
      type: "attach_evidence",
      evidenceIds: ["evidence-admission-review"],
      attachedAt: "2026-07-15T12:03:00.000Z",
    },
  });

  assert.equal(evidenced.ok, true);
  assert.deepEqual(evidenced.value.evidenceIds, ["evidence-admission-review"]);

  const closed = processCaseStep({
    caseRecord: evidenced.value,
    step: {
      type: "close_case",
      outcome: {
        result: "successful",
        summary: "Project admission was evidence-backed.",
      },
      closedAt: "2026-07-15T12:04:00.000Z",
    },
  });

  assert.equal(closed.ok, true);
  assert.equal(closed.value.status, "closed");
  assert.equal(closed.value.closedAt, "2026-07-15T12:04:00.000Z");
});

test("duplicate execution and evidence attachment are idempotent", async () => {
  const { processCaseStep } = await kernelModulePromise;
  const record = await openCaseFor("admitter");
  const evaluated = await evaluateApply(record, true, "decision-idempotent");
  assert.equal(evaluated.ok, true);

  const firstExecution = processCaseStep({
    caseRecord: evaluated.value,
    step: {
      type: "attach_execution",
      executionId: "execution-idempotent",
      authorityDecisionId: "decision-idempotent",
      attachedAt: "2026-07-15T12:05:00.000Z",
    },
  });
  assert.equal(firstExecution.ok, true);

  const duplicateExecution = processCaseStep({
    caseRecord: firstExecution.value,
    step: {
      type: "attach_execution",
      executionId: "execution-idempotent",
      authorityDecisionId: "decision-idempotent",
      attachedAt: "2026-07-15T12:06:00.000Z",
    },
  });

  assert.equal(duplicateExecution.ok, true);
  assert.equal(duplicateExecution.detail.changed, false);
  assert.deepEqual(duplicateExecution.value.executionIds, ["execution-idempotent"]);
  assert.equal(duplicateExecution.value.updatedAt, "2026-07-15T12:05:00.000Z");

  const firstEvidence = processCaseStep({
    caseRecord: duplicateExecution.value,
    step: {
      type: "attach_evidence",
      evidenceIds: ["evidence-idempotent"],
      attachedAt: "2026-07-15T12:07:00.000Z",
    },
  });
  assert.equal(firstEvidence.ok, true);

  const duplicateEvidence = processCaseStep({
    caseRecord: firstEvidence.value,
    step: {
      type: "attach_evidence",
      evidenceIds: ["evidence-idempotent"],
      attachedAt: "2026-07-15T12:08:00.000Z",
    },
  });

  assert.equal(duplicateEvidence.ok, true);
  assert.equal(duplicateEvidence.detail.changed, false);
  assert.deepEqual(duplicateEvidence.value.evidenceIds, ["evidence-idempotent"]);
  assert.equal(duplicateEvidence.value.updatedAt, "2026-07-15T12:07:00.000Z");
});

test("closed case rejects further mutation", async () => {
  const { processCaseStep } = await kernelModulePromise;
  const record = await openCaseFor("admitter");
  const evaluated = await evaluateApply(record, true, "decision-before-close");
  assert.equal(evaluated.ok, true);

  const evidenced = processCaseStep({
    caseRecord: evaluated.value,
    step: {
      type: "attach_evidence",
      evidenceIds: ["evidence-before-close"],
      attachedAt: "2026-07-15T12:09:00.000Z",
    },
  });
  assert.equal(evidenced.ok, true);

  const closed = processCaseStep({
    caseRecord: evidenced.value,
    step: {
      type: "close_case",
      outcome: {
        result: "successful",
        summary: "Closed after collecting evidence.",
      },
      closedAt: "2026-07-15T12:10:00.000Z",
    },
  });
  assert.equal(closed.ok, true);

  const mutatedWithEvidence = processCaseStep({
    caseRecord: closed.value,
    step: {
      type: "attach_evidence",
      evidenceIds: ["evidence-after-close"],
      attachedAt: "2026-07-15T12:11:00.000Z",
    },
  });

  assert.equal(mutatedWithEvidence.ok, false);
  assert.equal(mutatedWithEvidence.error.code, "case_closed");

  const mutatedWithExecution = processCaseStep({
    caseRecord: closed.value,
    step: {
      type: "attach_execution",
      executionId: "execution-after-close",
      authorityDecisionId: "decision-before-close",
      attachedAt: "2026-07-15T12:12:00.000Z",
    },
  });

  assert.equal(mutatedWithExecution.ok, false);
  assert.equal(mutatedWithExecution.error.code, "case_closed");
});

