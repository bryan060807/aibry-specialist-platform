# ASOS Incident Control Room

ASOS is a governed AI operations kernel demonstrated through one deterministic, TrackMaster-inspired login incident. GPT-5.6 analyzes evidence and proposes remediation, but the proposing specialist cannot approve its own action. The kernel rejects self-approval, a trusted human operator authorizes the bounded remediation, execution passes through the real authority gate, verification evidence is recorded, the case closes, and the full replay remains inspectable.

## Demo Video

- [Watch the narrated demo on YouTube](https://www.youtube.com/watch?v=9Fkm_76_K_k)
- [Watch the hosted MP4](https://specialists.aibry.shop/DEMO_Video.mp4)
- [View the video file in this repository](./public/DEMO_Video.mp4)

## Judge Testing Path

The judged experience is a fixed, deterministic TrackMaster-inspired login incident. It requires no installation, login, upload, or repository submission.

1. Open [https://specialists.aibry.shop/build-week](https://specialists.aibry.shop/build-week).
2. Keep **Interactive Constitution: deny specialist self-approval** enabled.
3. Select **Run governed incident**.
4. Observe:
   - live GPT-5.6 analysis or the clearly labeled saved-response fallback;
   - self-approval rejected by the kernel;
   - the explicit **Why was self-approval blocked?** explanation;
   - authorized human approval;
   - simulated execution through `CaseApplicationService`;
   - verification evidence, case closure, and replay report.
5. Select **Reset demo**, then repeat the incident.
6. Disable the Constitution toggle to preview the unsafe counterfactual. ASOS intentionally refuses to execute that path.

For local development, install Node.js `>=22.13.0` and npm, run `npm install` followed by `npm run dev`, then open `http://localhost:3000/build-week`. Validate the fixed test with `npm run test:build-week`, `npm run lint`, and `npm run build`.

## Local Setup

### Requirements

- Node.js `>=22.13.0`
- npm
- Windows or Linux

### Install and run

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000/build-week
```

### Live GPT-5.6 mode

Create `.env.local` in the repository root:

```env
OPENAI_API_KEY=your_key_here
OPENAI_BUILD_WEEK_MODEL=gpt-5.6
```

Never commit `.env.local` or expose the key in screenshots, logs, replay output, or submission text.

When the key is missing, the request times out, the API returns an error, or structured output fails validation, the app automatically uses the frozen saved GPT-5.6 response and labels the fallback clearly.

## Validation

```bash
npm run test:build-week
npm run lint
npm run build
```

The Build Week acceptance test verifies:

- deterministic reset;
- frozen TrackMaster incident fixture;
- saved GPT-5.6 fallback fixture;
- bounded specialist roles;
- kernel-enforced self-approval rejection;
- authorized approval;
- execution through the existing application service and authority gate;
- verification evidence;
- case closure;
- replay report;
- successful reset and repeat.

## Supported Platforms

- Windows development and operator workflow
- Linux/Fedora development and validation
- Cloudflare-hosted Vinext/Vite deployment
- Modern desktop and mobile browsers

## Pre-existing Work vs. Build Week Additions

### Pre-existing before Build Week

- ASOS domain model
- specialist and authority policies
- case kernel
- provider-independent application ports
- `CaseApplicationService`
- existing unit tests for domain, kernel, and application behavior
- AIBRY Specialist Platform landing site and Cloudflare deployment foundation

### Added during Build Week

- one frozen TrackMaster-inspired login incident fixture
- deterministic in-memory persistence for the judged workflow
- simulated remediation executor using the real application-service path
- live GPT-5.6 Responses API analysis with strict structured output
- clearly labeled saved-response fallback
- self-approval attempt and kernel-enforced rejection
- trusted human approval path
- verification evidence, closure, reset, and replay
- Interactive Constitution self-approval rule
- public Incident Control Room UI
- focused end-to-end acceptance test

## Codex Usage

Codex was used for early repository inspection and the primary Build Week implementation pass. The raw Codex session ID preserved for Devpost `/feedback` evidence is:

```text
019f7395-d625-7bc0-82e2-e81ec2524724
```

Later corrective work was completed through direct, reviewable Garage Admin file edits after Codex wrapper behavior proved unreliable for the narrow correction pass.

## GPT-5.6 Integration

The server uses the OpenAI Responses API with strict JSON schema output for:

- incident summary;
- bounded hypotheses;
- recommended remediation.

GPT-5.6 remains advisory. It cannot authorize or execute remediation. Authority remains:

```text
OBSERVE → PROPOSE → HUMAN AUTHORIZATION → APPLY → INDEPENDENT VERIFY
```

## Interactive Constitution

Milestone 3 intentionally limits the Constitution to one counterfactual rule:

> The specialist that proposes a remediation may not approve its own APPLY action.

The enabled state runs the real governed path. The disabled state explains the unsafe counterfactual but does not execute it.

## Three-minute Demo Path

- **0:00–0:20** — Open the public site and launch the Control Room.
- **0:20–0:50** — Explain the incident, evidence, and live/fallback GPT-5.6 analysis.
- **0:50–1:25** — Show the specialist attempting self-approval and the kernel rejecting it.
- **1:25–1:55** — Show trusted human authorization and execution through the authority gate.
- **1:55–2:25** — Show verification evidence, closure, and replay.
- **2:25–2:45** — Reset and repeat successfully.
- **2:45–3:00** — Toggle the Constitution off and explain why ASOS refuses the unsafe counterfactual.

## Submission Checklist

- [ ] Public deployment accessible without login
- [ ] Fresh-browser run/reset/repeat verification
- [ ] Live GPT-5.6 path verified
- [ ] Saved-response fallback verified
- [ ] Final screenshots captured
- [ ] Launch Control Room link verified from the public landing page
- [ ] Devpost story and technology tags updated
- [x] Three-minute narrated demo recorded
- [ ] Early valid submission created
- [x] `/feedback` session ID included

## Coming Next — Post-submission

- deployment regression incident
- worker queue backlog incident
- ChordMaster synchronization incident
- catalog consistency incident

These are roadmap items only. The submission is intentionally centered on one flawless, memorable incident.
