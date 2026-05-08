# Documentation & Roadmap Review — Roadmap Framework Analysis

**Date:** 2026-05-08
**Scope:** Current docs state + roadmap framing for public, conservative risk appetite
**Primary Audience:** Technical docs teams
**User Constraints:** Optimize for real Zed install/use first; hybrid webview future path; conservative risk appetite

---

## Executive Summary

**Current docs quality:** Excellent for developers. Security model, contracts, and architecture are precisely documented. MVP completion is clear.

**Roadmap maturity:** Early. Feature-parity matrix and phase 8 exist, but no **public-facing roadmap** addressing version releases, timeline, or audience-specific integration patterns.

**Critical gaps:**
1. Hybrid webview evolution path not documented (user requirement).
2. Registry/native install timeline and blockers opaque to users.
3. "Technical docs team" primary audience not served by current docs.
4. Conservative risk appetite not explicitly framed in roadmap.
5. "Deferred features" list lacks prioritization signal or user feedback channel.

**Mismatches to reframe:** Registry distribution promise ahead of reality; code-chunk trust.json undocumented; security review process absent; feature creep risk on deferred list.

---

## Current Documentation Assessment

### Strengths

| Document | Strengths |
|-----------|-----------|
| **system-architecture.md** | CLI/HTTP/WebSocket contracts precise; security defaults clear; component model transparent. |
| **implementation-contracts.md** | Phase 0 decisions documented; invariants explicit; security isolation tight. |
| **feature-parity.md** | Honest feature matrix with support levels, blockers, and target versions; post-MVP tracks identified. |
| **security.md** | Threat model articulated; code-chunk and custom-CSS constraints clear; known vulnerability tracked. |
| **README.md** | Clear value proposition; practical setup for source checkout; realistic about limitations. |
| **release-checklist.md** | Comprehensive pre-publish gates; manual copy matrix valuable; Zed dev-extension validation explicit. |

### Gaps

| Gap | Impact | Audience |
|-----|--------|----------|
| **No public roadmap** | Users don't know what's planned vs. deferred vs. never. Version expectations mismatch. | All users, especially docs teams planning integrations. |
| **Hybrid webview path undocumented** | If/when Zed adds webview, unclear how migration works. Users architect for external-browser permanence. | Long-term integrators, teams standardizing on tool. |
| **Registry/install timeline opaque** | README says "after accepted into registry," but no timeline, no blockers list, no definition of "native Zed command integration." | Users evaluating install UX; docs teams comparing to alternatives. |
| **"Technical docs team" audience unstated** | No integration examples, no workflow guidance, no team collaboration patterns. Audience is mentioned but not served. | Docs teams (stated primary audience). |
| **No security review process doc** | Code chunks, image upload, parser JS stuck behind "security review" with no timeline, no request channel, no definition of "trusted." | Users wanting advanced features; orgs with security workflows. |
| **trust.json file undocumented** | Code mentions "passive policy reader" for future execution, but users find the file and expect imminent feature. | Users reading code; docs teams planning for code execution. |
| **Deferred features lack prioritization** | 20+ features marked "Deferred" or "Not scheduled" with no signal for demand voting or track selection. | Users wanting features beyond MVP; roadmap prioritization teams. |
| **Conservative risk gates not explicit** | Docs are thorough, but don't frame why deferral is a feature (conservatism, not just complexity). | Docs teams with risk-sensitive requirements. |
| **MVP registry-readiness vs. actual distribution timeline** | Phase 7 marks "Zed registry readiness," but native install workflow still undocumented and timing unclear. | Users expecting "next release = registry install." |

---

## Roadmap Framing Issues

### Issue 1: Registry Distribution Promise Ahead of Reality

**Current state in README:**
```
"After the extension is accepted into the Zed extension registry,
the listing can be installed from Zed's Extensions page."
```

**Reality check:**
- Extension registry PR is the **next step**, not completed.
- "Native Zed command integration" (required for seamless install) is unproven and deferred.
- Current workflow is source-checkout + manual task for other workspaces.
- Users reading README may expect Zed extension install in next release, not future "when native command lands."

**Risk:** Support load from users expecting install-from-Zed sooner than technical readiness.

**Reframe needed:**
- Call out current source-checkout as stable 0.1.x path.
- Document registry submission **roadmap**, not promise.
- Explain "native command integration" blocker clearly.
- Set version target for registry listing + native install (e.g., 0.2.x candidate).

---

### Issue 2: Hybrid Webview Evolution Path Missing

**User requirement:** "Future Zed webview path should be hybrid."

**Current docs:** Explain external-browser-only architecture, but no future-state vision.

**What's missing:**
- When/if Zed adds webview support, how does hybrid work?
- Do users get both external + native preview side-by-side?
- Can preview state/session persist across external ↔ native switching?
- How does this affect security model, token lifecycle, performance?
- Migration path for workflows built on external-browser-only?

**Why it matters:**
- Zed API and webview support may evolve.
- Users are building doc integrations and want long-term stability.
- Hybrid path shows maturity (not lock-in to external browser forever).
- Docs teams may standardize on this tool if hybrid path is credible.

**Reframe needed:**
- New doc: `docs/webview-evolution.md`
- Explain external-browser rationale (Zed limitation, not choice).
- Describe hybrid vision: external browser + optional native preview when Zed API permits.
- Security/performance implications of hybrid.
- User migration story if native becomes available.

---

### Issue 3: "Technical Docs Team" Audience Not Served

**Current problem:**
- Docs are excellent for Zed extension developers.
- No integration patterns for docs teams (stated as **primary audience**).
- No examples of using rich copy in static generators, CI/CD, or team collaboration.
- No guidance for teams running Markdown in pipelines.

**Missing for docs teams:**
- How to use in MkDocs, Mintlify, Hugo, Docusaurus workflows.
- Team collab patterns: shared `.crossnote/style.less`, workspace config.
- Rich copy export for static site generators (HTML snippet, plain text fallback).
- CI/CD integration: can CLI be called from build scripts?
- Preview URL lifecycle and session isolation for team environments.
- Comparison to other Markdown preview tools in doc workflows.

**Reframe needed:**
- New doc: `docs/integration-guide.md` (targeting technical docs teams).
- Section: "Using in Doc Pipelines" (MkDocs, Hugo, etc.).
- Section: "Team Workflows" (shared config, preview coordination).
- Section: "Export for Static Sites" (copy/export as build step).

---

### Issue 4: Conservative Risk Appetite Not Framed

**User requirement:** "Risk appetite conservative."

**Current roadmap:** Lists features as "Deferred" or "Post-MVP," but doesn't explain why deferral is **intentional risk management**, not just prioritization.

**What's missing:**
- Explicit statement: "0.1.x is conservative: saved-file preview only, code execution disabled, external browser only."
- Roadmap table showing risk level per feature (e.g., code chunks = "High; trusted execution required").
- Timeline/process for moving features from deferred → included (e.g., demand voting, security review gate).
- Definition of "trusted execution" for future releases.

**Reframe needed:**
- Expand `development-roadmap.md` with "Risk Gates" section.
- Each version roadmap entry includes risk level and gate criteria.
- Security review blockers documented with process/timeline.
- Code chunks and image upload mapped to security review track with milestones.

---

### Issue 5: Deferred Features Lack Prioritization Signal

**Current state:** feature-parity.md has 20+ items as "Deferred" or "Not scheduled."

**Problem:**
- No signal for which deferred features are **high demand** vs. **nice-to-have**.
- No channel for users to vote/request priorities.
- Post-MVP "tracks" (knowledge base, export, diagrams, presentation) exist but no selection criteria or user feedback mechanism.
- Maintenance burden could grow as list accumulates.

**Reframe needed:**
- Add "Feedback & Prioritization" section in roadmap.
- Link to GitHub discussions or feature requests for demand voting.
- Quarterly "roadmap review" process: solicit feedback, re-prioritize tracks.
- Explicit: "Post-MVP direction chosen based on user feedback after 0.1.x release."

---

### Issue 6: Security Review Process Absent

**Current state:** Several features blocked by "security review":
- Code chunks (`{cmd=true}`, `{shell}`)
- Image upload/helper
- Custom parser JavaScript
- Remote diagram providers

**Problem:**
- No documented security review **process** or **timeline**.
- trust.json file exists but is undocumented (creates confusion).
- Users can't tell if "security review" means "2 weeks away" or "indefinite."
- No way for orgs to initiate review or contribute.

**Reframe needed:**
- New section in `security.md`: "Security Review Process"
- Define what "trusted execution" means: opt-in, audit logging, per-workspace policy, user action per run.
- Timeline for code chunks review (e.g., Q3 2026 candidate).
- How to request security review for specific features.
- trust.json: document structure and when it's actually used.

---

## Version-Based Roadmap Frame

**Suggested structure** for `development-roadmap.md` (expanded):

```
# Development Roadmap

## Current Release: 0.1.x (Stable)

**Stability Level:** Conservative (saved-file, no execution, external browser)

### What's Included
- Saved Markdown file preview
- Rich copy (HTML + plain text)
- HTML export
- Custom CSS (scoped `.crossnote/style.less`)
- Security hardening (tokenized URLs, path containment)

### Risk Gates Met
- Code execution disabled
- Custom parser JS disabled
- Public bind disabled
- Trusted execution not required

### Supported Platforms
- Zed (source checkout, local task)
- Planned: Zed extension registry (0.2.x candidate)

### Known Limitations
- External browser only (Zed has no webview API)
- Saved-file updates only (unsaved buffer streaming unproven)
- No import/export for Crossnote config or custom plugins

---

## Candidate: 0.2.x (Q3 2026)

**Risk Level:** Conservative → Moderate

### Candidate Features (demand-prioritized)

1. **Zed Extension Registry Install**
   - Unblock: prove native "Zed command" API or workaround
   - Benefit: one-click install from Zed UI
   - Security: no new model

2. **Knowledge Base Track (Optional)**
   - Wikilinks + note index
   - Backlinks in browser sidebar
   - Browser graph view
   - Benefit: teams managing notes, docs
   - Risk: file indexing overhead
   - Decision: post-MVP user feedback

3. **PDF Export (Optional)**
   - Puppeteer-based export
   - Benefit: offline sharing, archives
   - Risk: binary dependency (Chromium), file I/O
   - Gate: optional install check, local-only

---

## Vision: 0.3+ (Hybrid Webview)

**Path:** External browser + native preview (if Zed adds webview API)

### How Hybrid Works
1. If Zed webview available: offer side-by-side native + browser preview
2. If not: external browser only (no change for users)
3. Session tokens compatible both paths
4. User preference: which preview to open

### Security Implications
- Webview brings CSP + Zed sandbox (improve over browser)
- Token lifecycle unchanged (still one-time preview URLs)
- Same Crossnote render pipeline (no code execution)

### User Migration
- No breaking change (external browser still works)
- Optional native preview for better integration
- Teams can migrate at their own pace

---

## Deferred (Post-MVP, Demand-Driven)

### Security Review Track
- Code chunks with trusted execution
- Image upload/helper integrations
- Custom parser JavaScript hooks

**Process:** Submit feature request → security team review → timeline estimate

---
```

---

## Documentation Sections to Create/Expand

### 1. New: `docs/roadmap.md` (Public Roadmap)

Target: All users, especially docs teams planning integrations.

**Sections:**
- Current stable (0.1.x) promises
- Next release (0.2.x) candidate features + prioritization
- Long-term vision (hybrid webview, deferred tracks)
- How to request features or vote on priorities
- Release timeline (if available)
- Known blockers and risk gates

---

### 2. New: `docs/webview-evolution.md`

Target: Long-term integrators, teams standardizing on Zed.

**Sections:**
- Why external browser (Zed limitation)
- How hybrid webview will work (if Zed adds support)
- Session token and security model across both paths
- Migration path for existing workflows
- Timeline (speculative; tied to Zed API evolution)

---

### 3. New: `docs/integration-guide.md`

Target: **Technical docs teams** (stated primary audience).

**Sections:**
- Using in MkDocs, Hugo, Docusaurus, Mintlify, etc.
- Team workflows: shared config, preview coordination
- Rich copy export for static site builders
- CI/CD integration (CLI from build scripts)
- Best practices for team Markdown editing
- Comparison to other Markdown preview tools

---

### 4. Expand: `docs/security.md` (add "Security Review Process" section)

Target: Users wanting advanced features; orgs with security workflows.

**New sections:**
- Trusted execution definition and roadmap
- Security review process: how to request, timeline, criteria
- trust.json file: structure and usage
- Code chunks roadmap (when, conditions)
- Image upload roadmap (when, conditions)
- Custom parser JS roadmap (when, conditions)

---

### 5. Expand: `development-roadmap.md`

Target: Public roadmap audience.

**New structure:**
- Replace phase-based layout with **version-based layout** (0.1.x, 0.2.x, etc.)
- Link to public roadmap.md for detail
- Mark which releases are stable vs. candidate
- Explicit risk gates per version
- Timeline estimates (even if "TBD")

---

## Specific Risk & Reframing Recommendations

| Risk | Current Framing | Suggested Reframe |
|------|---|---|
| **Registry timeline overstated** | "After accepted into registry, can be installed from Zed's Extensions page." | "0.1.x is source-checkout. Registry submission is next step; native Zed command integration is candidate for 0.2.x+." |
| **Hybrid webview uncertain** | (Not mentioned) | "Future: If Zed adds webview support, we'll offer optional hybrid preview (external + native side-by-side). No migration required." |
| **Code chunks stuck** | "Deferred. Future execution feature must require per-workspace opt-in..." | "Code chunks roadmap: Security review Q3 2026 candidate. Process: request feature, initiate review, timeline ~8 weeks pending team capacity." |
| **trust.json confusing** | (Mentioned in security.md but not explained) | "trust.json: placeholder for future trusted execution policy. Not active in 0.1.x. Will document structure when security review complete." |
| **Docs team audience unstated** | (Docs good, but no examples for technical writers) | Add integration-guide.md with examples for doc pipelines, team workflows, export patterns. |
| **Conservative approach not explicit** | (Features deferred, but not framed as intentional risk management) | "0.1.x risk gates: code execution disabled, external browser only, saved-file preview only. Intentionally conservative for stability." |

---

## Honest Assessment: Current vs. Mature Public Roadmap

### Current State
✅ **Developer-facing docs:** Excellent
✅ **Security model:** Precisely documented
✅ **Contracts:** Clear (CLI, HTTP, WebSocket)
✅ **Feature tracking:** Feature-parity matrix exists
❌ **Public roadmap:** None (links to plan files, not user-facing)
❌ **Webview evolution:** Undocumented
❌ **Registry timeline:** Overstated relative to reality
❌ **Docs team integration:** No examples or guidance
❌ **Security review process:** Absent
❌ **Conservative risk appetite:** Not explicitly framed

### Mature Public Roadmap (Target)
✅ **Version-based roadmap** with timeline and risk gates
✅ **Explicit hybrid webview vision** (external now, native if Zed adds API)
✅ **Registry roadmap** (not promise; blocker list; timeline)
✅ **Integration guide** for technical docs teams
✅ **Security review process** documented with timeline
✅ **Risk frames** per release (conservative, moderate, etc.)
✅ **Feature prioritization process** (user feedback + demand voting)
✅ **Deferred features dashboard** with selection criteria

---

## Key Decisions to Make

1. **Version targeting:** When is registry install actually candidate? (Affects README/docs framing)
2. **Security review timeline:** Can code chunks review start in Q3 2026? (Affects roadmap credibility)
3. **Docs team examples:** Which integrations matter most? (MkDocs? Mintlify? Doc CMS?)
4. **Webview evolution:** Commit to hybrid path if Zed API emerges? (Affects user architecture decisions)
5. **Trust model:** What does "trusted execution" actually mean for code chunks? (Affects security review scope)
6. **Post-MVP prioritization:** How will 0.2.x features be selected? (User feedback, demand voting, team capacity?)

---

## Unresolved Questions

1. **Zed registry and native command integration timeline** – Is 0.2.x realistic, or later?
2. **Code chunks security review ownership** – Who drives this? What's the resource estimate?
3. **trust.json future** – Will it be populated for 0.2.x, or later? Document structure now?
4. **Docs team audience validation** – Are the stated customers (docs teams) actually confirmed? Should user research be done?
5. **Hybrid webview contingency** – If Zed never adds webview, is external-browser-only the permanent story? (Affects 3+ year roadmap framing)

---

## Summary

**Current docs:** Excellent for developers. Contracts, security, architecture clearly documented.

**Roadmap maturity:** Early. No public-facing roadmap; feature matrix exists but not user-facing; post-MVP tracks not prioritized.

**For conservative, docs-team-focused audience:** Need 5 new/expanded docs sections addressing registry timeline, webview evolution, integration patterns, security review process, and explicit risk gates.

**Estimated effort to mature roadmap:** 1–2 weeks (research + writing + team alignment on version targets and security timelines).

**Impact:** Clear public roadmap + integration guidance will accelerate adoption among technical docs teams (primary audience) and reduce support load from mismatched expectations.
