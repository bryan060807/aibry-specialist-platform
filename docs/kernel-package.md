# Proposed internal ASOS package

`@aibry/asos-kernel@0.2.0-proposed.1` is an in-process ESM package built from this repository's **actual** lib/domain, lib/kernel and lib/application implementation. The only public module is its explicit `lib/public/index.ts` export surface; it includes the existing createCaseApplicationService, ports, dispatcher, registration/ownership/governance schemas, error/result contracts and provenance. It exports no web framework, provider, production storage or invented network endpoint.

```sh
npm ci
npm run build:kernel
npm run test:kernel
npm run typecheck
npm run lint
npm test
npm run format:kernel
npm pack ./packages/asos-kernel --pack-destination /tmp
```

Pack only after committing reviewed source. The artifact records exact Git sourceCommit, sourceDirty and contractVersion in kernelProvenance. Consumers must reject dirty/mismatched provenance and pin the tarball bytes using lockfile integrity plus the recorded source commit. The package is private/proposed; creating a tarball is not registry publication or acceptance. Build emits declarations and rewrites relative emitted imports to Node ESM `.js` specifiers, without copying/maintaining a second kernel in a consumer.

Runtime schemas validate governed case inputs, domain-aware references, trusted governance context, execution output and persisted case shape. Public input discards unrecognized caller authority fields for legacy compatibility; no client field is used as editorial proof. Structured errors preserve persistence conflicts, authority failures/denials, invalid input/binding and kernel rejection. Trust facts originate only from constructor-injected ports. Direct pure kernel functions require trusted typed inputs and are not public HTTP authorization endpoints.

The package retains original Case/execution schema tags with optional additive editorial binding/provenance. Existing legacy persisted records remain readable. New editorial records require the versioned owner/binding schemas. A closed legacy case may recover only its own stable execution identity; switching stages is rejected rather than falsely reporting unrelated success.

Tests run both source regressions (unchanged assertions) and the compiled package conformance harness. All stores, identities, approvals and content in the latter are isolated fixtures. Production AIBRY ID access, signed receipt verification, actual revocation service, protected durable Case store and owner/outbox integration are separate gates. See proposed ADR 0006.
