// Versioned storage service for The Project Graveyard
// Supports wrapped schema { version: 2, projects: [...] } with automatic migration from v0 raw arrays and v1 schemas.

export const STORAGE_KEY = 'project-graveyard-v1'
export const SCHEMA_VERSION = 2

export function migrateProjects(projects, fromVersion = 0) {
  if (!Array.isArray(projects)) return []
  return projects.map((p) => {
    if (!p || typeof p !== 'object') return p
    const clone = { ...p }
    if (fromVersion < 2) {
      if (clone.adoptedBy && !clone.adopter) {
        clone.adopter = {
          name: clone.adoptedBy,
          plan: '',
          handle: '',
          date: clone.createdAt || '',
        }
      }
    }
    return clone
  })
}

export function loadProjects(storage = (typeof window !== 'undefined' ? window.localStorage : null)) {
  if (!storage) return null
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)

    // Old format: raw array of projects (version 0)
    if (Array.isArray(parsed)) {
      return migrateProjects(parsed, 0)
    }

    // Wrapped object format
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.projects)) {
      const v = Number(parsed.version) || 1
      return migrateProjects(parsed.projects, v)
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
