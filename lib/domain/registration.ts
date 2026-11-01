import { z } from "zod";
export type SpecialistIdentity =
  "archivist" | "admitter" | "manager" | `${string}.${string}`;
const stage = z.enum(["observe", "propose", "authorize", "apply", "validate"]);
export const SpecialistRegistration = z.strictObject({
  schemaVersion: z.literal("asos-specialist.v1"),
  id: z.union([
    z.enum(["archivist", "admitter", "manager"]),
    z.string().regex(/^[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*$/),
  ]),
  version: z.literal("1.0.0"),
  domain: z.string().min(1),
  capabilities: z.array(z.string().min(1)).min(1),
  stages: z.array(stage).min(1),
  policyId: z.string().min(1),
  evidenceRequirements: z
    .array(
      z.enum([
        "command-binding",
        "immutable-version",
        "proposal-digest",
        "independent-result",
      ]),
    )
    .min(1),
  prohibitedActions: z.array(z.string()),
  constraints: z.strictObject({
    maxConcurrency: z.number().int().min(1).max(6),
    requiresTrustedAccess: z.literal(true),
  }),
  validationResponsibilities: z.array(z.string()).min(1),
});
export type SpecialistRegistration = z.infer<typeof SpecialistRegistration>;
// Registry is immutable metadata. Policies are evaluated separately by the authority engine.
export function createSpecialistRegistry(input: readonly unknown[]) {
  const registrations = input.map((v) => SpecialistRegistration.parse(v));
  const keys = registrations.map((v) => `${v.id}@${v.version}`);
  if (new Set(keys).size !== keys.length)
    throw new Error("duplicate_specialist_registration");
  const frozen = registrations.map((r) =>
    Object.freeze({
      ...r,
      capabilities: Object.freeze(r.capabilities),
      stages: Object.freeze(r.stages),
      evidenceRequirements: Object.freeze(r.evidenceRequirements),
      prohibitedActions: Object.freeze(r.prohibitedActions),
      constraints: Object.freeze(r.constraints),
      validationResponsibilities: Object.freeze(r.validationResponsibilities),
    }),
  );
  return Object.freeze({
    list: Object.freeze(frozen),
    find: (id: string, version: string) =>
      frozen.find((r) => r.id === id && r.version === version),
  });
}
export const editorialRegistry = createSpecialistRegistry([
  ...[
    ["developmental", ["plot", "structure", "story-logic", "theme"]],
    [
      "continuity",
      ["chronology", "facts", "character-knowledge", "contradictions"],
    ],
    ["character", ["motivation", "emotional-authenticity", "character-arcs"]],
    ["dialogue", ["speech", "character-voice", "subtext", "clarity"]],
    ["line", ["sentence", "rhythm", "clarity", "author-voice"]],
    ["proofreader", ["grammar", "punctuation", "spelling", "formatting"]],
  ].map(([name, capabilities]) => ({
    schemaVersion: "asos-specialist.v1",
    id: `brutal-edit.${name}`,
    version: "1.0.0",
    domain: "brutal-edit",
    capabilities,
    stages: ["observe", "propose", "authorize", "apply"],
    policyId: "brutal-edit.editorial.v1",
    evidenceRequirements: [
      "command-binding",
      "immutable-version",
      "proposal-digest",
    ],
    prohibitedActions: [
      "mutate-original",
      "write-canon",
      "publish",
      "transfer-ownership",
      "self-validate",
    ],
    constraints: { maxConcurrency: 3, requiresTrustedAccess: true },
    validationResponsibilities: [
      "provide-verifiable-evidence",
      "preserve-author-intent",
    ],
  })),
  {
    schemaVersion: "asos-specialist.v1",
    id: "brutal-edit.validator",
    version: "1.0.0",
    domain: "brutal-edit",
    capabilities: [
      "evidence-quality",
      "approved-change-integrity",
      "introduced-defects",
      "post-apply-correctness",
    ],
    stages: ["observe", "validate"],
    policyId: "brutal-edit.validator.v1",
    evidenceRequirements: [
      "command-binding",
      "immutable-version",
      "proposal-digest",
      "independent-result",
    ],
    prohibitedActions: [
      "authorize-revision",
      "apply-revision",
      "propose-revision",
      "write-canon",
      "self-validate",
    ],
    constraints: { maxConcurrency: 1, requiresTrustedAccess: true },
    validationResponsibilities: [
      "independently-read-result",
      "verify-approved-diff",
      "report-defects",
    ],
  },
]);
