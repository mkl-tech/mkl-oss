import fs from 'node:fs/promises'

import { describe, expect, it } from 'vitest'

const UPSTREAM_INTEGRATION_EXAMPLE =
  'https://raw.githubusercontent.com/modelcontextprotocol/ext-apps/main/examples/integration-server/src/mcp-app.tsx'
const LOCAL_EXT_APPS_DIR = process.env.EXT_APPS_REPO_DIR ?? '/tmp/ext-apps-inspect'

async function loadUpstreamSource() {
  const localPath = `${LOCAL_EXT_APPS_DIR}/examples/integration-server/src/mcp-app.tsx`

  try {
    return await fs.readFile(localPath, 'utf8')
  } catch {
    const response = await fetch(UPSTREAM_INTEGRATION_EXAMPLE, {
      headers: {
        'user-agent': 'mkl-oss-storybook-addon-mcp-app-tests',
      },
    })

    if (!response.ok) {
      throw new Error(`Unable to fetch upstream example: ${response.status} ${response.statusText}`)
    }

    return response.text()
  }
}

describe('upstream ext-apps contract', () => {
  it('tracks the current integration-server React app from ext-apps main', async () => {
    const source = await loadUpstreamSource()

    expect(source).toContain('useApp({')
    expect(source).toContain('app.ontoolinput =')
    expect(source).toContain('app.ontoolresult =')
    expect(source).toContain('app.getHostContext()')
    expect(source).toContain('app.callServerTool(')
    expect(source).toContain('app.sendMessage(')
    expect(source).toContain('app.sendLog(')
    expect(source).toContain('app.openLink(')
    expect(source).toContain('app.downloadFile(')
    expect(source).toContain('app.getHostCapabilities()')
  })
})
