import { Link } from 'react-router-dom'
import { config } from '../lib/config'
import { journeyBegan, useContent } from '../lib/content'
import { chapterOf, isoDay } from '../lib/dates'
import { useI18n } from '../lib/i18n'

const NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']

export default function HomePage() {
  const { entries } = useContent()
  const { t, L, lang } = useI18n()
  const began = journeyBegan().slice(0, 7)
  const now = chapterOf(isoDay(), began, config.chapters, lang)
  const first = chapterOf(`${began}-01`, began, config.chapters, lang)
  const ways: [string, string[]][] = [
    ['/time', t.home.byTime],
    ['/people', t.home.byPerson],
    ['/notebook', t.home.notebook],
    ['/letters', t.home.letters],
  ]

  return (
    <div className="page">
      <section className="cover">
        <p className="kicker">
          {now.label}
          {now.name ? ` · ${now.name}` : ''}
        </p>
        <h1>{L(config.title)}</h1>
        <p className="subtitle">{L(config.subtitle)}</p>
        <p className="began">{t.home.begun(first.label)}</p>
      </section>

      <section className="contents" aria-labelledby="contents-h">
        <h2 id="contents-h" className="section-label">
          {t.home.contents}
        </h2>
        <ol className="toc">
          {config.stages.map((s, i) => {
            const n = entries.filter((e) => e.stage === s.id).length
            return (
              <li key={s.id}>
                <Link to={`/stage/${s.id}`}>
                  <span className="toc-num">{NUMERALS[i]}</span>
                  <span className="toc-title">{L(s.title)}</span>
                  <span className="toc-dots" aria-hidden />
                  <span className="toc-count">{t.home.count(n)}</span>
                </Link>
                <p className="toc-intro">{L(s.intro)}</p>
              </li>
            )
          })}
        </ol>
      </section>

      <section className="other-ways">
        {ways.map(([to, [title, desc]]) => (
          <Link key={to} to={to}>
            <strong>{title}</strong>
            <span>{desc}</span>
          </Link>
        ))}
      </section>
    </div>
  )
}
