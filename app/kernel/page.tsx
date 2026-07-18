"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type ArchitectureNode = {
  id: string;
  label: string;
  eyebrow: string;
  status: "implemented" | "active" | "building" | "boundary";
  file: string;
  summary: string;
  guarantees: string[];
  accepts: string;
  returns: string;
};

const architectureNodes: ArchitectureNode[] = [
  {
    id: "specialists",
    label: "Specialists",
    eyebrow: "DOMAIN / IDENTITY",
    status: "implemented",
    file: "lib/domain/specialists.ts",
    summary: "Defines a specialist as a bounded capability: role, purpose, constraints, and declared competence. Specialists do not own projects, authority, or organizational truth.",
    guarantees: ["Role identity is explicit", "Capabilities are declared", "Project data stays external", "No implied authority"],
    accepts: "Specialist definition",
    returns: "Validated capability contract",
  },
  {
    id: "authority",
    label: "Authority",
    eyebrow: "DOMAIN / GOVERNANCE",
    status: "implemented",
    file: "lib/domain/authority.ts",
    summary: "Models authority as an external grant with an actor, consequence class, exact scope, and decision. A specialist may use authority; it can never manufacture or own it.",
    guarantees: ["Authority remains external", "Scope is consequence-bound", "Decisions are attributable", "Urgency grants nothing"],
    accepts: "Grant + proposed consequence",
    returns: "Authorized or denied scope",
  },
  {
    id: "execution",
    label: "Execution",
    eyebrow: "DOMAIN / ACTION",
    status: "implemented",
    file: "lib/domain/execution.ts",
    summary: "Records what was intended, what was authorized, who or what applied it, and what actually happened. Execution is a governed record—not a tool call hidden inside a chat transcript.",
    guarantees: ["Intent is preserved", "Authorization is linked", "Outcome is explicit", "Evidence is attributable"],
    accepts: "Authorized command",
    returns: "Execution + evidence",
  },
  {
    id: "cases",
    label: "Cases",
    eyebrow: "DOMAIN / CONTINUITY",
    status: "implemented",
    file: "lib/domain/case.ts",
    summary: "Provides the durable spine of governed work: one immutable identity that ties together evidence, authority decisions, execution, verification, and final outcome.",
    guarantees: ["Case identity is stable", "State transitions are explicit", "Evidence remains linked", "Replay is possible"],
    accepts: "Incident + specialist work",
    returns: "Closed governed case",
  },
  {
    id: "kernel",
    label: "Case Kernel",
    eyebrow: "KERNEL / TRANSITIONS",
    status: "implemented",
    file: "lib/kernel/case-kernel.ts",
    summary: "Applies immutable, versioned transitions. The kernel accepts a proposed change only when the current state and authority evidence support it.",
    guarantees: ["Transitions are deterministic", "Authority is enforced", "Evidence is append-only", "Closure is explicit"],
    accepts: "Case state + command",
    returns: "Next case state",
  },
  {
    id: "application",
    label: "Application Service",
    eyebrow: "APPLICATION / ORCHESTRATION",
    status: "implemented",
    file: "lib/application/case-application-service.ts",
    summary: "Coordinates persistence, authority resolution, command execution, kernel application, and evidence attachment without moving provider concerns into the domain.",
    guarantees: ["Ports stay explicit", "Commands are idempotent", "Authority is resolved before execution", "Conflicts remain visible"],
    accepts: "Case application request",
    returns: "Saved governed result",
  },
  {
    id: "adapters",
    label: "Infrastructure Adapters",
    eyebrow: "BOUNDARY / PROVIDERS",
    status: "building",
    file: "lib/application/ports/*",
    summary: "Provider-specific persistence, authority, and execution implementations plug into existing ports. The kernel remains unaware of cloud vendors, databases, or AI providers.",
    guarantees: ["Provider details remain outside", "Ports are replaceable", "Failure is structured", "Tests can stay deterministic"],
    accepts: "Application port contract",
    returns: "Concrete provider behavior",
  },
];

const caseStates = ["OPEN", "ANALYZED", "PROPOSED", "BLOCKED", "AUTHORIZED", "EXECUTED", "VERIFIED", "CLOSED"];

const evidenceRules = [
  ["Attributable", "Every observation names its source and recording time."],
  ["Immutable", "Evidence is appended to a case; prior evidence is never silently rewritten."],
  ["Scoped", "Evidence supports a specific decision, execution, or verification claim."],
  ["Replayable", "A reviewer can reconstruct why the system moved from one state to the next."],
];

const downstreamSystems = [
  ["Incident Control Room", "Live GPT-5.6 analysis, authority denial, human approval, execution, verification, and replay."],
  ["Workforce Foundry", "Composes reusable teams from bounded roles and declared operating contracts."],
  ["Specialist Lab", "Evaluates specialist competence, behavior, and maturity against evidence-backed scenarios."],
  ["Catalog OS", "Applies governed specialist work to structured creative and operational catalogs."],
];

export default function KernelPage() {
  const [selectedId, setSelectedId] = useState("kernel");
  const selected = useMemo(() => architectureNodes.find((node) => node.id === selectedId) ?? architectureNodes[0], [selectedId]);

  return (
    <div className="kernel-page">
      <header className="kernel-header">
        <Link className="brand" href="/" aria-label="AIBRY Specialists OS home"><span className="brand-mark">A</span><span className="brand-copy"><strong>AIBRY SPECIALISTS OS</strong><small>ASOS KERNEL</small></span></Link>
        <nav aria-label="Kernel navigation"><a href="#overview">Overview</a><a href="#architecture">Architecture</a><a href="#case-contract">Case contract</a><a href="#evidence">Evidence</a><a href="#systems">Systems</a><a className="nav-cta" href="/build-week">Launch Live Demo</a></nav>
      </header>

      <main>
        <section className="kernel-hero" id="overview">
          <div className="kernel-hero-copy"><p className="kernel-label">ASOS KERNEL · LIVING ARCHITECTURE</p><h1>Governed work<br /><em>made inspectable.</em></h1><p>The kernel turns specialist proposals into explicit, replayable state transitions—without allowing the model, the role, or the tool layer to manufacture authority.</p><div className="hero-actions"><a className="button button-primary" href="#architecture">Explore architecture</a><a className="button button-secondary" href="/build-week">Launch Live Demo</a></div></div>
          <aside className="kernel-status"><span>IMPLEMENTED FOUNDATION</span><strong>Domain → Kernel → Application</strong><small>Provider-independent core</small></aside>
        </section>

        <section className="kernel-principles section-pad" id="principles">
          <div className="section-kicker"><span>00</span> Kernel principles</div>
          <div className="kernel-principle-grid"><article><strong>Authority is external</strong><p>A specialist can present evidence and propose action, but authority must arrive as an independent grant.</p></article><article><strong>State transitions are explicit</strong><p>Every consequential step is represented as a case transition rather than hidden inside conversational state.</p></article><article><strong>Execution follows approval</strong><p>The application service resolves authority and persists the decision before command execution may begin.</p></article><article><strong>Verification is independent</strong><p>The result is not trusted merely because the executor reports success; evidence closes the loop.</p></article></div>
        </section>

        <section className="kernel-architecture section-pad" id="architecture">
          <div className="section-heading"><div className="section-kicker"><span>01</span> Living architecture</div><h2>Inspect the contract<br /><em>behind the demo.</em></h2><p>Select a layer to see its implemented responsibility, guarantees, and code boundary.</p></div>
          <div className="kernel-workbench"><div className="kernel-node-list">{architectureNodes.map((node) => <button key={node.id} className={selected.id === node.id ? "kernel-node active" : "kernel-node"} onClick={() => setSelectedId(node.id)}><span>{node.eyebrow}</span><strong>{node.label}</strong><small>{node.status.toUpperCase()}</small></button>)}</div><article className="kernel-inspector"><p>{selected.eyebrow}</p><h3>{selected.label}</h3><code>{selected.file}</code><p>{selected.summary}</p><div className="kernel-io"><div><small>ACCEPTS</small><strong>{selected.accepts}</strong></div><div><small>RETURNS</small><strong>{selected.returns}</strong></div></div><ul>{selected.guarantees.map((guarantee) => <li key={guarantee}>{guarantee}</li>)}</ul></article></div>
        </section>

        <section className="case-contract section-pad" id="case-contract"><div className="section-heading"><div className="section-kicker"><span>02</span> Case contract</div><h2>One durable identity.<br /><em>Every governed decision.</em></h2><p>A case is the spine that links evidence, authority, execution, independent observation, and outcome.</p></div><div className="case-state-track">{caseStates.map((state, index) => <div className="case-state" key={state}><span>{String(index + 1).padStart(2, "0")}</span><strong>{state}</strong>{index < caseStates.length - 1 && <i>→</i>}</div>)}</div><div className="case-schema"><div><small>IDENTITY</small><strong>caseId · title · project reference</strong></div><div><small>AUTHORITY</small><strong>decisions · scope · reason codes</strong></div><div><small>ACTION</small><strong>execution IDs · idempotency</strong></div><div><small>PROOF</small><strong>evidence IDs · outcome · closure</strong></div></div></section>

        <section className="kernel-evidence section-pad" id="evidence"><div className="section-heading"><div className="section-kicker"><span>03</span> Evidence rules</div><h2>Proof survives<br /><em>the conversation.</em></h2></div><div className="evidence-grid">{evidenceRules.map(([title, copy], index) => <article key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{copy}</p></article>)}</div></section>

        <section className="kernel-systems section-pad" id="systems"><div className="section-heading"><div className="section-kicker"><span>04</span> Systems built on the kernel</div><h2>One contract.<br /><em>Many operating surfaces.</em></h2></div><div className="kernel-system-grid">{downstreamSystems.map(([title, copy], index) => <article key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{copy}</p>{index === 0 ? <a href="/build-week">Launch live demo →</a> : <small>POST-SUBMISSION ROADMAP</small>}</article>)}</div></section>
      </main>

      <footer><div className="footer-brand"><span className="brand-mark">A</span><strong>ASOS KERNEL</strong></div><p>Governed state transitions for persistent AI specialists.</p><Link href="/constitution">Interactive Constitution →</Link></footer>
    </div>
  );
}
