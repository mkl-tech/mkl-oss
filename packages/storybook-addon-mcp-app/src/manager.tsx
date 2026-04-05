import { addons, types, useGlobals, useParameter, useStorybookState } from 'storybook/manager-api'
import React, { useEffect, useMemo, useState } from 'react'

import {
  ADDON_ID,
  GLOBAL_APP_ERROR,
  GLOBAL_CANCELLED,
  GLOBAL_INPUT,
  GLOBAL_RESULT,
  PANEL_ID,
  PARAM_KEY,
} from './constants'
import { normalizeParameters, resolveMcpAppMockState, serializePayload, toGlobalUpdates } from './state'
import type {
  McpAppDispatchEvent,
  McpAppMockParameters,
  McpAppScenario,
  ResolvedMcpAppMockState,
} from './types'

function nowNonce() {
  return `${Date.now()}`
}

function panelSectionTitle(title: string) {
  return React.createElement(
    'h3',
    {
      style: {
        margin: '0 0 8px',
        fontSize: '13px',
        fontWeight: 700,
      },
    },
    title,
  )
}

function Panel() {
  const [globals, updateGlobals] = useGlobals()
  const { storyId } = useStorybookState()
  const storyParameters = normalizeParameters(
    useParameter<McpAppMockParameters | undefined>(PARAM_KEY, undefined),
  )
  const [inputText, setInputText] = useState(serializePayload(storyParameters.input))
  const [resultText, setResultText] = useState(serializePayload(storyParameters.result))
  const [cancelledText, setCancelledText] = useState(serializePayload(storyParameters.cancelled))
  const [errorText, setErrorText] = useState(storyParameters.appErrorMessage ?? '')

  const resolvedState = useMemo(
    () => resolveMcpAppMockState(storyParameters, globals, storyId),
    [globals, storyId, storyParameters],
  )

  useEffect(() => {
    const nextInput = serializePayload(resolvedState.input)
    const nextResult = serializePayload(resolvedState.result)
    const nextCancelled = serializePayload(resolvedState.cancelled)
    const nextError = resolvedState.appErrorMessage ?? ''

    setInputText(nextInput)
    setResultText(nextResult)
    setCancelledText(nextCancelled)
    setErrorText(nextError)
  }, [resolvedState])

  function updatePayloadGlobals(extra: Partial<ResolvedMcpAppMockState>) {
    updateGlobals({
      ...toGlobalUpdates(storyParameters, extra, storyId),
      [GLOBAL_INPUT]: inputText,
      [GLOBAL_RESULT]: resultText,
      [GLOBAL_CANCELLED]: cancelledText,
      [GLOBAL_APP_ERROR]: errorText,
    })
  }

  function applyScenario(scenario: McpAppScenario) {
    updatePayloadGlobals({
      scenario,
      activeEvent: 'scenario',
      dispatchNonce: nowNonce(),
      appErrorMessage: errorText,
    })
  }

  function emitEvent(activeEvent: McpAppDispatchEvent) {
    updatePayloadGlobals({
      scenario: resolvedState.scenario ?? storyParameters.scenario ?? 'loading',
      activeEvent,
      dispatchNonce: nowNonce(),
      appErrorMessage: errorText,
    })
  }

  function resetAll() {
    const resetGlobals = toGlobalUpdates(storyParameters, {
      activeEvent: 'scenario',
      dispatchNonce: nowNonce(),
    }, storyId)

    setInputText(resetGlobals[GLOBAL_INPUT] as string)
    setResultText(resetGlobals[GLOBAL_RESULT] as string)
    setCancelledText(resetGlobals[GLOBAL_CANCELLED] as string)
    setErrorText((resetGlobals[GLOBAL_APP_ERROR] as string) ?? '')
    updateGlobals(resetGlobals)
  }

  return React.createElement(
    'div',
    {
      style: {
        display: 'grid',
        gap: '16px',
        padding: '16px',
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      },
    },
    React.createElement(
      'section',
      { style: { display: 'grid', gap: '8px' } },
      panelSectionTitle('Scenario'),
      React.createElement(
        'select',
        {
          value: resolvedState.scenario ?? 'loading',
          onChange: (event: React.ChangeEvent<HTMLSelectElement>) =>
            applyScenario(event.target.value as McpAppScenario),
          style: { padding: '8px 10px' },
        },
        React.createElement('option', { value: 'loading' }, 'loading'),
        React.createElement('option', { value: 'result' }, 'result'),
        React.createElement('option', { value: 'empty' }, 'empty'),
        React.createElement('option', { value: 'error' }, 'error'),
        React.createElement('option', { value: 'cancelled' }, 'cancelled'),
      ),
      React.createElement(
        'button',
        { type: 'button', onClick: () => applyScenario(resolvedState.scenario ?? 'loading') },
        'Rejouer le scenario',
      ),
    ),
    React.createElement(
      'section',
      { style: { display: 'grid', gap: '8px' } },
      panelSectionTitle('Payloads'),
      React.createElement(
        'label',
        { style: { display: 'grid', gap: '4px' } },
        React.createElement('span', undefined, 'toolinput'),
        React.createElement('textarea', {
          rows: 6,
          value: inputText,
          onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => setInputText(event.target.value),
        }),
      ),
      React.createElement(
        'label',
        { style: { display: 'grid', gap: '4px' } },
        React.createElement('span', undefined, 'toolresult'),
        React.createElement('textarea', {
          rows: 10,
          value: resultText,
          onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => setResultText(event.target.value),
        }),
      ),
      React.createElement(
        'label',
        { style: { display: 'grid', gap: '4px' } },
        React.createElement('span', undefined, 'toolcancelled'),
        React.createElement('textarea', {
          rows: 4,
          value: cancelledText,
          onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => setCancelledText(event.target.value),
        }),
      ),
      React.createElement(
        'label',
        { style: { display: 'grid', gap: '4px' } },
        React.createElement('span', undefined, 'App error'),
        React.createElement('input', {
          value: errorText,
          onChange: (event: React.ChangeEvent<HTMLInputElement>) => setErrorText(event.target.value),
        }),
      ),
    ),
    React.createElement(
      'section',
      { style: { display: 'grid', gap: '8px' } },
      panelSectionTitle('Evenements'),
      React.createElement(
        'button',
        { type: 'button', onClick: () => emitEvent('toolinput') },
        'Envoyer `toolinput`',
      ),
      React.createElement(
        'button',
        { type: 'button', onClick: () => emitEvent('toolresult') },
        'Envoyer `toolresult`',
      ),
      React.createElement(
        'button',
        { type: 'button', onClick: () => emitEvent('toolcancelled') },
        'Envoyer `toolcancelled`',
      ),
      React.createElement('button', { type: 'button', onClick: resetAll }, 'Reset'),
    ),
  )
}

addons.register(ADDON_ID, () => {
  addons.add(PANEL_ID, {
    type: types.PANEL,
    title: 'MCP App',
    render: ({ active }) => {
      if (!active) {
        return null
      }

      return React.createElement(Panel)
    },
  })
})
