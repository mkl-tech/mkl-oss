export type McpAppScenario = 'loading' | 'result' | 'empty' | 'error' | 'cancelled'

export type McpAppDispatchEvent = 'scenario' | 'toolinput' | 'toolresult' | 'toolcancelled'

export type McpAppToolInputPayload = {
  arguments?: Record<string, unknown>
}

export type McpAppToolResultPayload = {
  structuredContent?: Record<string, unknown>
}

export type McpAppToolCancelledPayload = {
  reason?: string
}

export type McpAppMockParameters = {
  scenario?: McpAppScenario
  input?: McpAppToolInputPayload
  result?: McpAppToolResultPayload
  cancelled?: McpAppToolCancelledPayload
  appErrorMessage?: string
  hostContext?: Record<string, unknown>
}

export type ResolvedMcpAppMockState = {
  scenario: McpAppScenario
  activeEvent: McpAppDispatchEvent
  dispatchNonce: string
  input: McpAppToolInputPayload
  result: McpAppToolResultPayload
  cancelled: McpAppToolCancelledPayload
  appErrorMessage?: string
  hostContext?: Record<string, unknown>
}
