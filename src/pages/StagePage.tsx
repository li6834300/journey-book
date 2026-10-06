import { Link, useParams } from 'react-router-dom'
import { config, stageById, TOGETHER } from '../lib/config'
import { useContent } from '../lib/content'
import { useI18n } from '../lib/i18n'
import { useSession } from '../lib/session'
import { EntryPage, usePeopleAndTogether } from '../components/Entry'

export default function StagePage() {
  const { id } = useParams()
  const stage = stageById(id)
  const { entries } = useContent()
  const { canWrite, me } = useSession()
  const { t, L } = useI18n()
  const people = usePeopleAndTogether()
  if (!stage) return <p className="page">{t.stage.missing}</p>

  const index = config.stages.indexOf(stage)
  const prev = config.stages[index - 1]
  const next = config.stages[index + 1]
  const here = entries.filter((e) => e.stage === stage.id)
  const mine = here.find((e) => e.scope === 'individual' && e.authors.includes(me ?? ''))
  const ours = here.find((e) => e.scope === 'shared')

  return (
    <div className="page">
      <header className="chapter-head">
        <p className="kicker">{t.stage.of(index + 1, config.stages.length)}</p>
        <h1>{L(stage.title)}</h1>
        <p className="subtitle">{L(stage.intro)}</p>
      </header>

      <section className="prompts" aria-label={t.stage.prompts}>
        {stage.prompts.map((p) => (
          <p key={L(p)}>{L(p)}</p>
        ))}
      </section>

      {canWrite && (
        <div className="write-row">
          {mine ? (
            <Link className="button" to={`/write?path=${encodeURIComponent(mine.path)}`}>
              {t.stage.revisitMine}
            </Link>
          ) : (
            <Link className="button" to={`/write?kind=session&stage=${stage.id}`}>
              {t.stage.writeMine}
            </Link>
          )}
          <Link
            className="button ghost"
            to={ours ? `/write?path=${encodeURIComponent(ours.path)}` : `/write?kind=session&stage=${stage.id}&shared=1`}
          >
            {ours ? t.stage.revisitTogether : t.stage.writeTogether}
          </Link>
        </div>
      )}

      {here.length === 0 ? (
        <p className="empty">{t.stage.empty}</p>
      ) : (
        people.map(({ id: who }) =>
          here
            .filter((e) => (who === TOGETHER ? e.scope === 'shared' : e.scope === 'individual' && e.authors.includes(who)))
            .map((e) => <EntryPage key={e.path} e={e} showStage={false} />),
        )
      )}

      <nav className="turn">
        {prev ? <Link to={`/stage/${prev.id}`}>← {L(prev.title)}</Link> : <span />}
        {next ? <Link to={`/stage/${next.id}`}>{L(next.title)} →</Link> : <span />}
      </nav>
    </div>
  )
}
