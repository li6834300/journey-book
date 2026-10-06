import { Link, useParams } from 'react-router-dom'
import { stageById } from '../lib/config'
import { useContent } from '../lib/content'
import { EntryPage as Leaf } from '../components/Entry'

export default function EntryPage() {
  const slug = useParams()['*'] ?? ''
  const { entries, bySlug } = useContent()
  const e = bySlug(slug)
  if (!e) return <p className="page empty">This page is not in the book (yet). If it was just written, it will appear after the site refreshes.</p>

  const i = entries.indexOf(e)
  const prev = entries[i - 1]
  const next = entries[i + 1]
  const stage = stageById(e.stage)

  return (
    <div className="page">
      <p className="crumb">
        {stage ? <Link to={`/stage/${stage.id}`}>{stage.title}</Link> : <Link to="/time">By time</Link>}
      </p>
      <Leaf e={e} />
      <nav className="turn">
        {prev ? <Link to={`/read/${prev.slug}`}>← earlier</Link> : <span />}
        {next ? <Link to={`/read/${next.slug}`}>later →</Link> : <span />}
      </nav>
    </div>
  )
}
