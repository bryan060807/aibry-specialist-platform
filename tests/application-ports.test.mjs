import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const portPaths = [
  "lib/application/ports/authority-resolution.ts",
  "lib/application/ports/case-persistence.ts",
  "lib/application/ports/command-execution.ts",
];

const contractAssertions = [
  [
    "lib/application/ports/authority-resolution.ts",
    /export type TrustedAuthorityResolver\s*=\s*\{[\s\S]*resolve\(input: AuthorityEvaluationInput\): Promise<AuthorityEvaluationResult>;/,
  ],
  [
    "lib/application/ports/case-persistence.ts",
    /export type VersionedCase\s*=\s*Readonly<\{[\s\S]*record: CaseRecord;[\s\S]*version: CaseVersion;/,
  ],
  [
    "lib/application/ports/case-persistence.ts",
    /export type VersionedCasePersistence\s*=\s*\{[\s\S]*load\(caseId: CaseId\): Promise<VersionedCase \| undefined>;[\s\S]*save\(record: CaseRecord, expectedVersion: CaseVersion \| undefined\): Promise<CaseSaveResult>;/,
  ],
  [
    "lib/application/ports/command-execution.ts",
    /export type ImmutableCaseCommand\s*=\s*Readonly<\{[\s\S]*idempotencyKey: string;[\s\S]*caseId: CaseId;[\s\S]*authorityDecisionId: CaseAuthorityDecisionRecord\["id"\];/,
  ],
  [
    "lib/application/ports/command-execution.ts",
    /export type IdempotentCaseCommandExecutor\s*=\s*\{[\s\S]*execute\(command: ImmutableCaseCommand\): Promise<ExecutionRecord>;/,
  ],
];

test("application port modules transpile", () => {
  for (const path of portPaths) {
    const output = ts.transpileModule(readFileSync(path, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.ES2022,
        target: ts.ScriptTarget.ES2022,
      },
      fileName: path,
      reportDiagnostics: true,
    });
    const diagnostics = output.diagnostics?.filter(
      (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
    );

    assert.deepEqual(diagnostics, []);
  }
});

test("application ports define the v0.2 provider-independent contracts", () => {
  for (const [path, contract] of contractAssertions) {
    assert.match(readFileSync(path, "utf8"), contract, path);
  }

  for (const path of portPaths) {
    const source = readFileSync(path, "utf8");

    const imports = [...source.matchAll(/from\s+["'](.+?)["']/g)].map((match) => match[1]);
    assert.ok(imports.every((specifier) => specifier.startsWith("../../domain/")));
    assert.doesNotMatch(source, /\b(?:prisma|drizzle|postgres|supabase|fetch|axios|http|sqlite)\b/i);
  }
});
