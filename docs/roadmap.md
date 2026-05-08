# Roadmap

The roadmap favors secure docs-team value over full Markdown Preview Enhanced parity.

## Current Release Line

`0.1.x` focuses on a stable external-browser workflow:

- Saved-file preview from Zed tasks or the `zed-mpe` CLI.
- Local-only tokenized browser sessions.
- Rich copy and sanitized HTML export.
- Safe `.crossnote/style.less` subset.
- Browser contents sidebar, passive link diagnostics, and explicit draft editing.
- Disabled code execution, parser JavaScript, public bind, and credential workflows.

## Candidate Track: 0.2.x

- Better setup diagnostics and packaged CLI install paths.
- More docs-team examples and release validation across Windows, macOS, and Linux.
- Conservative local import/resource handling if a contained resolver is proven.
- More browser review polish based on user feedback.

## Candidate Track: 0.3.x

- Export improvements such as PDF or Pandoc only after command discovery, file access, and execution risks are reviewed.
- Additional diagram support only when local/remote provider policy is explicit and off by default.

## Future Zed Native Track

If Zed exposes a verified webview, panel, or custom preview API for this use case, the project should add a native preview adapter over the same render/session/security core. The external browser remains supported as fallback.

See [webview-evolution.md](webview-evolution.md) for the adapter boundary.

## Intentionally Excluded Until Separate Review

- Code chunk execution.
- Custom parser JavaScript.
- Public or remote preview serving.
- `head.html` injection.
- Credential-bearing image upload.
- Silent browser file writes or background autosave.

## Prioritization

Deferred features should move forward only when they have user demand, a contained design, tests, docs, and clear security gates. Open issues should describe the docs workflow, threat model impact, and release validation needed for the request.