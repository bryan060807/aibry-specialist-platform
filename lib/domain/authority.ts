import type { ExecutionStatus } from "./execution";
import type { AuthorityStageId, SpecialistProfile } from "./specialists";

export type SpecialistId = SpecialistProfile["id"];

export type AuthorityDecision = "allow" | "require_human_authorization" | "deny";

export type AuthorityPolicyId =
  | "archivist-observe-only"
  | "project-admitter-human-approved-apply"
  | "music-manager-scoped-human-approved-apply";

export type AuthorityRule = {
  id: string;
  stages: readonly AuthorityStageId[];
  decision: AuthorityDecision;
  reason: string;
  prohibitedActions?: readonly string[];
  requiresHumanAuthorization?: boolean;
  requiresApprovedScope?: boolean;
};

export type AuthorityPolicy = {
  id: AuthorityPolicyId;
  specialistId: SpecialistId;
  allowedStages: readonly AuthorityStageId[];
  humanGatedStages: readonly AuthorityStageId[];
  prohibitedStages: readonly AuthorityStageId[];
  prohibitedActions: readonly string[];
  rules: readonly AuthorityRule[];
};

export type AuthorityEvaluationInput = {
  specialistId: SpecialistId;
  requestedStageId: AuthorityStageId;
  currentStatus: ExecutionStatus;
  hasHumanAuthorization: boolean;
  requestedAction?: string;
  isWithinApprovedScope?: boolean;
};

export type AuthorityEvaluationReasonCode =
  | "policy_not_found"
  | "execution_not_actionable"
  | "stage_prohibited"
  | "stage_not_allowed"
  | "action_prohibited"
  | "human_authorization_required"
  | "approved_scope_required"
  | "invalid_execution_status"
  | "allowed";

export type AuthorityEvaluationResult = {
  decision: AuthorityDecision;
  reason: string;
  reasonCode: AuthorityEvaluationReasonCode;
  policyId?: AuthorityPolicyId;
  ruleId?: string;
};

const nonActionableStatuses: readonly ExecutionStatus[] = ["blocked", "failed", "cancelled"];

const stageStatusRequirements = {
  observe: ["draft", "observing", "proposed", "waiting_for_authorization", "authorized", "applying", "validating", "completed"],
  propose: ["draft", "observing", "proposed"],
  authorize: ["proposed", "waiting_for_authorization", "authorized"],
  apply: ["authorized", "applying"],
  validate: ["applying", "validating", "completed"],
} as const satisfies Record<AuthorityStageId, readonly ExecutionStatus[]>;

export const authorityPolicies: readonly AuthorityPolicy[] = [
  {
    id: "archivist-observe-only",
    specialistId: "archivist",
    allowedStages: ["observe", "validate"],
    humanGatedStages: [],
    prohibitedStages: ["propose", "authorize", "apply"],
    prohibitedActions: ["create_record", "update_record", "delete_record", "mutate_source", "apply_change"],
    rules: [
      {
        id: "archivist-no-autonomous-mutation",
        stages: ["propose", "authorize", "apply"],
        decision: "deny",
        reason: "Archivist authority is observe-only and cannot propose, authorize, or apply mutations.",
      },
    ],
  },
  {
    id: "project-admitter-human-approved-apply",
    specialistId: "admitter",
    allowedStages: ["observe", "propose", "validate", "apply"],
    humanGatedStages: ["authorize"],
    prohibitedStages: [],
    prohibitedActions: ["delete_project", "mutate_source", "publish_release"],
    rules: [
      {
        id: "admitter-human-authorization",
        stages: ["authorize", "apply"],
        decision: "require_human_authorization",
        reason: "Project Admitter requires explicit human authorization before authorization or apply stages proceed.",
        requiresHumanAuthorization: true,
      },
    ],
  },
  {
    id: "music-manager-scoped-human-approved-apply",
    specialistId: "manager",
    allowedStages: ["observe", "propose", "validate", "apply"],
    humanGatedStages: ["authorize"],
    prohibitedStages: [],
    prohibitedActions: ["mutate_source", "transfer_ownership", "publish_release"],
    rules: [
      {
        id: "manager-human-authorization",
        stages: ["authorize", "apply"],
        decision: "require_human_authorization",
        reason: "Music Manager requires explicit human authorization before authorization or apply stages proceed.",
        requiresHumanAuthorization: true,
      },
      {
        id: "manager-approved-scope",
        stages: ["apply"],
        decision: "deny",
        reason: "Music Manager apply authority is limited to the approved scope.",
        requiresApprovedScope: true,
      },
    ],
  },
];

export function evaluateAuthority(input: AuthorityEvaluationInput): AuthorityEvaluationResult {
  const policy = authorityPolicies.find((candidate) => candidate.specialistId === input.specialistId);

  if (!policy) {
    return {
      decision: "deny",
      reason: `No authority policy is registered for specialist "${input.specialistId}".`,
      reasonCode: "policy_not_found",
    };
  }

  if (nonActionableStatuses.includes(input.currentStatus)) {
    return {
      decision: "deny",
      reason: `Execution status "${input.currentStatus}" is not actionable.`,
      reasonCode: "execution_not_actionable",
      policyId: policy.id,
    };
  }

  if (input.requestedAction && policy.prohibitedActions.includes(input.requestedAction)) {
    return {
      decision: "deny",
      reason: `Action "${input.requestedAction}" is prohibited by policy "${policy.id}".`,
      reasonCode: "action_prohibited",
      policyId: policy.id,
    };
  }

  if (policy.prohibitedStages.includes(input.requestedStageId)) {
    const rule = policy.rules.find((candidate) => candidate.stages.includes(input.requestedStageId));

    return {
      decision: "deny",
      reason: rule?.reason ?? `Stage "${input.requestedStageId}" is prohibited by policy "${policy.id}".`,
      reasonCode: "stage_prohibited",
      policyId: policy.id,
      ruleId: rule?.id,
    };
  }

  const stageIsAllowed =
    policy.allowedStages.includes(input.requestedStageId) ||
    policy.humanGatedStages.includes(input.requestedStageId);

  if (!stageIsAllowed) {
    return {
      decision: "deny",
      reason: `Stage "${input.requestedStageId}" is not allowed by policy "${policy.id}".`,
      reasonCode: "stage_not_allowed",
      policyId: policy.id,
    };
  }

  const humanAuthorizationRule = policy.rules.find(
    (candidate) =>
      candidate.requiresHumanAuthorization &&
      candidate.stages.includes(input.requestedStageId),
  );

  if ((policy.humanGatedStages.includes(input.requestedStageId) || humanAuthorizationRule) && !input.hasHumanAuthorization) {
    return {
      decision: "require_human_authorization",
      reason:
        humanAuthorizationRule?.reason ??
        `Stage "${input.requestedStageId}" requires explicit human authorization.`,
      reasonCode: "human_authorization_required",
      policyId: policy.id,
      ruleId: humanAuthorizationRule?.id,
    };
  }

  if (!stageStatusRequirements[input.requestedStageId].includes(input.currentStatus)) {
    return {
      decision: "deny",
      reason: `Execution status "${input.currentStatus}" cannot transition to stage "${input.requestedStageId}".`,
      reasonCode: "invalid_execution_status",
      policyId: policy.id,
    };
  }

  const scopeRule = policy.rules.find(
    (candidate) =>
      candidate.requiresApprovedScope &&
      candidate.stages.includes(input.requestedStageId),
  );

  if (scopeRule && input.isWithinApprovedScope !== true) {
    return {
      decision: "deny",
      reason: scopeRule.reason,
      reasonCode: "approved_scope_required",
      policyId: policy.id,
      ruleId: scopeRule.id,
    };
  }

  return {
    decision: "allow",
    reason: `Stage "${input.requestedStageId}" is allowed by policy "${policy.id}".`,
    reasonCode: "allowed",
    policyId: policy.id,
  };
}
