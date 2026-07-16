# Case Model

## Status

Accepted

## Date

2026-07-15

## Context

The platform needs a primary unit for governed work. That unit must be understandable across specialists, project surfaces, and authority checks, while leaving room for different capabilities and workflows.

Work that produces meaningful outcomes must be connected to a clear context, a bounded objective, and supporting evidence.

## Decision

Case is the primary unit of governed work in ASOS.

A Case represents a bounded body of work that can be assigned context, evaluated for authority, acted on by specialists, and assessed by its evidence-backed outcomes. Specialists may contribute to a Case, but the Case remains the governing unit rather than an internal specialist task.

Evidence is required for meaningful outcomes. A Case outcome is not considered meaningful merely because an action was attempted; it must be supported by evidence appropriate to the decision or result.

## Consequences

Governed work has a common shape across the platform.

Specialist activity can be coordinated around the Case without requiring specialists to own project data.

Outcome quality can be evaluated through evidence rather than only through completion signals.

## Alternatives Considered

Use projects as the primary work unit. This was rejected because projects are broader ownership containers and may contain many governed work items.

Use specialist tasks as the primary work unit. This was rejected because it would make governance dependent on specialist implementation boundaries.

## Future Evolution

The Case model may later gain more precise lifecycle states, evidence expectations, or relationship rules. Those additions should preserve Case as the primary governed work unit.
