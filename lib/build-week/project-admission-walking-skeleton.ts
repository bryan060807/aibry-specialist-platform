import { createCaseApplicationService } from "../application/case-application-service";
import type { CaseSaveResult, CaseVersion, VersionedCase, VersionedCasePersistence } from "../application/ports/case-persistence";
import type { IdempotentCaseCommandExecutor, ImmutableCaseCommand } from "../application/ports/command-execution";
import { evaluateAuthority } from "../domain/authority";
import type { CaseRecord } from "../domain/case";
import type { ExecutionRecord } from "../domain/execution";

const caseId = "build-week-trackmaster-login-incident";
const fixedTime = "2026-07-18T05:30:00.000Z";

const project = {
  sourceOfTruth: "catalog-os" as const,
  externalProjectId: "trackmaster-login-incident-demo",
  externalProjectKey: "TRACKMASTER-AUTH-01",
  canonicalUrl: "asos-demo://trackmaster/login-incident",
  snapshotId: "trackmaster-login-fixture-v1",
};

export const trackMasterIncidentFixture = Object.freeze({
  incident: {
    id: "incident-trackmaster-login-01",
    title: "TrackMaster login failures after runtime configuration drift",
    symptom: "Valid users receive intermittent authentication failures after deployment.",
    severity: "high",
  },
  analysis: {
    mode: "saved-gpt-5.6-response",
    label: "Saved GPT-5.6 analysis replay",
    summary: "Authentication evidence indicates a runtime configuration mismatch rather than invalid user credentials.",
    hypotheses: [
      "The active runtime is using stale authentication configuration.",
      "Session validation and the deployed signing configuration are out of sync.",
    ],
    recommendedAction: "Reconcile the approved authentication runtime configuration and invalidate only affected sessions.",
  },
  specialists: [
    { id: "auth-observer", role: "Authentication Specialist", authority: "observe" },
    { id: "remediation-specialist", role: "Remediation Specialist", authority: "propose/apply-with-authorization" },
    { id: "authorized-operator", role: "Human Operator", authority: "authorize" },
    { id: "independent-verifier", role: "Verifier", authority: "validate" },
  ],
  remediation: {
    id: "remediation-trackmaster-auth-01",
    summary: "Apply the approved authentication configuration and invalidate only sessions bound to the stale configuration.",
    scope: "Deterministic simulation only; no live TrackMaster service or secrets are touched.",
  },
});

class InMemoryCasePersistence implements VersionedCasePersistence {
  private current: VersionedCase | undefined;
  private revision = 0;

  reset(): void {
    this.current = undefined;
    this.revision = 0;
  }

  async load(requestedCaseId: string): Promise<VersionedCase | undefined> {
    return this.current?.record.id === requestedCaseId ? this.current : undefined;
  }

  async save(record: CaseRecord, expectedVersion: CaseVersion | undefined): Promise<CaseSaveResult> {
    if (expectedVersion !== this.current?.version) {
      return { ok: false, conflict: { kind: "version_conflict", current: this.current } };
    }
    this.revision += 1;
    this.current = { record, version: `build-week-${this.revision}` };
    return { ok: true, value: this.current };
  }
}

class SimulatedTrackMasterRemediationExecutor implements IdempotentCaseCommandExecutor {
  async execute(command: ImmutableCaseCommand): Promise<ExecutionRecord> {
    const executionId = `execution:${command.authorityDecisionId}`;
    return {
      id: executionId,
      schemaVersion: "asos-execution.v1",
      specialistId: "admitter",
      stageId: "apply",
      project,
      status: "completed",
      objective: trackMasterIncidentFixture.remediation.summary,
      scope: trackMasterIncidentFixture.remediation.scope,
      createdAt: fixedTime,
      updatedAt: fixedTime,
      result: {
        outcome: "applied",
        summary: "Simulated authentication configuration reconciliation completed and verification evidence was recorded.",
        completedAt: fixedTime,
        evidence: [
          {
            id: `evidence:${command.authorityDecisionId}`,
            kind: "change",
            summary: "Simulation recorded the approved configuration reconciliation; no live system was changed.",
            source: "asos-build-week-trackmaster-fixture",
            recordedAt: fixedTime,
            metadata: {
              caseId: command.caseId,
              projectExternalProjectId: project.externalProjectId,
              specialistId: "admitter",
              stageId: "apply",
              authorityDecisionId: command.authorityDecisionId,
              commandId: `command:${command.authorityDecisionId}`,
              executionId,
              idempotencyKey: command.idempotencyKey,
            },
          },
        ],
      },
    };
  }
}

const cases = new InMemoryCasePersistence();

const applicationService = createCaseApplicationService({
  authority: {
    async resolve(input) {
      const authorized = input.requestedAction === "authorized_trackmaster_remediation";
      return evaluateAuthority({
        ...input,
        hasHumanAuthorization: authorized,
        isWithinApprovedScope: authorized,
      });
    },
  },
  cases,
  executor: new SimulatedTrackMasterRemediationExecutor(),
  clock: { now: () => fixedTime },
});

export function resetBuildWeekDemo() {
  cases.reset();
  return {
    ok: true as const,
    value: {
      status: "reset",
      caseId,
      message: "The deterministic ASOS Build Week demo has been reset.",
    },
  };
}

export async function runProjectAdmissionWalkingSkeleton() {
  cases.reset();

  const commonInput = {
    caseId,
    title: trackMasterIncidentFixture.incident.title,
    request: {
      objective: trackMasterIncidentFixture.remediation.summary,
      requestedAt: fixedTime,
      scope: trackMasterIncidentFixture.remediation.scope,
    },
    project,
    specialistId: "admitter" as const,
    stageId: "apply" as const,
  };

  const selfApproval = await applicationService.run({
    ...commonInput,
    requestedAction: "self_approve_trackmaster_remediation",
  });

  if (selfApproval.ok) {
    return {
      ok: false as const,
      error: {
        code: "self_approval_unexpectedly_allowed",
        message: "The kernel unexpectedly allowed the remediation specialist to self-approve.",
      },
    };
  }

  const rejectedDecision = selfApproval.value?.record.authorityDecisions.at(-1);

  const authorizedApproval = await applicationService.run({
    ...commonInput,
    requestedAction: "authorized_trackmaster_remediation",
  });

  if (!authorizedApproval.ok) {
    return authorizedApproval;
  }

  const finalCase = authorizedApproval.value.case.record;
  const allowedDecision = finalCase.authorityDecisions.at(-1);
  const evidence = authorizedApproval.value.evidence;

  const timeline = [
    "1. Demo reset to a deterministic fresh state.",
    `2. Incident triggered: ${trackMasterIncidentFixture.incident.title}.`,
    `3. ASOS case opened: ${finalCase.id}.`,
    `4. Evidence analysis loaded: ${trackMasterIncidentFixture.analysis.label}.`,
    `5. Bounded specialist roles assigned: ${trackMasterIncidentFixture.specialists.map((item) => item.role).join(", ")}.`,
    `6. Remediation proposed: ${trackMasterIncidentFixture.remediation.summary}`,
    "7. Remediation Specialist attempted to approve its own proposed action.",
    `8. Kernel rejected self-approval: ${rejectedDecision?.reason ?? selfApproval.error.message}`,
    "9. Authorized Human Operator supplied trusted approval for the bounded remediation.",
    `10. Authority gate allowed execution: ${allowedDecision?.reason ?? "approved"}`,
    "11. Deterministic remediation simulation executed through CaseApplicationService.",
    `12. Verification evidence recorded: ${evidence.map((item) => item.id).join(", ")}.`,
    `13. Case closed with outcome: ${finalCase.outcome?.result ?? "unknown"}.`,
    "14. Replay report generated; reset can be invoked and the flow repeated.",
  ];

  return {
    ok: true as const,
    value: {
      fixture: trackMasterIncidentFixture,
      case: authorizedApproval.value.case,
      selfApproval: {
        rejected: true,
        error: selfApproval.error,
        decision: rejectedDecision,
      },
      authorizedApproval: {
        allowed: true,
        decision: allowedDecision,
      },
      execution: authorizedApproval.value.execution,
      evidence,
      outcome: authorizedApproval.value.outcome,
      timeline,
      replayReport: {
        caseId: finalCase.id,
        incident: trackMasterIncidentFixture.incident,
        analysis: trackMasterIncidentFixture.analysis,
        specialists: trackMasterIncidentFixture.specialists,
        remediation: trackMasterIncidentFixture.remediation,
        authorityDecisions: finalCase.authorityDecisions,
        executionIds: finalCase.executionIds,
        evidenceIds: finalCase.evidenceIds,
        outcome: finalCase.outcome,
      },
    },
  };
}
