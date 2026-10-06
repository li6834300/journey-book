import { Link } from 'react-router-dom'
import { config, stageById } from '../lib/config'
import { isClosed, useContent, type Entry } from '../lib/content'
import { isoDay } from '../lib/dates'
import { useI18n } from '../lib/i18n'
import { useSession } from '../lib/session'
import Prose from './Prose'

export function useByline() {
  const { t, name } = useI18n()
  return (e: Entry) =>
    e.scope === 'shared' ? e.authors.map(name).join(t.entry.and) || t.people.together : e.authors.map(name).join(', ')
}

export function useEntryTitle() {
  const { t, L } = useI18n()
  return (e: Entry) =>
    e.title ??
    (e.type === 'journal' ? t.entry.defaultTitle.journal
    : e.type === 'future-letter' ? t.entry.defaultTitle.letter
    : e.type === 'experiment' ? t.entry.defaultTitle.experiment
    : L(stageById(e.stage)?.title) || t.entry.defaultTitle.reflection)
}

export function DateLine({ e }: { e: Entry }) {
  const { pending } = useContent()
  const { t, date } = useI18n()
  return (
    <p className="dateline">
      {t.entry.written(date(e.written))}
      {e.revisited && <> · {t.entry.revisited(date(e.revisited))}</>}
      {pending.has(e.path) && <span className="pending"> · {t.entry.pending}</span>}
    </p>
  )
}

export function canEdit(e: Entry, me: string | null) {
  return Boolean(me) && (e.scope === 'shared' || e.authors.includes(me!))
}

export function EditLink({ e, label }: { e: Entry; label?: string }) {
  const { canWrite, me } = useSession()
  const { t } = useI18n()
  if (!canWrite || !canEdit(e, me)) return null
  return (
    <Link className="quiet-action" to={`/write?path=${encodeURIComponent(e.path)}`}>
      {label ?? t.entry.revisit}
    </Link>
  )
}

export function Seal({ e }: { e: Entry }) {
  const { t, date } = useI18n()
  const byline = useByline()
  return (
    <div className="seal">
      <div className="seal-mark" aria-hidden>
        ✦
      </div>
      <p>{t.entry.written(date(e.written))}</p>
      <p>{e.openOn ? t.entry.openOn(date(e.openOn)) : t.entry.sealedNoDate}</p>
      <p className="seal-by">{t.entry.from(byline(e))}</p>
    </div>
  )
}

/** A whole reflection, laid out as a page of the book. */
export function EntryPage({ e, showStage = true }: { e: Entry; showStage?: boolean }) {
  const { t, L } = useI18n()
  const byline = useByline()
  const title = useEntryTitle()
  const closed = isClosed(e, isoDay())
  const stage = stageById(e.stage)
  return (
    <article className="leaf">
      <header>
        {showStage && stage && <p className="kicker">{L(stage.title)}</p>}
        {e.type !== 'session-reflection' && e.type !== 'final-journey' && <h2 className="leaf-title">{title(e)}</h2>}
        <p className="byline">{byline(e)}</p>
        {!closed && <DateLine e={e} />}
      </header>
      {closed ? <Seal e={e} /> : <Prose>{e.body}</Prose>}
      <EditLink e={e} label={closed ? t.entry.reviseSealed : undefined} />
    </article>
  )
}

/** One line in a list: a table-of-contents entry rather than a feed card. */
export function EntryLine({ e }: { e: Entry }) {
  const { t, L, date } = useI18n()
  const byline = useByline()
  const entryTitle = useEntryTitle()
  const closed = isClosed(e, isoDay())
  const stageTitle = L(stageById(e.stage)?.title)
  const isStage = e.type === 'session-reflection' || e.type === 'final-journey'
  const kind =
    e.type === 'journal' ? t.entry.kind.journal
    : e.type === 'experiment' ? t.entry.kind.experiment
    : e.type === 'future-letter' ? (closed ? t.entry.kind.sealed : t.entry.kind.letter)
    : stageTitle
  return (
    <li className="entry-line">
      <Link to={`/read/${e.slug}`}>
        <span className="entry-kind">{kind}</span>
        <span className="entry-title">{isStage ? t.entry.on(byline(e), stageTitle) : entryTitle(e)}</span>
        <span className="entry-meta">
          {isStage ? '' : `${byline(e)} · `}
          {date(e.written)}
          {closed && e.openOn ? ` · ${t.entry.opens(e.openOn.slice(0, 4))}` : ''}
        </span>
      </Link>
    </li>
  )
}

export function usePeopleAndTogether() {
  const { t, L } = useI18n()
  return [...config.people.map((p) => ({ id: p.id, name: L(p.name) })), { id: 'together', name: t.people.together }]
}
