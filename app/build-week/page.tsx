"use client";

import Link from "next/link";
import { useState } from "react";

type AuthorityDecision = {
  decision?: string;
  reason?: string;
  authorityResult?: {
    reason?: string;
    reasonCode?: string;
    policyId?: string;
    ruleId?: string;
  };
};

type ReplayReport = {
  caseId: string;
  analysis?: {
    mode?: string;
    label?: string;
    fallbackReason?: string;
  };
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
  | { kind: "counterfactual" }
  | { kind: "success"; value: RunResult }
  | { kind: "failure"; message: string };

const colors = {
  ink: "#050505",
  panel: "#0b0b0b",
  panelSoft: "#111111",
  paper: "#f2eee6",
  muted: "#aaa59e",
  line: "rgba(255,255,255,.12)",
  red: "#e12b20",
  green: "#57c884",
  amber: "#e5a84b",
};

const buttonBase = {
  minHeight: 50,
  borderRadius: 999,
  padding: "0 20px",
  font: "inherit",
  fontWeight: 700,
  cursor: "pointer",
  transition: "transform .2s ease, opacity .2s ease, background .2s ease",
} as const;

export default function BuildWeekPage() {
  const [state, setState] = useState<RunState>({ kind: "idle" });
  const [constitutionEnabled, setConstitutionEnabled] = useState(true);

  async function callDemo(action: "run" | "reset") {
    if (action === "run" && !constitutionEnabled) {
      setState({ kind: "counterfactual" });
      return;
    }

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
  const blockedReason =
    state.kind === "success"
      ? state.value.selfApproval.decision?.authorityResult?.reason ??
        state.value.selfApproval.decision?.reason ??
        state.value.selfApproval.error?.message
      : undefined;

  const analysisLabel =
    state.kind === "success"
      ? state.value.replayReport.analysis?.label ?? "Saved deterministic response"
      : "Awaiting incident run";

  return (
    <div style={{ minHeight: "100vh", background: colors.ink, color: colors.paper }}>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 24,
          padding: "18px max(4vw, 24px)",
          borderBottom: `1px solid ${colors.line}`,
          background: "rgba(5,5,5,.86)",
          backdropFilter: "blur(18px)",
        }}
      >
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{
              display: "grid",
              placeItems: "center",
              width: 38,
              height: 38,
              borderRadius: 6,
              background: colors.red,
              fontWeight: 800,
              fontSize: 21,
            }}
          >
            A
          </span>
          <span style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <strong style={{ fontSize: 12, letterSpacing: ".18em" }}>AIBRY SPECIALISTS OS</strong>
            <small style={{ color: "#77736d", letterSpacing: ".16em", fontSize: 9 }}>
              INCIDENT CONTROL ROOM
            </small>
          </span>
        </Link>
        <nav style={{ display: "flex", gap: 18, alignItems: "center", fontSize: 12 }}>
          <Link href="/constitution" style={{ color: colors.muted }}>Constitution</Link>
          <Link href="/kernel" style={{ color: colors.muted }}>Kernel</Link>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              border: `1px solid ${colors.line}`,
              borderRadius: 999,
              padding: "9px 13px",
              color: colors.paper,
            }}
          >
            <i style={{ width: 7, height: 7, borderRadius: "50%", background: colors.green }} />
            JUDGE PATH
          </span>
        </nav>
      </header>

      <main style={{ maxWidth: 1180, margin: "0 auto", padding: "76px 24px 110px" }}>
        <section
          style={{
            position: "relative",
            overflow: "hidden",
            border: `1px solid ${colors.line}`,
            borderRadius: 24,
            padding: "clamp(34px, 6vw, 72px)",
            background:
              "radial-gradient(circle at 82% 38%, rgba(225,43,32,.28), transparent 26%), linear-gradient(135deg, #111 0%, #080808 60%, #050505 100%)",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              opacity: .14,
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.07) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
          <div style={{ position: "relative", zIndex: 1, maxWidth: 840 }}>
            <p
              style={{
                margin: 0,
                color: colors.red,
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: ".2em",
              }}
            >
              OPENAI BUILD WEEK · LIVE GPT-5.6
            </p>
            <h1
              style={{
                margin: "18px 0 20px",
                fontSize: "clamp(3.2rem, 8vw, 7.5rem)",
                lineHeight: .9,
                letterSpacing: "-.065em",
              }}
            >
              INCIDENT<br />CONTROL <span style={{ color: colors.red }}>ROOM.</span>
            </h1>
            <p style={{ maxWidth: 760, margin: 0, color: "#c7c2ba", fontSize: 19, lineHeight: 1.65 }}>
              GPT-5.6 analyzes evidence and proposes remediation. ASOS then proves
              that intelligence does not equal authority: self-approval is blocked,
              trusted human authorization is required, and every decision remains replayable.
            </p>
          </div>
        </section>

        <section
          style={{
            marginTop: 22,
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.35fr) minmax(280px, .65fr)",
            gap: 18,
          }}
        >
          <article
            style={{
              border: `1px solid ${constitutionEnabled ? "rgba(225,43,32,.58)" : colors.line}`,
              borderRadius: 18,
              padding: 24,
              background: constitutionEnabled
                ? "linear-gradient(135deg, rgba(225,43,32,.1), rgba(255,255,255,.02))"
                : colors.panel,
            }}
          >
            <label style={{ display: "flex", gap: 16, alignItems: "flex-start", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={constitutionEnabled}
                onChange={(event) => {
                  setConstitutionEnabled(event.target.checked);
                  setState({ kind: "idle" });
                }}
                style={{ marginTop: 4, accentColor: colors.red, width: 18, height: 18 }}
              />
              <span>
                <small style={{ color: colors.red, letterSpacing: ".16em", fontWeight: 800 }}>
                  INTERACTIVE CONSTITUTION
                </small>
                <strong style={{ display: "block", marginTop: 8, fontSize: 21 }}>
                  Deny specialist self-approval
                </strong>
                <span style={{ display: "block", marginTop: 9, color: colors.muted, lineHeight: 1.6 }}>
                  Enabled: the remediation specialist may propose, but a trusted human
                  operator must independently authorize APPLY. Disabled: ASOS shows the
                  unsafe counterfactual and refuses to execute it.
                </span>
              </span>
            </label>
          </article>

          <article
            style={{
              border: `1px solid ${colors.line}`,
              borderRadius: 18,
              padding: 24,
              background: colors.panel,
            }}
          >
            <small style={{ color: "#6f6b65", letterSpacing: ".15em", fontWeight: 800 }}>
              ANALYSIS MODE
            </small>
            <strong style={{ display: "block", marginTop: 12, fontSize: 18, lineHeight: 1.4 }}>
              {analysisLabel}
            </strong>
            <p style={{ margin: "12px 0 0", color: colors.muted, fontSize: 13, lineHeight: 1.55 }}>
              Live Responses API when available. Saved GPT-5.6 response otherwise.
            </p>
          </article>
        </section>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 20 }}>
          <button
            onClick={() => callDemo("run")}
            disabled={busy}
            style={{
              ...buttonBase,
              border: 0,
              background: colors.red,
              color: "white",
              opacity: busy ? .62 : 1,
              boxShadow: "0 18px 50px rgba(225,43,32,.22)",
            }}
          >
            {state.kind === "running"
              ? "Running governed incident…"
              : constitutionEnabled
                ? "Run Live Demo"
                : "Preview unsafe counterfactual"}
          </button>
          <button
            onClick={() => callDemo("reset")}
            disabled={busy}
            style={{
              ...buttonBase,
              border: `1px solid ${colors.line}`,
              background: "transparent",
              color: colors.paper,
              opacity: busy ? .62 : 1,
            }}
          >
            {state.kind === "resetting" ? "Resetting…" : "Reset demo"}
          </button>
        </div>

        <section
          aria-live="polite"
          style={{
            marginTop: 24,
            border: `1px solid ${colors.line}`,
            borderRadius: 22,
            background: "linear-gradient(180deg, #0c0c0c, #080808)",
            overflow: "hidden",
          }}
        >
          {state.kind !== "success" && (
            <div style={{ padding: "34px 30px" }}>
              {state.kind === "idle" && (
                <div>
                  <small style={{ color: colors.red, letterSpacing: ".15em", fontWeight: 800 }}>
                    READY
                  </small>
                  <h2 style={{ margin: "10px 0 8px", fontSize: 30 }}>Fresh deterministic state</h2>
                  <p style={{ margin: 0, color: colors.muted, lineHeight: 1.6 }}>
                    Run the incident, inspect the replay, reset, and repeat the same governed path.
                  </p>
                </div>
              )}
              {state.kind === "running" && (
                <div>
                  <small style={{ color: colors.red, letterSpacing: ".15em", fontWeight: 800 }}>
                    EXECUTING
                  </small>
                  <h2 style={{ margin: "10px 0 8px", fontSize: 30 }}>Governed flow in progress</h2>
                  <p style={{ margin: 0, color: colors.muted }}>Analyzing evidence, resolving authority, executing, and verifying.</p>
                </div>
              )}
              {state.kind === "resetting" && (
                <div>
                  <small style={{ color: colors.red, letterSpacing: ".15em", fontWeight: 800 }}>
                    RESETTING
                  </small>
                  <h2 style={{ margin: "10px 0 8px", fontSize: 30 }}>Restoring clean demo state</h2>
                </div>
              )}
              {state.kind === "counterfactual" && (
                <div>
                  <small style={{ color: colors.amber, letterSpacing: ".15em", fontWeight: 800 }}>
                    UNSAFE COUNTERFACTUAL
                  </small>
                  <h2 style={{ margin: "10px 0 12px", fontSize: 34 }}>One specialist controls the whole chain.</h2>
                  <p style={{ maxWidth: 820, margin: 0, color: colors.muted, lineHeight: 1.65 }}>
                    Without the self-approval rule, the same specialist could propose,
                    approve, and execute its own remediation. ASOS refuses to run this path
                    because separation of duties collapses and the approval evidence becomes meaningless.
                  </p>
                </div>
              )}
              {state.kind === "failure" && (
                <div>
                  <small style={{ color: colors.red, letterSpacing: ".15em", fontWeight: 800 }}>
                    WORKFLOW FAILED
                  </small>
                  <h2 style={{ margin: "10px 0 8px", fontSize: 30 }}>{state.message}</h2>
                </div>
              )}
            </div>
          )}

          {state.kind === "success" && (
            <div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
                  borderBottom: `1px solid ${colors.line}`,
                }}
              >
                {[
                  ["SELF-APPROVAL", state.value.selfApproval.rejected ? "Rejected by kernel" : "Unexpectedly allowed", colors.red],
                  ["HUMAN AUTHORIZATION", state.value.authorizedApproval.allowed ? "Allowed" : "Not granted", colors.green],
                  ["ANALYSIS", analysisLabel, "#d7d2ca"],
                  ["OUTCOME", state.value.replayReport.outcome?.result ?? "unknown", colors.green],
                ].map(([label, value, accent]) => (
                  <article
                    key={label}
                    style={{
                      padding: 22,
                      borderRight: `1px solid ${colors.line}`,
                      background: colors.panel,
                    }}
                  >
                    <small style={{ color: "#716d67", letterSpacing: ".14em", fontWeight: 800 }}>{label}</small>
                    <strong style={{ display: "block", marginTop: 12, color: accent, fontSize: 18, lineHeight: 1.35 }}>
                      {value}
                    </strong>
                  </article>
                ))}
              </div>

              <div style={{ padding: "30px" }}>
                <aside
                  style={{
                    padding: "20px 22px",
                    border: "1px solid rgba(225,43,32,.42)",
                    borderLeft: `5px solid ${colors.red}`,
                    background: "rgba(225,43,32,.055)",
                  }}
                >
                  <small style={{ color: colors.red, letterSpacing: ".14em", fontWeight: 800 }}>
                    WHY BLOCKED?
                  </small>
                  <h2 style={{ margin: "9px 0 8px", fontSize: 25 }}>The proposer cannot manufacture approval.</h2>
                  <p style={{ margin: 0, color: "#c3beb6", lineHeight: 1.65 }}>{blockedReason}</p>
                </aside>

                <div style={{ marginTop: 34 }}>
                  <p style={{ color: colors.red, letterSpacing: ".14em", fontWeight: 800, fontSize: 11 }}>
                    REPLAY TIMELINE
                  </p>
                  <ol style={{ listStyle: "none", padding: 0, margin: "18px 0 0" }}>
                    {state.value.timeline.map((item, index) => (
                      <li
                        key={`${index}-${item}`}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "42px 1fr",
                          gap: 16,
                          padding: "15px 0",
                          borderTop: `1px solid ${colors.line}`,
                        }}
                      >
                        <span style={{ color: colors.red, fontWeight: 800, fontSize: 12 }}>
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span style={{ color: "#d1ccc4", lineHeight: 1.6 }}>{item.replace(/^\d+\.\s*/, "")}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <details
                  style={{
                    marginTop: 26,
                    border: `1px solid ${colors.line}`,
                    borderRadius: 12,
                    padding: "16px 18px",
                    background: colors.panelSoft,
                  }}
                >
                  <summary style={{ cursor: "pointer", fontWeight: 700 }}>Inspect replay report JSON</summary>
                  <pre
                    style={{
                      overflowX: "auto",
                      whiteSpace: "pre-wrap",
                      margin: "18px 0 0",
                      color: "#aaa69f",
                      fontSize: 12,
                      lineHeight: 1.6,
                    }}
                  >
                    {JSON.stringify(state.value.replayReport, null, 2)}
                  </pre>
                </details>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
