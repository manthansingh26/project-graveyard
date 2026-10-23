// Versioned storage service for The Project Graveyard
// Supports wrapped schema { version: 1, projects: [...] } with silent migration from old raw arrays.

export const STORAGE_KEY = 'project-graveyard-v1'
export const SCHEMA_VERSION = 1

export function loadProjects(storage = (typeof window !== 'undefined' ? window.localStorage : null)) {
  if (!storage) return null
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)

    // Old format: raw array of projects
    if (Array.isArray(parsed)) {
      return parsed
    }

    // New format: wrapped object { version: 1, projects: [...] }
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.projects)) {
      return parsed.projects
    }

    return null
  } catch {
    return null
  }
}

export function saveProjects(storage = (typeof window !== 'undefined' ? window.localStorage : null), projects) {
  if (!storage || !Array.isArray(projects)) return false
  try {
    const payload = {
      version: SCHEMA_VERSION,
      projects,
    }
    storage.setItem(STORAGE_KEY, JSON.stringify(payload))
    return true
  } catch {
    return false
  }
}

export function clearProjects(storage = (typeof window !== 'undefined' ? window.localStorage : null)) {
  if (!storage) return false
  try {
    storage.removeItem(STORAGE_KEY)
    return true
  } catch {
    return false
  }
}
