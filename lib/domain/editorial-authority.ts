import {
  GovernanceBinding,
  GovernanceContext,
  sameBinding,
  samePrincipal,
  sameProject,
} from "./governance";
import { editorialRegistry } from "./registration";
import type {
  AuthorityEvaluationInput,
  AuthorityEvaluationResult,
} from "./authority";

export function evaluateEditorialAuthority(
  input: AuthorityEvaluationInput,
): AuthorityEvaluationResult {
  const deny = (
    reasonCode: AuthorityEvaluationResult["reasonCode"],
    reason: string,
  ): AuthorityEvaluationResult => ({ decision: "deny", reasonCode, reason });
  const b = GovernanceBinding.safeParse(input.binding);
  if (
    !b.success ||
    b.data.specialistId !== input.specialistId ||
    b.data.stage !== input.requestedStageId ||
    b.data.action !== input.requestedAction
  )
    return deny(
      "governance_binding_invalid",
      "A valid immutable governance binding is required.",
    );
  const binding = b.data,
    registration = editorialRegistry.find(
      input.specialistId,
      binding.specialistVersion,
    );
  if (!registration)
    return deny(
      "policy_not_found",
      "Specialist is not registered at the requested version.",
    );
  if (
    registration.policyId !== "brutal-edit.editorial.v1" &&
    registration.policyId !== "brutal-edit.validator.v1"
  )
    return deny(
      "policy_not_found",
      "No reviewed authority policy is bound to this registration.",
    );
  const policyId = registration.policyId;
  if (
    !registration.stages.includes(binding.stage) ||
    registration.prohibitedActions.includes(binding.action)
  )
    return deny("stage_prohibited", "Editorial stage/action is prohibited.");
  const actions = {
    observe: "analyze",
    propose: "propose-revision",
    authorize: "authorize-revision",
    apply: "apply-revision",
    validate: "validate-revision",
  };
  if (binding.action !== actions[binding.stage])
    return deny(
      "action_prohibited",
      "Action does not match the governed stage.",
    );
  const statuses = {
    observe: ["draft", "observing"],
    propose: ["observing", "proposed"],
    authorize: ["proposed", "waiting_for_authorization", "authorized"],
    apply: ["authorized", "applying"],
    validate: ["completed", "validating"],
  } as const;
  if (!statuses[binding.stage].some((s) => s === input.currentStatus))
    return deny(
      "invalid_execution_status",
      "Execution is not actionable for this stage.",
    );
  const parsed = GovernanceContext.safeParse(input.governance);
  const now = Date.parse(input.evaluatedAt ?? "");
  if (!parsed.success || !Number.isFinite(now))
    return deny(
      "trusted_context_required",
      "A verified current governance context is required.",
    );
  const context = parsed.data;
  if (
    context.revocation !== "active" ||
    Date.parse(context.expiresAt) <= now ||
    !sameProject(context.project, binding.project) ||
    !context.allowedActions.includes(binding.action)
  )
    return deny(
      "owner_scope_denied",
      "Trusted owner scope is missing, expired, revoked or mismatched.",
    );
  if (registration.policyId === "brutal-edit.validator.v1") {
    if (binding.stage === "validate") {
      const v = context.validation;
      if (
        !v ||
        !binding.proposalDigest ||
        v.applyCaseId === binding.caseId ||
        !sameProject(v.result, binding.project) ||
        samePrincipal(context.principal, v.proposalProducer) ||
        samePrincipal(context.principal, v.applyExecutor)
      )
        return deny(
          "validator_not_independent",
          "Independent result access and validator identity are required.",
        );
    }
  } else if (!samePrincipal(context.principal, binding.project.author))
    return deny(
      "owner_scope_denied",
      "Editorial work requires the trusted owner identity.",
    );
  if (binding.stage === "authorize" || binding.stage === "apply") {
    const proof = context.approval;
    if (!proof)
      return {
        decision: "require_human_authorization",
        reasonCode: "human_authorization_required",
        reason: "Verified author approval is required.",
        policyId,
      };
    if (
      !binding.proposalDigest ||
      proof.decision !== "approve" ||
      proof.revocation !== "active" ||
      Date.parse(proof.expiresAt) <= now ||
      !samePrincipal(proof.author, binding.project.author) ||
      !sameBinding(proof.binding, binding)
    )
      return deny(
        "approval_binding_invalid",
        "Approval is invalid, stale, revoked, uncertain or bound to different work.",
      );
  }
  return {
    decision: "allow",
    reasonCode: "allowed",
    reason:
      "Registered policy and externally verified governance facts allow the bound work.",
    policyId,
    proof: {
      accessId: context.accessId,
      ...(context.approval
        ? { approvalReceiptId: context.approval.receiptId }
        : {}),
      actor: context.principal,
      expiresAt: context.expiresAt,
    },
  };
}
