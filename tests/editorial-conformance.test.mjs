import assert from "node:assert/strict";
import test from "node:test";
import {
  createSpecialistRegistry,
  editorialRegistry,
  ProjectReference,
  evaluateAuthority,
  processCaseStep,
  commandIdentities,
  GovernanceBinding,
} from "../packages/asos-kernel/dist/public/index.js";
import {
  author,
  project,
  input,
  facts,
  harness,
  MemoryCases,
  now,
} from "./helpers/editorial-fixtures.mjs";

test("seven registered editorial specialists execute through the actual application service", async () => {
  for (const registration of editorialRegistry.list) {
    const i = input({ specialistId: registration.id });
    const h = harness(i);
    const r = await h.service.run(i);
    assert.equal(r.ok, true, JSON.stringify(r));
    assert.equal(r.value.case.record.status, "closed");
    assert.equal(h.counts().mutations, 1);
  }
});
test("registry metadata never grants authority by itself", async () => {
  const i = input();
  const h = harness(i, { governance: { resolve: async () => undefined } });
  assert.equal((await h.service.run(i)).ok, false);
  assert.equal(h.counts().mutations, 0);
});
test("unknown specialist, unsupported version and unauthorized stage fail closed", async () => {
  for (const i of [
    input({ specialistId: "unknown.editor" }),
    input({ specialistVersion: "2.0.0" }),
    input({
      stageId: "validate",
      requestedAction: "validate-revision",
      proposalDigest: "b".repeat(64),
    }),
    input({
      specialistId: "brutal-edit.validator",
      stageId: "authorize",
      requestedAction: "authorize-revision",
    }),
  ]) {
    const h = harness(i);
    assert.equal((await h.service.run(i)).ok, false);
    assert.equal(h.counts().mutations, 0);
  }
});
test("generic multi-domain registration is versioned metadata with no unreviewed policy permission", () => {
  const r = {
    ...editorialRegistry.list[0],
    id: "example.observer",
    domain: "another-domain",
    policyId: "example.policy.v1",
  };
  assert.equal(createSpecialistRegistry([r]).list[0].domain, "another-domain");
  assert.throws(() => createSpecialistRegistry([r, r]));
  assert.equal(
    evaluateAuthority({
      specialistId: r.id,
      requestedStageId: "observe",
      currentStatus: "draft",
      hasHumanAuthorization: true,
    }).decision,
    "deny",
  );
});
test("unsupported references and mismatched novel, author or domain are rejected", async () => {
  assert.equal(
    ProjectReference.safeParse({ ...project, sourceOfTruth: "music-vault" })
      .success,
    false,
  );
  for (const bad of [
    { ...project, novelId: "different" },
    { ...project, author: { ...author, subject: "other-author" } },
    { ...project, sourceOfTruth: "catalog-os" },
  ]) {
    const i = input({ project: bad });
    const h = harness(i, {
      governance: { resolve: async (b) => ({ ...facts(b), project }) },
    });
    assert.equal((await h.service.run(i)).ok, false);
    assert.equal(h.counts().mutations, 0);
  }
});
test("successful work requires command-bound immutable-version evidence", async () => {
  const i = input();
  const h = harness(i, { evidence: false });
  const r = await h.service.run(i);
  assert.equal(r.ok, false);
  assert.equal(r.error.code, "invalid_execution_binding");
});
test("human boolean does not substitute for verified approval", async () => {
  const i = input({
    stageId: "apply",
    requestedAction: "apply-revision",
    proposalDigest: "b".repeat(64),
  });
  const h = harness(i, {
    governance: {
      resolve: async (b) => {
        const c = facts(b);
        delete c.approval;
        return c;
      },
    },
  });
  const r = await h.service.run({
    ...i,
    hasHumanAuthorization: true,
    isWithinApprovedScope: true,
  });
  assert.equal(r.ok, false);
  assert.equal(h.counts().mutations, 0);
});
for (const variant of [
  "expired",
  "revoked",
  "unknown",
  "digest",
  "case",
  "action",
  "scope",
  "execution",
  "author",
  "rejected",
  "missing",
])
  test(`approval ${variant} is denied by actual authority policy`, async () => {
    const i = input({
      stageId: "apply",
      requestedAction: "apply-revision",
      proposalDigest: "b".repeat(64),
    });
    const h = harness(i, {
      governance: {
        resolve: async (b) => {
          const c = facts(b);
          if (variant === "expired") c.approval.expiresAt = now;
          if (variant === "revoked" || variant === "unknown")
            c.approval.revocation = variant;
          if (variant === "digest")
            c.approval.binding = { ...b, proposalDigest: "c".repeat(64) };
          if (variant === "case")
            c.approval.binding = { ...b, caseId: "other" };
          if (variant === "action")
            c.approval.binding = { ...b, action: "other" };
          if (variant === "scope")
            c.approval.binding = { ...b, scope: "other" };
          if (variant === "execution")
            c.approval.binding = { ...b, executionId: "other" };
          if (variant === "author")
            c.approval.author = { ...author, issuer: "untrusted" };
          if (variant === "rejected") c.approval.decision = "reject";
          if (variant === "missing") delete c.approval;
          return c;
        },
      },
    });
    assert.equal((await h.service.run(i)).ok, false);
    assert.equal(h.counts().mutations, 0);
  });
test("revocation is refreshed before dispatch and on resumed unfinished commands", async () => {
  const i = input({
    stageId: "apply",
    requestedAction: "apply-revision",
    proposalDigest: "b".repeat(64),
  });
  let checks = 0;
  const h = harness(i, {
    governance: {
      resolve: async (b) => {
        checks++;
        const c = facts(b);
        if (checks > 1) c.revocation = "revoked";
        return c;
      },
    },
  });
  assert.equal((await h.service.run(i)).ok, false);
  assert.equal(h.counts().mutations, 0);
});
test("duplicate execution recovery uses the same kernel command after case save failure", async () => {
  const i = input({
    stageId: "apply",
    requestedAction: "apply-revision",
    proposalDigest: "b".repeat(64),
  });
  const cases = new MemoryCases();
  cases.failClose = true;
  const h = harness(i, { cases });
  const first = await h.service.run(i);
  assert.equal(first.ok, false);
  assert.equal(first.error.code, "persistence_failure");
  const second = await h.service.run(i);
  assert.equal(second.ok, true);
  assert.equal(h.counts().mutations, 1);
  assert.equal(h.counts().calls, 2);
  assert.equal((await h.service.run(i)).detail.recovered, true);
  assert.equal(h.counts().mutations, 1);
});
test("case CAS conflicts are explicit and do not execute", async () => {
  const i = input(),
    cases = new MemoryCases();
  cases.conflict = true;
  const h = harness(i, { cases });
  const r = await h.service.run(i);
  assert.equal(r.error.code, "persistence_conflict");
  assert.equal(h.counts().mutations, 0);
});
test("closed case cannot be reused for an unrelated stage, digest or objective", async () => {
  const i = input(),
    h = harness(i);
  assert.equal((await h.service.run(i)).ok, true);
  for (const next of [
    { ...i, stageId: "propose", requestedAction: "propose-revision" },
    { ...i, request: { ...i.request, objective: "Different work" } },
    { ...i, proposalDigest: "b".repeat(64) },
  ]) {
    const r = await h.service.run(next);
    assert.equal(r.ok, false);
    assert.equal(r.error.code, "case_context_mismatch");
  }
});
test("independent validator cannot authorize, apply or self-certify", async () => {
  const i = input({
    specialistId: "brutal-edit.validator",
    stageId: "validate",
    requestedAction: "validate-revision",
    proposalDigest: "b".repeat(64),
  });
  for (const self of [true, false]) {
    const h = harness(i, {
      governance: {
        resolve: async (b) => ({
          ...facts(b),
          principal: {
            issuer: "test-validator",
            subject: self ? "producer" : "independent",
          },
          validation: {
            proposalProducer: { issuer: "test-validator", subject: "producer" },
            applyExecutor: { issuer: "test-validator", subject: "executor" },
            result: b.project,
            applyCaseId: "separate-apply-case",
          },
        }),
      },
    });
    assert.equal((await h.service.run(i)).ok, !self);
  }
  const h = harness({
    ...i,
    stageId: "apply",
    requestedAction: "apply-revision",
  });
  assert.equal(
    (
      await h.service.run({
        ...i,
        stageId: "apply",
        requestedAction: "apply-revision",
      })
    ).ok,
    false,
  );
});
test("direct kernel evaluation cannot substitute another case ownership binding", () => {
  const i = input();
  const binding = GovernanceBinding.parse({
    schemaVersion: "asos-binding.v1",
    project,
    caseId: i.caseId,
    specialistId: i.specialistId,
    specialistVersion: "1.0.0",
    stage: i.stageId,
    action: i.requestedAction,
    scope: i.request.scope,
    objective: i.request.objective,
    executionId: commandIdentities(i).executionId,
  });
  const opened = processCaseStep({
    step: {
      type: "open_case",
      id: i.caseId,
      title: i.title,
      request: i.request,
      project,
      specialistId: i.specialistId,
      openedAt: now,
      governanceBinding: binding,
    },
  });
  const result = processCaseStep({
    caseRecord: opened.value,
    step: {
      type: "evaluate_authority",
      decisionId: "foreign",
      requestedStageId: "observe",
      currentStatus: "draft",
      hasHumanAuthorization: true,
      requestedAction: "analyze",
      decidedAt: now,
      binding: { ...binding, caseId: "foreign" },
      governance: facts({ ...binding, caseId: "foreign" }),
    },
  });
  assert.equal(result.ok, false);
  assert.equal(result.error.code, "governance_context_mismatch");
});
for (const variant of [
  "expired",
  "revoked",
  "unknown",
  "wrong-actor",
  "no-action-scope",
])
  test(`trusted access ${variant} cannot execute`, async () => {
    const i = input();
    const h = harness(i, {
      governance: {
        resolve: async (b) => {
          const c = facts(b);
          if (variant === "expired") c.expiresAt = now;
          if (variant === "revoked" || variant === "unknown")
            c.revocation = variant;
          if (variant === "wrong-actor")
            c.principal = { ...author, subject: "someone-else" };
          if (variant === "no-action-scope") c.allowedActions = ["different"];
          return c;
        },
      },
    });
    assert.equal((await h.service.run(i)).ok, false);
    assert.equal(h.counts().mutations, 0);
  });
test("cross-novel case mismatch never discloses another owner case record", async () => {
  const i = input(),
    h = harness(i);
  assert.equal((await h.service.run(i)).ok, true);
  const p = {
    ...project,
    novelId: "second-novel",
    externalProjectId: "second-novel",
    author: { ...author, subject: "second-author" },
  };
  const other = harness(input({ project: p }), {
    cases: h.cases,
    governance: {
      resolve: async (b) => ({ ...facts(b), principal: p.author }),
    },
  });
  const result = await other.service.run(input({ project: p }));
  assert.equal(result.ok, false);
  assert.equal(result.error.code, "case_context_mismatch");
  assert.equal(result.value, undefined);
});
