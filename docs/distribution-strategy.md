# Distribution Strategy

## Decision

The MVP distribution path is a Node CLI exposed as `zed-mpe`, installed from this repository during development and later published as an npm package. Zed launches the CLI through a project task.

## Rationale

- Zed tasks reliably receive `ZED_FILE` and `ZED_WORKTREE_ROOT`.
- Node is the natural runtime for Crossnote and Markdown Preview Enhanced parity work.
- A CLI keeps the Rust/WASM extension thin and avoids depending on unproven rich UI APIs.
- The same CLI can later support global npm install, project-local install, and optional extension-assisted npm install.

## MVP Install Flow

1. Run `npm install` in the repository.
2. Run `npm run build:node`.
3. Use the `MPE Preview Current File` Zed task.

## Release Package Flow

The root npm package exposes a `zed-mpe` binary that points at `packages/server/dist/cli.js`. Release validation uses:

```bash
npm pack --dry-run
npm run smoke:package
```

The smoke script packs the root package, installs it into a temporary project with production dependencies, launches `zed-mpe preview --no-open`, and verifies the local `/health` endpoint.

## Later Packaging

- Publish the server package with a `zed-mpe` binary.
- Keep package smoke tests from a clean install in the release gate.
- Revisit `zed_extension_api::npm_install_package` only after Phase 4 proves the extension UX and capability prompts are acceptable.