# Contributing

Keep changes focused, reproducible, and easy to verify.

## One environment

```sh
flox activate
bun install --frozen-lockfile
bun run hooks:install
```

Flox locks system packages; `bun.lock` locks JavaScript packages. Use Bun for workspace commands and installation. Next.js and Vitest retain Node as their runtime. Docker and Calibre are separate host prerequisites for the full conversion workflow.

## Shared checks

```sh
bun run check
bun run test:coverage
bun run build:all
bun run test:e2e
```

`check` runs formatting, ESLint, TypeScript checks, Markdown and Mermaid validation, and the LOC budget. Pre-commit runs the same check command; pre-push also runs coverage, builds, browser tests, and security checks. CI adds infrastructure validation, dependency auditing, and browser journeys. Run `bun run check:infra` inside Flox for the infrastructure checks.

## Edit documentation

Edit the matching file in `docs/`. Add a catalog entry in `client/lib/catalog.ts` for new public pages. Relative Markdown links resolve to documentation routes; second-level headings supply the table of contents. Mermaid code fences are checked by the same parser used by the browser.

## Keep code lean

New authored source files have a 300-line budget. Existing larger files have explicit ceilings in `scripts/loc-budget.json`; they may shrink but may not grow. The aggregate source budget prevents splitting files merely to hide growth. Generated files, dependencies, lockfiles, and documentation are excluded. Do not minify source to meet the budget.

## CI and releases

Pull requests and pushes run required checks with read-only permissions. CI failures block the release workflow. After a successful push to `master`, auto-release tags that exact revision with the next patch version and creates release notes. Existing tags are reused safely on retry. Pull request runs cannot trigger releases.

## Commit conventions

Use conventional prefixes such as `feat:`, `fix:`, or `docs:` and keep the first line under 72 characters. Never commit credentials or local environment files. Include the reason for a change and how it was verified in the pull request.

## Security patch

`patches/braces@3.0.3.patch` bounds parser nesting to 128 levels to prevent recursive AST stack exhaustion (GHSA-vfj7-8cjw-p6xm). No upstream patched version is published. `bun run check:security` verifies normal expansion and rejects deeply nested braces and parentheses through compile, expand, and stringify in every installed copy before accepting that one version-only audit finding. All other high or critical advisories fail CI. Remove the patch and exception when an upstream fix is available.
