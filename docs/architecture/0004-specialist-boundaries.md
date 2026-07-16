# Specialist Boundaries

## Status

Accepted

## Date

2026-07-15

## Context

Specialists provide focused capabilities within ASOS. They may analyze, produce, transform, or recommend work, but they operate within the platform governance model rather than replacing it.

The platform needs clear boundaries so specialists can be added or improved without giving them ownership of project data or authority rules.

## Decision

Specialists define capabilities but do not own project data.

A specialist boundary describes what the specialist can do, what inputs it needs, what outputs or evidence it can produce, and what constraints it must respect. Project data remains owned by the platform domain that governs the project, not by the specialist that acts on it.

Specialists must operate through ASOS concepts such as Case, authority evaluation, and evidence-backed outcomes.

## Consequences

Specialists can be swapped, extended, or constrained without transferring project ownership.

Project data remains governed by the platform rather than fragmented across capability providers.

Specialist outputs can be evaluated as contributions to a Case, not as independent sources of truth.

## Alternatives Considered

Let specialists own the data they create or modify. This was rejected because it would fragment project ownership and complicate governance.

Treat specialists as general agents with broad platform authority. This was rejected because it would blur capability boundaries and weaken external authority evaluation.

## Future Evolution

Specialist contracts may become more formal over time. Future work should clarify capability descriptions, evidence outputs, and authority requirements without changing project data ownership.
