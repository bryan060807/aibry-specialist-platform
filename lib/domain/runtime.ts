import { z } from "zod";
import { ProjectReference, GovernanceBinding, Principal } from "./governance";
const id = z.string().min(1).max(200);
export const RunCaseInput = z.object({
  caseId: id,
  title: id,
  request: z.object({
    objective: id,
    summary: z.string().optional(),
    requestedBy: id.optional(),
    requestedAt: z.string().datetime(),
    scope: id.optional(),
  }),
  project: ProjectReference,
  specialistId: z.union([
    z.enum(["archivist", "admitter", "manager"]),
    z.templateLiteral([z.string().min(1), ".", z.string().min(1)]),
  ]),
  stageId: z.enum(["observe", "propose", "authorize", "apply", "validate"]),
  requestedAction: id.optional(),
  specialistVersion: z.literal("1.0.0").optional(),
  proposalDigest: z
    .string()
    .regex(/^[a-f0-9]{64}$/)
    .optional(),
});
export const ExecutionValue = z.object({
  id: z.string().min(1),
  schemaVersion: z.literal("asos-execution.v1"),
  specialistId: z.union([
    z.enum(["archivist", "admitter", "manager"]),
    z.templateLiteral([z.string().min(1), ".", z.string().min(1)]),
  ]),
  stageId: z.enum(["observe", "propose", "authorize", "apply", "validate"]),
  project: ProjectReference,
  status: z.enum([
    "draft",
    "observing",
    "proposed",
    "waiting_for_authorization",
    "authorized",
    "applying",
    "validating",
    "completed",
    "blocked",
    "failed",
    "cancelled",
  ]),
  objective: z.string(),
  scope: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  result: z
    .object({
      outcome: z.enum([
        "no_action",
        "proposal_ready",
        "authorized",
        "applied",
        "validated",
        "blocked",
        "failed",
        "cancelled",
      ]),
      summary: z.string(),
      evidence: z.array(
        z.object({
          id: z.string().min(1),
          kind: z.enum([
            "reviewed",
            "finding",
            "proposal",
            "change",
            "skipped",
            "judgment",
            "failure",
          ]),
          summary: z.string(),
          source: z.string().optional(),
          uri: z.string().optional(),
          recordedAt: z.string().datetime(),
          metadata: z
            .record(
              z.string(),
              z.union([z.string(), z.number(), z.boolean(), z.null()]),
            )
            .optional(),
        }),
      ),
      nextStageId: z
        .enum(["observe", "propose", "authorize", "apply", "validate"])
        .optional(),
      completedAt: z.string().datetime().optional(),
    })
    .optional(),
});
export const CaseRecordValue = z.object({
  id: z.string().min(1),
  schemaVersion: z.literal("asos-case.v1"),
  title: z.string(),
  request: RunCaseInput.shape.request,
  project: ProjectReference,
  specialistId: RunCaseInput.shape.specialistId,
  governanceBinding: GovernanceBinding.optional(),
  status: z.enum([
    "open",
    "waiting_for_authority",
    "authorized",
    "in_progress",
    "blocked",
    "closed",
  ]),
  executionIds: z.array(z.string()),
  evidenceIds: z.array(z.string()),
  authorityDecisions: z.array(
    z.object({
      id: z.string(),
      decidedAt: z.string().datetime(),
      specialistId: RunCaseInput.shape.specialistId,
      decision: z.enum(["allow", "require_human_authorization", "deny"]),
      authorityResult: z.object({
        decision: z.enum(["allow", "require_human_authorization", "deny"]),
        reason: z.string(),
        reasonCode: z.enum([
          "policy_not_found",
          "execution_not_actionable",
          "stage_prohibited",
          "stage_not_allowed",
          "action_prohibited",
          "human_authorization_required",
          "approved_scope_required",
          "invalid_execution_status",
          "allowed",
          "governance_binding_invalid",
          "trusted_context_required",
          "owner_scope_denied",
          "validator_not_independent",
          "approval_binding_invalid",
        ]),
        policyId: z
          .enum([
            "archivist-observe-only",
            "project-admitter-human-approved-apply",
            "music-manager-scoped-human-approved-apply",
            "brutal-edit.editorial.v1",
            "brutal-edit.validator.v1",
          ])
          .optional(),
        ruleId: z.string().optional(),
        proof: z
          .object({
            accessId: z.string(),
            approvalReceiptId: z.string().optional(),
            actor: Principal,
            expiresAt: z.string().datetime(),
          })
          .optional(),
      }),
      executionId: z.string().optional(),
      appliedToWork: z.boolean().optional(),
    }),
  ),
  outcome: z
    .object({
      result: z.enum(["successful", "partial", "failed"]),
      summary: z.string(),
    })
    .optional(),
  openedAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  closedAt: z.string().datetime().optional(),
});
