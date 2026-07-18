"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

const roles = [
  {
    code: "INFRA-01",
    name: "Infrastructure Diagnostician",
    short: "Infrastructure",
    mission: "Find the real failure, preserve the evidence, and propose the safest repair.",
    scenario: "Checkout API latency breached the 800 ms operational threshold.",
    observation: "Correlated latency spike with exhausted database connections on two production workers.",
    proposal: "Raise the worker pool limit from 12 to 18, recycle only affected workers, and preserve rollback at 12.",
    result: "P95 latency returned to 214 ms. Error rate remained below 0.2%. No unrelated workers changed.",
    sources: ["Live telemetry", "Approved runbooks", "Incident history"],
    tools: ["Read logs", "Query metrics", "Draft repair"],
  },
  {
    code: "CREATIVE-02",
    name: "Creative Release Director",
    short: "Creative",
    mission: "Move completed work through release without flattening the artist’s identity.",
    scenario: "A final master is ready, but the release package is incomplete.",
    observation: "Master audio passed technical checks; artwork, metadata, distribution notes, and archive manifest are missing.",
    proposal: "Launch the approved release workflow and assign four bounded specialist tasks with shared project context.",
    result: "Release package completed with consistent identity, verified metadata, and a complete archival record.",
    sources: ["Music Vault", "Artist Constitution", "Release standards"],
    tools: ["Inspect catalog", "Build workflow", "Draft assets"],
  },
  {
    code: "TRUST-03",
    name: "Compliance Sentinel",
    short: "Compliance",
    mission: "Detect policy drift early and prove every claim with attributable evidence.",
    scenario: "A privileged service account no longer matches the approved access policy.",
    observation: "One permission was added outside the current authorization record; no active incident explains it.",
    proposal: "Suspend the unapproved permission, preserve the audit trail, and request owner review before removal.",
    result: "Unauthorized scope isolated. Approved access remained uninterrupted. Evidence package attached for review.",
    sources: ["Access policy", "Audit evidence", "Authorization ledger"],
    tools: ["Compare policy", "Collect evidence", "Propose containment"],
  },
  {
    code: "KNOW-04",
    name: "Knowledge Architect",
    short: "Knowledge",
    mission: "Turn fragmented organizational knowledge into reliable, navigable authority.",
    scenario: "Three onboarding guides disagree about the production release process.",
    observation: "Two documents are stale; the newest guide conflicts with one recorded operational decision.",
    proposal: "Preserve all sources, designate the verified procedure as canonical, and mark conflicting guidance superseded.",
    result: "One authoritative path established with provenance, version history, and explicit conflict resolution.",
    sources: ["Canonical docs", "Decision ledger", "Change history"],
    tools: ["Search sources", "Compare versions", "Propose canon"],
  },
];

const phases = ["Observe", "Propose", "Authorize", "Apply", "Verify"];

export default function SpecialistLab() {
  const [roleIndex, setRoleIndex] = useState(0);
  const [phase, setPhase] = useState(0);
  const [maturity, setMaturity] = useState(0);
  const [clones, setClones] = useState(1);
  const [cycles, setCycles] = useState(0);
  const [flash, setFlash] = useState(false);

  const role = roles[roleIndex];
  const currentPhase = phase === 0 ? "Ready" : phases[phase - 1];

  const buttonLabel = [
    "Begin assignment",
    "Draft evidence-backed proposal",
    "Human authorize proposal",
    "Apply authorized change",
    "Run independent verification",
    "Approve memory patch & mature",
  ][phase];

  const logs = useMemo(() => {
    const entries = [
      `[BOOT] ${role.code} role package loaded. Constitution lock confirmed.`,
    ];
    if (maturity > 0) entries.push(`[MEMORY] ${maturity} approved learning patch${maturity === 1 ? "" : "es"} available to this role.`);
    if (phase >= 1) entries.push(`[OBSERVE] ${role.observation}`);
    if (phase >= 2) entries.push(`[PROPOSE] ${role.proposal}`);
    if (phase >= 3) entries.push("[AUTHORITY] Human authorization recorded. Scope locked to this proposal.");
    if (phase >= 4) entries.push("[APPLY] Authorized change executed. Verification authority remains independent.");
    if (phase >= 5) entries.push(`[VERIFY] ${role.result}`);
    return entries;
  }, [role, phase, maturity]);

  function chooseRole(index: number) {
    if (phase !== 0) return;
    setRoleIndex(index);
    setClones(1);
    setMaturity(0);
    setCycles(0);
  }

  function advanceCycle() {
    setFlash(true);
    window.setTimeout(() => setFlash(false), 420);
    if (phase < 5) {
      setPhase((value) => value + 1);
      return;
    }
    setMaturity((value) => value + 1);
    setCycles((value) => value + 1);
    setPhase(0);
  }

  function cloneSpecialist() {
    if (maturity < 1 || clones >= 6) return;
    setClones((value) => value + 1);
  }

  return (
    <div className="lab-page">
      <header className="lab-topbar">
        <Link className="brand" href="/" aria-label="Return to AIBRY Specialists OS">
          <span className="brand-mark">A</span>
          <span className="brand-copy"><strong>AIBRY SPECIALISTS OS</strong><small>INTERACTIVE SPECIALIST LAB</small></span>
        </Link>
        <div className="lab-nav-actions">
          <span className="live-indicator"><i /> SYSTEM ONLINE</span>
          <a href="/constitution">Constitution</a>
          <a href="/kernel">ASOS Kernel</a>
          <a href="/foundry">Workforce foundry</a>
          <a href="/theater">Capability theater</a>
          <Link href="/">← Back to the platform</Link>
        </div>
      </header>

      <main className="lab-main">
        <section className="lab-intro">
          <div>
            <p className="eyebrow"><span>Interactive prototype</span> · Governed maturation</p>
            <h1>DON&apos;T READ THE PITCH.<br /><em>RUN THE SYSTEM.</em></h1>
          </div>
          <p>
            Configure a specialist, give it a real assignment, control the authority
            boundary, approve its memory, and clone the capability once it proves itself.
          </p>
        </section>

        <section className={`lab-board ${flash ? "lab-flash" : ""}`}>
          <aside className="role-picker">
            <div className="panel-label"><span>01</span> SELECT ROLE</div>
            <div className="role-options">
              {roles.map((item, index) => (
                <button
                  type="button"
                  key={item.code}
                  className={roleIndex === index ? "selected" : ""}
                  aria-pressed={roleIndex === index}
                  disabled={phase !== 0}
                  onClick={() => chooseRole(index)}
                >
                  <small>{item.code}</small>
                  <strong>{item.short}</strong>
                  <span>↗</span>
                </button>
              ))}
            </div>

            <div className="role-spec">
              <div className="spec-row"><small>MISSION</small><p>{role.mission}</p></div>
              <div className="spec-row"><small>AUTHORITATIVE SOURCES</small>{role.sources.map((source) => <span key={source}>✓ {source}</span>)}</div>
              <div className="spec-row"><small>APPROVED TOOLS</small>{role.tools.map((tool) => <span key={tool}>· {tool}</span>)}</div>
            </div>
          </aside>

          <div className="work-console">
            <div className="console-head">
              <div>
                <small>ACTIVE SPECIALIST</small>
                <h2>{role.name}</h2>
              </div>
              <div className="specialist-state"><i className={phase > 0 ? "active" : ""}/><span>{currentPhase.toUpperCase()}</span></div>
            </div>

            <div className="core-stage">
              <div className={`lab-core phase-${phase}`}>
                <span className="orbit orbit-one"/><span className="orbit orbit-two"/><span className="orbit orbit-three"/>
                <div className="core-center"><small>ASOS</small><strong>{String(maturity + 1).padStart(2, "0")}</strong><span>MATURITY</span></div>
              </div>
              <div className="assignment-card">
                <small>ACTIVE ASSIGNMENT</small>
                <strong>{role.scenario}</strong>
                <div><span>Authority ceiling</span><b>{phase < 3 ? "PROPOSE ONLY" : "AUTHORIZED SCOPE"}</b></div>
              </div>
            </div>

            <div className="phase-track" aria-label="Governed work cycle">
              {phases.map((item, index) => {
                const stage = index + 1;
                return (
                  <div className={phase === stage ? "active" : phase > stage ? "complete" : ""} key={item}>
                    <span>{phase > stage ? "✓" : stage}</span><strong>{item}</strong>
                  </div>
                );
              })}
            </div>

            <div className="terminal-window" aria-live="polite">
              <div className="terminal-title"><span>OPERATION LOG</span><i/><i/><i/></div>
              <div className="terminal-lines">
                {logs.map((entry, index) => <p key={`${entry}-${index}`}><span>{String(index + 1).padStart(2, "0")}</span>{entry}</p>)}
                <p className="terminal-cursor"><span>{String(logs.length + 1).padStart(2, "0")}</span>_<i /></p>
              </div>
            </div>

            <button className={`cycle-button phase-button-${phase}`} type="button" onClick={advanceCycle}>
              <span>{phase === 2 ? "HUMAN ACTION REQUIRED" : phase === 5 ? "MEMORY REVIEW" : "ADVANCE WORK CYCLE"}</span>
              <strong>{buttonLabel}</strong>
              <i>→</i>
            </button>
          </div>

          <aside className="governance-panel">
            <div className="panel-label"><span>02</span> CONSTITUTION LOCK</div>
            <div className="lock-visual"><div>⌾</div><strong>ENFORCED</strong><small>Specialist cannot override</small></div>
            <dl className="authority-table">
              <div><dt>Observe</dt><dd>Allowed</dd></div>
              <div><dt>Propose</dt><dd>Allowed</dd></div>
              <div><dt>Authorize</dt><dd className={phase === 2 ? "human-required" : "human"}>Human only</dd></div>
              <div><dt>Apply</dt><dd>After approval</dd></div>
              <div><dt>Verify</dt><dd>Independent</dd></div>
            </dl>
            <div className="maturity-stats">
              <div><span>{cycles}</span><small>VERIFIED CYCLES</small></div>
              <div><span>{maturity}</span><small>MEMORY PATCHES</small></div>
              <div><span>{clones}</span><small>ACTIVE INSTANCES</small></div>
            </div>
            <div className="governance-warning"><span>!</span><p><strong>No silent self-rewrites.</strong>The specialist may propose its improvement. It may never approve it.</p></div>
          </aside>
        </section>

        <section className="clone-bay-section">
          <div className="clone-bay-copy">
            <div className="panel-label"><span>03</span> CAPABILITY DEPLOYMENT</div>
            <h2>Prove the role.<br /><em>Then multiply it.</em></h2>
            <p>
              Complete one governed cycle to unlock cloning. Every new instance inherits
              validated role memory and standards—never another instance&apos;s private task history.
            </p>
            <button type="button" onClick={cloneSpecialist} disabled={maturity < 1 || clones >= 6}>
              {maturity < 1 ? "Complete a verified cycle to unlock" : clones >= 6 ? "Demo capacity reached" : "+ Deploy validated clone"}
            </button>
          </div>
          <div className="clone-bay-visual">
            <div className="shared-role-core"><small>SHARED ROLE</small><strong>{role.code}</strong><span>MEMORY v{maturity}.0</span></div>
            <div className="clone-pods">
              {[1,2,3,4,5,6].map((number) => (
                <div className={number <= clones ? "deployed" : "empty"} key={number}>
                  <span>{String(number).padStart(2,"0")}</span>
                  <strong>{number <= clones ? role.short : "EMPTY BAY"}</strong>
                  <small>{number <= clones ? "ACCOUNTABLE INSTANCE" : "AWAITING DEPLOYMENT"}</small>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="lab-close">
          <p>That is the difference.</p>
          <h2>Agents perform.<br /><em>Specialists develop.</em></h2>
          <div><Link className="button button-primary" href="/">Return to the full platform</Link><button className="button button-secondary" type="button" onClick={() => { setPhase(0); setMaturity(0); setCycles(0); setClones(1); }}>Reset the lab</button></div>
        </section>
      </main>
    </div>
  );
}
