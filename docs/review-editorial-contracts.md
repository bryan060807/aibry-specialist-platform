# Proposed ASOS editorial domain contracts

Base: main at c7159b0e3b4ea0b720fedf78f0c2e0bc303e962a.
Branch: feature/asos-editorial-domain-contracts. Draft only; no merge, publication or deployment.

The existing kernel could govern only Catalog OS specialists/projects. This additive proposal registers six editorial capabilities plus an independent validator with versioned metadata, separates novel ownership through an asos-owner.v1 reference and evaluates verified scoped access/author approval through the existing authority engine. Registry presence and client booleans never confer editorial authority. Catalog profiles/policies remain intact.

The existing application service now consumes a TrustedGovernanceResolver, validates runtime input/output, preserves exact Case/stage/objective/digest bindings, refreshes facts before dispatch and requires immutable-version evidence. It prevents unrelated closed-case recovery and cross-novel error disclosure. Decisions retain access/approval provenance; author and independent validator identities are external trusted facts, not specialist self-approval.

A private proposed @aibry/asos-kernel@0.2.0-proposed.1 package exports the actual domain/kernel/application service and ports with declarations, schemas and source-commit/dirty provenance. No duplicate kernel or network endpoint is created. Brutal Edit consumes a lockfile-integrity-pinned tarball built from a committed clean source version.

Validation: 72 kernel/domain/conformance tests (42 prior regression assertions plus 30 new cases), full TypeScript, lint (three existing img warnings), Vinext production build/artifact validation, rendered HTML/security test and package formatting passed. Previous test assertions remain; their detached source transpilation loaders migrated to native TS loading so runtime validators/dependencies resolve. New conformance tests use the compiled package itself.

Full TypeScript exposed previously absent Cloudflare binding declarations and a non-existent allowedDecision.reason field. Added type-only official Worker declarations/derived asset types and corrected the timeline reason reference; no bindings, hosting configuration or production registrations changed.

ADR 0006 is explicitly proposed. AIBRY ID verification, authentic receipt issuance, live revocation, protected production stores and real owner/outbox-to-Case coordination remain external release gates. All new tests use isolated verified-fact fixtures and placeholder content. No production manuscript writes, Music Vault access or deployment occurs.

## Delivery

The implementation and standalone-test follow-up were pushed to `feature/asos-editorial-domain-contracts`. The consumed runtime artifact remains pinned to implementation commit `21e8f8a4040bd9f607fa8b7e1696bd53d9b3a83d`; later commits contain test-command/delivery notes, not a silently replaced artifact.

`gh pr create --draft` against main was attempted and returned `Forbidden` for `https://api.github.com/graphql`. No PR creation is claimed and no network/identity settings were changed. Use this complete description and [open the proposed upstream comparison](https://github.com/bryan060807/aibry-specialist-platform/compare/main...feature/asos-editorial-domain-contracts?expand=1).

Brutal Edit's dependent integration is on `feature/brutal-edit-phase3b-asos`: https://github.com/bryan060807/aibry-brutal-edit/compare/main...feature/brutal-edit-phase3b-asos?expand=1. These are comparison links, not existing PR numbers. Neither branch was merged or deployed.
