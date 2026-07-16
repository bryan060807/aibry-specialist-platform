"use client";

import { useState } from "react";
import { authorityStages, evidenceDisplayItems, specialists } from "@/lib/domain/specialists";

export default function Home() {
  const [activeSpecialist, setActiveSpecialist] = useState(0);
  const [activeAuthority, setActiveAuthority] = useState(2);
  const specialist = specialists[activeSpecialist];
  const stage = authorityStages[activeAuthority];

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="AIBRY Specialist Platform home">
          <span className="brand-mark">A</span><span>AIBRY</span><small>Specialist Platform</small>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#platform">Platform</a><a href="#catalog">Catalog OS</a><a href="#specialists">Specialists</a><a href="#evidence">Evidence</a>
        </nav>
        <a className="header-action" href="#authority">View the system <span>↗</span></a>
      </header>

      <section className="hero" id="top">
        <div className="hero-grid" aria-hidden="true" />
        <div className="eyebrow"><span className="pulse" /> A coordinated system of focused AI specialists</div>
        <h1>Creative systems.<br /><em>Human authority.</em></h1>
        <p className="hero-copy">AIBRY replaces the all-powerful AI with a coordinated team: clear jobs, controlled authority, shared standards, and a complete record of every meaningful action.</p>
        <div className="hero-actions">
          <a className="button primary" href="#platform">Explore the platform <span>↓</span></a>
          <a className="button ghost" href="#authority"><span className="play">▶</span> See the authority loop</a>
        </div>
        <div className="status-rail" aria-label="Authority workflow">
          {authorityStages.map((item, i) => <button key={item.id} className={i === activeAuthority ? "active" : ""} onClick={() => setActiveAuthority(i)}><span>{String(i + 1).padStart(2, "0")}</span>{item.label}</button>)}
        </div>
        <aside className="hero-console" aria-label="System status">
          <div className="console-head"><span>LIVE SYSTEM MODEL</span><i>ONLINE</i></div>
          <div className="orbital"><div className="ring r1"/><div className="ring r2"/><div className="core">HUMAN<br/><strong>AUTHORITY</strong></div><span className="node n1">OBSERVE</span><span className="node n2">PROPOSE</span><span className="node n3">APPLY</span></div>
          <div className="console-stats"><div><span>STANDARD</span><strong>ASOS v1</strong></div><div><span>VALIDATION</span><strong>AVC</strong></div><div><span>MODE</span><strong>REVIEW-GATED</strong></div></div>
        </aside>
      </section>

      <section className="manifesto" id="platform">
        <p className="section-kicker">01 / THE PLATFORM</p>
        <div><h2>Not one AI pretending<br/>to be <em>everything.</em></h2><p>A team of specialists that knows exactly where its authority begins—and where it ends.</p></div>
        <blockquote>“Nothing important changes without a record. Nothing happens without appropriate authorization.”</blockquote>
      </section>

      <section className="specialist-section" id="specialists">
        <div className="section-heading"><div><p className="section-kicker">02 / THE SPECIALISTS</p><h2>Focused by design.<br/><em>Accountable by default.</em></h2></div><p>Each specialist owns one clear responsibility, operates within defined boundaries, and leaves behind evidence another specialist can inspect.</p></div>
        <div className="specialist-lab">
          <div className="specialist-tabs" role="tablist" aria-label="Specialist profiles">
            {specialists.map((item, i) => <button role="tab" aria-selected={i === activeSpecialist} key={item.id} onClick={() => setActiveSpecialist(i)} className={i === activeSpecialist ? "active" : ""}><span>{item.index}</span><div><strong>{item.name}</strong><small>{item.role}</small></div><b>→</b></button>)}
          </div>
          <article className={`specialist-card ${specialist.color}`}>
            <div className="card-watermark">{specialist.index}</div><p className="card-label">ACTIVE SPECIALIST PROFILE</p><h3>{specialist.name}</h3><h4>{specialist.role}</h4><p>{specialist.brief}</p><ul>{specialist.capabilities.map(cap => <li key={cap}><span>✓</span>{cap}</li>)}</ul><div className="boundary"><span>AUTHORITY BOUNDARY</span><strong>{specialist.authorityBoundary}</strong></div>
          </article>
        </div>
      </section>

      <section className="authority-section" id="authority">
        <div className="section-heading"><div><p className="section-kicker">03 / CONTROLLED AUTHORITY</p><h2>The authority loop.<br/><em>Built to stop itself.</em></h2></div><p>Click through the operating sequence. The most important feature is not what the system can do—it’s where the system must wait.</p></div>
        <div className="authority-workbench">
          <div className="authority-track" role="tablist">
            {authorityStages.map((item, i) => <button key={item.id} role="tab" aria-selected={i === activeAuthority} onClick={() => setActiveAuthority(i)} className={i === activeAuthority ? "active" : ""}><span>{item.number}</span><strong>{item.label}</strong>{i < authorityStages.length - 1 && <i>→</i>}</button>)}
          </div>
          <div className="stage-readout"><div><span>SELECTED STAGE / {stage.number}</span><h3>{stage.label}</h3></div><div><strong>{stage.command}</strong><p>{stage.copy}</p></div><div className="permission"><span>PERMISSION STATE</span><b>{stage.permissionState}</b></div></div>
        </div>
      </section>

      <section className="catalog-section" id="catalog">
        <div className="catalog-intro"><p className="section-kicker">04 / THE PROVING GROUND</p><h2>It started with<br/><em>the music catalog.</em></h2><p>Catalog OS turns a living Music Vault into governed, inspectable creative infrastructure—without replacing the vault or flattening its history.</p><div className="principles"><span>Music Vault = source of truth</span><span>Generated data = disposable</span><span>Expand, never replace</span></div></div>
        <div className="catalog-terminal"><div className="terminal-top"><span>CATALOG OS / PROJECT ADMISSION</span><i>READ-ONLY SCAN</i></div><div className="terminal-body"><p><b>›</b> inspect /music/albums</p><p><b>›</b> validate project.md front doors</p><p className="ok"><b>✓</b> managed projects identified</p><p className="warn"><b>!</b> provisional candidates isolated</p><p className="ok"><b>✓</b> source vault unchanged</p><div className="terminal-result"><span>RESULT</span><strong>VISIBLE. GOVERNED. AUDITABLE.</strong></div></div></div>
      </section>

      <section className="proof-section">
        <div className="proof-copy"><p className="section-kicker">PRODUCTION PROOF / AVC PASS</p><h2>The first specialist<br/><em>earned trust.</em></h2><p>Project Admitter completed the first end-to-end production execution under the ASOS Validation Cycle. Archivist then re-audited the result independently.</p><div className="proof-stamp">THE ADMITTER HAS PASSED AVC <span>VERIFIED 2026</span></div></div>
        <div className="metric-grid"><article><span>PROJECT FILES ADMITTED</span><strong>19</strong><small>Existing front doors preserved</small></article><article><span>EXECUTION ERRORS</span><strong>0</strong><small>Every write verified</small></article><article><span>WARNINGS</span><strong>35 <i>→</i> 14</strong><small>≈60% measurable reduction</small></article><article><span>UNEXPECTED MUTATIONS</span><strong>0</strong><small>Safety guarantees preserved</small></article></div>
      </section>

      <section className="evidence-section" id="evidence">
        <div className="section-heading"><div><p className="section-kicker">05 / COMPLETE ACCOUNTABILITY</p><h2>Every action leaves<br/><em>something inspectable.</em></h2></div><div className="asos-badge"><span>SHARED STANDARD</span><strong>ASOS <i>v1</i></strong><small>AIBRY Specialist Operational Standard</small></div></div>
        <div className="evidence-grid">{evidenceDisplayItems.map((item, i) => <article key={item.label}><span>{String(i + 1).padStart(2, "0")}</span><div className="evidence-icon">{item.icon}</div><p>{item.label}</p></article>)}</div>
      </section>

      <section className="future-section"><p className="section-kicker">THE CREATIVE STUDIO VISION</p><h2>One finished song.<br/><em>A complete release world.</em></h2><p className="future-copy">The same governed specialist model grows from catalog integrity into a coordinated creative campaign—without giving up the human decision point.</p><div className="domain-row">{["Song", "Artwork", "Merch assets", "Store + SEO copy", "Release package"].map((x,i)=><div key={x}><span>0{i+1}</span><strong>{x}</strong></div>)}</div></section>

      <footer><div className="footer-brand"><span className="brand-mark">A</span><div><strong>AIBRY</strong><small>Specialist Platform</small></div></div><p>A team of specialists.<br/>A standard of excellence.<br/>A future of possibilities.</p><div className="footer-lock"><span>✦</span> FOCUSED. SAFE. TRUSTED.<br/>BUILT TO LAST.</div></footer>
    </main>
  );
}
