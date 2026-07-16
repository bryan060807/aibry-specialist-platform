import type { CaseAuthorityDecisionRecord, CaseId } from "../../domain/case";
import type { ExecutionRecord } from "../../domain/execution";

/**
 * A stable command identity makes repeated delivery safe for an executor.
 */
export type ImmutableCaseCommand = Readonly<{
  idempotencyKey: string;
  caseId: CaseId;
  authorityDecisionId: CaseAuthorityDecisionRecord["id"];
}>;

export type IdempotentCaseCommandExecutor = {
  execute(command: ImmutableCaseCommand): Promise<ExecutionRecord>;
};
