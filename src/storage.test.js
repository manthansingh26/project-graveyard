import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  STORAGE_KEY,
  SCHEMA_VERSION,
  loadProjects,
  saveProjects,
  clearProjects,
} from './storage.js'

function createFakeStorage(initialData = {}) {
  const store = { ...initialData }
  return {
    getItem: (key) => (Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null),
    setItem: (key, val) => { store[key] = String(val) },
    removeItem: (key) => { delete store[key] },
    _store: store,
  }
}

test('save -> load roundtrip works with wrapped schema', () => {
  const storage = createFakeStorage()
  const mockProjects = [
    { id: 'p1', title: 'Test 1' },
    { id: 'p2', title: 'Test 2' },
  ]
  const saved = saveProjects(storage, mockProjects)
  assert.equal(saved, true)

  const raw = JSON.parse(storage.getItem(STORAGE_KEY))
  assert.equal(raw.version, SCHEMA_VERSION)
  assert.deepEqual(raw.projects, mockProjects)

  const loaded = loadProjects(storage)
  assert.deepEqual(loaded, mockProjects)
})

test('loads old raw-array format seamlessly (silent migration)', () => {
  const oldRawArray = [{ id: 'p1', title: 'Old Format Project' }]
  const storage = createFakeStorage({
    [STORAGE_KEY]: JSON.stringify(oldRawArray),
  })

  const loaded = loadProjects(storage)
  assert.deepEqual(loaded, oldRawArray)
})

test('loads wrapped format with version', () => {
  const wrapped = {
    version: 1,
    projects: [{ id: 'p2', title: 'Wrapped Project' }],
  }
  const storage = createFakeStorage({
    [STORAGE_KEY]: JSON.stringify(wrapped),
  })

  const loaded = loadProjects(storage)
  assert.deepEqual(loaded, wrapped.projects)
})

test('corrupted data returns null without throwing', () => {
  const storage = createFakeStorage({
    [STORAGE_KEY]: '{ invalid json ...',
  })
  assert.equal(loadProjects(storage), null)

  const invalidObjStorage = createFakeStorage({
    [STORAGE_KEY]: JSON.stringify({ version: 1, projects: 'not-an-array' }),
  })
  assert.equal(loadProjects(invalidObjStorage), null)

  const emptyStorage = createFakeStorage()
  assert.equal(loadProjects(emptyStorage), null)
})

test('clearProjects removes the storage key and returns true', () => {
  const storage = createFakeStorage({
    [STORAGE_KEY]: JSON.stringify({ version: 1, projects: [] }),
  })
  const cleared = clearProjects(storage)
  assert.equal(cleared, true)
  assert.equal(storage.getItem(STORAGE_KEY), null)
  assert.equal(loadProjects(storage), null)
})
