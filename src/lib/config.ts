import raw from '../../journey/config.json'

export type Lang = 'zh' | 'en'
export const LANGS: Lang[] = ['zh', 'en']

/** A text in config.json: either one string, or { "zh": "…", "en": "…" }. */
export type Localized = string | Partial<Record<Lang, string>>

export const pick = (v: Localized | undefined, lang: Lang): string =>
  v == null ? '' : typeof v === 'string' ? v : (v[lang] ?? v.zh ?? v.en ?? '')

/** Every language version of a text, for matching headings written in either. */
export const variants = (v: Localized): string[] => (typeof v === 'string' ? [v] : Object.values(v).filter(Boolean) as string[])

export interface Person {
  id: string
  name: Localized
  github?: string
}

export interface Stage {
  id: string
  title: Localized
  dir: string
  intro: Localized
  prompts: Localized[]
}

export interface JourneyConfig {
  title: Localized
  subtitle: Localized
  defaultLanguage?: Lang
  began: string
  repository: { owner: string; repo: string; branch: string }
  people: Person[]
  stages: Stage[]
  experimentPrompts: Localized[]
  chapters: Record<string, Localized>
}

export const config = raw as JourneyConfig
export const repo = config.repository
export const repoUrl = `https://github.com/${repo.owner}/${repo.repo}`

export const stageById = (id?: string) => config.stages.find((s) => s.id === id)
export const stageByDir = (dir: string) => config.stages.find((s) => s.dir === dir)

/** Accepts a person id ("person-a") or any version of their name ("知恩", "Zhien"). */
export const personOf = (who?: string) =>
  config.people.find((p) => p.id === who || variants(p.name).some((n) => n.toLowerCase() === who?.toLowerCase()))

export const nameOf = (who: string | undefined, lang: Lang) => {
  const p = personOf(who)
  return p ? pick(p.name, lang) : (who ?? '')
}

export const TOGETHER = 'together'
