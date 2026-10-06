import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { config, nameOf, stageById } from '../lib/config'
import { useContent } from '../lib/content'
import { isoDay, longDate } from '../lib/dates'
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

const emptyForm = (spec: WriteSpec, today: string): Form => ({
  title: '',
  intro: '',
  sections: spec.prompts.map((heading) => ({ heading, text: '' })),
  body: '',
  openOn: defaultOpenOn(today),
  sealed: true,
  note: '',
})

function formFromDoc(spec: WriteSpec, raw: string, today: string): { form: Form; data: FrontMatter } {
  const { data, body } = parseDoc(raw)
  const { intro, sections } = splitSections(body)
  return {
    data,
    form: {
      ...emptyForm(spec, today),
      title: data.title ? String(data.title) : '',
      intro: spec.prompts.length ? intro : '',
      sections: spec.prompts.length ? mergeWithPrompts(spec.prompts, sections) : [],
      body: spec.prompts.length ? '' : body,
      openOn: data.open_on ? String(data.open_on) : defaultOpenOn(today),
      sealed: data.sealed !== false,
    },
  }
}

export default function WritePage() {
  const [params] = useSearchParams()
  const { token, me, canWrite } = useSession()
  const spec = useMemo(() => {
    const path = params.get('path')
    if (path) return specFromPath(path)
    return me ? newSpec((params.get('kind') ?? 'journal') as Kind, me, { stage: params.get('stage') ?? undefined, shared: params.get('shared') === '1' }) : null
  }, [params, me])

  if (!canWrite || !token || !me) return <Navigate to="/connect" replace />
  if (!spec) return <p className="page empty">There is nothing to write here.</p>
  return <Editor key={spec.draftKey} spec={spec} token={token} me={me} />
}

function Editor({ spec: initialSpec, token, me }: { spec: WriteSpec; token: string; me: string }) {
  const navigate = useNavigate()
  const { remember } = useContent()
  const today = isoDay()
  const [spec, setSpec] = useState(initialSpec)
  const [form, setForm] = useState<Form>(() => emptyForm(initialSpec, today))
  const [data, setData] = useState<FrontMatter>({})
  /** The repository version this draft is based on: null means "new file". */
  const [baseSha, setBaseSha] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [restored, setRestored] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
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
        const parsed = formFromDoc(spec, live.content, today)
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
      if (!reached && !draft) setStatus({ kind: 'error', text: 'Could not reach the journey just now. You can still write; it stays on this device until it can be saved.' })
      setLoaded(true)
    })()
    return () => {
      cancelled = true
    }
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
    if (!body.trim()) return setStatus({ kind: 'error', text: 'There is nothing written yet.' })
    if (spec.kind === 'experiment' && !form.title.trim()) return setStatus({ kind: 'error', text: 'Give the experiment a name first.' })
    const path = spec.path ?? experimentPath(today, form.title)
    saveDraft(spec.draftKey, form, baseSha)
    setStatus({ kind: 'saving' })
    const message = commitMessage({ spec, me, isNew, date, title: form.title.trim(), openOn: form.openOn, note: form.note })
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
      setStatus({ kind: 'saved', message, commit: res.commit, url: res.url })
      if (!spec.path) {
        const fixed = specFromPath(path)!
        setSpec(fixed)
        navigate(`/write?path=${encodeURIComponent(path)}`, { replace: true })
      }
    } catch (e) {
      if (e instanceof NetworkError) setStatus({ kind: 'offline' })
      else if (e instanceof ConflictError) {
        const live = await getFile(token, path).catch(() => null)
        setConflict({ latest: live?.content ?? '', latestSha: live?.sha ?? null, reviewing: false })
        setStatus({ kind: 'idle' })
      } else if (e instanceof AccessError)
        setStatus({ kind: 'error', text: 'This device is not allowed to save right now. Your words are kept here; reconnect on the "This device" page.' })
      else setStatus({ kind: 'error', text: 'Saving did not work this time. Your reflection is still saved on this device.' })
    }
  }

  async function copyDraft() {
    const text = spec.prompts.length ? joinSections(form.intro, form.sections) : form.body
    try {
      await navigator.clipboard.writeText(text)
      setStatus({ kind: 'error', text: 'Your draft is copied. It is also still kept on this device.' })
    } catch {
      setStatus({ kind: 'error', text: 'Copying was not allowed by this browser. Your draft is still kept on this device.' })
    }
  }

  if (!loaded) return <p className="page empty">Opening…</p>

  const heading =
    spec.kind === 'session'
      ? spec.scope === 'shared' ? `${stage?.title}, together` : `${stage?.title}, ${nameOf(me)}`
      : spec.scope === 'shared' ? `${spec.heading}, together` : `${spec.heading}, ${nameOf(me)}`

  return (
    <div className="page writing">
      <header className="chapter-head">
        <p className="kicker">{isNew ? 'Writing' : 'Revisiting'}</p>
        <h1>{heading}</h1>
        {spec.kind === 'letter' && <p className="subtitle">A sealed letter is hidden on the website until its day. The words still live in the repository.</p>}
        {!isNew && <p className="subtitle">First written {longDate(date)}</p>}
      </header>

      {restored && (
        <p className="notice soft">Restored your unsaved draft from this device ({longDate(restored)}).</p>
      )}

      {(spec.kind === 'experiment' || spec.kind === 'journal') && (
        <label className="field">
          <span>{spec.kind === 'experiment' ? 'What shall we call this experiment?' : 'A title (optional)'}</span>
          <input value={form.title} onChange={(e) => update({ title: e.target.value })} disabled={spec.kind === 'experiment' && !isNew} />
        </label>
      )}

      {preview ? (
        <div className="leaf">
          <Prose>{body || '_Nothing written yet._'}</Prose>
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
          <span>{spec.kind === 'letter' ? 'Dear future us,' : 'What is on your mind today?'}</span>
          <textarea rows={16} value={form.body} onChange={(e) => update({ body: e.target.value })} />
        </label>
      )}

      {spec.kind === 'letter' && (
        <div className="letter-options">
          <label className="field inline">
            <span>Intended to be opened</span>
            <input type="date" value={form.openOn} min={today} onChange={(e) => update({ openOn: e.target.value })} />
          </label>
          <label className="check">
            <input type="checkbox" checked={form.sealed} onChange={(e) => update({ sealed: e.target.checked })} /> Seal this letter
          </label>
        </div>
      )}

      <label className="field history-line">
        <span>A line for our history (optional)</span>
        <input
          value={form.note}
          placeholder={spec.kind === 'session' ? 'adds thoughts on childhood rules' : ''}
          onChange={(e) => update({ note: e.target.value })}
        />
      </label>

      <div className="save-row">
        <button className="button" onClick={save} disabled={status.kind === 'saving'}>
          {status.kind === 'saving' ? 'Saving…' : 'Save to our journey'}
        </button>
        <button className="button ghost" onClick={() => setPreview((p) => !p)}>
          {preview ? 'Keep writing' : 'Preview'}
        </button>
        <Link className="quiet-action" to={stage ? `/stage/${stage.id}` : spec.kind === 'letter' ? '/letters' : '/notebook'}>
          Back to the book
        </Link>
      </div>

      <div aria-live="polite">
        {status.kind === 'saved' && (
          <div className="notice saved">
            <p>Saved to our journey.</p>
            <details>
              <summary>Details</summary>
              <p>
                {status.message}
                <br />
                <a href={status.url} target="_blank" rel="noreferrer">
                  {status.commit.slice(0, 7)}
                </a>{' '}
                · the public site updates after GitHub Pages rebuilds, usually within a few minutes.
              </p>
            </details>
          </div>
        )}
        {status.kind === 'offline' && (
          <p className="notice">Your reflection is still saved on this device. You can try again when you are online.</p>
        )}
        {status.kind === 'error' && <p className="notice">{status.text}</p>}
      </div>

      {conflict && (
        <div className="dialog-backdrop" role="dialog" aria-modal="true" aria-labelledby="conflict-h">
          <div className="dialog">
            <h2 id="conflict-h">This reflection changed since you opened it.</h2>
            <p>Someone saved a newer version. Nothing has been overwritten, and your draft is safe on this device.</p>
            {conflict.reviewing && (
              <div className="latest">
                <p className="kicker">The latest version</p>
                {conflict.latest ? <Prose>{parseDoc(conflict.latest).body}</Prose> : <p>The file was removed.</p>}
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
                  I have read it — keep my draft as the newer version
                </button>
              </div>
            )}
            <div className="dialog-actions">
              {!conflict.reviewing && (
                <button className="button" onClick={() => setConflict({ ...conflict, reviewing: true })}>
                  Review latest version
                </button>
              )}
              <button className="button ghost" onClick={copyDraft}>
                Copy my draft
              </button>
              <button className="button ghost" onClick={() => setConflict(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
