import { useState, type FormEvent } from 'react'
import { config, repo, repoUrl } from '../lib/config'
import { draftKeys } from '../lib/drafts'
import { AccessError, NetworkError } from '../lib/github'
import { useI18n } from '../lib/i18n'
import { useSession } from '../lib/session'

export default function ConnectPage() {
  const { token, login, me, setMe, connect, forget } = useSession()
  const { t, L, name } = useI18n()
  const c = t.connect
  const [value, setValue] = useState('')
  const [remember, setRemember] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const repoName = `${repo.owner}/${repo.repo}`

  async function submit(ev: FormEvent) {
    ev.preventDefault()
    setBusy(true)
    setMessage(null)
    try {
      const r = await connect(value.trim(), remember)
      setMessage(r.canPush ? null : c.cannotWrite(r.login))
    } catch (e) {
      setMessage(
        e instanceof NetworkError ? c.offline
        : e instanceof AccessError && e.message === 'repo' ? c.cannotSee(repoName)
        : c.rejected,
      )
    } finally {
      setValue('')
      setBusy(false)
    }
  }

  if (token) {
    const drafts = draftKeys().length
    return (
      <div className="page narrow">
        <header className="chapter-head">
          <p className="kicker">{c.deviceKicker}</p>
          <h1>{c.connected}</h1>
          <p className="subtitle">{c.signedIn(login ?? '')}</p>
        </header>
        <fieldset className="who">
          <legend>{c.who}</legend>
          {config.people.map((p) => (
            <label key={p.id}>
              <input type="radio" name="me" checked={me === p.id} onChange={() => setMe(p.id)} /> {L(p.name)}
            </label>
          ))}
        </fieldset>
        {me && <p className="note">{c.signedAs(name(me))}</p>}
        <div className="forget">
          <button className="button ghost" onClick={forget}>
            {c.forget}
          </button>
          <p className="note">
            {c.forgetNote}
            {drafts > 0 && c.draftsStay(drafts)}
          </p>
        </div>
      </div>
    )
  }

  const [s1, s2, s3, s4] = c.steps
  return (
    <div className="page narrow">
      <header className="chapter-head">
        <p className="kicker">{c.kicker}</p>
        <h1>{c.title}</h1>
        <p className="subtitle">{c.intro}</p>
      </header>

      <ol className="steps">
        <li>
          {s1[0]}
          <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noreferrer">
            {s1[1]}
          </a>
          {s1[2]}
        </li>
        <li>
          {s2[0]}
          <a href={repoUrl} target="_blank" rel="noreferrer">
            {repoName}
          </a>
          {s2[2]}
        </li>
        <li>{s3[0]}</li>
        <li>{s4[0]}</li>
      </ol>

      <form className="connect" onSubmit={submit}>
        <label>
          {c.tokenLabel}
          <input
            type="password"
            autoComplete="off"
            spellCheck={false}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="github_pat_…"
            required
          />
        </label>
        <label className="check">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> {c.remember}
        </label>
        <button className="button" disabled={busy || !value.trim()}>
          {busy ? c.checking : c.connect}
        </button>
        {message && <p className="notice">{message}</p>}
      </form>

      <p className="note">{c.privacy}</p>
    </div>
  )
}
