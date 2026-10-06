import { Link, useParams } from 'react-router-dom'
import { config, stageById, TOGETHER } from '../lib/config'
import { useContent } from '../lib/content'
import { useSession } from '../lib/session'
import { EntryPage, peopleAndTogether } from '../components/Entry'

export default function StagePage() {
  const { id } = useParams()
  const stage = stageById(id)
  const { entries } = useContent()
  const { canWrite, me } = useSession()
  if (!stage) return <p className="page">This part of the journey does not exist.</p>

  const index = config.stages.indexOf(stage)
  const prev = config.stages[index - 1]
  const next = config.stages[index + 1]
  const here = entries.filter((e) => e.stage === stage.id)
  const mine = here.find((e) => e.scope === 'individual' && e.authors.includes(me ?? ''))
  const ours = here.find((e) => e.scope === 'shared')

  return (
    <div className="page">
      <header className="chapter-head">
        <p className="kicker">Stage {index + 1} of {config.stages.length}</p>
        <h1>{stage.title}</h1>
        <p className="subtitle">{stage.intro}</p>
      </header>

      <section className="prompts" aria-label="Prompts">
        {stage.prompts.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </section>

      {canWrite && (
        <div className="write-row">
          {mine ? (
            <Link className="button" to={`/write?path=${encodeURIComponent(mine.path)}`}>
              Revisit my reflection
            </Link>
          ) : (
            <Link className="button" to={`/write?kind=session&stage=${stage.id}`}>
              Write my reflection
            </Link>
          )}
          <Link
            className="button ghost"
            to={ours ? `/write?path=${encodeURIComponent(ours.path)}` : `/write?kind=session&stage=${stage.id}&shared=1`}
          >
            {ours ? 'Revisit what we wrote together' : 'Write together'}
          </Link>
        </div>
      )}

      {here.length === 0 ? (
        <p className="empty">Nothing written here yet. The questions are waiting.</p>
      ) : (
        peopleAndTogether().map(({ id: who }) =>
          here
            .filter((e) => (who === TOGETHER ? e.scope === 'shared' : e.scope === 'individual' && e.authors.includes(who)))
            .map((e) => <EntryPage key={e.path} e={e} showStage={false} />),
        )
      )}

      <nav className="turn">
        {prev ? <Link to={`/stage/${prev.id}`}>← {prev.title}</Link> : <span />}
        {next ? <Link to={`/stage/${next.id}`}>{next.title} →</Link> : <span />}
      </nav>
    </div>
  )
}
