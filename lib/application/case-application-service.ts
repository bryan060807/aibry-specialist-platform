import {
  GovernanceBinding,
  sameBinding,
  sameProject,
  type GovernanceContext,
} from "../domain/governance";
import {
  RunCaseInput,
  ExecutionValue,
  CaseRecordValue,
} from "../domain/runtime";
import { evaluateAuthority } from "../domain/authority";
import type { SpecialistIdentity } from "../domain/registration";
import type { TrustedGovernanceResolver } from "./ports/governance-resolution";
import type { TrustedAuthorityResolver } from "./ports/authority-resolution";
import type {
  CaseSaveConflict,
  CaseVersion,
  VersionedCase,
  VersionedCasePersistence,
} from "./ports/case-persistence";
import type {
  IdempotentCaseCommandExecutor,
  ImmutableCaseCommand,
} from "./ports/command-execution";
import type {
  AuthorityEvaluationInput,
  AuthorityEvaluationResult,
} from "../domain/authority";
import type {
  CaseAuthorityDecisionRecord,
  CaseId,
  CaseOutcome,
  CaseRecord,
  CaseRequest,
} from "../domain/case";
import type {
  EvidenceRecord,
  ExecutionRecord,
  ExecutionStatus,
  ProjectContextRef,
} from "../domain/execution";
import type { AuthorityStageId } from "../domain/specialists";
import { processCaseStep, type CaseKernelError } from "../kernel/case-kernel";

export type CaseApplicationClock = Readonly<{
  now(): string;
}>;

export type CaseApplicationServiceDependencies = Readonly<{
  authority: TrustedAuthorityResolver;
  governance?: TrustedGovernanceResolver;
  cases: VersionedCasePersistence;
  executor: IdempotentCaseCommandExecutor;
  clock?: CaseApplicationClock;
}>;

export type RunGovernedCaseInput = Readonly<{
  caseId: CaseId;
  title: string;
  request: CaseRequest;
  project: ProjectContextRef;
  specialistId: SpecialistIdentity;
  stageId: AuthorityStageId;
  requestedAction?: string;
  specialistVersion?: "1.0.0";
  proposalDigest?: string;
}>;

export type CaseApplicationErrorCode =
  | "invalid_input"
  | "authority_denied"
  | "authority_failure"
  | "authority_protocol_mismatch"
  | "case_context_mismatch"
  | "execution_failure"
  | "invalid_execution_binding"
  | "kernel_rejected"
  | "persistence_conflict"
  | "persistence_failure";

export type CaseApplicationError = Readonly<{
  code: CaseApplicationErrorCode;
  message: string;
}>;

export type CaseApplicationDetail = Readonly<{
  authorityDecisionId: CaseAuthorityDecisionRecord["id"];
  commandId: string;
  idempotencyKey: string;
  executionId: ExecutionRecord["id"];
  recovered: boolean;
}>;

export type CaseApplicationSuccess = Readonly<{
  case: VersionedCase;
  execution?: ExecutionRecord;
  evidence: readonly EvidenceRecord[];
  outcome?: CaseOutcome;
}>;

export type CaseApplicationResult =
  | Readonly<{
      ok: true;
      value: CaseApplicationSuccess;
      detail: CaseApplicationDetail;
    }>
  | Readonly<{
      ok: false;
      error: CaseApplicationError;
      value?: VersionedCase;
      conflict?: CaseSaveConflict;
      detail: CaseApplicationDetail;
    }>;

export type CaseApplicationService = Readonly<{
  run(input: RunGovernedCaseInput): Promise<CaseApplicationResult>;
}>;

const systemClock: CaseApplicationClock = {
  now: () => new Date().toISOString(),
};

const successfulExecutionOutcomes = new Set([
  "no_action",
  "proposal_ready",
  "authorized",
  "applied",
  "validated",
]);

const failedExecutionStatuses: readonly ExecutionStatus[] = [
  "blocked",
  "failed",
  "cancelled",
];

export function createCaseApplicationService(
  dependencies: CaseApplicationServiceDependencies,
): CaseApplicationService {
  const clock = dependencies.clock ?? systemClock;

  return {
    run: (raw) => {
      const input = RunCaseInput.safeParse(raw);
      if (!input.success)
        return Promise.resolve(
          failure("invalid_input", "Invalid governed case input.", {
            authorityDecisionId: "invalid",
            commandId: "invalid",
            idempotencyKey: "invalid",
            executionId: "invalid",
            recovered: false,
          }),
        );
      return runGovernedCase(dependencies, clock, input.data);
    },
  };
}

async function runGovernedCase(
  dependencies: CaseApplicationServiceDependencies,
  clock: CaseApplicationClock,
  input: RunGovernedCaseInput,
): Promise<CaseApplicationResult> {
  const identities = commandIdentities(input);
  let binding: GovernanceBinding | undefined;
  if (input.project.sourceOfTruth === "novel-owner") {
    const parsed = GovernanceBinding.safeParse({
      schemaVersion: "asos-binding.v1",
      project: input.project,
      caseId: input.caseId,
      specialistId: input.specialistId,
      specialistVersion: input.specialistVersion,
      stage: input.stageId,
      action: input.requestedAction,
      scope: input.request.scope,
      objective: input.request.objective,
      proposalDigest: input.proposalDigest,
      executionId: identities.executionId,
    });
    if (!parsed.success)
      return failure(
        "invalid_input",
        "Editorial governance binding is incomplete.",
        identities,
      );
    binding = parsed.data;
  } else if (input.specialistId.includes("."))
    return failure(
      "case_context_mismatch",
      "Editorial specialist requires a novel-owner reference.",
      identities,
    );
  let context: GovernanceContext | undefined;
  if (binding) {
    try {
      context = await dependencies.governance?.resolve(
        structuredClone(binding),
      );
    } catch {
      return failure(
        "authority_failure",
        "Trusted governance could not be verified.",
        identities,
      );
    }
  }
  const opened = await loadOrOpenCase(
    dependencies.cases,
    clock,
    input,
    identities,
    binding,
  );

  if (!opened.ok) {
    return opened;
  }

  if (opened.value.record.status === "closed") {
    if (binding) {
      const check = evaluateAuthority({
        ...authorityInputFor(input, false),
        binding,
        governance: context,
        evaluatedAt: clock.now(),
      });
      if (check.decision !== "allow")
        return failure("authority_denied", check.reason, identities);
    }
    if (!opened.value.record.executionIds.includes(identities.executionId))
      return failure(
        "case_context_mismatch",
        "Closed case cannot be reused for another command or stage.",
        identities,
        opened.value,
      );
    return success(
      opened.value,
      undefined,
      [],
      opened.value.record.outcome,
      identities,
      true,
    );
  }

  const authority = await ensureAuthorityDecision(
    dependencies.authority,
    dependencies.cases,
    clock,
    input,
    opened.value,
    identities,
    binding,
    context,
  );

  if (!authority.ok) {
    return authority;
  }

  if (authority.decision.decision !== "allow") {
    return failure(
      "authority_denied",
      `Trusted authority decision "${authority.decision.id}" did not allow execution.`,
      identities,
      authority.case,
    );
  }

  if (caseHasCompletedCommand(authority.case.record, identities.executionId)) {
    return success(
      authority.case,
      undefined,
      [],
      authority.case.record.outcome,
      identities,
      true,
    );
  }

  const command: ImmutableCaseCommand = Object.freeze({
    idempotencyKey: identities.idempotencyKey,
    caseId: input.caseId,
    authorityDecisionId: authority.decision.id,
    ...(binding ? { governanceBinding: structuredClone(binding) } : {}),
  });

  if (binding) {
    try {
      const refreshed = await dependencies.governance?.resolve(
        structuredClone(binding),
      );
      const check = evaluateAuthority({
        ...authorityInputFor(input, false),
        binding,
        governance: refreshed,
        evaluatedAt: clock.now(),
      });
      if (check.decision !== "allow")
        return failure(
          "authority_denied",
          check.reason,
          identities,
          authority.case,
        );
    } catch {
      return failure(
        "authority_failure",
        "Governance refresh failed before execution.",
        identities,
        authority.case,
      );
    }
  }
  let execution: ExecutionRecord;

  try {
    const value = await dependencies.executor.execute(command);
    const parsed = ExecutionValue.safeParse(value);
    if (!parsed.success)
      return failure(
        "invalid_execution_binding",
        "Execution response failed runtime validation.",
        identities,
        authority.case,
      );
    execution = parsed.data;
  } catch (error: unknown) {
    return failure(
      "execution_failure",
      errorMessage(error),
      identities,
      authority.case,
    );
  }

  const executionBinding = validateExecutionBinding(
    authority.case.record,
    input,
    authority.decision,
    identities,
    execution,
  );

  if (!executionBinding.ok) {
    return failure(
      "invalid_execution_binding",
      executionBinding.message,
      identities,
      authority.case,
    );
  }

  const applied = applyExecutionThroughKernel(
    authority.case.record,
    execution,
    executionBinding.outcome,
    clock.now(),
    authority.decision.id,
  );

  if (!applied.ok) {
    return failure(
      "kernel_rejected",
      applied.message,
      identities,
      authority.case,
    );
  }

  const saved = await saveCase(
    dependencies.cases,
    applied.record,
    authority.case.version,
    identities,
    authority.case,
  );

  if (!saved.ok) {
    return saved.result;
  }

  return success(
    saved.value,
    execution,
    execution.result?.evidence ?? [],
    executionBinding.outcome,
    identities,
    false,
  );
}

export function commandIdentities(
  input: RunGovernedCaseInput,
): CaseApplicationDetail {
  const action = input.requestedAction ?? "default";
  const authorityDecisionId = `authority:${stablePart(input.caseId)}:${stablePart(input.stageId)}:${stablePart(action)}`;
  const commandId = `command:${authorityDecisionId}`;
  const idempotencyKey = commandId;

  return {
    authorityDecisionId,
    commandId,
    idempotencyKey,
    executionId: `execution:${authorityDecisionId}`,
    recovered: false,
  };
}

function stablePart(value: string): string {
  return encodeURIComponent(value);
}

async function loadOrOpenCase(
  cases: VersionedCasePersistence,
  clock: CaseApplicationClock,
  input: RunGovernedCaseInput,
  detail: CaseApplicationDetail,
  binding?: GovernanceBinding,
): Promise<
  | Readonly<{ ok: true; value: VersionedCase }>
  | Readonly<{ ok: false } & Extract<CaseApplicationResult, { ok: false }>>
> {
  let loaded: VersionedCase | undefined;

  try {
    loaded = await cases.load(input.caseId);
  } catch (error: unknown) {
    return failure("persistence_failure", errorMessage(error), detail);
  }

  if (loaded) {
    if (!CaseRecordValue.safeParse(loaded.record).success)
      return failure(
        "persistence_failure",
        "Stored case failed runtime validation.",
        detail,
      );
    const mismatch = validateCaseContext(loaded.record, input);
    if (
      binding &&
      (!loaded.record.governanceBinding ||
        !sameBinding(loaded.record.governanceBinding, binding))
    )
      return failure(
        "case_context_mismatch",
        "Editorial case binding cannot change.",
        detail,
      );

    if (mismatch) {
      return failure(
        "case_context_mismatch",
        mismatch,
        detail,
        input.project.sourceOfTruth === "novel-owner" ? undefined : loaded,
      );
    }

    return { ok: true, value: loaded };
  }

  const opened = processCaseStep({
    step: {
      type: "open_case",
      id: input.caseId,
      title: input.title,
      request: input.request,
      project: input.project,
      specialistId: input.specialistId,
      openedAt: clock.now(),
      governanceBinding: binding,
    },
  });

  if (!opened.ok) {
    return failure("kernel_rejected", opened.error.message, detail);
  }

  const saved = await saveCase(cases, opened.value, undefined, detail);

  if (!saved.ok) {
    return saved.result;
  }

  return { ok: true, value: saved.value };
}

async function ensureAuthorityDecision(
  authority: TrustedAuthorityResolver,
  cases: VersionedCasePersistence,
  clock: CaseApplicationClock,
  input: RunGovernedCaseInput,
  current: VersionedCase,
  detail: CaseApplicationDetail,
  binding?: GovernanceBinding,
  context?: GovernanceContext,
): Promise<
  | Readonly<{
      ok: true;
      case: VersionedCase;
      decision: CaseAuthorityDecisionRecord;
    }>
  | Readonly<{ ok: false } & Extract<CaseApplicationResult, { ok: false }>>
> {
  const existing = findAuthorityDecision(
    current.record,
    detail.authorityDecisionId,
  );

  if (existing && !binding) {
    return { ok: true, case: current, decision: existing };
  }

  const untrustedAuthorityInput = authorityInputFor(input, false);
  let trustedAuthority: AuthorityEvaluationResult;

  try {
    trustedAuthority = binding
      ? evaluateAuthority({
          ...untrustedAuthorityInput,
          binding,
          governance: context,
          evaluatedAt: clock.now(),
        })
      : await authority.resolve(untrustedAuthorityInput);
  } catch (error: unknown) {
    return failure("authority_failure", errorMessage(error), detail, current);
  }

  const kernelInput = authorityInputFor(
    input,
    trustedAuthority.decision === "allow",
  );
  const evaluated = processCaseStep({
    caseRecord: current.record,
    step: {
      type: "evaluate_authority",
      decisionId: detail.authorityDecisionId,
      requestedStageId: input.stageId,
      currentStatus: kernelInput.currentStatus,
      hasHumanAuthorization: kernelInput.hasHumanAuthorization,
      requestedAction: input.requestedAction,
      isWithinApprovedScope: kernelInput.isWithinApprovedScope,
      decidedAt: clock.now(),
      binding,
      governance: context,
    },
  });

  if (!evaluated.ok) {
    return failure("kernel_rejected", evaluated.error.message, detail, current);
  }

  if (
    !authorityResultsMatch(trustedAuthority, evaluated.detail.authorityResult)
  ) {
    return failure(
      "authority_protocol_mismatch",
      "Trusted authority result did not match the kernel authority decision.",
      detail,
      current,
    );
  }

  const saved = await saveCase(
    cases,
    evaluated.value,
    current.version,
    detail,
    current,
  );

  if (!saved.ok) {
    return saved.result;
  }

  const decision = findAuthorityDecision(
    saved.value.record,
    detail.authorityDecisionId,
  );

  if (!decision) {
    return failure(
      "kernel_rejected",
      "Kernel did not record the expected authority decision.",
      detail,
      saved.value,
    );
  }

  return { ok: true, case: saved.value, decision };
}

function authorityInputFor(
  input: RunGovernedCaseInput,
  trustedAllow: boolean,
): AuthorityEvaluationInput {
  return {
    specialistId: input.specialistId,
    requestedStageId: input.stageId,
    currentStatus: currentStatusForStage(input.stageId),
    hasHumanAuthorization: trustedAllow,
    requestedAction: input.requestedAction,
    isWithinApprovedScope: trustedAllow ? true : undefined,
  };
}

function currentStatusForStage(stageId: AuthorityStageId): ExecutionStatus {
  switch (stageId) {
    case "observe":
      return "draft";
    case "propose":
      return "observing";
    case "authorize":
      return "proposed";
    case "apply":
      return "authorized";
    case "validate":
      return "completed";
  }
}

function authorityResultsMatch(
  trusted: AuthorityEvaluationResult,
  kernel: AuthorityEvaluationResult | undefined,
): boolean {
  return Boolean(
    kernel &&
    trusted.decision === kernel.decision &&
    trusted.reasonCode === kernel.reasonCode &&
    trusted.policyId === kernel.policyId &&
    trusted.ruleId === kernel.ruleId,
  );
}

function findAuthorityDecision(
  record: CaseRecord,
  decisionId: CaseAuthorityDecisionRecord["id"],
): CaseAuthorityDecisionRecord | undefined {
  return record.authorityDecisions.findLast(
    (decision) => decision.id === decisionId,
  );
}

function validateCaseContext(
  record: CaseRecord,
  input: RunGovernedCaseInput,
): string | undefined {
  if (record.id !== input.caseId) {
    return "Loaded case id did not match the requested case id.";
  }

  if (record.specialistId !== input.specialistId) {
    return "Loaded case specialist did not match the requested specialist.";
  }

  if (!projectRefsMatch(record.project, input.project)) {
    return "Loaded case project did not match the requested project.";
  }

  return undefined;
}

function projectRefsMatch(left: ProjectContextRef, right: ProjectContextRef) {
  return sameProject(left, right);
}

type ExecutionBindingResult =
  | Readonly<{ ok: true; outcome: CaseOutcome }>
  | Readonly<{ ok: false; message: string }>;

function validateExecutionBinding(
  record: CaseRecord,
  input: RunGovernedCaseInput,
  decision: CaseAuthorityDecisionRecord,
  detail: CaseApplicationDetail,
  execution: ExecutionRecord,
): ExecutionBindingResult {
  if (execution.id !== detail.executionId) {
    return bindingFailure(
      "Execution id did not match the stable command execution id.",
    );
  }

  if (
    execution.specialistId !== record.specialistId ||
    execution.specialistId !== input.specialistId
  ) {
    return bindingFailure(
      "Execution specialist did not match the case specialist.",
    );
  }

  if (execution.stageId !== input.stageId) {
    return bindingFailure("Execution stage did not match the requested stage.");
  }

  if (!projectRefsMatch(execution.project, record.project)) {
    return bindingFailure("Execution project did not match the case project.");
  }

  if (!execution.result) {
    return bindingFailure(
      "Execution result is required before evidence can be attached.",
    );
  }

  for (const evidence of execution.result.evidence) {
    const evidenceFailure = validateEvidenceBinding(
      evidence,
      record,
      input,
      decision,
      detail,
      execution.id,
    );

    if (evidenceFailure) {
      return bindingFailure(evidenceFailure);
    }
  }

  const terminalFailure =
    failedExecutionStatuses.includes(execution.status) ||
    execution.result.outcome === "blocked" ||
    execution.result.outcome === "failed" ||
    execution.result.outcome === "cancelled";

  if (terminalFailure) {
    return {
      ok: true,
      outcome: {
        result: "failed",
        summary: execution.result.summary,
      },
    };
  }

  if (
    execution.status !== "completed" ||
    !successfulExecutionOutcomes.has(execution.result.outcome)
  ) {
    return bindingFailure(
      "Execution did not return a terminal successful or failed result.",
    );
  }

  if (execution.result.evidence.length === 0) {
    return bindingFailure("Successful execution requires bound evidence.");
  }

  return {
    ok: true,
    outcome: {
      result: "successful",
      summary: execution.result.summary,
    },
  };
}

function validateEvidenceBinding(
  evidence: EvidenceRecord,
  record: CaseRecord,
  input: RunGovernedCaseInput,
  decision: CaseAuthorityDecisionRecord,
  detail: CaseApplicationDetail,
  executionId: ExecutionRecord["id"],
): string | undefined {
  const metadata = evidence.metadata;

  if (!metadata) {
    return `Evidence "${evidence.id}" did not include binding metadata.`;
  }

  const expected = {
    caseId: record.id,
    projectExternalProjectId: record.project.externalProjectId,
    specialistId: record.specialistId,
    stageId: input.stageId,
    authorityDecisionId: decision.id,
    commandId: detail.commandId,
    executionId,
    idempotencyKey: detail.idempotencyKey,
    ...(record.project.sourceOfTruth === "novel-owner"
      ? {
          ownerSchema: "asos-owner.v1",
          novelId: record.project.novelId,
          manuscriptId: record.project.manuscriptId,
          versionId: record.project.versionId,
          contentDigest: record.project.contentDigest,
          authorIssuer: record.project.author.issuer,
          authorSubject: record.project.author.subject,
          ...(input.proposalDigest
            ? { proposalDigest: input.proposalDigest }
            : {}),
        }
      : {}),
  };

  for (const [key, value] of Object.entries(expected)) {
    if (metadata[key] !== value) {
      return `Evidence "${evidence.id}" binding "${key}" did not match the case command.`;
    }
  }

  return undefined;
}

function applyExecutionThroughKernel(
  record: CaseRecord,
  execution: ExecutionRecord,
  outcome: CaseOutcome,
  now: string,
  authorityDecisionId: CaseAuthorityDecisionRecord["id"],
):
  | Readonly<{ ok: true; record: CaseRecord }>
  | Readonly<{ ok: false; message: string }> {
  const attachedExecution = processCaseStep({
    caseRecord: record,
    step: {
      type: "attach_execution",
      executionId: execution.id,
      authorityDecisionId,
      attachedAt: now,
    },
  });

  if (!attachedExecution.ok) {
    return kernelFailure(attachedExecution.error);
  }

  const attachedEvidence = processCaseStep({
    caseRecord: attachedExecution.value,
    step: {
      type: "attach_evidence",
      evidenceIds:
        execution.result?.evidence.map((evidence) => evidence.id) ?? [],
      attachedAt: now,
    },
  });

  if (!attachedEvidence.ok) {
    return kernelFailure(attachedEvidence.error);
  }

  const closed = processCaseStep({
    caseRecord: attachedEvidence.value,
    step: {
      type: "close_case",
      outcome,
      closedAt: now,
    },
  });

  if (!closed.ok) {
    return kernelFailure(closed.error);
  }

  return { ok: true, record: closed.value };
}

function kernelFailure(
  error: CaseKernelError,
): Readonly<{ ok: false; message: string }> {
  return {
    ok: false,
    message: error.message,
  };
}

async function saveCase(
  cases: VersionedCasePersistence,
  record: CaseRecord,
  expectedVersion: CaseVersion | undefined,
  detail: CaseApplicationDetail,
  value?: VersionedCase,
): Promise<
  | Readonly<{ ok: true; value: VersionedCase }>
  | Readonly<{
      ok: false;
      result: Extract<CaseApplicationResult, { ok: false }>;
    }>
> {
  try {
    const result = await cases.save(record, expectedVersion);

    if (result.ok) {
      return { ok: true, value: result.value };
    }

    return {
      ok: false,
      result: {
        ok: false,
        error: {
          code: "persistence_conflict",
          message: "Case persistence rejected the conditional save.",
        },
        value,
        conflict: result.conflict,
        detail,
      },
    };
  } catch (error: unknown) {
    return {
      ok: false,
      result: failure(
        "persistence_failure",
        errorMessage(error),
        detail,
        value,
      ),
    };
  }
}

function caseHasCompletedCommand(
  record: CaseRecord,
  executionId: ExecutionRecord["id"],
): boolean {
  return (
    record.status === "closed" &&
    record.executionIds.includes(executionId) &&
    record.evidenceIds.length > 0
  );
}

function bindingFailure(message: string): ExecutionBindingResult {
  return { ok: false, message };
}

function success(
  versionedCase: VersionedCase,
  execution: ExecutionRecord | undefined,
  evidence: readonly EvidenceRecord[],
  outcome: CaseOutcome | undefined,
  detail: CaseApplicationDetail,
  recovered: boolean,
): Extract<CaseApplicationResult, { ok: true }> {
  return {
    ok: true,
    value: {
      case: versionedCase,
      execution,
      evidence,
      outcome,
    },
    detail: {
      ...detail,
      recovered,
    },
  };
}

function failure(
  code: CaseApplicationErrorCode,
  message: string,
  detail: CaseApplicationDetail,
  value?: VersionedCase,
): Extract<CaseApplicationResult, { ok: false }> {
  return {
    ok: false,
    error: {
      code,
      message,
    },
    value,
    detail,
  };
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}
