import type { App } from '@modelcontextprotocol/ext-apps'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React, { useEffect, useState } from 'react'
import { describe, expect, it } from 'vitest'

import { McpAppMockProvider } from '../src/context'
import { useApp } from '../src/runtime'
import type { McpAppMockParameters, McpAppToolResultPayload } from '../src/types'

function extractTime(result: McpAppToolResultPayload | null) {
  return (result?.structuredContent as { time?: string } | undefined)?.time ?? 'Loading...'
}

function IntegrationHarness() {
  const [toolResult, setToolResult] = useState<McpAppToolResultPayload | null>(null)
  const [hostContext, setHostContext] = useState<Record<string, unknown> | undefined>()
  const [lastAction, setLastAction] = useState('none')

  const { app, error } = useApp({
    appInfo: { name: 'Integration Harness', version: '1.0.0' },
    capabilities: {},
    onAppCreated: (instance) => {
      instance.ontoolinput = async () => {
        setLastAction('input')
      }
      instance.ontoolresult = async (result) => {
        setToolResult(result as McpAppToolResultPayload)
        setLastAction('result')
      }
      instance.ontoolcancelled = async (params) => {
        setLastAction(`cancelled:${(params as { reason?: string }).reason ?? 'none'}`)
      }
      instance.onhostcontextchanged = (nextContext) => {
        setHostContext(nextContext as Record<string, unknown>)
      }
    },
  })

  useEffect(() => {
    if (app) {
      setHostContext(app.getHostContext())
    }
  }, [app])

  if (error) {
    return <div>ERROR: {error.message}</div>
  }

  if (!app) {
    return <div>Connecting...</div>
  }

  const canDownload = app.getHostCapabilities()?.downloadFile !== undefined

  return (
    <div>
      <div data-testid="server-time">{extractTime(toolResult)}</div>
      <div data-testid="last-action">{lastAction}</div>
      <div data-testid="host-theme">{String(hostContext?.theme ?? 'none')}</div>
      <button
        type="button"
        onClick={async () => {
          const result = await app.callServerTool({ name: 'get-time', arguments: {} })
          setToolResult(result as McpAppToolResultPayload)
          setLastAction('callServerTool')
        }}
      >
        Get Server Time
      </button>
      <button
        type="button"
        onClick={async () => {
          const result = await app.sendMessage({ role: 'user', content: [] })
          setLastAction(result.isError ? 'message:error' : 'message:ok')
        }}
      >
        Send Message
      </button>
      <button
        type="button"
        onClick={async () => {
          await app.sendLog({ level: 'info', data: 'hello' })
          setLastAction('log:ok')
        }}
      >
        Send Log
      </button>
      <button
        type="button"
        onClick={async () => {
          const result = await app.openLink({ url: 'https://modelcontextprotocol.io/' })
          setLastAction(result.isError ? 'link:error' : 'link:ok')
        }}
      >
        Open Link
      </button>
      {canDownload ? (
        <button
          type="button"
          onClick={async () => {
            const result = await app.downloadFile({ contents: [] })
            setLastAction(result.isError ? 'download:error' : 'download:ok')
          }}
        >
          Download File
        </button>
      ) : null}
    </div>
  )
}

function renderHarness(parameters?: McpAppMockParameters) {
  return render(
    <McpAppMockProvider parameters={parameters}>
      <IntegrationHarness />
    </McpAppMockProvider>,
  )
}

describe('runtime integration', () => {
  it('replays result and host context for a React app shaped like the upstream integration example', async () => {
    renderHarness({
      scenario: 'result',
      hostContext: { theme: 'dark' },
      result: {
        structuredContent: { time: '2026-04-05T10:30:00.000Z' },
      },
    })

    await waitFor(() => {
      expect(screen.getByTestId('server-time')).toHaveTextContent('2026-04-05T10:30:00.000Z')
    })
    expect(screen.getByTestId('last-action')).toHaveTextContent('result')
    expect(screen.getByTestId('host-theme')).toHaveTextContent('dark')
  })

  it('supports the host communication methods used by the upstream integration example', async () => {
    const user = userEvent.setup()
    renderHarness({
      scenario: 'loading',
      hostCapabilities: { downloadFile: {} },
      result: {
        structuredContent: { time: '2026-04-05T11:00:00.000Z' },
      },
    })

    await user.click(screen.getByRole('button', { name: 'Get Server Time' }))
    expect(screen.getByTestId('server-time')).toHaveTextContent('2026-04-05T11:00:00.000Z')
    expect(screen.getByTestId('last-action')).toHaveTextContent('callServerTool')

    await user.click(screen.getByRole('button', { name: 'Send Message' }))
    expect(screen.getByTestId('last-action')).toHaveTextContent('message:ok')

    await user.click(screen.getByRole('button', { name: 'Send Log' }))
    expect(screen.getByTestId('last-action')).toHaveTextContent('log:ok')

    await user.click(screen.getByRole('button', { name: 'Open Link' }))
    expect(screen.getByTestId('last-action')).toHaveTextContent('link:ok')

    await user.click(screen.getByRole('button', { name: 'Download File' }))
    expect(screen.getByTestId('last-action')).toHaveTextContent('download:ok')
  })

  it('surfaces the configured app error', () => {
    renderHarness({
      scenario: 'error',
      appErrorMessage: 'Simulated MCP host failure.',
    })

    expect(screen.getByText('ERROR: Simulated MCP host failure.')).toBeInTheDocument()
  })
})
