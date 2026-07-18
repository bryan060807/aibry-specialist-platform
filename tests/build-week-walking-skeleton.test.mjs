import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";
import ts from "typescript";

const modulesPromise = importBuildWeekModules();

async function importBuildWeekModules() {
  const outputRoot = mkdtempSync(join(tmpdir(), "asos-build-week-test-"));
  writeFileSync(join(outputRoot, "package.json"), '{"type":"module"}\n');

  const modulePaths = [
    "lib/domain/case.ts",
    "lib/domain/authority.ts",
    "lib/domain/execution.ts",
    "lib/domain/specialists.ts",
    "lib/kernel/case-kernel.ts",
    "lib/application/ports/authority-resolution.ts",
    "lib/application/ports/case-persistence.ts",
    "lib/application/ports/command-execution.ts",
    "lib/application/case-application-service.ts",
    "lib/build-week/project-admission-walking-skeleton.ts",
  ];

  for (const modulePath of modulePaths) {
    const source = readFileSync(new URL(`../${modulePath}`, import.meta.url), "utf8");
    const output = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.ES2022,
        target: ts.ScriptTarget.ES2022,
      },
      fileName: modulePath,
      reportDiagnostics: true,
    });

    const errors = output.diagnostics?.filter(
      (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
    );
    assert.deepEqual(errors, []);

    const outputPath = join(outputRoot, modulePath.replace(/\.ts$/, ".js"));
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, addJsExtensions(output.outputText));
  }

  return import(
    pathToFileURL(
      join(outputRoot, "lib/build-week/project-admission-walking-skeleton.js"),
    ).href
  );
}

function addJsExtensions(source) {
  return source.replace(
    /(from\s+["'])(\.\.?\/[^"']+?)(["'];?)/g,
    (match, prefix, specifier, suffix) => {
      if (/\.[cm]?js$/.test(specifier)) return match;
      return `${prefix}${specifier}.js${suffix}`;
    },
  );
}

test("ASOS Build Week walking skeleton rejects self-approval, executes after authorized approval, replays, resets, and repeats", async () => {
  const { resetBuildWeekDemo, runProjectAdmissionWalkingSkeleton } = await modulesPromise;

  const reset = resetBuildWeekDemo();
  assert.equal(reset.ok, true);
  assert.equal(reset.value.status, "reset");

  const first = await runProjectAdmissionWalkingSkeleton();
  assert.equal(first.ok, true);
  assert.equal(first.value.fixture.incident.id, "incident-trackmaster-login-01");
  assert.equal(first.value.fixture.analysis.mode, "saved-gpt-5.6-response");
  assert.equal(first.value.fixture.specialists.length, 4);
  assert.equal(first.value.selfApproval.rejected, true);
  assert.equal(first.value.selfApproval.error.code, "authority_denied");
  assert.equal(first.value.selfApproval.decision.decision, "require_human_authorization");
  assert.equal(first.value.authorizedApproval.allowed, true);
  assert.equal(first.value.authorizedApproval.decision.decision, "allow");
  assert.equal(first.value.execution.status, "completed");
  assert.equal(first.value.evidence.length, 1);
  assert.equal(first.value.outcome.result, "successful");
  assert.equal(first.value.case.record.status, "closed");
  assert.equal(first.value.timeline.length, 14);
  assert.equal(first.value.replayReport.caseId, "build-week-trackmaster-login-incident");
  assert.equal(first.value.replayReport.authorityDecisions.length, 2);

  const secondReset = resetBuildWeekDemo();
  assert.equal(secondReset.ok, true);

  const second = await runProjectAdmissionWalkingSkeleton();
  assert.equal(second.ok, true);
  assert.deepEqual(second.value.timeline, first.value.timeline);
  assert.deepEqual(second.value.replayReport, first.value.replayReport);
});
