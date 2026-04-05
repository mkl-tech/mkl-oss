import type { UseAppOptions } from '@modelcontextprotocol/ext-apps/react'
import { useEffect, useRef } from 'react'

export * from '@modelcontextprotocol/ext-apps/react'

import { useMockedMcpAppState } from './context'

export function useApp({ onAppCreated }: UseAppOptions) {
  const mockState = useMockedMcpAppState()
  const didCreateRef = useRef(false)
  const onAppCreatedRef = useRef(onAppCreated)

  onAppCreatedRef.current = onAppCreated

  useEffect(() => {
    if (!didCreateRef.current) {
      onAppCreatedRef.current?.(mockState.app)
      didCreateRef.current = true
    }

    return mockState.register()
  }, [mockState.app, mockState.register])

  return {
    app: mockState.app,
    isConnected: mockState.isConnected,
    error: mockState.error,
  }
}

export function useHostStyles() {}

export function useHostStyleVariables() {}

export function useHostFonts() {}
