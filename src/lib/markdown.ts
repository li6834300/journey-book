import YAML from 'yaml'

export type FrontMatter = Record<string, unknown>

export function parseDoc(raw: string): { data: FrontMatter; body: string } {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!m) return { data: {}, body: raw }
  let data: FrontMatter = {}
  try {
    data = (YAML.parse(m[1]) as FrontMatter) ?? {}
  } catch {
    // Malformed header: keep the words, lose the metadata.
  }
  return { data, body: m[2].replace(/^\s*\n/, '') }
}

export function serializeDoc(data: FrontMatter, body: string): string {
  const clean = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined && v !== ''))
  return `---\n${YAML.stringify(clean).trimEnd()}\n---\n\n${body.trim()}\n`
}

export interface Section {
  heading: string
  text: string
}

/** Splits a body into the text before the first "## " heading and its sections. */
export function splitSections(body: string): { intro: string; sections: Section[] } {
  const sections: Section[] = []
  const intro: string[] = []
  let current: Section | null = null
  for (const line of body.split('\n')) {
    const h = line.match(/^##\s+(.+?)\s*$/)
    if (h) {
      current = { heading: h[1], text: '' }
      sections.push(current)
    } else if (current) {
      current.text += line + '\n'
    } else {
      intro.push(line)
    }
  }
  for (const s of sections) s.text = s.text.trim()
  return { intro: intro.join('\n').trim(), sections }
}

/**
 * Prompts first, in order, followed by any headings the file already had.
 * Each prompt is given as all its language versions, current language first;
 * a heading already written in any of them keeps its original wording.
 */
export function mergeWithPrompts(prompts: string[][], existing: Section[]): Section[] {
  const used = new Set<Section>()
  const merged = prompts.map((versions) => {
    const found = existing.find((s) => !used.has(s) && versions.includes(s.heading))
    if (found) used.add(found)
    return { heading: found?.heading ?? versions[0], text: found?.text ?? '' }
  })
  for (const s of existing) if (!used.has(s)) merged.push(s)
  return merged
}

export function joinSections(intro: string, sections: Section[]): string {
  const parts = intro.trim() ? [intro.trim()] : []
  for (const s of sections) if (s.text.trim()) parts.push(`## ${s.heading}\n\n${s.text.trim()}`)
  return parts.join('\n\n')
}
