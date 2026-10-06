import { Link } from 'react-router-dom'
import { config } from '../lib/config'
import { journeyBegan, useContent } from '../lib/content'
import { chapterOf, isoDay } from '../lib/dates'

const NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']

export default function HomePage() {
  const { entries } = useContent()
  const began = journeyBegan().slice(0, 7)
  const now = chapterOf(isoDay(), began, config.chapters)
  const first = chapterOf(`${began}-01`, began, config.chapters)

  return (
    <div className="page">
      <section className="cover">
        <p className="kicker">
          {now.label}
          {now.name ? ` · ${now.name}` : ''}
        </p>
        <h1>{config.title}</h1>
        <p className="subtitle">{config.subtitle}</p>
        <p className="began">
          Begun {first.label}
        </p>
      </section>

      <section className="contents" aria-labelledby="contents-h">
        <h2 id="contents-h" className="section-label">
          Contents
        </h2>
        <ol className="toc">
          {config.stages.map((s, i) => {
            const n = entries.filter((e) => e.stage === s.id).length
            return (
              <li key={s.id}>
                <Link to={`/stage/${s.id}`}>
                  <span className="toc-num">{NUMERALS[i]}</span>
                  <span className="toc-title">{s.title}</span>
                  <span className="toc-dots" aria-hidden />
                  <span className="toc-count">{n === 0 ? 'prompts, for now' : n === 1 ? 'one reflection' : `${n} reflections`}</span>
                </Link>
                <p className="toc-intro">{s.intro}</p>
              </li>
            )
          })}
        </ol>
      </section>

      <section className="other-ways">
        <Link to="/time">
          <strong>By time</strong>
          <span>Everything in the order it was written</span>
        </Link>
        <Link to="/people">
          <strong>By person</strong>
          <span>Each of us, and what we wrote together</span>
        </Link>
        <Link to="/notebook">
          <strong>Notebook</strong>
          <span>Journal entries and small experiments</span>
        </Link>
        <Link to="/letters">
          <strong>Letters</strong>
          <span>Written now, to be opened later</span>
        </Link>
      </section>
    </div>
  )
}
