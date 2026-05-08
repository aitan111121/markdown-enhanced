# Repository Instructions

These instructions apply to all AI-assisted work in this repository.

## Source Control

- Never push directly to `main`.
- Create a focused branch for every change, using prefixes like `feat/`, `fix/`, `docs/`, `test/`, or `chore/`.
- Open a pull request into `main` and merge only after review, required checks, and plan alignment are complete.
- Do not bypass branch protection, required reviews, or required checks, even for urgent or small changes.
- Treat CodeRabbit as an advisory review signal unless branch protection explicitly marks it required. Do not block merge solely on a pending CodeRabbit status after local gates, required checks, plan alignment, and user-approved review are complete.
- Keep commits focused. Do not mix unrelated refactors, formatting churn, generated files, or dependency updates into feature/fix commits.
- Do not commit secrets, `.env` files, local credentials, private tokens, or generated indexes such as `.gitnexus/`.
- After running GitNexus, keep `.gitnexus/` and other local generated indexes unstaged unless a tracked documentation artifact was intentionally requested.

## Durable Lessons

- When review, testing, or production use reveals an issue from previous AI-assisted work, distill the root lesson into this file or the most relevant project doc before final handoff. Keep it concise, actionable, and framed as a prevention rule.
- Do not add browser refresh controls that reload one-time token preview URLs. Use live update channels or explicit new-session flows instead.
- Preserve preview scroll against the actual scroll surface. For this browser preview, preserve `window` scroll unless the CSS makes a dedicated container the scroll owner and tests prove it.

## Required Pre-Push Gates

Before pushing a branch, run the available project commands for:

- lint
- typecheck
- build
- unit and integration tests, when present
- end-to-end tests
- smoke tests that prove the result matches the active plan

If a gate is not available yet, call that out in the PR and explain why. Missing e2e or smoke commands must be explicitly documented. Do not mark work complete while known syntax, type, build, lint, e2e, or smoke failures remain unresolved.

For this Markdown Preview Enhanced for Zed project, smoke coverage should include the user-visible path being changed, such as launching preview, rendering markdown features, copying rich HTML/plain text, validating browser behavior, and checking security-sensitive file handling when relevant.

## Research Before Code

- Do not rush into edits. Read the active plan, phase file, README/docs when available, relevant source files, tests, and nearby patterns before changing code.
- Use targeted search first to cover the affected surface area: entry points, callers, tests, config, scripts, packaging, and docs.
- Prefer root-cause fixes over surface patches.
- Follow the existing architecture and style. Add abstractions only when they remove real duplication or clarify a repeated workflow.
- Keep implementation scoped to the current task and plan phase. Avoid opportunistic rewrites.

## Plan Alignment

- Treat `plans/260507-2257-markdown-preview-enhanced-for-zed/plan.md` as the current delivery map until superseded.
- Before coding, identify the active phase and the files/contracts it owns.
- After implementation, compare actual behavior against the plan's success criteria and update the plan/docs when progress meaningfully changes.
- If reality conflicts with the plan, document the finding and adjust the plan before expanding scope.

## GitNexus Usage

GitNexus research summary: GitNexus indexes a repository into a local code knowledge graph and exposes tools for query, context, impact analysis, detect_changes, cypher, wiki generation, and graph-aware rename. Use it as an additional code intelligence layer, not as a replacement for reading source and running tests.

Use GitNexus carefully when available:

- Run `gitnexus status` before relying on graph results. If the index is missing or stale, run `gitnexus analyze` from the repo root.
- Use `gitnexus query` to locate feature flows and related areas before editing unfamiliar code.
- Use `gitnexus context` for symbols that may have callers, callees, imports, or process participation.
- Use `gitnexus impact` before editing shared functions, public APIs, CLI contracts, preview-server behavior, security gates, or rendering pipelines.
- Use `gitnexus detect_changes` before commit/push to check the blast radius of staged or unstaged changes.
- For renames, use GitNexus rename only with `dry_run` first. Review every affected file and confidence tag before applying edits.
- If GitNexus output conflicts with the source code, trust the source code, reindex, and verify manually with search and tests.
- If GitNexus is unavailable, fall back to `rg`, language-server references, test discovery, and direct file reads. Note the gap in the PR when impact could not be graph-checked.

## Token Efficiency

- Prefer targeted searches and small, relevant file reads over loading entire large files.
- Avoid reading generated, vendored, cache, build, binary, or dependency directories unless the task explicitly requires it.
- Summarize large findings into concise notes before continuing.
- Keep docs and plan updates short enough that future agents can recover context quickly.
- Create or maintain compact maps of important contracts when they prevent repeated rediscovery.

## Smooth App Behavior

- Keep UI and preview operations responsive. Avoid blocking the editor or browser preview with long synchronous work.
- Debounce file watching, preview refresh, clipboard actions, and expensive render passes where appropriate.
- Use caching deliberately, with clear invalidation when source files, config, assets, or render options change.
- Prefer incremental or scoped updates when they are simpler and reliable; fall back to full refresh when correctness is at risk.
- Provide clear loading, empty, error, retry, and permission-denied states for user-facing flows.
- Clean up spawned processes, file watchers, ports, temp files, and browser resources.

## Security And Trust

- Default to local-only behavior for preview services and development tooling.
- Treat markdown, HTML, diagrams, scripts, styles, links, images, and external resources as untrusted input unless explicitly trusted by the user.
- Keep code execution disabled by default. Any trusted execution path must be explicit, opt-in, documented, and test-covered.
- Sanitize rendered HTML and validate file paths to prevent XSS, path traversal, local file exposure, and unintended network access.
- Never expose secrets through logs, preview pages, clipboard output, errors, or generated artifacts.

## Pull Request Checklist

Every PR should include:

- Branch name and focused scope.
- Plan phase or issue reference.
- Summary of changed behavior.
- Tests and checks run, including lint, typecheck, build, e2e, and smoke results where available.
- GitNexus status or impact/detect_changes summary when available.
- Screenshots or recordings for visible UI/preview changes.
- Security notes for changes touching preview rendering, file access, local server behavior, clipboard, code execution, or dependencies.
- Remaining risks or follow-up work.
