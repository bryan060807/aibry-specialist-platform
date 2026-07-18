const specialistParts = [
  {
    index: "01",
    title: "Role",
    copy: "A bounded professional identity with an explicit mission, responsibilities, and definition of done.",
  },
  {
    index: "02",
    title: "Knowledge",
    copy: "Approved domain sources selected by the organization—not whatever the model happens to remember.",
  },
  {
    index: "03",
    title: "Memory",
    copy: "Institutional continuity, role development, and accountable experience carried across sessions.",
  },
  {
    index: "04",
    title: "Tools",
    copy: "Only the capabilities required for the role, exposed through deliberate and auditable permissions.",
  },
  {
    index: "05",
    title: "Authority",
    copy: "A hard boundary between what the specialist can observe, propose, authorize, and apply.",
  },
  {
    index: "06",
    title: "Validation",
    copy: "Evidence-backed evaluation that proves competence instead of merely claiming it.",
  },
];

const memoryLayers = [
  ["Constitutional", "Operating principles, authority, standards, and truth-resolution rules."],
  ["Organizational", "Shared projects, decisions, policies, vocabulary, and institutional knowledge."],
  ["Role", "Expertise and lessons inherited by every validated instance of a specialist."],
  ["Instance", "The individual worker’s accountable history, preferences, and development."],
  ["Task", "Temporary working context that expires when the assignment is complete."],
];

const maturitySteps = [
  ["Observe", "Collect evidence without changing the system."],
  ["Propose", "Recommend a bounded improvement with rationale and expected outcomes."],
  ["Authorize", "Require independent human approval before consequential action."],
  ["Apply", "Execute only the approved scope through a governed authority gate."],
  ["Verify", "Independently observe results and preserve replayable evidence."],
];

const useCases = [
  ["01", "Incident response", "Evidence-driven diagnosis, bounded remediation, human authorization, and replayable verification."],
  ["02", "Catalog operations", "Persistent specialist roles that preserve standards, provenance, and accountable changes."],
  ["03", "Creative production", "Domain-bound workers that mature through evidence without silently rewriting their own rules."],
  ["04", "Engineering operations", "Governed proposals, explicit authority, deterministic execution, and independent validation."],
  ["05", "Workforce design", "Reusable role packages with defined knowledge, tools, standards, and escalation boundaries."],
  ["06", "Organizational memory", "Shared context that compounds learning while keeping temporary work separate from doctrine."],
];

const guardrails = [
  ["01", "No silent authority", "Specialists cannot grant themselves new permissions or approve their own consequential actions."],
  ["02", "No silent memory rewrite", "Experience may be proposed for promotion, but constitutional and role memory remain review-gated."],
  ["03", "No unbounded tools", "Every tool is attached to a role, scope, and auditable operating contract."],
  ["04", "No proof by assertion", "Capability is demonstrated through evidence, outcomes, and independent validation."],
];

export default function Home() {
  return (
    <div className="site-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="AIBRY Specialists OS home">
          <span className="brand-mark">A</span>
          <span className="brand-copy">
            <strong>AIBRY SPECIALISTS OS</strong>
            <small>GOVERNED AI WORKFORCE</small>
          </span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#system">The system</a>
          <a href="#constitution">Constitution</a>
          <a href="#memory">Memory</a>
          <a href="#maturation">Maturation</a>
          <a className="nav-cta" href="/build-week">Launch Live Demo</a>
        </nav>
      </header>

      <main>
        <section className="hero" id="top">
          <div className="hero-image" aria-hidden="true">
            <img src="/specialist-core.svg" alt="" />
            <div className="hero-shade" />
            <div className="hero-grid" />
          </div>

          <div className="hero-content">
            <p className="eyebrow"><span>Intelligence is abundant.</span> Continuity is not.</p>
            <h1>BUILD A WORKFORCE<br />THAT <em>REMEMBERS.</em></h1>
            <p className="hero-lede">
              Persistent, domain-bound AI specialists that learn from evidence,
              share institutional memory, and mature under human authority.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="/build-week">Launch Live Demo <span>↗</span></a>
              <a className="button button-secondary" href="#system">Explore Specialists OS</a>
            </div>
          </div>

          <div className="constitution-callout">
            <span className="callout-line" />
            <p>THE CONSTITUTION</p>
            <small>Truth · Authority · Standards · Boundaries</small>
          </div>

          <div className="hero-rail" aria-label="System components">
            <span>Role</span><span>Memory</span><span>Tools</span><span>Authority</span><span>Validation</span>
          </div>

          <div className="scroll-cue" aria-hidden="true"><span /> SCROLL TO ENTER THE SYSTEM</div>
        </section>

        <section className="statement section-pad">
          <div className="section-kicker"><span>00</span> The shift</div>
          <div className="statement-grid">
            <h2>Most AI agents are talented contractors with amnesia.</h2>
            <div className="statement-copy">
              <p>
                They arrive without institutional knowledge, complete an assignment,
                and disappear. The next session starts with another talented stranger
                who must learn the organization all over again.
              </p>
              <p>
                AIBRY Specialists OS changes the unit from an agent into a specialist:
                a persistent worker with a defined role, approved knowledge, bounded
                authority, measurable standards, and a history it can responsibly build upon.
              </p>
            </div>
          </div>
          <div className="shift-line">
            <div><small>THE OLD UNIT</small><strong>Disposable agent</strong></div>
            <span className="shift-arrow">→</span>
            <div><small>THE NEW UNIT</small><strong>Persistent specialist</strong></div>
          </div>
        </section>

        <section className="system section-pad" id="system">
          <div className="section-heading">
            <div className="section-kicker"><span>01</span> Specialist anatomy</div>
            <h2>The model is the engine.<br /><em>The specialist is the system.</em></h2>
            <p>
              Intelligence becomes durable capability only when it is wrapped in
              identity, knowledge, memory, tools, governance, and proof.
            </p>
          </div>

          <div className="formula" aria-label="Specialist formula">
            <span>SPECIALIST</span>
            <b>=</b>
            <div>MODEL <i>+</i> ROLE <i>+</i> KNOWLEDGE <i>+</i> MEMORY <i>+</i> TOOLS <i>+</i> AUTHORITY <i>+</i> VALIDATION</div>
          </div>

          <div className="parts-grid">
            {specialistParts.map((part) => (
              <article className="part-card" key={part.title}>
                <div className="part-top"><span>{part.index}</span><i>↗</i></div>
                <h3>{part.title}</h3>
                <p>{part.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="constitution section-pad" id="constitution">
          <div className="constitution-visual" aria-hidden="true">
            <img src="/specialist-core.svg" alt="" />
            <div className="visual-fade" />
            <span className="core-ring core-ring-one" />
            <span className="core-ring core-ring-two" />
          </div>
          <div className="constitution-copy">
            <div className="section-kicker"><span>02</span> The Constitution</div>
            <h2>One authority.<br /><em>Many specialists.</em></h2>
            <p className="large-copy">
              The Constitution is not a giant prompt. It is the organization’s
              versioned registry of authoritative knowledge, operating standards,
              permissions, and conflict-resolution rules.
            </p>
            <ul className="feature-list">
              <li><span>01</span><div><strong>Defines what counts as truth</strong><small>Sources are declared, ranked, versioned, and attributable.</small></div></li>
              <li><span>02</span><div><strong>Defines who holds authority</strong><small>Observation, proposal, approval, application, and verification remain distinct.</small></div></li>
              <li><span>03</span><div><strong>Defines how work is judged</strong><small>Every role inherits measurable standards instead of vague expectations.</small></div></li>
              <li><span>04</span><div><strong>Defines the hard boundaries</strong><small>No specialist can quietly grant itself tools, permissions, or truth.</small></div></li>
            </ul>
            <a className="constitution-demo-link" href="/build-week"><span>INTERACTIVE CONSTITUTION</span><strong>Break the rule. Watch governance explain the failure.</strong><i>→</i></a>
          </div>
        </section>

        <section className="memory section-pad" id="memory">
          <div className="section-heading split-heading">
            <div>
              <div className="section-kicker"><span>03</span> Memory architecture</div>
              <h2>Shared memory.<br /><em>Individual accountability.</em></h2>
            </div>
            <p>
              Memory is layered so the organization can compound what works without
              turning every temporary thought into permanent doctrine.
            </p>
          </div>
          <div className="memory-stack">
            {memoryLayers.map(([title, copy], index) => (
              <article className="memory-layer" key={title} style={{ "--layer": index } as React.CSSProperties}>
                <span>0{index + 1}</span>
                <h3>{title} memory</h3>
                <p>{copy}</p>
                <i>{index === 0 ? "FOUNDATION" : index === 4 ? "EPHEMERAL" : "PERSISTENT"}</i>
              </article>
            ))}
          </div>
          <aside className="memory-note">
            <strong>The model supplies the intelligence.</strong>
            <span>Your memory architecture supplies the identity.</span>
          </aside>
        </section>

        <section className="maturation section-pad" id="maturation">
          <div className="section-heading maturation-heading">
            <div className="section-kicker"><span>04</span> Governed maturation</div>
            <h2>Growth without<br /><em>ungoverned authority.</em></h2>
            <p>
              Specialists improve through evidence and experience—but they cannot
              silently rewrite their own history, standards, or permissions.
            </p>
          </div>

          <div className="maturity-track">
            {maturitySteps.map(([title, copy], index) => (
              <article className="maturity-step" key={title}>
                <div className="step-node"><span>{index + 1}</span></div>
                <div className="step-copy"><h3>{title}</h3><p>{copy}</p></div>
              </article>
            ))}
          </div>

          <div className="no-silent-rewrite">
            <span>NON-NEGOTIABLE</span>
            <strong>A specialist may propose its own improvement. It may never approve it.</strong>
          </div>
        </section>

        <section className="applications section-pad">
          <div className="section-heading">
            <div className="section-kicker"><span>05</span> Where it operates</div>
            <h2>One operating system.<br /><em>Many bounded roles.</em></h2>
          </div>
          <div className="use-case-grid">
            {useCases.map(([index, title, copy]) => (
              <article className="use-case" key={title}>
                <span>{index}</span><h3>{title}</h3><p>{copy}</p><i>GOVERNED SPECIALIST</i>
              </article>
            ))}
          </div>
        </section>

        <section className="guardrails section-pad">
          <div className="guardrails-title">
            <div className="section-kicker"><span>06</span> Hard boundaries</div>
            <h2>Power with<br /><em>proof and restraint.</em></h2>
            <p>
              Specialists become more useful because their authority, memory, and tools
              are explicit—not because the system quietly removes constraints.
            </p>
          </div>
          <div className="guardrail-grid">
            {guardrails.map(([index, title, copy]) => (
              <article key={title}><span>{index}</span><h3>{title}</h3><p>{copy}</p></article>
            ))}
          </div>
        </section>

        <section className="briefing section-pad">
          <div className="briefing-image" aria-hidden="true">
            <img src="/specialist-core.svg" alt="" />
            <div />
          </div>
          <div className="briefing-content">
            <blockquote><span>BUILD WEEK INCIDENT</span>ONE INCIDENT.<br />EVERY DECISION<br />REPLAYABLE.</blockquote>
            <p className="briefing-copy">
              Watch GPT-5.6 analyze evidence, a specialist propose remediation,
              the kernel reject self-approval, a human authorize the bounded action,
              and ASOS preserve verification evidence from incident to closure.
            </p>
            <div className="briefing-actions">
              <a className="button button-primary" href="/build-week">Launch Live Demo <span>↗</span></a>
              <a className="button button-secondary" href="#top">Return to top</a>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="footer-brand"><span className="brand-mark">A</span><strong>AIBRY SPECIALISTS OS</strong></div>
        <p>Governed AI specialists with memory, authority, and proof.</p>
        <small>BUILD WEEK · GPT-5.6 · ASOS</small>
      </footer>
    </div>
  );
}
