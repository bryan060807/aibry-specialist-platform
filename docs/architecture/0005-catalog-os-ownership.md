# Catalog OS Ownership

## Status

Accepted

## Date

2026-07-15

## Context

The platform includes domains that own durable project data and related assets. Those domains must remain distinct from specialists, which provide capabilities but do not own project records.

Catalog OS is the domain responsible for projects and Music Vault ownership. ASOS governs specialist work around those assets, but it does not move project or vault ownership into specialist boundaries.

## Decision

Catalog OS owns projects and Music Vault.

ASOS treats Catalog OS as the ownership source for project and Music Vault data. Specialists may act on Cases involving those assets when authorized, but they do not become the owner of the underlying project or Music Vault records.

Evidence is required when specialist work produces meaningful outcomes that affect or describe Catalog OS-owned assets.

## Consequences

Project and Music Vault ownership remain stable and domain-specific.

ASOS can govern work involving Catalog OS assets without taking ownership of those assets.

Specialist actions can be evaluated against Catalog OS context, external authority checks, and evidence requirements.

## Alternatives Considered

Move project ownership into ASOS. This was rejected because ASOS is the governance kernel, not the owner of every platform domain object.

Let specialists own project or Music Vault records they interact with. This was rejected because it would fragment durable ownership and make governance harder to reason about.

## Future Evolution

Future ADRs may define more detailed contracts between ASOS and Catalog OS. Those contracts should preserve Catalog OS ownership of projects and Music Vault while allowing governed specialist work through Cases.
