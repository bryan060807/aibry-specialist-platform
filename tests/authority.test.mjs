import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const authorityModulePromise = importAuthorityModule();

async function importAuthorityModule() {
  const source = readFileSync(new URL("../lib/domain/authority.ts", import.meta.url), "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: "authority.ts",
    reportDiagnostics: true,
  });

  const errorDiagnostics = output.diagnostics?.filter(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
  );

  assert.deepEqual(errorDiagnostics, []);

  return import(`data:text/javascript;base64,${Buffer.from(output.outputText).toString("base64")}`);
}

async function evaluate(input) {
  const { evaluateAuthority } = await authorityModulePromise;
  return evaluateAuthority(input);
}

test("archivist allows observe and validate but denies mutation stages", async () => {
  assert.equal(
    (
      await evaluate({
        specialistId: "archivist",
        requestedStageId: "observe",
        currentStatus: "draft",
        hasHumanAuthorization: false,
      })
    ).decision,
    "allow",
  );

  assert.equal(
    (
      await evaluate({
        specialistId: "archivist",
        requestedStageId: "validate",
        currentStatus: "completed",
        hasHumanAuthorization: false,
      })
    ).decision,
    "allow",
  );

  const proposed = await evaluate({
    specialistId: "archivist",
    requestedStageId: "propose",
    currentStatus: "observing",
    hasHumanAuthorization: true,
  });

  assert.equal(proposed.decision, "deny");
  assert.equal(proposed.reasonCode, "stage_prohibited");

  const applied = await evaluate({
    specialistId: "archivist",
    requestedStageId: "apply",
    currentStatus: "authorized",
    hasHumanAuthorization: true,
  });

  assert.equal(applied.decision, "deny");
  assert.equal(applied.ruleId, "archivist-no-autonomous-mutation");
});

test("project admitter requires human authorization before authorize and apply", async () => {
  assert.equal(
    (
      await evaluate({
        specialistId: "admitter",
        requestedStageId: "propose",
        currentStatus: "observing",
        hasHumanAuthorization: false,
      })
    ).decision,
    "allow",
  );

  const pendingAuthorization = await evaluate({
    specialistId: "admitter",
    requestedStageId: "authorize",
    currentStatus: "proposed",
    hasHumanAuthorization: false,
  });

  assert.equal(pendingAuthorization.decision, "require_human_authorization");
  assert.equal(pendingAuthorization.reasonCode, "human_authorization_required");

  assert.equal(
    (
      await evaluate({
        specialistId: "admitter",
        requestedStageId: "authorize",
        currentStatus: "proposed",
        hasHumanAuthorization: true,
      })
    ).decision,
    "allow",
  );

  assert.equal(
    (
      await evaluate({
        specialistId: "admitter",
        requestedStageId: "apply",
        currentStatus: "authorized",
        hasHumanAuthorization: false,
      })
    ).decision,
    "require_human_authorization",
  );

  assert.equal(
    (
      await evaluate({
        specialistId: "admitter",
        requestedStageId: "apply",
        currentStatus: "authorized",
        hasHumanAuthorization: true,
      })
    ).decision,
    "allow",
  );

  const invalidTransition = await evaluate({
    specialistId: "admitter",
    requestedStageId: "apply",
    currentStatus: "proposed",
    hasHumanAuthorization: true,
  });

  assert.equal(invalidTransition.decision, "deny");
  assert.equal(invalidTransition.reasonCode, "invalid_execution_status");
});

test("music manager requires human authorization and approved scope before apply", async () => {
  assert.equal(
    (
      await evaluate({
        specialistId: "manager",
        requestedStageId: "apply",
        currentStatus: "authorized",
        hasHumanAuthorization: false,
        isWithinApprovedScope: true,
      })
    ).decision,
    "require_human_authorization",
  );

  const outsideScope = await evaluate({
    specialistId: "manager",
    requestedStageId: "apply",
    currentStatus: "authorized",
    hasHumanAuthorization: true,
  });

  assert.equal(outsideScope.decision, "deny");
  assert.equal(outsideScope.reasonCode, "approved_scope_required");

  assert.equal(
    (
      await evaluate({
        specialistId: "manager",
        requestedStageId: "apply",
        currentStatus: "authorized",
        hasHumanAuthorization: true,
        isWithinApprovedScope: true,
      })
    ).decision,
    "allow",
  );
});

test("normal denials return structured results", async () => {
  const result = await evaluate({
    specialistId: "unknown-specialist",
    requestedStageId: "observe",
    currentStatus: "draft",
    hasHumanAuthorization: false,
  });

  assert.equal(result.decision, "deny");
  assert.equal(result.reasonCode, "policy_not_found");
  assert.match(result.reason, /No authority policy/);
});
