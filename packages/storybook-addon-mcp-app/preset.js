import { fileURLToPath } from 'node:url'

function resolvePackageFile(pathname) {
  return fileURLToPath(new URL(pathname, import.meta.url))
}

export function managerEntries(entry = []) {
  return [...entry, resolvePackageFile('./dist/manager.js')]
}

export function previewAnnotations(entry = []) {
  return [...entry, resolvePackageFile('./dist/preview.js')]
}

export default {
  managerEntries,
  previewAnnotations,
}
