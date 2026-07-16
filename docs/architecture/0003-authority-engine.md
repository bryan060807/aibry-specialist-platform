# Authority Engine

## Status

Accepted

## Date

2026-07-15

## Context

Specialists need to know whether an action is permitted, but authority decisions should not be embedded inside each specialist. Authority must remain consistent across the platform and should be evaluated against shared rules and context.

The architecture also needs a clear separation between proposing or performing work and deciding whether that work is authorized.

## Decision

Authority is evaluated externally from specialists.

Specialists request or receive authority context, but they do not own the authority model. The authority engine is responsible for evaluating whether work is allowed based on the relevant Case, project context, policies, and available evidence.

## Consequences

Authority decisions remain consistent across specialists.

Specialists can focus on their capabilities without duplicating governance logic.

The platform can improve authority evaluation without rewriting every specialist boundary.

Failures or uncertainty in authority evaluation should prevent meaningful governed actions from being treated as authorized outcomes.

## Alternatives Considered

Let each specialist decide authority internally. This was rejected because it would create inconsistent governance and make authority behavior difficult to audit.

Use static permissions alone. This was rejected because governed work may require context-sensitive evaluation beyond a simple access flag.

## Future Evolution

The authority engine may later incorporate richer policy inputs, review paths, or evidence requirements. Those changes should keep authority evaluation external to specialist implementations.
