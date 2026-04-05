# `@mkl-oss/storybook-addon-mcp-app`

Storybook addon package for mocking MCP App React integrations in local component stories.

It provides:

- a Storybook decorator that injects a mock MCP App host
- a Storybook panel for switching scenarios and replaying MCP events
- a runtime module that can replace `@modelcontextprotocol/ext-apps/react` in Storybook
- small helpers for story parameters

## Installation

```bash
pnpm add -D @mkl-oss/storybook-addon-mcp-app
```

This package is designed to be used alongside:

- `storybook`
- `react`
- `react-dom`
- `@modelcontextprotocol/ext-apps`

## Compatibility

| Package | Supported versions | Status |
| --- | --- | --- |
| `@mkl-oss/storybook-addon-mcp-app` | `0.1.x` | current release line |
| `storybook` | `10.x` | tested |
| `react` | `19.x` | tested |
| `react-dom` | `19.x` | tested |
| `@modelcontextprotocol/ext-apps` | `1.3.x` | tested |

Compatibility with earlier Storybook major versions is not claimed until it is explicitly tested.

Test suite documentation: [test/README.md](./test/README.md)

## Usage

This package is designed for React UIs that depend on `@modelcontextprotocol/ext-apps/react`, especially components using:

- `useApp(...)`
- `useHostStyles(...)`
- MCP callbacks such as `ontoolinput`, `ontoolresult`, and `ontoolcancelled`

The addon lets Storybook render those components without a real MCP host.

## What It Adds

- a decorator that injects a mocked MCP App host into stories
- a toolbar global for switching between common MCP states
- a manager panel named `MCP App`
- helpers for defining scenario parameters directly in stories

Supported scenarios:

- `loading`
- `result`
- `empty`
- `error`
- `cancelled`

## Storybook Setup

### 1. Register the addon

In your package `.storybook/main.ts`:

```ts
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { StorybookConfig } from '@storybook/react-vite'

const dirname = path.dirname(fileURLToPath(import.meta.url))

const config: StorybookConfig = {
  addons: ['@storybook/addon-docs', '@mkl-oss/storybook-addon-mcp-app'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  viteFinal: async (viteConfig) => ({
    ...viteConfig,
    resolve: {
      ...viteConfig.resolve,
      alias: {
        ...(viteConfig.resolve?.alias ?? {}),
        '@modelcontextprotocol/ext-apps/react':
          '@mkl-oss/storybook-addon-mcp-app/runtime',
      },
    },
  }),
}

export default config
```

The important part is the alias: it replaces the real MCP React runtime with the mocked Storybook runtime for stories only.

The addon preset automatically registers the manager panel and preview annotations. You only need to import `@mkl-oss/storybook-addon-mcp-app/preview` manually if you want to compose or override the preview configuration yourself.

## Writing Stories

Use `createMcpAppScenario(...)` in story parameters:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite'
import { createMcpAppScenario } from '@mkl-oss/storybook-addon-mcp-app'

import ConsultationSlotsApp from './App'

const meta = {
  title: 'MCP App/ConsultationSlotsApp',
  component: ConsultationSlotsApp,
  parameters: {
    mcpAppMock: createMcpAppScenario('loading'),
  },
} satisfies Meta<typeof ConsultationSlotsApp>

export default meta

type Story = StoryObj<typeof meta>

export const Loading: Story = {}

export const Result: Story = {
  parameters: {
    mcpAppMock: createMcpAppScenario('result', {
      input: {
        arguments: {
          maxResults: 5,
        },
      },
      result: {
        structuredContent: {
          fetchedAt: '2026-04-01T15:45:00.000Z',
          total: 2,
          slots: [
            {
              id: 'slot-1',
              startAt: '2026-04-03T08:00:00.000Z',
              duration: 60,
            },
          ],
        },
      },
    }),
  },
}
```

## Story Parameters

The addon reads the `mcpAppMock` story parameter.

Available fields:

- `scenario`
- `input`
- `result`
- `cancelled`
- `appErrorMessage`
- `hostContext`

Example:

```ts
parameters: {
  mcpAppMock: {
    scenario: 'error',
    appErrorMessage: 'Connexion MCP simulée indisponible.',
  },
}
```

## Using the Panel

The `MCP App` panel in Storybook lets you:

- switch the active scenario
- replay the active scenario
- edit the JSON payload for `toolinput`
- edit the JSON payload for `toolresult`
- edit the JSON payload for `toolcancelled`
- override the app-level error message
- manually emit `toolinput`, `toolresult`, or `toolcancelled`
- reset the story state to the initial story parameters

The panel updates Storybook globals, so changes apply live to the current story without changing source files.

## Exports

Main package exports from `@mkl-oss/storybook-addon-mcp-app`:

- `createMcpAppScenario`
- `getEmptyResultPayload`
- `normalizeParameters`
- `resolveMcpAppMockState`
- `serializePayload`
- `toGlobalUpdates`
- `McpAppMockProvider`
- `useMcpAppMockControls`

Preview exports from `@mkl-oss/storybook-addon-mcp-app/preview`:

- `withMcpAppMock`
- `mcpAppMockGlobalTypes`

Runtime export from `@mkl-oss/storybook-addon-mcp-app/runtime`:

- Storybook-safe replacement for `@modelcontextprotocol/ext-apps/react`

## Notes

- This addon is meant for Storybook usage only.
- The runtime mock only implements the MCP App behavior needed by current React stories, not the full SDK surface of a real MCP host runtime.
- For a real integration build, keep using the actual `@modelcontextprotocol/ext-apps/react` package outside Storybook.
- The manager panel and preview helpers are intended for local Storybook development, not production builds.
