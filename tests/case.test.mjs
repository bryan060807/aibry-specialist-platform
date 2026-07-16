import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const caseModulePromise = importCaseModule();

async function importCaseModule() {
  const source = readFileSync(new URL("../lib/domain/case.ts", import.meta.url), "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: "case.ts",
    reportDiagnostics: true,
  });

  const errorDiagnostics = output.diagnostics?.filter(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
  );

  assert.deepEqual(errorDiagnostics, []);

  return import(`data:text/javascript;base64,${Buffer.from(output.outputText).toString("base64")}`);
}

async function openBaseCase() {
  const { openCase } = await caseModulePromise;
  const project = {
    sourceOfTruth: "catalog-os",
    externalProjectId: "catalog-project-1",
    externalProjectKey: "CAT-1",
  };
  const opened = openCase({
    id: "case-1",
    title: "Review catalog metadata",
    request: {
      objective: "Find missing release metadata.",
      requestedAt: "2026-07-15T12:00:00.000Z",
    },
    project,
    specialistId: "archivist",
    openedAt: "2026-07-15T12:00:00.000Z",
  });

  assert.equal(opened.ok, true);

  return { record: opened.value, project };
}

test("openCase creates a deterministic Catalog OS project reference", async () => {
  const { record, project } = await openBaseCase();

  assert.equal(record.schemaVersion, "asos-case.v1");
  assert.equal(record.status, "open");
  assert.equal(record.project, project);
  assert.deepEqual(record.executionIds, []);
  assert.deepEqual(record.evidenceIds, []);
  assert.deepEqual(record.authorityDecisions, []);
  assert.equal(record.openedAt, "2026-07-15T12:00:00.000Z");
  assert.equal(record.updatedAt, "2026-07-15T12:00:00.000Z");
});

test("recordAuthorityDecision keeps denied decisions out of applied work", async () => {
  const { record } = await openBaseCase();
  const { recordAuthorityDecision } = await caseModulePromise;

  const deniedApplied = recordAuthorityDecision(
    record,
    {
      id: "decision-1",
      decidedAt: "2026-07-15T12:01:00.000Z",
      specialistId: "archivist",
      decision: "deny",
      authorityResult: {
        decision: "deny",
        reason: "Archivist authority is observe-only.",
        reasonCode: "stage_prohibited",
      },
      appliedToWork: true,
    },
    "2026-07-15T12:01:00.000Z",
  );

  assert.equal(deniedApplied.ok, false);
  assert.equal(deniedApplied.error.code, "denied_decision_applied");

  const recordedDenial = recordAuthorityDecision(
    record,
    {
      id: "decision-2",
      decidedAt: "2026-07-15T12:02:00.000Z",
      specialistId: "archivist",
      decision: "deny",
      authorityResult: {
        decision: "deny",
        reason: "Archivist authority is observe-only.",
        reasonCode: "stage_prohibited",
      },
    },
    "2026-07-15T12:02:00.000Z",
  );

  assert.equal(recordedDenial.ok, true);
  assert.equal(recordedDenial.value.status, "blocked");
  assert.equal(recordedDenial.value.authorityDecisions.length, 1);
});

test("duplicate execution and evidence attachments are idempotent", async () => {
  const { record } = await openBaseCase();
  const { attachEvidence, attachExecution } = await caseModulePromise;

  const firstExecution = attachExecution(record, "execution-1", "2026-07-15T12:03:00.000Z");
  assert.equal(firstExecution.ok, true);

  const duplicateExecution = attachExecution(
    firstExecution.value,
    "execution-1",
    "2026-07-15T12:04:00.000Z",
  );
  assert.equal(duplicateExecution.ok, true);
  assert.deepEqual(duplicateExecution.value.executionIds, ["execution-1"]);
  assert.equal(duplicateExecution.value.updatedAt, "2026-07-15T12:03:00.000Z");

  const firstEvidence = attachEvidence(firstExecution.value, "evidence-1", "2026-07-15T12:05:00.000Z");
  assert.equal(firstEvidence.ok, true);

  const duplicateEvidence = attachEvidence(
    firstEvidence.value,
    "evidence-1",
    "2026-07-15T12:06:00.000Z",
  );
  assert.equal(duplicateEvidence.ok, true);
  assert.deepEqual(duplicateEvidence.value.evidenceIds, ["evidence-1"]);
  assert.equal(duplicateEvidence.value.updatedAt, "2026-07-15T12:05:00.000Z");
});

test("closeCase returns structured denials for invalid closure rules", async () => {
  const { record } = await openBaseCase();
  const { closeCase } = await caseModulePromise;

  const missingOutcome = closeCase(record, undefined, "2026-07-15T12:07:00.000Z");
  assert.equal(missingOutcome.ok, false);
  assert.equal(missingOutcome.error.code, "missing_outcome");

  const successfulWithoutEvidence = closeCase(
    record,
    { result: "successful", summary: "Metadata is complete." },
    "2026-07-15T12:08:00.000Z",
  );
  assert.equal(successfulWithoutEvidence.ok, false);
  assert.equal(successfulWithoutEvidence.error.code, "evidence_required");

  const failedWithoutReason = closeCase(
    record,
    { result: "failed", summary: "  " },
    "2026-07-15T12:09:00.000Z",
  );
  assert.equal(failedWithoutReason.ok, false);
  assert.equal(failedWithoutReason.error.code, "failed_reason_required");
});

test("closeCase allows evidence-backed success and reason-backed failure", async () => {
  const { record } = await openBaseCase();
  const { attachEvidence, closeCase } = await caseModulePromise;

  const withEvidence = attachEvidence(record, "evidence-1", "2026-07-15T12:10:00.000Z");
  assert.equal(withEvidence.ok, true);

  const successful = closeCase(
    withEvidence.value,
    { result: "successful", summary: "Metadata is complete." },
    "2026-07-15T12:11:00.000Z",
  );
  assert.equal(successful.ok, true);
  assert.equal(successful.value.status, "closed");
  assert.equal(successful.value.closedAt, "2026-07-15T12:11:00.000Z");

  const failed = closeCase(
    record,
    { result: "failed", summary: "Catalog OS project was missing required source metadata." },
    "2026-07-15T12:12:00.000Z",
  );
  assert.equal(failed.ok, true);
  assert.equal(failed.value.status, "closed");
  assert.equal(failed.value.evidenceIds.length, 0);
});
