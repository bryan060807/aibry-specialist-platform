"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type RiskRule = { id: string; title: string; description: string; enabled: boolean };

const initialRules: RiskRule[] = [
  { id: "self-approval", title: "Deny specialist self-approval", description: "A specialist may propose a consequential action but may not authorize its own APPLY stage.", enabled: true },
  { id: "silent-memory", title: "Deny silent memory promotion", description: "Task experience must remain review-gated before it becomes role or constitutional memory.", enabled: true },
  { id: "unbounded-tools", title: "Deny unbounded tool access", description: "Tools must remain attached to an explicit role, scope, and auditable authority contract.", enabled: true },
];

export default function ConstitutionPage() {
  const [rules, setRules] = useState(initialRules);
  const [selected, setSelected] = useState("self-approval");
  const activeRule = useMemo(() => rules.find((rule) => rule.id === selected) ?? rules[0], [rules, selected]);
  const enabledCount = rules.filter((rule) => rule.enabled).length;

  function toggleRule(id: string) {
    setRules((current) => current.map((rule) => rule.id === id ? { ...rule, enabled: !rule.enabled } : rule));
  }

  return (
    <div className="constitution-page">
      <header className="constitution-header">
        <Link className="brand" href="/" aria-label="AIBRY Specialists OS home"><span className="brand-mark">A</span><span className="brand-copy"><strong>AIBRY SPECIALISTS OS</strong><small>INTERACTIVE CONSTITUTION</small></span></Link>
        <nav><span><i /> DRAFT SANDBOX · NO LIVE POLICY</span><a href="/kernel">ASOS Kernel</a><a href="/foundry">Workforce Foundry</a><Link href="/">Platform</Link></nav>
      </header>
      <main className="constitution-main">
        <section className="constitution-hero">
          <div><p className="constitution-label">THE CONSTITUTION</p><h1>Make the rules<br /><em>visible.</em></h1><p>Explore how truth, authority, tools, and memory remain explicit before specialists act.</p></div>
          <aside><span>{enabledCount}/3</span><small>GUARDRAILS ENABLED</small></aside>
        </section>
        <section className="constitution-workbench">
          <div className="constitution-rules">
            {rules.map((rule, index) => (
              <button className={selected === rule.id ? "constitution-rule active" : "constitution-rule"} key={rule.id} onClick={() => setSelected(rule.id)}>
                <span>0{index + 1}</span><div><strong>{rule.title}</strong><small>{rule.enabled ? "ENFORCED" : "COUNTERFACTUAL"}</small></div><i>{rule.enabled ? "●" : "○"}</i>
              </button>
            ))}
          </div>
          <article className="constitution-inspector">
            <p>SELECTED RULE</p><h2>{activeRule.title}</h2><p>{activeRule.description}</p>
            <button className={activeRule.enabled ? "constitution-toggle enabled" : "constitution-toggle"} onClick={() => toggleRule(activeRule.id)}><span>{activeRule.enabled ? "ENFORCED" : "DISABLED"}</span><i /></button>
            <div className="constitution-result"><small>{activeRule.enabled ? "GOVERNED RESULT" : "UNSAFE COUNTERFACTUAL"}</small><strong>{activeRule.enabled ? "The authority gate preserves separation of duties." : "The system explains the risk but does not execute the unsafe path."}</strong></div>
          </article>
        </section>
        <section className="constitution-footer-cta"><div><p>SEE THE RULE UNDER PRESSURE</p><h2>Watch self-approval fail<br />inside a real incident.</h2></div><div><a className="button button-primary" href="/build-week">Launch Live Demo</a><a className="button button-secondary" href="/kernel">Inspect the ASOS Kernel</a></div></section>
      </main>
    </div>
  );
}
