import { execSync } from 'node:child_process'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Exposes the Git history of journey/ as `virtual:journey-history`, so the
 * site can say "Written 18 October 2026 · Last revisited 2 November 2026".
 * CI must check out the full history (fetch-depth: 0) for this to be accurate.
 */
function journeyHistory(): Plugin {
  const id = 'virtual:journey-history'
  const resolved = '\0' + id
  return {
    name: 'journey-history',
    resolveId: (source) => (source === id ? resolved : undefined),
    load: (source) => (source === resolved ? `export default ${JSON.stringify(readHistory())}` : undefined),
  }
}

function readHistory() {
  const files: Record<string, { first: string; last: string; commits: number }> = {}
  let began: string | null = null
  try {
    const out = execSync('git log --format=%x1e%aI --name-only -- journey', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
    // git log is newest first: the first date seen is "last", the final one is "first".
    for (const block of out.split('\x1e').filter(Boolean)) {
      const [date, ...names] = block.split('\n').map((s) => s.trim()).filter(Boolean)
      began = date
      for (const name of names) {
        const f = (files[name] ??= { first: date, last: date, commits: 0 })
        f.first = date
        f.commits++
      }
    }
  } catch {
    // Not a Git checkout: dates fall back to front matter.
  }
  return { began, files }
}

export default defineConfig({
  base: './',
  build: { chunkSizeWarningLimit: 800 },
  plugins: [react(), journeyHistory()],
})
