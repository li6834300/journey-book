import raw from '../../journey/config.json'

export interface Person {
  id: string
  name: string
  github?: string
}

export interface Stage {
  id: string
  title: string
  dir: string
  intro: string
  prompts: string[]
}

export interface JourneyConfig {
  title: string
  subtitle: string
  began: string
  repository: { owner: string; repo: string; branch: string }
  people: Person[]
  stages: Stage[]
  experimentPrompts: string[]
  chapters: Record<string, string>
}

export const config = raw as JourneyConfig
export const repo = config.repository
export const repoUrl = `https://github.com/${repo.owner}/${repo.repo}`

export const stageById = (id?: string) => config.stages.find((s) => s.id === id)
export const stageByDir = (dir: string) => config.stages.find((s) => s.dir === dir)

/** Accepts a person id ("person-a") or display name ("Person A"). */
export const personOf = (who?: string) =>
  config.people.find((p) => p.id === who || p.name.toLowerCase() === who?.toLowerCase())

export const nameOf = (who?: string) => personOf(who)?.name ?? who ?? 'Someone'

export const TOGETHER = 'together'
