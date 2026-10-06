import { Link } from 'react-router-dom'
import { useContent } from '../lib/content'
import { useI18n } from '../lib/i18n'
import { useSession } from '../lib/session'
import { EntryLine } from '../components/Entry'

export default function NotebookPage() {
  const { entries } = useContent()
  const { canWrite } = useSession()
  const { t } = useI18n()
  const journal = entries.filter((e) => e.type === 'journal').reverse()
  const experiments = entries.filter((e) => e.type === 'experiment').reverse()

  return (
    <div className="page">
      <header className="chapter-head">
        <p className="kicker">{t.notebook.kicker}</p>
        <h1>{t.notebook.title}</h1>
        <p className="subtitle">{t.notebook.subtitle}</p>
      </header>

      {canWrite && (
        <div className="write-row">
          <Link className="button" to="/write?kind=journal">
            {t.notebook.writeJournal}
          </Link>
          <Link className="button ghost" to="/write?kind=journal&shared=1">
            {t.notebook.journalTogether}
          </Link>
          <Link className="button ghost" to="/write?kind=experiment">
            {t.notebook.beginExperiment}
          </Link>
        </div>
      )}

      <section className="season">
        <h2 className="season-label">{t.notebook.experiments}</h2>
        {experiments.length ? (
          <ul className="entry-list">{experiments.map((e) => <EntryLine key={e.path} e={e} />)}</ul>
        ) : (
          <p className="empty">{t.notebook.noExperiments}</p>
        )}
      </section>

      <section className="season">
        <h2 className="season-label">{t.notebook.journal}</h2>
        {journal.length ? (
          <ul className="entry-list">{journal.map((e) => <EntryLine key={e.path} e={e} />)}</ul>
        ) : (
          <p className="empty">{t.notebook.noJournal}</p>
        )}
      </section>
    </div>
  )
}
