import assert from "node:assert/strict";
import test from "node:test";

const modulesPromise = importBuildWeekModules();

async function importBuildWeekModules() {
  return import("../lib/build-week/project-admission-walking-skeleton.ts");
}

test("ASOS Build Week walking skeleton rejects self-approval, executes after authorized approval, replays, resets, and repeats", async () => {
  const { resetBuildWeekDemo, runProjectAdmissionWalkingSkeleton } =
    await modulesPromise;

  const reset = resetBuildWeekDemo();
  assert.equal(reset.ok, true);
  assert.equal(reset.value.status, "reset");

  const first = await runProjectAdmissionWalkingSkeleton();
  assert.equal(first.ok, true);
  assert.equal(
    first.value.fixture.incident.id,
    "incident-trackmaster-login-01",
  );
  assert.equal(first.value.fixture.analysis.mode, "saved-gpt-5.6-response");
  assert.equal(first.value.fixture.specialists.length, 4);
  assert.equal(first.value.selfApproval.rejected, true);
  assert.equal(first.value.selfApproval.error.code, "authority_denied");
  assert.equal(
    first.value.selfApproval.decision.decision,
    "require_human_authorization",
  );
  assert.equal(first.value.authorizedApproval.allowed, true);
  assert.equal(first.value.authorizedApproval.decision.decision, "allow");
  assert.equal(first.value.execution.status, "completed");
  assert.equal(first.value.evidence.length, 1);
  assert.equal(first.value.outcome.result, "successful");
  assert.equal(first.value.case.record.status, "closed");
  assert.equal(first.value.timeline.length, 14);
  assert.equal(
    first.value.replayReport.caseId,
    "build-week-trackmaster-login-incident",
  );
  assert.equal(first.value.replayReport.authorityDecisions.length, 2);

  const secondReset = resetBuildWeekDemo();
  assert.equal(secondReset.ok, true);

  const second = await runProjectAdmissionWalkingSkeleton();
  assert.equal(second.ok, true);
  assert.deepEqual(second.value.timeline, first.value.timeline);
  assert.deepEqual(second.value.replayReport, first.value.replayReport);
});
