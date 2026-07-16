import type { AuthorityStageId, SpecialistProfile } from "./specialists";

export type SpecialistId = SpecialistProfile["id"];

export type ExecutionStageId = AuthorityStageId;

export type ProjectContextRef = {
  sourceOfTruth: "catalog-os";
  externalProjectId: string;
  externalProjectKey?: string;
  canonicalUrl?: string;
  snapshotId?: string;
};

export type ExecutionStatus =
  | "draft"
  | "observing"
  | "proposed"
  | "waiting_for_authorization"
  | "authorized"
  | "applying"
  | "validating"
  | "completed"
  | "blocked"
  | "failed"
  | "cancelled";

export type EvidenceKind =
  | "reviewed"
  | "finding"
  | "proposal"
  | "change"
  | "skipped"
  | "judgment"
  | "failure";

export type EvidenceRecord = {
  id: string;
  kind: EvidenceKind;
  summary: string;
  source?: string;
  uri?: string;
  recordedAt: string;
  metadata?: Record<string, string | number | boolean | null>;
};

export type ExecutionOutcome =
  | "no_action"
  | "proposal_ready"
  | "authorized"
  | "applied"
  | "validated"
  | "blocked"
  | "failed"
  | "cancelled";

export type ExecutionResult = {
  outcome: ExecutionOutcome;
  summary: string;
  evidence: EvidenceRecord[];
  nextStageId?: ExecutionStageId;
  completedAt?: string;
};

export type ExecutionRecord = {
  id: string;
  schemaVersion: "asos-execution.v1";
  specialistId: SpecialistId;
  stageId: ExecutionStageId;
  project: ProjectContextRef;
  status: ExecutionStatus;
  objective: string;
  scope?: string;
  createdAt: string;
  updatedAt: string;
  result?: ExecutionResult;
};
