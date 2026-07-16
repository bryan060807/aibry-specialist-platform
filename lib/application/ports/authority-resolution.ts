import type {
  AuthorityEvaluationInput,
  AuthorityEvaluationResult,
} from "../../domain/authority";

/**
 * Resolves an authority decision from a trusted authority boundary.
 *
 * The application layer depends on this contract instead of a concrete policy
 * engine or transport.
 */
export type TrustedAuthorityResolver = {
  resolve(input: AuthorityEvaluationInput): Promise<AuthorityEvaluationResult>;
};
