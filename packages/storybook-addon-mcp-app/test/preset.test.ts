import path from 'node:path'
import { describe, expect, it } from 'vitest'

import preset, { managerEntries, previewAnnotations } from '../preset.js'

describe('preset', () => {
  it('registers manager and preview entries from the built package', () => {
    const managers = managerEntries([])
    const previews = previewAnnotations([])

    expect(managers).toHaveLength(1)
    expect(previews).toHaveLength(1)
    expect(managers[0]).toBe(path.resolve('dist/manager.js'))
    expect(previews[0]).toBe(path.resolve('dist/preview.js'))
    expect(preset.managerEntries).toBe(managerEntries)
    expect(preset.previewAnnotations).toBe(previewAnnotations)
  })
})
