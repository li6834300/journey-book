import { config } from '../lib/config'
import { journeyBegan, useContent, type Entry } from '../lib/content'
import { chapterOf } from '../lib/dates'
import { EntryLine } from '../components/Entry'

export default function TimelinePage() {
  const { entries } = useContent()
  const began = journeyBegan().slice(0, 7)
  const chapters: { key: string; label: string; name?: string; items: Entry[] }[] = []
  for (const e of entries) {
    const c = chapterOf(e.written, began, config.chapters)
    const last = chapters[chapters.length - 1]
    if (last?.key === c.key) last.items.push(e)
    else chapters.push({ ...c, items: [e] })
  }

  return (
    <div className="page">
      <header className="chapter-head">
        <p className="kicker">By time</p>
        <h1>As it was written</h1>
      </header>
      {chapters.length === 0 && <p className="empty">The first page has not been written yet.</p>}
      {chapters.map((c) => (
        <section key={c.key} className="season">
          <h2 className="season-label">
            {c.label}
            {c.name && <span>{c.name}</span>}
          </h2>
          <ul className="entry-list">
            {c.items.map((e) => (
              <EntryLine key={e.path} e={e} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
