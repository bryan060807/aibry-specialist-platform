import type { CaseId, CaseRecord } from "../../domain/case";

export type CaseVersion = string;

export type VersionedCase = Readonly<{
  record: CaseRecord;
  version: CaseVersion;
}>;

export type CaseSaveConflict = Readonly<{
  kind: "version_conflict";
  current: VersionedCase | undefined;
}>;

export type CaseSaveResult =
  | Readonly<{
      ok: true;
      value: VersionedCase;
    }>
  | Readonly<{
      ok: false;
      conflict: CaseSaveConflict;
    }>;

/**
 * Stores cases with compare-and-swap semantics.
 *
 * `expectedVersion` is undefined only when creating a previously absent case.
 */
export type VersionedCasePersistence = {
  load(caseId: CaseId): Promise<VersionedCase | undefined>;
  save(record: CaseRecord, expectedVersion: CaseVersion | undefined): Promise<CaseSaveResult>;
};
