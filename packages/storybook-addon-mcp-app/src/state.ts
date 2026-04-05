import {
  GLOBAL_ACTIVE_EVENT,
  GLOBAL_APP_ERROR,
  GLOBAL_CANCELLED,
  GLOBAL_DISPATCH_NONCE,
  GLOBAL_INPUT,
  GLOBAL_RESULT,
  GLOBAL_SCENARIO,
  GLOBAL_STORY_ID,
} from './constants'
import type {
  McpAppDispatchEvent,
  McpAppMockParameters,
  McpAppScenario,
  McpAppToolCancelledPayload,
  McpAppToolInputPayload,
  McpAppToolResultPayload,
  ResolvedMcpAppMockState,
} from './types'

const DEFAULT_INPUT: McpAppToolInputPayload = {
  arguments: {
    maxResults: 3,
  },
}

const DEFAULT_RESULT: McpAppToolResultPayload = {
  content: [
    {
      type: 'text',
      text: '2026-04-03T08:00:00.000Z',
    },
  ],
  structuredContent: {
    time: '2026-04-03T08:00:00.000Z',
  },
}

const DEFAULT_CANCELLED: McpAppToolCancelledPayload = {
  reason: 'La récupération des créneaux a été interrompue.',
}

const DEFAULT_ERROR_MESSAGE = 'Connexion MCP simulée indisponible.'

function isScenario(value: unknown): value is McpAppScenario {
  return (
    value === 'loading' ||
    value === 'result' ||
    value === 'empty' ||
    value === 'error' ||
    value === 'cancelled'
  )
}

function isDispatchEvent(value: unknown): value is McpAppDispatchEvent {
  return (
    value === 'scenario' ||
    value === 'toolinput' ||
    value === 'toolresult' ||
    value === 'toolcancelled'
  )
}

function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== 'string' || value.trim() === '') {
    return fallback
  }

  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

function inferScenarioDispatch(scenario: McpAppScenario): McpAppDispatchEvent {
  switch (scenario) {
    case 'loading':
    case 'result':
    case 'empty':
    case 'error':
    case 'cancelled':
      return 'scenario'
  }
}

export function createMcpAppScenario(
  scenario: McpAppScenario,
  parameters: Omit<McpAppMockParameters, 'scenario'> = {},
): McpAppMockParameters {
  return {
    scenario,
    input: parameters.input ?? DEFAULT_INPUT,
    result: parameters.result ?? DEFAULT_RESULT,
    cancelled: parameters.cancelled ?? DEFAULT_CANCELLED,
    appErrorMessage: parameters.appErrorMessage,
    hostContext: parameters.hostContext,
    hostCapabilities: parameters.hostCapabilities,
  }
}

export function serializePayload(payload: unknown): string {
  return JSON.stringify(payload, null, 2)
}

export function normalizeParameters(parameters?: McpAppMockParameters): McpAppMockParameters {
  const scenario = parameters?.scenario ?? 'loading'

  return {
    scenario,
    input: parameters?.input ?? DEFAULT_INPUT,
    result: parameters?.result ?? DEFAULT_RESULT,
    cancelled: parameters?.cancelled ?? DEFAULT_CANCELLED,
    appErrorMessage:
      scenario === 'error'
        ? parameters?.appErrorMessage ?? DEFAULT_ERROR_MESSAGE
        : parameters?.appErrorMessage,
    hostContext: parameters?.hostContext,
    hostCapabilities: parameters?.hostCapabilities,
  }
}

export function getEmptyResultPayload(result: McpAppToolResultPayload): McpAppToolResultPayload {
  const structuredContent =
    result.structuredContent && typeof result.structuredContent === 'object'
      ? result.structuredContent
      : {}

  return {
    structuredContent: {
      ...structuredContent,
      total: 0,
      slots: [],
    },
  }
}

export function resolveMcpAppMockState(
  parameters?: McpAppMockParameters,
  globals: Record<string, unknown> = {},
  storyId?: string,
): ResolvedMcpAppMockState {
  const normalized = normalizeParameters(parameters)
  const storyGlobalsAreCurrent =
    !storyId || typeof globals[GLOBAL_STORY_ID] !== 'string' || globals[GLOBAL_STORY_ID] === storyId
  const activeGlobals = storyGlobalsAreCurrent ? globals : {}
  const scenario: McpAppScenario = isScenario(activeGlobals[GLOBAL_SCENARIO])
    ? activeGlobals[GLOBAL_SCENARIO]
    : normalized.scenario ?? 'loading'
  const input = parseJson<McpAppToolInputPayload>(
    activeGlobals[GLOBAL_INPUT],
    normalized.input ?? DEFAULT_INPUT,
  )
  const result = parseJson<McpAppToolResultPayload>(
    activeGlobals[GLOBAL_RESULT],
    normalized.result ?? DEFAULT_RESULT,
  )
  const cancelled = parseJson<McpAppToolCancelledPayload>(
    activeGlobals[GLOBAL_CANCELLED],
    normalized.cancelled ?? DEFAULT_CANCELLED,
  )
  const activeEvent = isDispatchEvent(activeGlobals[GLOBAL_ACTIVE_EVENT])
    ? activeGlobals[GLOBAL_ACTIVE_EVENT]
    : inferScenarioDispatch(scenario)
  const dispatchNonce =
    typeof activeGlobals[GLOBAL_DISPATCH_NONCE] === 'string'
      ? activeGlobals[GLOBAL_DISPATCH_NONCE]
      : `${scenario}:${activeEvent}`
  const globalError =
    typeof activeGlobals[GLOBAL_APP_ERROR] === 'string' && activeGlobals[GLOBAL_APP_ERROR].trim() !== ''
      ? activeGlobals[GLOBAL_APP_ERROR]
      : undefined

  const appErrorMessage =
    scenario === 'error'
      ? globalError ?? normalized.appErrorMessage ?? DEFAULT_ERROR_MESSAGE
      : globalError ?? normalized.appErrorMessage

  return {
    scenario,
    activeEvent,
    dispatchNonce,
    input,
    result,
    cancelled,
    appErrorMessage,
    hostContext: normalized.hostContext,
    hostCapabilities: normalized.hostCapabilities,
  }
}

export function toGlobalUpdates(
  parameters?: McpAppMockParameters,
  overrides: Partial<ResolvedMcpAppMockState> = {},
  storyId?: string,
): Record<string, unknown> {
  const resolved = {
    ...resolveMcpAppMockState(parameters, {}, storyId),
    ...overrides,
  }

  return {
    [GLOBAL_STORY_ID]: storyId ?? '',
    [GLOBAL_SCENARIO]: resolved.scenario,
    [GLOBAL_ACTIVE_EVENT]: resolved.activeEvent,
    [GLOBAL_DISPATCH_NONCE]: resolved.dispatchNonce,
    [GLOBAL_INPUT]: serializePayload(resolved.input),
    [GLOBAL_RESULT]: serializePayload(resolved.result),
    [GLOBAL_CANCELLED]: serializePayload(resolved.cancelled),
    [GLOBAL_APP_ERROR]: resolved.appErrorMessage ?? '',
  }
}
