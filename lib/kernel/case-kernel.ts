import {
  attachEvidence,
  attachExecution,
  closeCase,
  openCase,
  recordAuthorityDecision,
  type CaseAuthorityDecisionRecord,
  type CaseDomainErrorCode,
  type CaseOutcome,
  type CaseRecord,
  type CaseRequest,
  type OpenCaseInput,
} from "../domain/case";
import {
  evaluateAuthority,
  type AuthorityEvaluationInput,
  type AuthorityEvaluationResult,
} from "../domain/authority";
import type {
  EvidenceRecord,
  ExecutionRecord,
  ExecutionStatus,
  ProjectContextRef,
} from "../domain/execution";
import {
  sameProject,
  sameBinding,
  ProjectReference,
} from "../domain/governance";
import type {
  GovernanceBinding,
  GovernanceContext,
} from "../domain/governance";
import type { AuthorityStageId } from "../domain/specialists";

export type {
  CaseAuthorityDecisionRecord,
  CaseOutcome,
  CaseRecord,
  CaseRequest,
  ProjectContextRef,
};

export type CaseKernelErrorCode =
  | CaseDomainErrorCode
  | "governance_context_mismatch"
  | "case_required"
  | "case_already_open"
  | "authority_decision_not_found"
  | "authority_decision_not_allowed"
  | "unsupported_step";

export type CaseKernelError = {
  code: CaseKernelErrorCode;
  message: string;
};

export type CaseKernelDetail = {
  changed: boolean;
  authorityResult?: AuthorityEvaluationResult;
  authorityDecisionId?: CaseAuthorityDecisionRecord["id"];
};

export type CaseKernelResult<T> =
  | {
      ok: true;
      value: T;
      detail: CaseKernelDetail;
    }
  | {
      ok: false;
      error: CaseKernelError;
      value?: T;
      detail: CaseKernelDetail;
    };

export type InitializeCaseInput = OpenCaseInput;

export type EvaluateAndRecordAuthorityInput = {
  decisionId: CaseAuthorityDecisionRecord["id"];
  requestedStageId: AuthorityStageId;
  currentStatus: ExecutionStatus;
  hasHumanAuthorization: boolean;
  decidedAt: string;
  requestedAction?: string;
  isWithinApprovedScope?: boolean;
  binding?: GovernanceBinding;
  governance?: GovernanceContext;
};

export type AttachAuthorizedExecutionInput = {
  executionId: ExecutionRecord["id"];
  authorityDecisionId: CaseAuthorityDecisionRecord["id"];
  attachedAt: string;
};

export type AttachEvidenceReferencesInput = {
  evidenceIds: readonly EvidenceRecord["id"][];
  attachedAt: string;
};

export type CloseKernelCaseInput = {
  outcome: CaseOutcome;
  closedAt: string;
};

export type CaseKernelStep =
  | ({ type: "open_case" } & InitializeCaseInput)
  | ({ type: "evaluate_authority" } & EvaluateAndRecordAuthorityInput)
  | ({ type: "attach_execution" } & AttachAuthorizedExecutionInput)
  | ({ type: "attach_evidence" } & AttachEvidenceReferencesInput)
  | ({ type: "close_case" } & CloseKernelCaseInput);

export type ProcessCaseStepInput = {
  caseRecord?: CaseRecord;
  step: CaseKernelStep;
};

function ok(
  value: CaseRecord,
  detail: Partial<CaseKernelDetail> = {},
): CaseKernelResult<CaseRecord> {
  return {
    ok: true,
    value: freezeCaseRecord(value),
    detail: {
      changed: detail.changed ?? true,
      authorityResult: detail.authorityResult,
      authorityDecisionId: detail.authorityDecisionId,
    },
  };
}

function deny(
  error: CaseKernelError,
  value: CaseRecord | undefined,
  detail: Partial<CaseKernelDetail> = {},
): CaseKernelResult<CaseRecord> {
  return {
    ok: false,
    error,
    value: value ? freezeCaseRecord(value) : undefined,
    detail: {
      changed: false,
      authorityResult: detail.authorityResult,
      authorityDecisionId: detail.authorityDecisionId,
    },
  };
}

function fromDomainResult(
  result: ReturnType<typeof openCase>,
  detail?: Partial<CaseKernelDetail>,
): CaseKernelResult<CaseRecord>;
function fromDomainResult(
  result:
    | ReturnType<typeof recordAuthorityDecision>
    | ReturnType<typeof attachExecution>
    | ReturnType<typeof attachEvidence>
    | ReturnType<typeof closeCase>,
  detail?: Partial<CaseKernelDetail>,
): CaseKernelResult<CaseRecord>;
function fromDomainResult(
  result:
    | ReturnType<typeof openCase>
    | ReturnType<typeof recordAuthorityDecision>
    | ReturnType<typeof attachExecution>
    | ReturnType<typeof attachEvidence>
    | ReturnType<typeof closeCase>,
  detail: Partial<CaseKernelDetail> = {},
): CaseKernelResult<CaseRecord> {
  if (result.ok) {
    return ok(result.value, detail);
  }

  return deny(result.error, undefined, detail);
}

function freezeCaseRecord(record: CaseRecord): CaseRecord {
  Object.freeze(record.executionIds);
  Object.freeze(record.evidenceIds);

  for (const decision of record.authorityDecisions) {
    Object.freeze(decision);
  }

  Object.freeze(record.authorityDecisions);

  if (record.outcome) {
    Object.freeze(record.outcome);
  }

  return Object.freeze(record);
}

function findAuthorityDecision(
  record: CaseRecord,
  decisionId: CaseAuthorityDecisionRecord["id"],
): CaseAuthorityDecisionRecord | undefined {
  return record.authorityDecisions.findLast(
    (decision) => decision.id === decisionId,
  );
}

export function initializeCase(
  input: InitializeCaseInput,
): CaseKernelResult<CaseRecord> {
  if (!ProjectReference.safeParse(input.project).success)
    return deny(
      {
        code: "governance_context_mismatch",
        message: "Unsupported owner reference.",
      },
      undefined,
    );
  if (
    input.project.sourceOfTruth === "novel-owner" &&
    (!input.governanceBinding ||
      input.governanceBinding.caseId !== input.id ||
      input.governanceBinding.specialistId !== input.specialistId ||
      !sameProject(input.governanceBinding.project, input.project))
  )
    return deny(
      {
        code: "governance_context_mismatch",
        message: "Editorial case requires its own immutable owner binding.",
      },
      undefined,
    );
  return fromDomainResult(openCase(input));
}

export function evaluateAndRecordAuthority(
  record: CaseRecord,
  input: EvaluateAndRecordAuthorityInput,
): CaseKernelResult<CaseRecord> {
  if (
    record.project.sourceOfTruth === "novel-owner" &&
    (!input.binding ||
      !record.governanceBinding ||
      !sameBinding(input.binding, record.governanceBinding) ||
      !sameProject(input.binding.project, record.project) ||
      input.binding.caseId !== record.id)
  )
    return deny(
      {
        code: "governance_context_mismatch",
        message: "Authority binding does not belong to this case.",
      },
      record,
    );
  const authorityInput: AuthorityEvaluationInput = {
    specialistId: record.specialistId,
    requestedStageId: input.requestedStageId,
    currentStatus: input.currentStatus,
    hasHumanAuthorization: input.hasHumanAuthorization,
    requestedAction: input.requestedAction,
    isWithinApprovedScope: input.isWithinApprovedScope,
    binding: input.binding,
    governance: input.governance,
    evaluatedAt: input.decidedAt,
  };
  const authorityResult = evaluateAuthority(authorityInput);
  const decision: CaseAuthorityDecisionRecord = {
    id: input.decisionId,
    decidedAt: input.decidedAt,
    specialistId: record.specialistId,
    decision: authorityResult.decision,
    authorityResult,
  };

  const result = recordAuthorityDecision(record, decision, input.decidedAt);

  if (!result.ok) {
    return deny(result.error, record, {
      authorityResult,
      authorityDecisionId: input.decisionId,
    });
  }

  return ok(result.value, {
    authorityResult,
    authorityDecisionId: input.decisionId,
  });
}

export function attachAuthorizedExecution(
  record: CaseRecord,
  input: AttachAuthorizedExecutionInput,
): CaseKernelResult<CaseRecord> {
  if (
    record.project.sourceOfTruth === "novel-owner" &&
    record.governanceBinding?.executionId !== input.executionId
  )
    return deny(
      {
        code: "governance_context_mismatch",
        message: "Execution does not belong to the bound case command.",
      },
      record,
    );
  const decision = findAuthorityDecision(record, input.authorityDecisionId);

  if (!decision) {
    return deny(
      {
        code: "authority_decision_not_found",
        message: `Authority decision "${input.authorityDecisionId}" is not recorded on this case.`,
      },
      record,
      { authorityDecisionId: input.authorityDecisionId },
    );
  }

  if (decision.decision !== "allow") {
    return deny(
      {
        code: "authority_decision_not_allowed",
        message: `Authority decision "${input.authorityDecisionId}" does not permit execution attachment.`,
      },
      record,
      {
        authorityResult: decision.authorityResult,
        authorityDecisionId: input.authorityDecisionId,
      },
    );
  }

  const result = attachExecution(record, input.executionId, input.attachedAt);

  if (!result.ok) {
    return deny(result.error, record, {
      authorityResult: decision.authorityResult,
      authorityDecisionId: input.authorityDecisionId,
    });
  }

  return ok(result.value, {
    changed: result.value !== record,
    authorityResult: decision.authorityResult,
    authorityDecisionId: input.authorityDecisionId,
  });
}

export function attachEvidenceReferences(
  record: CaseRecord,
  input: AttachEvidenceReferencesInput,
): CaseKernelResult<CaseRecord> {
  let nextRecord = record;
  let changed = false;

  for (const evidenceId of input.evidenceIds) {
    const result = attachEvidence(nextRecord, evidenceId, input.attachedAt);

    if (!result.ok) {
      return deny(result.error, nextRecord);
    }

    changed ||= result.value !== nextRecord;
    nextRecord = result.value;
  }

  return ok(nextRecord, { changed });
}

export function closeKernelCase(
  record: CaseRecord,
  input: CloseKernelCaseInput,
): CaseKernelResult<CaseRecord> {
  const result = closeCase(record, input.outcome, input.closedAt);

  if (!result.ok) {
    return deny(result.error, record);
  }

  return ok(result.value);
}

export function processCaseStep(
  input: ProcessCaseStepInput,
): CaseKernelResult<CaseRecord> {
  const { caseRecord, step } = input;

  if (step.type === "open_case") {
    if (caseRecord) {
      return deny(
        {
          code: "case_already_open",
          message:
            "Cannot open a new case step when a case record is already present.",
        },
        caseRecord,
      );
    }

    return initializeCase(step);
  }

  if (!caseRecord) {
    return deny(
      {
        code: "case_required",
        message: `Step "${step.type}" requires an existing case record.`,
      },
      undefined,
    );
  }

  switch (step.type) {
    case "evaluate_authority":
      return evaluateAndRecordAuthority(caseRecord, step);
    case "attach_execution":
      return attachAuthorizedExecution(caseRecord, step);
    case "attach_evidence":
      return attachEvidenceReferences(caseRecord, step);
    case "close_case":
      return closeKernelCase(caseRecord, step);
    default:
      return deny(
        {
          code: "unsupported_step",
          message: `Unsupported case kernel step "${(step as { type: string }).type}".`,
        },
        caseRecord,
      );
  }
}
