import { config, nameOf, stageById, TOGETHER } from './config'
import { addYears, isoDay } from './dates'

// What is being written, where it lives in the repository, and how its commit reads.

export type Kind = 'session' | 'journal' | 'experiment' | 'letter'

export interface WriteSpec {
  kind: Kind
  stage?: string
  scope: 'individual' | 'shared'
  /** Fixed file path, or null for a new experiment (named from its title on save). */
  path: string | null
  draftKey: string
  prompts: string[]
  heading: string
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'experiment'

export const experimentPath = (date: string, title: string) => `journey/experiments/${date}-${slugify(title)}.md`

export function specFromPath(path: string): WriteSpec | null {
  const rel = path.replace(/^journey\//, '')
  const file = rel.split('/').pop()!.replace(/\.md$/, '')
  const dir = rel.split('/').slice(0, -1).join('/')
  const owner = file.replace(/^\d{4}-\d{2}-\d{2}-/, '')
  const scope = owner === TOGETHER ? 'shared' : 'individual'
  const stage = config.stages.find((s) => s.dir === dir)
  if (stage) return { kind: 'session', stage: stage.id, scope, path, draftKey: path, prompts: stage.prompts, heading: stage.title }
  if (dir === 'journal') return { kind: 'journal', scope, path, draftKey: path, prompts: [], heading: 'Journal' }
  if (dir === 'experiments')
    return { kind: 'experiment', scope: 'shared', path, draftKey: path, prompts: config.experimentPrompts, heading: 'Living experiment' }
  if (dir === 'future-letters') return { kind: 'letter', scope, path, draftKey: path, prompts: [], heading: 'A letter to the future' }
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
  return {
    kind: 'experiment',
    scope: 'shared',
    path: null,
    draftKey: 'new-experiment',
    prompts: config.experimentPrompts,
    heading: 'Living experiment',
  }
}

export const defaultOpenOn = (today: string) => addYears(today, 5)

export function commitMessage(o: {
  spec: WriteSpec
  me: string
  isNew: boolean
  date: string
  title: string
  openOn?: string
  note: string
}): string {
  const name = nameOf(o.me)
  const who = o.spec.scope === 'shared' ? 'together' : name
  const note = o.note.trim().replace(/\s+/g, ' ')
  const stageTitle = stageById(o.spec.stage)?.title ?? ''
  switch (o.spec.kind) {
    case 'session':
      if (note) return `Journey: ${who === 'together' ? 'we' : name} ${note}`
      if (o.spec.stage === 'growing')
        return o.isNew ? `Journey: ${who} looks back on the whole journey` : `Journey: ${who} revisits the final journey`
      if (o.spec.scope === 'shared') return o.isNew ? `Journey: together on ${stageTitle}` : `Journey: we revisit ${stageTitle} together`
      return o.isNew ? `Journey: ${name} reflection on ${stageTitle}` : `Journey: ${name} revisits ${stageTitle}`
    case 'journal':
      return `Journal: ${who} — ${o.date}${note ? ` (${note})` : o.isNew ? '' : ' (revisited)'}`
    case 'experiment':
      if (note) return `Journey: ${note} — ${o.title}`
      return o.isNew ? `Journey: begin living experiment — ${o.title}` : `Journey: update living experiment reflection — ${o.title}`
    case 'letter':
      return o.isNew
        ? `Letter: ${who} writes to ${o.openOn ? o.openOn.slice(0, 4) : 'the future'}`
        : `Letter: ${who} revises a letter to the future`
  }
}
