import { z } from "zod";

const id = z.string().min(1).max(200);
export const Principal = z.strictObject({ issuer: id, subject: id });
export type Principal = z.infer<typeof Principal>;
const optionalProjectFields = {
  externalProjectKey: id.optional(),
  canonicalUrl: id.optional(),
  snapshotId: id.optional(),
};
export const CatalogProject = z.strictObject({
  sourceOfTruth: z.literal("catalog-os"),
  externalProjectId: id,
  ...optionalProjectFields,
});
export const NovelProject = z
  .strictObject({
    sourceOfTruth: z.literal("novel-owner"),
    schemaVersion: z.literal("asos-owner.v1"),
    domain: z.literal("brutal-edit"),
    externalProjectId: id,
    novelId: id,
    manuscriptId: id,
    versionId: id,
    contentDigest: z.string().regex(/^[a-f0-9]{64}$/),
    author: Principal,
    ...optionalProjectFields,
  })
  .refine((p) => p.externalProjectId === p.novelId);
export const ProjectReference = z.union([CatalogProject, NovelProject]);
export type ProjectReference = z.infer<typeof ProjectReference>;
export type NovelProjectReference = z.infer<typeof NovelProject>;
export function sameProject(
  left: ProjectReference,
  right: ProjectReference,
): boolean {
  const l = ProjectReference.safeParse(left),
    r = ProjectReference.safeParse(right);
  return (
    l.success && r.success && JSON.stringify(l.data) === JSON.stringify(r.data)
  );
}
export const GovernanceBinding = z.strictObject({
  schemaVersion: z.literal("asos-binding.v1"),
  project: NovelProject,
  caseId: id,
  specialistId: id,
  specialistVersion: z.literal("1.0.0"),
  stage: z.enum(["observe", "propose", "authorize", "apply", "validate"]),
  action: id,
  scope: id,
  objective: id,
  proposalDigest: z
    .string()
    .regex(/^[a-f0-9]{64}$/)
    .optional(),
  executionId: id.max(2000),
});
export type GovernanceBinding = z.infer<typeof GovernanceBinding>;
export const ApprovalProof = z.strictObject({
  schemaVersion: z.literal("asos-approval.v1"),
  receiptId: id,
  author: Principal,
  binding: GovernanceBinding,
  decision: z.enum(["approve", "reject"]),
  expiresAt: z.string().datetime(),
  revocation: z.enum(["active", "revoked", "unknown"]),
});
export const GovernanceContext = z.strictObject({
  schemaVersion: z.literal("asos-governance.v1"),
  accessId: id,
  principal: Principal,
  project: NovelProject,
  allowedActions: z.array(id).min(1),
  expiresAt: z.string().datetime(),
  revocation: z.enum(["active", "revoked", "unknown"]),
  approval: ApprovalProof.optional(),
  validation: z
    .strictObject({
      proposalProducer: Principal,
      applyExecutor: Principal,
      result: NovelProject,
      applyCaseId: id,
    })
    .optional(),
});
export type GovernanceContext = z.infer<typeof GovernanceContext>;
export function samePrincipal(a: Principal, b: Principal) {
  return a.issuer === b.issuer && a.subject === b.subject;
}
export function sameBinding(a: GovernanceBinding, b: GovernanceBinding) {
  return (
    JSON.stringify(GovernanceBinding.parse(a)) ===
    JSON.stringify(GovernanceBinding.parse(b))
  );
}
