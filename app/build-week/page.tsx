"use client";

import { useState } from "react";

type AuthorityDecision = {
  decision?: string;
  reason?: string;
};

type ReplayReport = {
  caseId: string;
  authorityDecisions: AuthorityDecision[];
  executionIds: string[];
  evidenceIds: string[];
  outcome?: { result?: string };
};

type RunResult = {
  timeline: string[];
  selfApproval: {
    rejected: boolean;
    error?: { message?: string };
    decision?: AuthorityDecision;
  };
  authorizedApproval: {
    allowed: boolean;
    decision?: AuthorityDecision;
  };
  replayReport: ReplayReport;
};

type RunState =
  | { kind: "idle" }
  | { kind: "running" }
  | { kind: "resetting" }
  | { kind: "success"; value: RunResult }
  | { kind: "failure"; message: string };

const buttonStyle = {
  border: "1px solid currentColor",
  borderRadius: 8,
  padding: "10px 16px",
  font: "inherit",
  cursor: "pointer",
  background: "transparent",
} as const;

export default function BuildWeekPage() {
  const [state, setState] = useState<RunState>({ kind: "idle" });

  async function callDemo(action: "run" | "reset") {
    setState({ kind: action === "run" ? "running" : "resetting" });

    try {
      const response = await fetch("/api/build-week/project-admission", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action }),
        cache: "no-store",
      });
      const payload = await response.json();

      if (!payload.ok) {
        setState({
          kind: "failure",
          message: payload.error?.message ?? "The governed workflow failed.",
        });
        return;
      }

      if (action === "reset") {
        setState({ kind: "idle" });
        return;
      }

      setState({ kind: "success", value: payload.value });
    } catch {
      setState({
        kind: "failure",
        message: "Unable to reach the deterministic ASOS demo endpoint.",
      });
    }
  }

  const busy = state.kind === "running" || state.kind === "resetting";

  return (
    <main
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: "64px 24px 96px",
        fontFamily: "var(--font-geist-sans)",
      }}
    >
      <p style={{ letterSpacing: "0.16em", fontSize: 13 }}>ASOS BUILD WEEK</p>
      <h1 style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)", marginBottom: 12 }}>
        Incident Control Room
      </h1>
      <p style={{ maxWidth: 760, fontSize: 18, lineHeight: 1.6 }}>
        One deterministic TrackMaster-inspired incident demonstrates the ASOS
        authority model: evidence and specialists may propose a remediation,
        but the proposing specialist cannot manufacture its own approval.
      </p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 28 }}>
        <button style={buttonStyle} onClick={() => callDemo("run")} disabled={busy}>
          {state.kind === "running" ? "Running incident…" : "Run incident"}
        </button>
        <button style={buttonStyle} onClick={() => callDemo("reset")} disabled={busy}>
          {state.kind === "resetting" ? "Resetting…" : "Reset demo"}
        </button>
      </div>

      <section
        aria-live="polite"
        style={{
          marginTop: 32,
          border: "1px solid color-mix(in srgb, currentColor 20%, transparent)",
          borderRadius: 12,
          padding: 24,
        }}
      >
        {state.kind === "idle" && (
          <p style={{ margin: 0 }}>
            Ready. Reset is deterministic; the same incident can be repeated.
          </p>
        )}
        {state.kind === "running" && <p style={{ margin: 0 }}>Executing governed flow…</p>}
        {state.kind === "resetting" && <p style={{ margin: 0 }}>Restoring clean demo state…</p>}
        {state.kind === "failure" && (
          <div>
            <h2 style={{ marginTop: 0 }}>Workflow failed</h2>
            <p>{state.message}</p>
          </div>
        )}
        {state.kind === "success" && (
          <div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 12,
                marginBottom: 24,
              }}
            >
              <article style={{ border: "1px solid currentColor", borderRadius: 8, padding: 14 }}>
                <strong>Self-approval</strong>
                <p style={{ marginBottom: 0 }}>
                  {state.value.selfApproval.rejected ? "Rejected by kernel" : "Unexpectedly allowed"}
                </p>
              </article>
              <article style={{ border: "1px solid currentColor", borderRadius: 8, padding: 14 }}>
                <strong>Authorized approval</strong>
                <p style={{ marginBottom: 0 }}>
                  {state.value.authorizedApproval.allowed ? "Allowed" : "Not granted"}
                </p>
              </article>
              <article style={{ border: "1px solid currentColor", borderRadius: 8, padding: 14 }}>
                <strong>Case outcome</strong>
                <p style={{ marginBottom: 0 }}>
                  {state.value.replayReport.outcome?.result ?? "unknown"}
                </p>
              </article>
            </div>

            <h2>Replay timeline</h2>
            <ol style={{ lineHeight: 1.65, paddingLeft: 24 }}>
              {state.value.timeline.map((item, index) => (
                <li key={`${index}-${item}`} style={{ marginBottom: 8 }}>
                  {item}
                </li>
              ))}
            </ol>

            <details style={{ marginTop: 24 }}>
              <summary>Replay report details</summary>
              <pre style={{ overflowX: "auto", whiteSpace: "pre-wrap" }}>
                {JSON.stringify(state.value.replayReport, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </section>
    </main>
  );
}
