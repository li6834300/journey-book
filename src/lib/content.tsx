import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import history from 'virtual:journey-history'
import { config, personOf, stageByDir, stageById, TOGETHER } from './config'
import { dayOf } from './dates'
import { parseDoc, type FrontMatter } from './markdown'

// Journey content is bundled at build time from journey/**/*.md.
const bundled = Object.fromEntries(
  Object.entries(
    import.meta.glob('../../journey/**/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>,
  )
    .map(([k, v]) => [k.replace(/^(\.\.\/)+/, ''), v] as const)
    .filter(([k]) => k !== 'journey/README.md'),
)

export type EntryType = 'session-reflection' | 'journal' | 'experiment' | 'final-journey' | 'future-letter'

export interface Entry {
  path: string
  /** URL slug: the path without "journey/" and ".md". */
  slug: string
  type: EntryType
  data: FrontMatter
  body: string
  /** Title from front matter, if any; otherwise the interface names it. */
  title?: string
  authors: string[]
  scope: 'individual' | 'shared'
  stage?: string
  /** First written (front matter date, else first commit). */
  written: string
  /** Last time the file changed after it was first written, if it did. */
  revisited?: string
  sealed: boolean
  openOn?: string
}

const TYPES: EntryType[] = ['session-reflection', 'journal', 'experiment', 'final-journey', 'future-letter']

const typeFromPath = (path: string): EntryType | undefined => {
  if (path.startsWith('journey/sessions/')) return 'session-reflection'
  if (path.startsWith('journey/final-journey/')) return 'final-journey'
  if (path.startsWith('journey/journal/')) return 'journal'
  if (path.startsWith('journey/experiments/')) return 'experiment'
  if (path.startsWith('journey/future-letters/')) return 'future-letter'
}

const str = (v: unknown) => (v instanceof Date ? v.toISOString().slice(0, 10) : v == null ? undefined : String(v))

export function toEntry(path: string, raw: string, override?: { first?: string; last?: string }): Entry | null {
  const { data, body } = parseDoc(raw)
  const declared = str(data.type) as EntryType | undefined
  const type = declared && TYPES.includes(declared) ? declared : typeFromPath(path)
  if (!type) return null
  const file = path.split('/').pop()!.replace(/\.md$/, '')
  const dir = path.replace(/^journey\//, '').split('/').slice(0, -1).join('/')

  const listed = Array.isArray(data.authors) ? data.authors.map(String) : data.author ? [String(data.author)] : []
  const fromName = file.replace(/^\d{4}-\d{2}-\d{2}-/, '')
  const authors = (listed.length ? listed : fromName === TOGETHER ? config.people.map((p) => p.id) : [fromName]).map(
    (a) => personOf(a)?.id ?? a,
  )
  const scope = data.scope === 'shared' || data.scope === 'individual' ? data.scope : authors.length > 1 ? 'shared' : 'individual'

  const stage = type === 'final-journey' ? 'growing' : (stageById(str(data.session))?.id ?? stageByDir(dir)?.id)
  const git = history.files[path]
  const first = override?.first ?? git?.first
  const last = override?.last ?? git?.last
  const written = str(data.date) ?? (first ? dayOf(first) : file.slice(0, 10))
  const lastDay = str(data.updated) ?? (last && git && git.commits > 1 ? dayOf(last) : undefined)
  const revisited = lastDay && lastDay > written ? lastDay : undefined

  const title = str(data.title)

  return {
    path,
    slug: path.replace(/^journey\//, '').replace(/\.md$/, ''),
    type,
    data,
    body,
    title,
    authors,
    scope,
    stage,
    written,
    revisited,
    sealed: data.sealed === true,
    openOn: str(data.open_on),
  }
}

/** A sealed letter stays closed on the website until its opening day. */
export const isClosed = (e: Entry, today: string) => e.type === 'future-letter' && e.sealed && (!e.openOn || today < e.openOn)

interface Content {
  entries: Entry[]
  bySlug: (slug: string) => Entry | undefined
  /** Shows a just-saved file right away, before GitHub Pages has rebuilt. */
  remember: (path: string, raw: string) => void
  pending: Set<string>
}

const Ctx = createContext<Content | null>(null)

export function ContentProvider({ children }: { children: ReactNode }) {
  const [recent, setRecent] = useState<Record<string, { raw: string; at: string }>>({})

  const remember = useCallback((path: string, raw: string) => {
    setRecent((r) => ({ ...r, [path]: { raw, at: new Date().toISOString() } }))
  }, [])

  const value = useMemo<Content>(() => {
    const files: Record<string, string> = { ...bundled }
    for (const [p, r] of Object.entries(recent)) files[p] = r.raw
    const entries = Object.entries(files)
      .map(([p, raw]) => {
        const r = recent[p]
        return toEntry(p, raw, r ? { first: history.files[p]?.first ?? r.at, last: r.at } : undefined)
      })
      .filter((e): e is Entry => e !== null)
      .sort((a, b) => a.written.localeCompare(b.written) || a.path.localeCompare(b.path))
    return {
      entries,
      bySlug: (slug) => entries.find((e) => e.slug === slug),
      remember,
      pending: new Set(Object.keys(recent)),
    }
  }, [recent, remember])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useContent() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useContent outside ContentProvider')
  return c
}

export const journeyBegan = () => (history.began ? dayOf(history.began) : `${config.began}-01`)
