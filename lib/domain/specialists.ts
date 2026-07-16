export type AuthorityStageId = "observe" | "propose" | "authorize" | "apply" | "validate";

export type AuthorityPolicy = "EVIDENCE REQUIRED" | "WAITING FOR HUMAN" | "SCOPE LOCKED";

export type AuthorityBoundaryPolicy =
  | "OBSERVE ONLY"
  | "PROPOSE → APPROVED APPLY"
  | "REVIEW-GATED OPERATIONS";

export type AuthorityStage = {
  id: AuthorityStageId;
  number: string;
  label: string;
  command: string;
  copy: string;
  permissionState: AuthorityPolicy;
};

export type Capability = string;

export type SpecialistProfile = {
  id: "archivist" | "admitter" | "manager";
  index: string;
  name: string;
  role: string;
  color: "green" | "blue" | "violet";
  brief: string;
  capabilities: Capability[];
  authorityBoundary: AuthorityBoundaryPolicy;
};

export type EvidenceDisplayItem = {
  label: string;
  icon: string;
};

export const specialists: SpecialistProfile[] = [
  {
    id: "archivist",
    index: "01",
    name: "Archivist",
    role: "The Inspector",
    color: "green",
    brief: "Inspects the Music Vault, finds missing information, and reports what needs attention—without changing the source.",
    capabilities: ["Catalog inventory", "Gap detection", "Evidence reports"],
    authorityBoundary: "OBSERVE ONLY",
  },
  {
    id: "admitter",
    index: "02",
    name: "Project Admitter",
    role: "The Gatekeeper",
    color: "blue",
    brief: "Creates the minimum safe records needed to formally admit music into the managed catalog.",
    capabilities: ["Admission checks", "Project records", "Boundary enforcement"],
    authorityBoundary: "PROPOSE → APPROVED APPLY",
  },
  {
    id: "manager",
    index: "03",
    name: "Music Manager",
    role: "The Organizer",
    color: "violet",
    brief: "Enriches and manages approved music projects while leaving ownership of the music itself with the artist.",
    capabilities: ["Project context", "Creative operations", "Release coordination"],
    authorityBoundary: "REVIEW-GATED OPERATIONS",
  },
];

export const authorityStages: AuthorityStage[] = [
  {
    id: "observe",
    number: "01",
    label: "Observe",
    command: "LOOK. DON’T TOUCH.",
    copy: "Inspect the system, identify gaps, and produce a clear report. No source state changes.",
    permissionState: "EVIDENCE REQUIRED",
  },
  {
    id: "propose",
    number: "02",
    label: "Propose",
    command: "RECOMMEND. DON’T CHANGE.",
    copy: "Prepare the exact change, explain the reason, and expose the expected outcome.",
    permissionState: "EVIDENCE REQUIRED",
  },
  {
    id: "authorize",
    number: "03",
    label: "Authorize",
    command: "HUMAN DECISION POINT.",
    copy: "A person reviews scope and evidence. Nothing proceeds without explicit authorization.",
    permissionState: "WAITING FOR HUMAN",
  },
  {
    id: "apply",
    number: "04",
    label: "Apply",
    command: "APPROVED. THEN ACT.",
    copy: "Make only the authorized change, preserve a record, and stop at the defined boundary.",
    permissionState: "SCOPE LOCKED",
  },
  {
    id: "validate",
    number: "05",
    label: "Validate",
    command: "TRUST NEEDS PROOF.",
    copy: "Independently observe the result and verify that reality matches the approved proposal.",
    permissionState: "EVIDENCE REQUIRED",
  },
];

export const evidenceDisplayItems: EvidenceDisplayItem[] = [
  { label: "What was reviewed", icon: "⌕" },
  { label: "What was found", icon: "✦" },
  { label: "What was proposed", icon: "≡" },
  { label: "What changed", icon: "✓" },
  { label: "What was skipped", icon: "≫" },
  { label: "Where judgment was required", icon: "◉" },
  { label: "What failed—and why", icon: "!" },
];
