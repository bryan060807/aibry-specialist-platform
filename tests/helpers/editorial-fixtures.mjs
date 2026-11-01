// Isolated, externally supplied VERIFIED-FACT test doubles. No AIBRY ID or live authority claims.
import {
  createCaseApplicationService,
  commandIdentities,
  evaluateAuthority,
} from "../../packages/asos-kernel/dist/public/index.js";
export const now = "2026-11-01T13:00:00.000Z";
export const author = {
  issuer: "isolated-test-id",
  subject: "placeholder-author",
};
export const project = {
  sourceOfTruth: "novel-owner",
  schemaVersion: "asos-owner.v1",
  domain: "brutal-edit",
  externalProjectId: "placeholder-novel",
  novelId: "placeholder-novel",
  manuscriptId: "placeholder-manuscript",
  versionId: "original-v1",
  contentDigest: "a".repeat(64),
  author,
};
export function input(overrides = {}) {
  return {
    caseId: "editorial-case-1",
    title: "Placeholder analysis",
    request: {
      objective: "Inspect placeholder evidence",
      requestedAt: now,
      scope: "paragraph-a",
    },
    project,
    specialistId: "brutal-edit.line",
    specialistVersion: "1.0.0",
    stageId: "observe",
    requestedAction: "analyze",
    ...overrides,
  };
}
export function facts(binding) {
  return {
    schemaVersion: "asos-governance.v1",
    accessId: "verified-test-access",
    principal: author,
    project: binding.project,
    allowedActions: [
      "analyze",
      "propose-revision",
      "authorize-revision",
      "apply-revision",
      "validate-revision",
    ],
    expiresAt: "2026-11-02T00:00:00Z",
    revocation: "active",
    approval: {
      schemaVersion: "asos-approval.v1",
      receiptId: "verified-test-approval",
      author,
      binding,
      decision: "approve",
      expiresAt: "2026-11-02T00:00:00Z",
      revocation: "active",
    },
  };
}
export class MemoryCases {
  records = new Map();
  failClose = false;
  conflict = false;
  async load(id) {
    return structuredClone(this.records.get(id));
  }
  async save(record, expected) {
    const current = this.records.get(record.id);
    if (this.conflict || current?.version !== expected)
      return { ok: false, conflict: { kind: "version_conflict", current } };
    if (this.failClose && record.status === "closed") {
      this.failClose = false;
      throw new Error("isolated-post-execution-case-save-failure");
    }
    const value = {
      record: structuredClone(record),
      version: String(Number(current?.version ?? 0) + 1),
    };
    this.records.set(record.id, value);
    return { ok: true, value: structuredClone(value) };
  }
}
export function execution(input, command, evidence = true) {
  const identities = commandIdentities(input);
  const p = input.project;
  return {
    id: identities.executionId,
    schemaVersion: "asos-execution.v1",
    specialistId: input.specialistId,
    stageId: input.stageId,
    project: p,
    status: "completed",
    objective: input.request.objective,
    createdAt: now,
    updatedAt: now,
    result: {
      outcome: input.stageId === "validate" ? "validated" : "no_action",
      summary: "Isolated placeholder result",
      evidence: evidence
        ? [
            {
              id: "evidence-placeholder",
              kind: "finding",
              summary: "Placeholder observation",
              recordedAt: now,
              metadata: {
                caseId: input.caseId,
                projectExternalProjectId: p.externalProjectId,
                specialistId: input.specialistId,
                stageId: input.stageId,
                authorityDecisionId: command.authorityDecisionId,
                commandId: identities.commandId,
                executionId: identities.executionId,
                idempotencyKey: command.idempotencyKey,
                ownerSchema: "asos-owner.v1",
                novelId: p.novelId,
                manuscriptId: p.manuscriptId,
                versionId: p.versionId,
                contentDigest: p.contentDigest,
                authorIssuer: p.author.issuer,
                authorSubject: p.author.subject,
                ...(input.proposalDigest
                  ? { proposalDigest: input.proposalDigest }
                  : {}),
              },
            },
          ]
        : [],
    },
  };
}
export function harness(runInput = input(), options = {}) {
  const cases = options.cases ?? new MemoryCases();
  const completed = new Map();
  let calls = 0,
    mutations = 0;
  const executor = options.executor ?? {
    async execute(command) {
      calls++;
      if (completed.has(command.idempotencyKey))
        return structuredClone(completed.get(command.idempotencyKey));
      const result = execution(runInput, command, options.evidence !== false);
      mutations++;
      completed.set(command.idempotencyKey, result);
      return structuredClone(result);
    },
  };
  const service = createCaseApplicationService({
    authority: { resolve: async (i) => evaluateAuthority(i) },
    governance: options.governance ?? { resolve: async (b) => facts(b) },
    cases,
    executor,
    clock: { now: () => now },
  });
  return { service, cases, counts: () => ({ calls, mutations }) };
}
