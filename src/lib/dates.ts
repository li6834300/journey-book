import { formatMonth, formatSeason } from './i18n'
import { pick, type Lang, type Localized } from './config'

/** Local calendar date as YYYY-MM-DD. */
export const isoDay = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export const dayOf = (iso: string) => (iso.length === 10 ? iso : isoDay(new Date(iso)))

export const addYears = (iso: string, years: number) => `${Number(iso.slice(0, 4)) + years}${iso.slice(4)}`

/** Seasons, with December belonging to the winter that continues into the new year. */
export function seasonKey(iso: string): string {
  const year = Number(iso.slice(0, 4))
  const month = Number(iso.slice(5, 7))
  const [name, y] =
    month === 12 ? ['winter', year]
    : month <= 2 ? ['winter', year - 1]
    : month <= 5 ? ['spring', year]
    : month <= 8 ? ['summer', year]
    : ['autumn', year]
  return `${name}-${y}`
}

/**
 * The gentle sense of passing time: the first month is its own chapter
 * ("2026年10月 · 开始"), after that the journey moves in seasons.
 * Chapter names come from journey/config.json.
 */
export function chapterOf(day: string, beganMonth: string, names: Record<string, Localized>, lang: Lang) {
  const ym = day.slice(0, 7)
  if (ym <= beganMonth) {
    return {
      key: beganMonth,
      label: formatMonth(beganMonth, lang),
      name: names[beganMonth] ? pick(names[beganMonth], lang) : lang === 'zh' ? '开始' : 'The beginning',
    }
  }
  const key = seasonKey(day)
  return { key, label: formatSeason(key, lang), name: names[key] ? pick(names[key], lang) : undefined }
}
