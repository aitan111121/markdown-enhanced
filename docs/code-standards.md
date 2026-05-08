# Code Standards

## Project Shape

- Keep Zed integration thin; browser preview and rendering live in Node packages.
- Keep security defaults in shared contract modules before adding rendering features.
- Prefer small files with one clear responsibility.
- Use kebab-case for file names and descriptive names for modules.

## TypeScript

- Use strict TypeScript and ESM.
- Prefer Node built-ins before adding dependencies.
- Pass file paths as argument arrays, never interpolated shell strings.
- Treat Markdown, rendered HTML, and local files as untrusted input.

## Rust Extension

- Keep the Rust/WASM extension minimal until Phase 0 proves a richer Zed action surface.
- Add process or npm capabilities only when concrete extension code uses them.
- Keep task-based launch as the primary MVP path.

## Testing

- Cover path containment, file size caps, auth tokens, Host/Origin checks, and malicious Markdown before expanding rendering features.
- Browser copy behavior must have both deterministic unit coverage and manual destination checks later.