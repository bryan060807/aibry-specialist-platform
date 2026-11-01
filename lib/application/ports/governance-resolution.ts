import type {
  GovernanceBinding,
  GovernanceContext,
} from "../../domain/governance";
/** Must independently verify sessions, ownership, receipt authenticity and current revocation.
 * No web-app implementation is supplied. Client JSON is never a trusted context. */
export interface TrustedGovernanceResolver {
  resolve(
    binding: Readonly<GovernanceBinding>,
  ): Promise<GovernanceContext | undefined>;
}
