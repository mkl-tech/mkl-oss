import type { App } from '@modelcontextprotocol/ext-apps/react'
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react'

import { getEmptyResultPayload, resolveMcpAppMockState } from './state'
import type { McpAppMockParameters, ResolvedMcpAppMockState } from './types'

class MockMcpApp {
  ontoolinput?: (params: unknown) => void
  ontoolresult?: (params: unknown) => void
  ontoolcancelled?: (params: unknown) => void
  onhostcontextchanged?: (params: unknown) => void

  private hostContext?: Record<string, unknown>

  constructor(hostContext?: Record<string, unknown>) {
    this.hostContext = hostContext
  }

  getHostContext() {
    return this.hostContext
  }

  setHostContext(hostContext?: Record<string, unknown>) {
    this.hostContext = hostContext

    if (hostContext) {
      this.onhostcontextchanged?.(hostContext)
    }
  }

  emitToolInput(params: unknown) {
    this.ontoolinput?.(params)
  }

  emitToolResult(params: unknown) {
    this.ontoolresult?.(params)
  }

  emitToolCancelled(params: unknown) {
    this.ontoolcancelled?.(params)
  }
}

type McpAppMockContextValue = {
  registerApp: (app: MockMcpApp) => () => void
  state: ResolvedMcpAppMockState
}

const McpAppMockContext = createContext<McpAppMockContextValue | null>(null)

function dispatchStateToApp(app: MockMcpApp, state: ResolvedMcpAppMockState) {
  switch (state.activeEvent) {
    case 'toolinput':
      app.emitToolInput(state.input)
      return
    case 'toolresult':
      app.emitToolResult(state.result)
      return
    case 'toolcancelled':
      app.emitToolCancelled(state.cancelled)
      return
    case 'scenario':
      switch (state.scenario) {
        case 'loading':
          app.emitToolInput(state.input)
          return
        case 'result':
          app.emitToolInput(state.input)
          app.emitToolResult(state.result)
          return
        case 'empty':
          app.emitToolInput(state.input)
          app.emitToolResult(getEmptyResultPayload(state.result))
          return
        case 'cancelled':
          app.emitToolInput(state.input)
          app.emitToolCancelled(state.cancelled)
          return
        case 'error':
          return
      }
  }
}

export function McpAppMockProvider({
  children,
  globals,
  parameters,
  storyId,
}: {
  children: React.ReactNode
  globals?: Record<string, unknown>
  parameters?: McpAppMockParameters
  storyId?: string
}) {
  const state = useMemo(
    () => resolveMcpAppMockState(parameters, globals, storyId),
    [globals, parameters, storyId],
  )
  const appsRef = useRef(new Set<MockMcpApp>())
  const stateRef = useRef(state)

  stateRef.current = state

  const registerApp = useCallback(
    (app: MockMcpApp) => {
      appsRef.current.add(app)
      app.setHostContext(stateRef.current.hostContext)
      dispatchStateToApp(app, stateRef.current)

      return () => {
        appsRef.current.delete(app)
      }
    },
    [],
  )

  useEffect(() => {
    for (const app of appsRef.current) {
      app.setHostContext(state.hostContext)
    }
  }, [state.hostContext])

  useEffect(() => {
    for (const app of appsRef.current) {
      dispatchStateToApp(app, state)
    }
  }, [
    state.activeEvent,
    state.appErrorMessage,
    state.cancelled,
    state.dispatchNonce,
    state.input,
    state.result,
    state.scenario,
  ])

  const contextValue = useMemo(
    () => ({
      registerApp,
      state,
    }),
    [registerApp, state],
  )

  return <McpAppMockContext.Provider value={contextValue}>{children}</McpAppMockContext.Provider>
}

export function useMcpAppMockControls() {
  const context = useContext(McpAppMockContext)

  if (!context) {
    throw new Error('useMcpAppMockControls must be used inside McpAppMockProvider.')
  }

  return context
}

export function useMockedMcpAppState(): {
  app: App
  isConnected: boolean
  error: Error | null
  register: () => () => void
} {
  const context = useMcpAppMockControls()
  const appRef = useRef<MockMcpApp | null>(null)
  const registerRef = useRef<() => () => void>(() => () => {})

  if (!appRef.current) {
    appRef.current = new MockMcpApp(context.state.hostContext)
  }

  registerRef.current = () => context.registerApp(appRef.current!)

  return useMemo(
    () => ({
      app: appRef.current as unknown as App,
      isConnected: context.state.scenario !== 'error' && !context.state.appErrorMessage,
      error:
        context.state.scenario === 'error' && context.state.appErrorMessage
          ? new Error(context.state.appErrorMessage)
          : null,
      register: () => registerRef.current(),
    }),
    [context.state.appErrorMessage, context.state.scenario],
  )
}
