"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Specialist = {
  code: string;
  name: string;
  job: string;
  authority: string;
  memory: string;
  tools: string[];
};

const templates: Array<{
  code: string;
  name: string;
  label: string;
  mission: string;
  sources: string[];
  specialists: Specialist[];
}> = [
  {
    code: "OPS",
    name: "Infrastructure Operations",
    label: "Keep critical systems reliable",
    mission: "Protect uptime, shorten diagnosis, preserve evidence, and make every repair safer than the last.",
    sources: ["Live telemetry", "Approved runbooks", "Configuration registry", "Incident decisions"],
    specialists: [
      { code: "OBS-01", name: "Signal Sentinel", job: "Detect meaningful operational change and assemble attributable evidence.", authority: "Observe and open cases", memory: "Signal patterns and verified incident precursors", tools: ["Metrics", "Logs", "Health checks"] },
      { code: "DIA-02", name: "Incident Diagnostician", job: "Find the causal failure and produce the safest bounded repair proposal.", authority: "Propose only", memory: "Validated diagnoses and failed hypotheses", tools: ["Topology", "Runbooks", "Case evidence"] },
      { code: "OPS-03", name: "Bounded Operator", job: "Apply exactly authorized operational changes with rollback preserved.", authority: "Apply approved scope", memory: "Execution outcomes, never private credentials", tools: ["Deploy", "Restart", "Rollback"] },
      { code: "VAL-04", name: "Independent Verifier", job: "Observe the system fresh and prove whether the intended result occurred.", authority: "Verify, never apply", memory: "Acceptance thresholds and regression patterns", tools: ["Synthetic checks", "Metrics", "Diff"] },
      { code: "MEM-05", name: "Memory Steward", job: "Convert verified experience into reviewable institutional learning proposals.", authority: "Propose memory patches", memory: "Proven operational lessons with provenance", tools: ["Evidence ledger", "Memory diff", "Conflict scan"] },
    ],
  },
  {
    code: "CRE",
    name: "Creative Enterprise",
    label: "Scale output without flattening identity",
    mission: "Move finished ideas through production, release, promotion, and archive without losing the creator’s voice.",
    sources: ["Creative Constitution", "Project vault", "Release standards", "Approved catalog"],
    specialists: [
      { code: "ARC-01", name: "Catalog Archivist", job: "Protect canonical project state, provenance, and completion evidence.", authority: "Observe and admit records", memory: "Catalog structure and verified project history", tools: ["Vault search", "Metadata", "Manifest"] },
      { code: "DIR-02", name: "Release Director", job: "Turn completed work into a coherent, bounded release case.", authority: "Propose workflows", memory: "Validated release patterns and channel requirements", tools: ["Case planner", "Calendar", "Standards"] },
      { code: "IDN-03", name: "Identity Guardian", job: "Keep artwork, language, and promotion true to the creator’s declared identity.", authority: "Approve identity fit", memory: "Creative principles and explicit rejections", tools: ["Asset review", "Style canon", "Diff"] },
      { code: "PUB-04", name: "Channel Publisher", job: "Prepare and apply authorized distribution packages per channel.", authority: "Apply approved release scope", memory: "Channel behavior and validated packaging", tools: ["Distributor", "Export", "Checklist"] },
      { code: "RET-05", name: "Release Retrospect", job: "Verify the package and propose durable lessons after launch.", authority: "Verify and propose memory", memory: "Outcomes, anomalies, and campaign evidence", tools: ["Analytics", "Archive", "Memory diff"] },
    ],
  },
  {
    code: "CST",
    name: "Customer Operations",
    label: "Deliver consistency at human scale",
    mission: "Resolve customer needs with domain depth, reliable escalation, and continuity across every interaction.",
    sources: ["Product knowledge", "Customer record", "Service policy", "Decision history"],
    specialists: [
      { code: "INT-01", name: "Intent Interpreter", job: "Identify the real customer need without inventing missing facts.", authority: "Observe and classify", memory: "Verified intent patterns and vocabulary", tools: ["CRM read", "Search", "Case intake"] },
      { code: "RES-02", name: "Resolution Specialist", job: "Build evidence-backed resolutions within service policy.", authority: "Propose and low-risk resolve", memory: "Successful resolutions by case class", tools: ["Knowledge base", "Account tools", "Draft"] },
      { code: "TRU-03", name: "Trust Guardian", job: "Protect privacy, promises, refunds, and customer-impacting authority boundaries.", authority: "Gate consequential actions", memory: "Policy interpretations and exceptions", tools: ["Policy compare", "Consent", "Escalate"] },
      { code: "ESC-04", name: "Escalation Coordinator", job: "Route high-consequence cases with complete context and no customer repetition.", authority: "Escalate and coordinate", memory: "Escalation paths and ownership evidence", tools: ["Routing", "Handoff", "Timeline"] },
      { code: "QUA-05", name: "Quality Observer", job: "Independently verify resolution quality and propose service improvements.", authority: "Verify and propose memory", memory: "Quality findings and verified failure modes", tools: ["Case replay", "Scoring", "Memory diff"] },
    ],
  },
  {
    code: "REG",
    name: "Regulated Business",
    label: "Move quickly without losing proof",
    mission: "Make policy, authority, evidence, and independent validation native to everyday work.",
    sources: ["Policy registry", "Regulatory canon", "Authorization ledger", "Audit evidence"],
    specialists: [
      { code: "MON-01", name: "Control Monitor", job: "Continuously compare live operations to declared policy and controls.", authority: "Observe and open cases", memory: "Control drift signatures and false positives", tools: ["Policy engine", "Audit log", "Diff"] },
      { code: "EVD-02", name: "Evidence Custodian", job: "Preserve attributable, time-bound evidence for every meaningful claim.", authority: "Collect and seal evidence", memory: "Evidence standards and provenance rules", tools: ["Ledger", "Timestamp", "Archive"] },
      { code: "RSK-03", name: "Risk Specialist", job: "Assess impact and propose bounded remediation with rollback.", authority: "Propose only", memory: "Verified risks and mitigation outcomes", tools: ["Risk model", "Controls", "Case file"] },
      { code: "AUT-04", name: "Authority Registrar", job: "Confirm that the right human approves the right consequence class.", authority: "Validate authority, never grant it", memory: "Authority graph and approved exceptions", tools: ["Identity", "Approval ledger", "Scope lock"] },
      { code: "AUD-05", name: "Independent Auditor", job: "Re-observe outcomes and prove alignment without trusting execution claims.", authority: "Verify and report", memory: "Audit findings and remediation evidence", tools: ["Fresh observation", "Evidence compare", "Report"] },
    ],
  },
];

const priorities = ["Continuity", "Speed", "Provenance", "Creativity", "Compliance"];
const postures = [
  { name: "Proposal-first", text: "Every consequential change requires explicit human authorization." },
  { name: "Bounded delegation", text: "Low-risk reversible actions may proceed; consequences still stop at a human gate." },
  { name: "Operational autonomy", text: "Validated routine classes may apply automatically inside hard limits and audit rules." },
];

const stressTests = [
  { code: "CONFLICT", title: "Two sources disagree", result: "Work pauses. The Knowledge layer ranks declared authority, preserves both claims, and opens a conflict-resolution case." },
  { code: "URGENCY", title: "An executive says “just do it”", result: "Urgency cannot manufacture authority. The request is converted into a scoped proposal for the correct human decision-maker." },
  { code: "MEMORY", title: "A bad lesson enters memory", result: "The Memory Steward quarantines the patch because it lacks independent verification and conflicts with existing evidence." },
];

export default function WorkforceFoundry() {
  const [orgName, setOrgName] = useState("Northstar Company");
  const [templateIndex, setTemplateIndex] = useState(0);
  const [selectedPriorities, setSelectedPriorities] = useState(["Continuity", "Provenance"]);
  const [posture, setPosture] = useState(1);
  const [built, setBuilt] = useState(false);
  const [activeRole, setActiveRole] = useState(0);
  const [stress, setStress] = useState<number | null>(null);
  const template = templates[templateIndex];
  const specialist = template.specialists[activeRole];

  const blueprint = useMemo(() => ({
    organization: orgName || "Unnamed organization",
    operating_domain: template.name,
    mission: template.mission,
    priorities: selectedPriorities,
    authority_posture: postures[posture].name,
    constitutional_sources: template.sources,
    case_contract: ["Observe", "Propose", "Human Authority", "Apply", "Independent Verify"],
    specialists: template.specialists,
    architectural_rules: [
      "Cases are the primary unit of governed work.",
      "Authority is external to every specialist.",
      "Evidence is required for meaningful outcomes.",
      "AI providers are interchangeable implementation details.",
    ],
  }), [orgName, template, selectedPriorities, posture]);

  function togglePriority(priority: string) {
    setSelectedPriorities((current) => current.includes(priority) ? current.filter((item) => item !== priority) : [...current, priority]);
    setBuilt(false);
  }

  function chooseTemplate(index: number) {
    setTemplateIndex(index);
    setActiveRole(0);
    setBuilt(false);
    setStress(null);
  }

  function buildWorkforce() {
    setBuilt(true);
    setActiveRole(0);
    setStress(null);
  }

  function exportBlueprint() {
    const blob = new Blob([JSON.stringify(blueprint, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(orgName || "organization").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-specialist-blueprint.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="foundry-page">
      <header className="foundry-topbar">
        <Link className="brand" href="/" aria-label="AIBRY Specialists OS home">
          <span className="brand-mark">A</span>
          <span className="brand-copy"><strong>AIBRY SPECIALISTS OS</strong><small>WORKFORCE FOUNDRY</small></span>
        </Link>
        <div className="foundry-nav"><span><i /> BLUEPRINT ENGINE ONLINE</span><a href="/constitution">Constitution</a><a href="/kernel">ASOS Kernel</a><a href="/theater">Capability Theater</a><a href="/lab">Specialist Lab</a><Link href="/">Platform</Link></div>
      </header>

      <main className="foundry-main">
        <section className="foundry-intro">
          <div>
            <p className="eyebrow"><span>Workforce foundry</span> · Organization-scale design</p>
            <h1>DON&apos;T HIRE AN AGENT.<br /><em>DESIGN A CAPABILITY.</em></h1>
          </div>
          <p>Define the organization. Declare what matters. The OS assembles specialized roles around one source of truth, one authority model, and one accountable case contract.</p>
        </section>

        <section className={`foundry-shell ${built ? "blueprint-built" : ""}`}>
          <aside className="foundry-config">
            <div className="foundry-label"><span>01</span> DEFINE ORGANIZATION</div>
            <label className="org-name-field"><small>ORGANIZATION NAME</small><input value={orgName} onChange={(event) => { setOrgName(event.target.value); setBuilt(false); }} aria-label="Organization name" /></label>
            <div className="config-group"><small>OPERATING DOMAIN</small><div className="template-grid">{templates.map((item,index) => <button type="button" className={templateIndex === index ? "selected" : ""} onClick={() => chooseTemplate(index)} key={item.code}><span>{item.code}</span><strong>{item.name}</strong><small>{item.label}</small></button>)}</div></div>
            <div className="config-group"><small>NON-NEGOTIABLE PRIORITIES</small><div className="priority-list">{priorities.map((priority) => <button type="button" aria-pressed={selectedPriorities.includes(priority)} className={selectedPriorities.includes(priority) ? "selected" : ""} onClick={() => togglePriority(priority)} key={priority}><i>{selectedPriorities.includes(priority) ? "✓" : "+"}</i>{priority}</button>)}</div></div>
            <div className="config-group posture-group"><small>AUTHORITY POSTURE</small><input type="range" min="0" max="2" step="1" value={posture} onChange={(event) => { setPosture(Number(event.target.value)); setBuilt(false); }} aria-label="Authority posture" /><div className="posture-scale"><span>HUMAN-HEAVY</span><span>DELEGATED</span></div><strong>{postures[posture].name}</strong><p>{postures[posture].text}</p></div>
            <button className="forge-button" type="button" onClick={buildWorkforce}><span>{built ? "RE-FORGE BLUEPRINT" : "FORGE WORKFORCE"}</span><strong>{built ? "Apply configuration changes" : "Assemble specialist organization"}</strong><i>→</i></button>
          </aside>

          <div className="blueprint-stage">
            <div className="blueprint-head"><div><small>ORGANIZATIONAL BLUEPRINT</small><h2>{built ? (orgName || "Unnamed organization") : "Awaiting configuration"}</h2></div><span className={built ? "ready" : ""}><i />{built ? "BLUEPRINT VALID" : "NOT FORGED"}</span></div>

            <div className={`org-map ${built ? "active" : ""}`}>
              <div className="foundry-core"><small>ONE TRUE SOURCE</small><strong>CONSTITUTION</strong><span>{template.code} · {postures[posture].name}</span><i /></div>
              <div className="case-orbit"><span>CASE CONTRACT</span><b>OBSERVE → PROPOSE → AUTHORIZE → APPLY → VERIFY</b></div>
              {template.specialists.map((item,index) => (
                <button type="button" className={`foundry-role role-${index + 1} ${activeRole === index ? "selected" : ""}`} disabled={!built} onClick={() => setActiveRole(index)} key={item.code}>
                  <span>{item.code}</span><strong>{item.name}</strong><small>{item.authority}</small><i>{index + 1}</i>
                </button>
              ))}
              {[1,2,3,4,5].map((line) => <span className={`foundry-line foundry-line-${line}`} key={line} />)}
            </div>

            <div className="blueprint-metrics">
              <div><strong>{built ? "05" : "—"}</strong><span>SPECIALIZED ROLES</span></div>
              <div><strong>{built ? String(template.sources.length).padStart(2,"0") : "—"}</strong><span>TRUTH SOURCES</span></div>
              <div><strong>{built ? "05" : "—"}</strong><span>CASE GATES</span></div>
              <div><strong>00</strong><span>SELF-GRANTED POWERS</span></div>
            </div>
          </div>

          <aside className="foundry-inspector">
            <div className="foundry-label"><span>02</span> ROLE CONTRACT</div>
            {!built ? <div className="inspector-empty"><span>⌁</span><strong>Forge the workforce</strong><p>The role contract, authority boundary, memory inheritance, and approved tools will appear here.</p></div> : <>
              <div className="inspector-title"><small>{specialist.code}</small><h3>{specialist.name}</h3><span>{specialist.authority}</span></div>
              <dl className="contract-list"><div><dt>MISSION</dt><dd>{specialist.job}</dd></div><div><dt>ROLE MEMORY</dt><dd>{specialist.memory}</dd></div><div><dt>APPROVED TOOLS</dt><dd>{specialist.tools.map((tool) => <span key={tool}>✓ {tool}</span>)}</dd></div><div><dt>AUTHORITY OWNER</dt><dd>External constitutional graph</dd></div></dl>
              <div className="instance-rule"><span>CLONE RULE</span><p>New instances inherit this validated role contract—not another worker&apos;s private task history.</p></div>
            </>}
          </aside>
        </section>

        <section className={`stress-lab ${built ? "unlocked" : ""}`}>
          <div className="stress-copy"><div className="foundry-label"><span>03</span> CONSTITUTION STRESS TEST</div><h2>Trust is not what happens<br />when things go right.</h2><p>Attack the blueprint with the situations that usually make AI systems abandon their rules.</p></div>
          <div className="stress-console">
            <div className="stress-buttons">{stressTests.map((test,index) => <button type="button" disabled={!built} className={stress === index ? "selected" : ""} onClick={() => setStress(index)} key={test.code}><small>{test.code}</small><strong>{test.title}</strong><span>RUN ↗</span></button>)}</div>
            <div className={`stress-result ${stress !== null ? "visible" : ""}`}><div><span>{stress !== null ? "CONSTITUTIONAL RESPONSE" : "AWAITING STRESS EVENT"}</span><i>{stress !== null ? "CONTROL HELD" : "STANDBY"}</i></div><p>{stress !== null ? stressTests[stress].result : "Forge a workforce, then choose a failure condition to prove its boundaries."}</p>{stress !== null && <small>NO AUTHORITY DRIFT · EVIDENCE PRESERVED · CASE OPENED</small>}</div>
          </div>
        </section>

        <section className="foundry-export">
          <div><p>THE RESULT</p><h2>A workforce architecture<br />you can actually inspect.</h2></div>
          <div><p>{built ? `${template.specialists.length} roles. ${template.sources.length} sources of truth. One external authority model. Zero silent self-rewrites.` : "Forge the workforce to generate a portable organizational blueprint."}</p><button type="button" disabled={!built} onClick={exportBlueprint}>Download workforce blueprint <span>↓</span></button></div>
        </section>
      </main>
    </div>
  );
}
