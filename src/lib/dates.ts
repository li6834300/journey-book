const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const asDate = (iso: string) => new Date(iso.length === 10 ? `${iso}T12:00:00` : iso)

/** "18 October 2026" */
export const longDate = (iso: string) => {
  const d = asDate(iso)
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

/** Local calendar date as YYYY-MM-DD. */
export const isoDay = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export const dayOf = (iso: string) => (iso.length === 10 ? iso : isoDay(asDate(iso)))

export const addYears = (iso: string, years: number) => `${Number(iso.slice(0, 4)) + years}${iso.slice(4)}`

/** "2026-10" -> "October 2026" */
export const monthLabel = (ym: string) => `${MONTHS[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}`

/** Seasons, with December belonging to the winter that continues into the new year. */
export function seasonOf(iso: string): { key: string; label: string } {
  const year = Number(iso.slice(0, 4))
  const month = Number(iso.slice(5, 7))
  const [name, y] =
    month === 12 ? ['Winter', year]
    : month <= 2 ? ['Winter', year - 1]
    : month <= 5 ? ['Spring', year]
    : month <= 8 ? ['Summer', year]
    : ['Autumn', year]
  return { key: `${name.toLowerCase()}-${y}`, label: `${name} ${y}` }
}

/**
 * The gentle sense of passing time: the first month is its own chapter
 * ("October 2026 · The beginning"), after that the journey moves in seasons.
 * Chapter names come from journey/config.json.
 */
export function chapterOf(day: string, beganMonth: string, names: Record<string, string>) {
  const ym = day.slice(0, 7)
  if (ym <= beganMonth) return { key: beganMonth, label: monthLabel(beganMonth), name: names[beganMonth] ?? 'The beginning' }
  const s = seasonOf(day)
  return { key: s.key, label: s.label, name: names[s.key] }
}
