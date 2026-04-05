import React from 'react'
import type { Decorator, Preview } from '@storybook/react'
import { useEffect, useRef } from 'react'
import { useGlobals } from 'storybook/preview-api'

import { GLOBAL_SCENARIO, PARAM_KEY } from './constants'
import { McpAppMockProvider } from './context'
import { toGlobalUpdates } from './state'
import type { McpAppMockParameters } from './types'

export const withMcpAppMock: Decorator = (renderStory, context) => {
  const [globals, updateGlobals] = useGlobals()
  const lastStoryIdRef = useRef<string | null>(null)
  const storyParameters = context.parameters[PARAM_KEY] as McpAppMockParameters | undefined

  useEffect(() => {
    if (lastStoryIdRef.current === context.id) {
      return
    }

    lastStoryIdRef.current = context.id
    updateGlobals(
      toGlobalUpdates(
        storyParameters,
        {
          activeEvent: 'scenario',
          dispatchNonce: `story:${context.id}`,
        },
        context.id,
      ),
    )
  }, [context.id, storyParameters, updateGlobals])

  return (
    <McpAppMockProvider
      globals={globals}
      parameters={storyParameters}
      storyId={context.id}
    >
      {renderStory()}
    </McpAppMockProvider>
  )
}

export const mcpAppMockGlobalTypes: Preview['globalTypes'] = {
  [GLOBAL_SCENARIO]: {
    name: 'MCP scenario',
    description: 'Scenario MCP App simulé pour la story courante.',
    defaultValue: 'loading',
    toolbar: {
      title: 'MCP App',
      icon: 'lightning',
      dynamicTitle: true,
      items: [
        { value: 'loading', title: 'Loading' },
        { value: 'result', title: 'Result' },
        { value: 'empty', title: 'Empty' },
        { value: 'error', title: 'Error' },
        { value: 'cancelled', title: 'Cancelled' },
      ],
    },
  },
}

const preview: Preview = {
  decorators: [withMcpAppMock],
  globalTypes: mcpAppMockGlobalTypes,
}

export default preview
