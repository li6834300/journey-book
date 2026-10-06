import { Link } from 'react-router-dom'
import { config, nameOf, stageById } from '../lib/config'
import { isClosed, useContent, type Entry } from '../lib/content'
import { isoDay, longDate } from '../lib/dates'
import { useSession } from '../lib/session'
import Prose from './Prose'

export const byline = (e: Entry) =>
  e.scope === 'shared' ? e.authors.map(nameOf).join(' & ') || 'Together' : e.authors.map(nameOf).join(', ')

export function DateLine({ e }: { e: Entry }) {
  const { pending } = useContent()
  return (
    <p className="dateline">
      Written {longDate(e.written)}
      {e.revisited && <> · Last revisited {longDate(e.revisited)}</>}
      {pending.has(e.path) && <span className="pending"> · on its way to the book</span>}
    </p>
  )
}

export function canEdit(e: Entry, me: string | null) {
  return Boolean(me) && (e.scope === 'shared' || e.authors.includes(me!))
}

export function EditLink({ e, label }: { e: Entry; label?: string }) {
  const { canWrite, me } = useSession()
  if (!canWrite || !canEdit(e, me)) return null
  return (
    <Link className="quiet-action" to={`/write?path=${encodeURIComponent(e.path)}`}>
      {label ?? 'Revisit'}
    </Link>
  )
}

export function Seal({ e }: { e: Entry }) {
  return (
    <div className="seal">
      <div className="seal-mark" aria-hidden>
        ✦
      </div>
      <p>Written {longDate(e.written)}</p>
      <p>{e.openOn ? `Intended to be opened ${longDate(e.openOn)}` : 'Sealed until we choose to open it'}</p>
      <p className="seal-by">from {byline(e)}</p>
    </div>
  )
}

/** A whole reflection, laid out as a page of the book. */
export function EntryPage({ e, showStage = true }: { e: Entry; showStage?: boolean }) {
  const closed = isClosed(e, isoDay())
  const stage = stageById(e.stage)
  return (
    <article className="leaf">
      <header>
        {showStage && stage && <p className="kicker">{stage.title}</p>}
        {e.type !== 'session-reflection' && e.type !== 'final-journey' && <h2 className="leaf-title">{e.title}</h2>}
        <p className="byline">{byline(e)}</p>
        {!closed && <DateLine e={e} />}
      </header>
      {closed ? <Seal e={e} /> : <Prose>{e.body}</Prose>}
      <EditLink e={e} label={closed ? 'Revise (opens the seal for you)' : undefined} />
    </article>
  )
}

/** One line in a list: a table-of-contents entry rather than a feed card. */
export function EntryLine({ e }: { e: Entry }) {
  const closed = isClosed(e, isoDay())
  const stage = stageById(e.stage)
  const kind =
    e.type === 'journal' ? 'Journal'
    : e.type === 'experiment' ? 'Experiment'
    : e.type === 'future-letter' ? (closed ? 'Sealed letter' : 'Letter')
    : (stage?.title ?? '')
  const title = e.type === 'session-reflection' || e.type === 'final-journey' ? `${byline(e)} on ${stage?.title}` : e.title
  return (
    <li className="entry-line">
      <Link to={`/read/${e.slug}`}>
        <span className="entry-kind">{kind}</span>
        <span className="entry-title">{title}</span>
        <span className="entry-meta">
          {e.type === 'session-reflection' || e.type === 'final-journey' ? '' : `${byline(e)} · `}
          {longDate(e.written)}
          {closed && e.openOn ? ` · opens ${e.openOn.slice(0, 4)}` : ''}
        </span>
      </Link>
    </li>
  )
}

export const peopleAndTogether = () => [...config.people.map((p) => ({ id: p.id, name: p.name })), { id: 'together', name: 'Together' }]
