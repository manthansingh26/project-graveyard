import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

test('static entry document exposes product description and JS notice in noscript fallback', () => {
  const indexPath = path.resolve('index.html')
  assert.ok(fs.existsSync(indexPath), 'index.html must exist as the primary entry document')

  const html = fs.readFileSync(indexPath, 'utf-8')

  // Extract <noscript> block
  const noscriptMatch = html.match(/<noscript>([\s\S]*?)<\/noscript>/i)
  assert.ok(noscriptMatch, 'index.html must contain a <noscript> element')

  const noscriptContent = noscriptMatch[1]

  // Verify application title
  assert.match(
    noscriptContent,
    /The Project Graveyard/i,
    'noscript fallback must identify The Project Graveyard'
  )

  // Verify concise, accessible explanation of the application's 5 core capabilities
  assert.match(
    noscriptContent,
    /record abandoned projects/i,
    'noscript fallback must explain recording abandoned projects'
  )

  assert.match(
    noscriptContent,
    /review project history/i,
    'noscript fallback must explain reviewing project history'
  )

  assert.match(
    noscriptContent,
    /assess revival potential/i,
    'noscript fallback must explain assessing revival potential'
  )

  assert.match(
    noscriptContent,
    /create a revival plan/i,
    'noscript fallback must explain creating a revival plan'
  )

  assert.match(
    noscriptContent,
    /offer eligible projects for adoption/i,
    'noscript fallback must explain offering eligible projects for adoption'
  )

  // Verify honest notice regarding JavaScript requirement for interactive features
  assert.match(
    noscriptContent,
    /JavaScript is required/i,
    'noscript fallback must honestly inform that JavaScript is required for interactive features'
  )

  // Verify React app entry root and module script are intact outside <noscript>
  assert.ok(
    html.includes('<div id="root"></div>'),
    'index.html must preserve the React mount point <div id="root"></div>'
  )
  assert.ok(
    html.includes('<script type="module" src="/src/main.jsx"></script>'),
    'index.html must preserve the React application module script tag'
  )
})
