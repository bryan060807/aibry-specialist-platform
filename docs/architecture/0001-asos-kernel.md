# ASOS Kernel

## Status

Accepted

## Date

2026-07-15

## Context

ASOS is the architectural kernel for the specialist platform. It defines the governed operating model that other parts of the system participate in, including how work is framed, how authority is checked, how specialists are bounded, and how outcomes are supported by evidence.

The platform needs a stable center that can coordinate specialist capabilities without letting any one specialist redefine project ownership, authority, or evidence rules.

## Decision

ASOS is the kernel. Architectural decisions for governed specialist work must be consistent with ASOS as the common operating layer.

ASOS owns the shared concepts and constraints that make specialist activity coherent across the platform. Product surfaces, specialists, and supporting services may extend or use ASOS concepts, but they do not replace the kernel.

## Consequences

The platform has a single architectural center for governed work.

Specialists can evolve independently while still participating in a common model.

Changes that alter the meaning of governed work, authority, ownership, or evidence must be evaluated as ASOS-level changes, not isolated feature changes.

## Alternatives Considered

Let each specialist define its own operating model. This was rejected because it would fragment project governance and make outcomes difficult to compare or audit.

Treat ASOS as an application feature. This was rejected because the kernel defines platform-level constraints rather than a single user-facing workflow.

## Future Evolution

Future ADRs may refine ASOS concepts as the platform matures. Those refinements should preserve ASOS as the kernel unless a later architectural decision explicitly replaces this model.
