// Explicit supported in-process boundary. No web framework or providers exported.
export {
  createCaseApplicationService,
  commandIdentities,
} from "../application/case-application-service";
export type {
  RunGovernedCaseInput,
  CaseApplicationResult,
  CaseApplicationServiceDependencies,
} from "../application/case-application-service";
export type { TrustedAuthorityResolver } from "../application/ports/authority-resolution";
export type { TrustedGovernanceResolver } from "../application/ports/governance-resolution";
export type {
  VersionedCasePersistence,
  VersionedCase,
  CaseSaveResult,
} from "../application/ports/case-persistence";
export type {
  IdempotentCaseCommandExecutor,
  ImmutableCaseCommand,
} from "../application/ports/command-execution";
export { evaluateAuthority, authorityPolicies } from "../domain/authority";
export {
  editorialRegistry,
  createSpecialistRegistry,
  SpecialistRegistration,
} from "../domain/registration";
export {
  Principal,
  ProjectReference,
  NovelProject,
  GovernanceBinding,
  GovernanceContext,
  ApprovalProof,
  sameBinding,
  sameProject,
} from "../domain/governance";
export {
  RunCaseInput,
  ExecutionValue,
  CaseRecordValue,
} from "../domain/runtime";
export { processCaseStep } from "../kernel/case-kernel";
export type { CaseRecord } from "../domain/case";
export type { ExecutionRecord, EvidenceRecord } from "../domain/execution";
export const kernelContractVersion = "0.2.0-proposed.1" as const;

export { kernelProvenance } from "./provenance";
