# Test Strategy

This directory contains the test suite for `@mkl-oss/storybook-addon-mcp-app`.

The goal of these tests is to validate two things:

- the addon still works as a local Storybook mock runtime for React MCP apps
- the addon still matches the shape of a current MCP app example from `modelcontextprotocol/ext-apps`

## Why This Exists

This package is not a generic UI helper. It replaces parts of the MCP App runtime inside Storybook, so regressions can happen in two directions:

- we break our own mock behavior
- upstream MCP app examples evolve and our mock no longer covers the APIs they use

The test suite is split accordingly.

## Test Files

### `preset.test.ts`

Verifies the Storybook preset wiring:

- `managerEntries()`
- `previewAnnotations()`
- paths resolved from the built package

This protects the addon packaging and auto-registration behavior.

### `runtime.integration.test.tsx`

Integration-style tests for the mocked runtime.

These tests mount a small React harness that intentionally mirrors the way an upstream MCP app uses:

- `useApp(...)`
- `ontoolinput`
- `ontoolresult`
- `ontoolcancelled`
- `getHostContext()`
- host communication methods such as `callServerTool`, `sendMessage`, `sendLog`, `openLink`, and `downloadFile`

This is the main regression suite for local development.

### `upstream-contract.test.ts`

Contract test against the current `integration-server` React example from `modelcontextprotocol/ext-apps`.

It checks that the upstream example still contains the APIs we expect to support. This is intentionally narrower than a full E2E run: the purpose is to detect contract drift early.

The test loads the upstream example in this order:

1. from `EXT_APPS_REPO_DIR`, if provided
2. from `/tmp/ext-apps-inspect`, if present
3. from `raw.githubusercontent.com`, as a network fallback

This makes the test usable both:

- in CI, where we clone `ext-apps` explicitly
- locally, where you may already have a clone in `/tmp`

## Commands

Run the local deterministic suite:

```bash
pnpm --filter @mkl-oss/storybook-addon-mcp-app test
```

Run only the upstream contract check:

```bash
pnpm --filter @mkl-oss/storybook-addon-mcp-app test:upstream
```

Run the full package validation:

```bash
pnpm --filter @mkl-oss/storybook-addon-mcp-app validate
```

## CI Intent

The CI workflow uses two levels:

- `test` + `validate` as the main package safety net
- `test:upstream` as an upstream compatibility monitor based on a fresh clone of `modelcontextprotocol/ext-apps`

Keeping the upstream contract check separate makes failures easier to interpret:

- if `test` fails, we likely broke our own addon
- if `test:upstream` fails, upstream changed and the addon contract may need to be updated
