import { Link } from 'react-router-dom'
import { isClosed, useContent } from '../lib/content'
import { isoDay } from '../lib/dates'
import { useSession } from '../lib/session'
import { EntryLine, Seal } from '../components/Entry'

export default function LettersPage() {
  const { entries } = useContent()
  const { canWrite } = useSession()
  const today = isoDay()
  const letters = entries.filter((e) => e.type === 'future-letter')
  const sealed = letters.filter((e) => isClosed(e, today))
  const open = letters.filter((e) => !isClosed(e, today))

  return (
    <div className="page">
      <header className="chapter-head">
        <p className="kicker">Letters</p>
        <h1>To the people we will be</h1>
        <p className="subtitle">A sealed letter keeps its words to itself until the day it was meant for.</p>
      </header>

      {canWrite && (
        <div className="write-row">
          <Link className="button" to="/write?kind=letter">
            Write a letter to the future
          </Link>
          <Link className="button ghost" to="/write?kind=letter&shared=1">
            Write one together
          </Link>
        </div>
      )}

      {letters.length === 0 && <p className="empty">No letters yet.</p>}
      <div className="seals">
        {sealed.map((e) => (
          <Link key={e.path} to={`/read/${e.slug}`} className="seal-link">
            <Seal e={e} />
          </Link>
        ))}
      </div>
      {open.length > 0 && (
        <section className="season">
          <h2 className="season-label">Opened</h2>
          <ul className="entry-list">{open.map((e) => <EntryLine key={e.path} e={e} />)}</ul>
        </section>
      )}
    </div>
  )
}
