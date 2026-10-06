import { Link } from 'react-router-dom'
import { useContent } from '../lib/content'
import { useSession } from '../lib/session'
import { EntryLine } from '../components/Entry'

export default function NotebookPage() {
  const { entries } = useContent()
  const { canWrite } = useSession()
  const journal = entries.filter((e) => e.type === 'journal').reverse()
  const experiments = entries.filter((e) => e.type === 'experiment').reverse()

  return (
    <div className="page">
      <header className="chapter-head">
        <p className="kicker">Notebook</p>
        <h1>Between the chapters</h1>
        <p className="subtitle">Small notes from ordinary days, and the things we tried.</p>
      </header>

      {canWrite && (
        <div className="write-row">
          <Link className="button" to="/write?kind=journal">
            Write today's journal
          </Link>
          <Link className="button ghost" to="/write?kind=journal&shared=1">
            A journal entry together
          </Link>
          <Link className="button ghost" to="/write?kind=experiment">
            Begin an experiment
          </Link>
        </div>
      )}

      <section className="season">
        <h2 className="season-label">Experiments</h2>
        {experiments.length ? (
          <ul className="entry-list">{experiments.map((e) => <EntryLine key={e.path} e={e} />)}</ul>
        ) : (
          <p className="empty">No experiments yet.</p>
        )}
      </section>

      <section className="season">
        <h2 className="season-label">Journal</h2>
        {journal.length ? (
          <ul className="entry-list">{journal.map((e) => <EntryLine key={e.path} e={e} />)}</ul>
        ) : (
          <p className="empty">No journal entries yet.</p>
        )}
      </section>
    </div>
  )
}
