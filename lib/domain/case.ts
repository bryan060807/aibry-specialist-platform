import type { AuthorityDecision, AuthorityEvaluationResult } from "./authority";
import type { EvidenceRecord, ExecutionRecord, ProjectContextRef } from "./execution";
import type { SpecialistProfile } from "./specialists";

export type CaseId = string;

export type CaseStatus =
  | "open"
  | "waiting_for_authority"
  | "authorized"
  | "in_progress"
  | "blocked"
  | "closed";

export type CaseRequest = {
  objective: string;
  summary?: string;
  requestedBy?: string;
  requestedAt: string;
  scope?: string;
};

export type CaseAuthorityDecisionRecord = {
  id: string;
  decidedAt: string;
  specialistId: SpecialistProfile["id"];
  decision: AuthorityDecision;
  authorityResult: AuthorityEvaluationResult;
  executionId?: ExecutionRecord["id"];
  appliedToWork?: boolean;
};

export type CaseOutcome = {
  result: "successful" | "partial" | "failed";
  summary: string;
};

export type CaseRecord = {
  id: CaseId;
  schemaVersion: "asos-case.v1";
  title: string;
  request: CaseRequest;
  project: ProjectContextRef;
  specialistId: SpecialistProfile["id"];
  status: CaseStatus;
  executionIds: ExecutionRecord["id"][];
  evidenceIds: EvidenceRecord["id"][];
  authorityDecisions: CaseAuthorityDecisionRecord[];
  outcome?: CaseOutcome;
  openedAt: string;
  updatedAt: string;
  closedAt?: string;
};

export type CaseDomainErrorCode =
  | "case_closed"
  | "missing_outcome"
  | "evidence_required"
  | "failed_reason_required"
  | "denied_decision_applied";

export type CaseDomainError = {
  code: CaseDomainErrorCode;
  message: string;
};

export type CaseDomainResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: CaseDomainError };

export type OpenCaseInput = {
  id: CaseId;
  title: string;
  request: CaseRequest;
  project: ProjectContextRef;
  specialistId: SpecialistProfile["id"];
  openedAt: string;
};

function ok<T>(value: T): CaseDomainResult<T> {
  return { ok: true, value };
}

function deny<T>(code: CaseDomainErrorCode, message: string): CaseDomainResult<T> {
  return { ok: false, error: { code, message } };
}

function nextStatusForAuthorityDecision(decision: AuthorityDecision): CaseStatus {
  if (decision === "allow") {
    return "authorized";
  }

  if (decision === "require_human_authorization") {
    return "waiting_for_authority";
  }

  return "blocked";
}

export function openCase(input: OpenCaseInput): CaseDomainResult<CaseRecord> {
  return ok({
    id: input.id,
    schemaVersion: "asos-case.v1",
    title: input.title,
    request: input.request,
    project: input.project,
    specialistId: input.specialistId,
    status: "open",
    executionIds: [],
    evidenceIds: [],
    authorityDecisions: [],
    openedAt: input.openedAt,
    updatedAt: input.openedAt,
  });
}

export function recordAuthorityDecision(
  record: CaseRecord,
  decision: CaseAuthorityDecisionRecord,
  updatedAt: string,
): CaseDomainResult<CaseRecord> {
  if (record.status === "closed") {
    return deny("case_closed", "Cannot record an authority decision on a closed case.");
  }

  if (decision.decision === "deny" && decision.appliedToWork === true) {
    return deny("denied_decision_applied", "A denied authority decision cannot be represented as applied work.");
  }

  return ok({
    ...record,
    status: nextStatusForAuthorityDecision(decision.decision),
    authorityDecisions: [...record.authorityDecisions, decision],
    updatedAt,
  });
}

export function attachExecution(
  record: CaseRecord,
  executionId: ExecutionRecord["id"],
  updatedAt: string,
): CaseDomainResult<CaseRecord> {
  if (record.status === "closed") {
    return deny("case_closed", "Cannot attach execution to a closed case.");
  }

  if (record.executionIds.includes(executionId)) {
    return ok(record);
  }

  return ok({
    ...record,
    status: "in_progress",
    executionIds: [...record.executionIds, executionId],
    updatedAt,
  });
}

export function attachEvidence(
  record: CaseRecord,
  evidenceId: EvidenceRecord["id"],
  updatedAt: string,
): CaseDomainResult<CaseRecord> {
  if (record.status === "closed") {
    return deny("case_closed", "Cannot attach evidence to a closed case.");
  }

  if (record.evidenceIds.includes(evidenceId)) {
    return ok(record);
  }

  return ok({
    ...record,
    evidenceIds: [...record.evidenceIds, evidenceId],
    updatedAt,
  });
}

export function closeCase(
  record: CaseRecord,
  outcome: CaseOutcome | undefined,
  closedAt: string,
): CaseDomainResult<CaseRecord> {
  if (record.status === "closed") {
    return deny("case_closed", "Cannot close a case that is already closed.");
  }

  if (!outcome) {
    return deny("missing_outcome", "Cannot close a case without an outcome.");
  }

  if ((outcome.result === "successful" || outcome.result === "partial") && record.evidenceIds.length === 0) {
    return deny("evidence_required", "Successful and partial case outcomes require at least one evidence reference.");
  }

  if (outcome.result === "failed" && record.evidenceIds.length === 0 && outcome.summary.trim().length === 0) {
    return deny(
      "failed_reason_required",
      "A failed case may close without evidence only when a reason is recorded in the outcome summary.",
    );
  }

  return ok({
    ...record,
    status: "closed",
    outcome,
    updatedAt: closedAt,
    closedAt,
  });
}
