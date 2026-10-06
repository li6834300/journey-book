import { config, nameOf, pick, stageById, TOGETHER, type Lang, type Localized } from './config'
import { addYears, isoDay } from './dates'
import { stringsFor } from './i18n'

// What is being written, where it lives in the repository, and how its commit reads.

export type Kind = 'session' | 'journal' | 'experiment' | 'letter'

export interface WriteSpec {
  kind: Kind
  stage?: string
  scope: 'individual' | 'shared'
  /** Fixed file path, or null for a new experiment (named from its title on save). */
  path: string | null
  draftKey: string
  prompts: Localized[]
}

const slugify = (s: string) => {
  const ascii = s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
  // Chinese titles have no ASCII to slug from: keep them readable in the file name.
  if (ascii.length >= 3) return ascii
  const native = s.trim().replace(/[\\/:*?"<>|#%\s]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 24)
  return native || 'experiment'
}

export const experimentPath = (date: string, title: string) => `journey/experiments/${date}-${slugify(title)}.md`

export function specFromPath(path: string): WriteSpec | null {
  const rel = path.replace(/^journey\//, '')
  const file = rel.split('/').pop()!.replace(/\.md$/, '')
  const dir = rel.split('/').slice(0, -1).join('/')
  const owner = file.replace(/^\d{4}-\d{2}-\d{2}-/, '')
  const scope = owner === TOGETHER ? 'shared' : 'individual'
  const stage = config.stages.find((s) => s.dir === dir)
  if (stage) return { kind: 'session', stage: stage.id, scope, path, draftKey: path, prompts: stage.prompts }
  if (dir === 'journal') return { kind: 'journal', scope, path, draftKey: path, prompts: [] }
  if (dir === 'experiments') return { kind: 'experiment', scope: 'shared', path, draftKey: path, prompts: config.experimentPrompts }
  if (dir === 'future-letters') return { kind: 'letter', scope, path, draftKey: path, prompts: [] }
  return null
}

export function newSpec(kind: Kind, me: string, opts: { stage?: string; shared?: boolean }): WriteSpec | null {
  const who = opts.shared ? TOGETHER : me
  const today = isoDay()
  if (kind === 'session') {
    const stage = stageById(opts.stage)
    return stage ? specFromPath(`journey/${stage.dir}/${who}.md`) : null
  }
  if (kind === 'journal') return specFromPath(`journey/journal/${today}-${who}.md`)
  if (kind === 'letter') return specFromPath(`journey/future-letters/${today}-${who}.md`)
  return { kind: 'experiment', scope: 'shared', path: null, draftKey: 'new-experiment', prompts: config.experimentPrompts }
}

export const defaultOpenOn = (today: string) => addYears(today, 5)

/** A commit message written for people, in the language the writer is using. */
export function commitMessage(o: {
  spec: WriteSpec
  me: string
  lang: Lang
  isNew: boolean
  date: string
  title: string
  openOn?: string
  note: string
}): string {
  const c = stringsFor(o.lang).commit
  const name = nameOf(o.me, o.lang)
  const shared = o.spec.scope === 'shared'
  const who = shared ? c.together : name
  const note = o.note.trim().replace(/\s+/g, ' ')
  const stageTitle = pick(stageById(o.spec.stage)?.title, o.lang)
  switch (o.spec.kind) {
    case 'session':
      if (note) return c.adds(shared ? c.we : name, note)
      if (o.spec.stage === 'growing') return o.isNew ? c.growingNew(who) : c.growingAgain(who)
      if (shared) return o.isNew ? c.togetherNew(stageTitle) : c.togetherAgain(stageTitle)
      return o.isNew ? c.mineNew(name, stageTitle) : c.mineAgain(name, stageTitle)
    case 'journal':
      return c.journal(who, o.date, note ? (o.lang === 'zh' ? `（${note}）` : ` (${note})`) : o.isNew ? '' : c.revisited)
    case 'experiment':
      if (note) return c.experimentNote(note, o.title)
      return o.isNew ? c.experimentNew(o.title) : c.experimentAgain(o.title)
    case 'letter':
      return o.isNew ? c.letterNew(who, o.openOn ? o.openOn.slice(0, 4) : c.future) : c.letterAgain(who)
  }
}
