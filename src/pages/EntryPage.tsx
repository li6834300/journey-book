import { Link, useParams } from 'react-router-dom'
import { stageById } from '../lib/config'
import { useContent } from '../lib/content'
import { useI18n } from '../lib/i18n'
import { EntryPage as Leaf } from '../components/Entry'

export default function EntryPage() {
  const slug = useParams()['*'] ?? ''
  const { entries, bySlug } = useContent()
  const { t, L } = useI18n()
  const e = bySlug(slug)
  if (!e) return <p className="page empty">{t.entry.missing}</p>

  const i = entries.indexOf(e)
  const prev = entries[i - 1]
  const next = entries[i + 1]
  const stage = stageById(e.stage)

  return (
    <div className="page">
      <p className="crumb">
        {stage ? <Link to={`/stage/${stage.id}`}>{L(stage.title)}</Link> : <Link to="/time">{t.time.kicker}</Link>}
      </p>
      <Leaf e={e} />
      <nav className="turn">
        {prev ? <Link to={`/read/${prev.slug}`}>{t.entry.earlier}</Link> : <span />}
        {next ? <Link to={`/read/${next.slug}`}>{t.entry.later}</Link> : <span />}
      </nav>
    </div>
  )
}
