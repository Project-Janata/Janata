# Ralph Runner

This repo includes a lightweight setup for running Ralph Loop locally on the Mac Mini.

Runtime state is intentionally local-only:

- `.ralph/`
- `.context/`
- `local-notes/`
- raw evidence videos/screenshots

Do not commit those files. The reusable setup scripts are committed under `scripts/ralph/`.

## One-Time Setup

From a clean checkout on the Mac Mini:

```bash
git checkout v2
git pull origin v2
npm install
npm run ralph:setup
```

`npm run ralph:setup` creates:

- `.ralph/prd.json` from the GitHub milestone `MSC v2 Beta`
- `.ralph/learnings.md`
- `.ralph/verify.sh`
- `.context/evidence/`

It also adds local Git excludes for Ralph runtime state.

## Required Tools

The Mac Mini needs:

- Xcode and iOS Simulator
- Homebrew
- Node/npm
- GitHub CLI authenticated with repo access
- Codex
- `ralph-loop` on `PATH`
- EAS CLI for build preparation only

Do not run App Store submit or publish commands from the runner.

## Sprint Board

Ralph pulls stories from:

- Repo: `Project-Janata/Janata`
- Milestone: `MSC v2 Beta`
- Target branch: `v2`
- Slack channel: `#priduct-updates`

Use labels to manage the board:

- `status:todo`, `status:in-progress`, `status:review`, `status:blocked`, `status:done`
- `priority:p0`, `priority:p1`, `priority:p2`, `priority:p3`
- `area:*`
- `ralph:story`

## Running One Story

Prefer one story at a time:

```bash
npm run ralph:status
npm run ralph:run-one
```

After a story:

1. Push the feature branch.
2. Open or update the PR.
3. Run automated checks.
4. Run end-to-end UI testing.
5. Record browser/iOS simulator evidence.
6. Post video evidence to `#priduct-updates`.
7. Link or reference the evidence in the PR.
8. Merge to `v2` only if the gate passes.

## Merge Gate

A PR may merge into `v2` only after:

- `.ralph/verify.sh` passes
- end-to-end UI smoke passes
- design review passes
- recorded video evidence is posted to `#priduct-updates`
- PR includes test evidence and known residual risk

## Refreshing The Local PRD

When GitHub Issues change:

```bash
npm run ralph:setup
```

This regenerates `.ralph/prd.json` from the milestone. Do this before starting a new Ralph session.

