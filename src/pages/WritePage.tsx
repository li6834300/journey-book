import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { config, pick, stageById, variants, type Lang } from '../lib/config'
import { useContent } from '../lib/content'
import { isoDay } from '../lib/dates'
import { useI18n } from '../lib/i18n'
import { clearDraft, loadDraft, saveDraft } from '../lib/drafts'
import { AccessError, ConflictError, getFile, NetworkError, putFile } from '../lib/github'
import { commitMessage, defaultOpenOn, experimentPath, newSpec, specFromPath, type Kind, type WriteSpec } from '../lib/kinds'
import { joinSections, mergeWithPrompts, parseDoc, serializeDoc, splitSections, type FrontMatter, type Section } from '../lib/markdown'
import { useSession } from '../lib/session'
import Prose from '../components/Prose'

interface Form {
  title: string
  intro: string
  sections: Section[]
  body: string
  openOn: string
  sealed: boolean
  note: string
}

type Status =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'saved'; message: string; commit: string; url: string }
  | { kind: 'offline' }
  | { kind: 'error'; text: string }

interface Conflict {
  latest: string
  latestSha: string | null
  reviewing: boolean
}

const promptVersions = (spec: WriteSpec, lang: Lang) =>
  spec.prompts.map((p) => {
    const own = pick(p, lang)
    return [own, ...variants(p).filter((v) => v !== own)]
  })

const emptyForm = (spec: WriteSpec, today: string, lang: Lang): Form => ({
  title: '',
  intro: '',
  sections: spec.prompts.map((p) => ({ heading: pick(p, lang), text: '' })),
  body: '',
  openOn: defaultOpenOn(today),
  sealed: true,
  note: '',
})

function formFromDoc(spec: WriteSpec, raw: string, today: string, lang: Lang): { form: Form; data: FrontMatter } {
  const { data, body } = parseDoc(raw)
  const { intro, sections } = splitSections(body)
  return {
    data,
    form: {
      ...emptyForm(spec, today, lang),
      title: data.title ? String(data.title) : '',
      intro: spec.prompts.length ? intro : '',
      sections: spec.prompts.length ? mergeWithPrompts(promptVersions(spec, lang), sections) : [],
      body: spec.prompts.length ? '' : body,
      openOn: data.open_on ? String(data.open_on) : defaultOpenOn(today),
      sealed: data.sealed !== false,
    },
  }
}

export default function WritePage() {
  const [params] = useSearchParams()
  const { token, me, canWrite } = useSession()
  const { t } = useI18n()
  const spec = useMemo(() => {
    const path = params.get('path')
    if (path) return specFromPath(path)
    return me ? newSpec((params.get('kind') ?? 'journal') as Kind, me, { stage: params.get('stage') ?? undefined, shared: params.get('shared') === '1' }) : null
  }, [params, me])

  if (!canWrite || !token || !me) return <Navigate to="/connect" replace />
  if (!spec) return <p className="page empty">{t.write.nothing}</p>
  return <Editor key={spec.draftKey} spec={spec} token={token} me={me} />
}

function Editor({ spec: initialSpec, token, me }: { spec: WriteSpec; token: string; me: string }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { remember } = useContent()
  const { t, L, lang, name, date: fmt } = useI18n()
  const w = t.write
  const today = isoDay()
  const spec = initialSpec
  const [form, setForm] = useState<Form>(() => emptyForm(initialSpec, today, lang))
  const [data, setData] = useState<FrontMatter>({})
  /** The repository version this draft is based on: null means "new file". */
  const [baseSha, setBaseSha] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [restored, setRestored] = useState<string | null>(null)
  // A new experiment gets its file name on first save; the editor reopens on that path and keeps the confirmation.
  const [status, setStatus] = useState<Status>(() => (location.state as { saved?: Status } | null)?.saved ?? { kind: 'idle' })
  const [conflict, setConflict] = useState<Conflict | null>(null)
  const [preview, setPreview] = useState(false)
  const dirty = useRef(false)

  // Load the live file from GitHub (the build may be minutes behind), then any local draft.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      let live: Awaited<ReturnType<typeof getFile>> = null
      let reached = true
      try {
        if (spec.path) live = await getFile(token, spec.path)
      } catch {
        reached = false
      }
      if (cancelled) return
      if (live) {
        const parsed = formFromDoc(spec, live.content, today, lang)
        setForm(parsed.form)
        setData(parsed.data)
        setBaseSha(live.sha)
      }
      const draft = loadDraft<Form>(spec.draftKey)
      if (draft) {
        setForm(draft.state)
        setBaseSha(draft.baseSha)
        setRestored(draft.savedAt)
        dirty.current = true
      }
      if (!reached && !draft) setStatus({ kind: 'error', text: w.unreachable })
      setLoaded(true)
    })()
    return () => {
      cancelled = true
    }
    // Language is read once when opening; switching it must not reload the draft.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec, token, today])

  // Keep a local draft while writing, so nothing is lost before it reaches GitHub.
  useEffect(() => {
    if (!loaded || !dirty.current) return
    const t = setTimeout(() => saveDraft(spec.draftKey, form, baseSha), 500)
    return () => clearTimeout(t)
  }, [form, baseSha, loaded, spec.draftKey])

  const update = (patch: Partial<Form>) => {
    dirty.current = true
    setForm((f) => ({ ...f, ...patch }))
    if (status.kind === 'saved') setStatus({ kind: 'idle' })
  }

  const isNew = baseSha === null
  const stage = stageById(spec.stage)
  const body = spec.prompts.length ? joinSections(form.intro, form.sections) : form.body
  const date = String(data.date ?? (spec.path?.match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? today))

  function compose(): string {
    const authors = spec.scope === 'shared' ? config.people.map((p) => p.id) : undefined
    const front: FrontMatter = {
      ...(spec.scope === 'shared' ? { authors } : { author: data.author ?? me }),
      date,
      ...(isNew ? {} : { updated: today }),
      ...(spec.kind === 'session' && spec.stage !== 'growing' ? { session: spec.stage } : {}),
      type:
        spec.kind === 'session' ? (spec.stage === 'growing' ? 'final-journey' : 'session-reflection')
        : spec.kind === 'letter' ? 'future-letter'
        : spec.kind,
      scope: spec.scope,
      ...(spec.kind === 'experiment' || spec.kind === 'journal' ? { title: form.title.trim() || undefined } : {}),
      ...(spec.kind === 'letter' ? { sealed: form.sealed, open_on: form.openOn } : {}),
    }
    // Keep any fields we don't manage (added by hand in the repository).
    const known = new Set(['author', 'authors', 'date', 'updated', 'session', 'type', 'scope', 'title', 'sealed', 'open_on'])
    for (const [k, v] of Object.entries(data)) if (!known.has(k)) front[k] = v
    return serializeDoc(front, body)
  }

  async function save() {
    if (!body.trim()) return setStatus({ kind: 'error', text: w.empty })
    if (spec.kind === 'experiment' && !form.title.trim()) return setStatus({ kind: 'error', text: w.needName })
    const path = spec.path ?? experimentPath(today, form.title)
    saveDraft(spec.draftKey, form, baseSha)
    setStatus({ kind: 'saving' })
    const message = commitMessage({ spec, me, lang, isNew, date, title: form.title.trim(), openOn: form.openOn, note: form.note })
    try {
      const live = await getFile(token, path)
      if ((live?.sha ?? null) !== baseSha) {
        setConflict({ latest: live?.content ?? '', latestSha: live?.sha ?? null, reviewing: false })
        return setStatus({ kind: 'idle' })
      }
      const doc = compose()
      const res = await putFile(token, path, doc, message, baseSha)
      clearDraft(spec.draftKey)
      dirty.current = false
      setBaseSha(res.sha)
      setRestored(null)
      remember(path, doc)
      setForm((f) => ({ ...f, note: '' }))
      const saved: Status = { kind: 'saved', message, commit: res.commit, url: res.url }
      setStatus(saved)
      if (!spec.path) navigate(`/write?path=${encodeURIComponent(path)}`, { replace: true, state: { saved } })
    } catch (e) {
      if (e instanceof NetworkError) setStatus({ kind: 'offline' })
      else if (e instanceof ConflictError) {
        const live = await getFile(token, path).catch(() => null)
        setConflict({ latest: live?.content ?? '', latestSha: live?.sha ?? null, reviewing: false })
        setStatus({ kind: 'idle' })
      } else if (e instanceof AccessError)
        setStatus({ kind: 'error', text: w.noAccess })
      else setStatus({ kind: 'error', text: w.failed })
    }
  }

  async function copyDraft() {
    const text = spec.prompts.length ? joinSections(form.intro, form.sections) : form.body
    try {
      await navigator.clipboard.writeText(text)
      setStatus({ kind: 'error', text: w.copied })
    } catch {
      setStatus({ kind: 'error', text: w.copyBlocked })
    }
  }

  if (!loaded) return <p className="page empty">{w.opening}</p>

  const what = spec.kind === 'session' ? L(stage?.title) : spec.kind === 'journal' ? w.journal : spec.kind === 'letter' ? w.letter : w.experiment
  const heading = w.heading(what, spec.scope === 'shared' ? w.together : name(me))

  return (
    <div className="page writing">
      <header className="chapter-head">
        <p className="kicker">{isNew ? w.writing : w.revisiting}</p>
        <h1>{heading}</h1>
        {spec.kind === 'letter' && <p className="subtitle">{w.letterNote}</p>}
        {!isNew && <p className="subtitle">{w.firstWritten(fmt(date))}</p>}
      </header>

      {restored && (
        <p className="notice soft">{w.restored(fmt(restored))}</p>
      )}

      {(spec.kind === 'experiment' || spec.kind === 'journal') && (
        <label className="field">
          <span>{spec.kind === 'experiment' ? w.experimentName : w.titleOptional}</span>
          <input value={form.title} onChange={(e) => update({ title: e.target.value })} disabled={spec.kind === 'experiment' && !isNew} />
        </label>
      )}

      {preview ? (
        <div className="leaf">
          <Prose>{body || w.nothingYet}</Prose>
        </div>
      ) : spec.prompts.length ? (
        <>
          {form.sections.map((s, i) => (
            <label className="field prompt" key={s.heading}>
              <span>{s.heading}</span>
              <textarea
                rows={7}
                value={s.text}
                onChange={(e) => update({ sections: form.sections.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)) })}
              />
            </label>
          ))}
        </>
      ) : (
        <label className="field">
          <span>{spec.kind === 'letter' ? w.dear : w.onMind}</span>
          <textarea rows={16} value={form.body} onChange={(e) => update({ body: e.target.value })} />
        </label>
      )}

      {spec.kind === 'letter' && (
        <div className="letter-options">
          <label className="field inline">
            <span>{w.openOn}</span>
            <input type="date" value={form.openOn} min={today} onChange={(e) => update({ openOn: e.target.value })} />
          </label>
          <label className="check">
            <input type="checkbox" checked={form.sealed} onChange={(e) => update({ sealed: e.target.checked })} /> {w.seal}
          </label>
        </div>
      )}

      <label className="field history-line">
        <span>{w.historyLine}</span>
        <input
          value={form.note}
          placeholder={spec.kind === 'session' ? w.historyPlaceholder : ''}
          onChange={(e) => update({ note: e.target.value })}
        />
      </label>

      <div className="save-row">
        <button className="button" onClick={save} disabled={status.kind === 'saving'}>
          {status.kind === 'saving' ? w.saving : w.save}
        </button>
        <button className="button ghost" onClick={() => setPreview((p) => !p)}>
          {preview ? w.keepWriting : w.preview}
        </button>
        <Link className="quiet-action" to={stage ? `/stage/${stage.id}` : spec.kind === 'letter' ? '/letters' : '/notebook'}>
          {w.back}
        </Link>
      </div>

      <div aria-live="polite">
        {status.kind === 'saved' && (
          <div className="notice saved">
            <p>{w.saved}</p>
            <details>
              <summary>{w.details}</summary>
              <p>
                {status.message}
                <br />
                <a href={status.url} target="_blank" rel="noreferrer">
                  {status.commit.slice(0, 7)}
                </a>{' '}
                · {w.rebuild}
              </p>
            </details>
          </div>
        )}
        {status.kind === 'offline' && (
          <p className="notice">{w.offline}</p>
        )}
        {status.kind === 'error' && <p className="notice">{status.text}</p>}
      </div>

      {conflict && (
        <div className="dialog-backdrop" role="dialog" aria-modal="true" aria-labelledby="conflict-h">
          <div className="dialog">
            <h2 id="conflict-h">{w.conflictTitle}</h2>
            <p>{w.conflictBody}</p>
            {conflict.reviewing && (
              <div className="latest">
                <p className="kicker">{w.latest}</p>
                {conflict.latest ? <Prose>{parseDoc(conflict.latest).body}</Prose> : <p>{w.removed}</p>}
                <button
                  className="button ghost"
                  onClick={() => {
                    // An explicit, informed choice: continue from the latest version.
                    // The other version remains in the Git history either way.
                    setBaseSha(conflict.latestSha)
                    if (conflict.latest) setData(parseDoc(conflict.latest).data)
                    dirty.current = true
                    setConflict(null)
                  }}
                >
                  {w.keepMine}
                </button>
              </div>
            )}
            <div className="dialog-actions">
              {!conflict.reviewing && (
                <button className="button" onClick={() => setConflict({ ...conflict, reviewing: true })}>
                  {w.review}
                </button>
              )}
              <button className="button ghost" onClick={copyDraft}>
                {w.copy}
              </button>
              <button className="button ghost" onClick={() => setConflict(null)}>
                {w.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
