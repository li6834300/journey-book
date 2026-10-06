import { useState, type FormEvent } from 'react'
import { config, nameOf, repo, repoUrl } from '../lib/config'
import { draftKeys } from '../lib/drafts'
import { AccessError, NetworkError } from '../lib/github'
import { useSession } from '../lib/session'

export default function ConnectPage() {
  const { token, login, me, setMe, connect, forget } = useSession()
  const [value, setValue] = useState('')
  const [remember, setRemember] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function submit(ev: FormEvent) {
    ev.preventDefault()
    setBusy(true)
    setMessage(null)
    try {
      const r = await connect(value.trim(), remember)
      setMessage(r.canPush ? null : `That access belongs to ${r.login}, but it cannot write to our journey.`)
    } catch (e) {
      setMessage(
        e instanceof NetworkError ? 'This device seems to be offline. Try again when you are connected.'
        : e instanceof AccessError && e.message === 'repo' ? `That access cannot see ${repo.owner}/${repo.repo}.`
        : 'GitHub did not accept that access token.',
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
          <p className="kicker">This device</p>
          <h1>Connected to our journey</h1>
          <p className="subtitle">Signed in to GitHub as {login}.</p>
        </header>
        <fieldset className="who">
          <legend>Who is writing on this device?</legend>
          {config.people.map((p) => (
            <label key={p.id}>
              <input type="radio" name="me" checked={me === p.id} onChange={() => setMe(p.id)} /> {p.name}
            </label>
          ))}
        </fieldset>
        {me && <p className="note">Reflections written here will be signed {nameOf(me)}.</p>}
        <div className="forget">
          <button className="button ghost" onClick={forget}>
            Forget this device
          </button>
          <p className="note">
            Removes the access stored in this browser. Nothing in the journey is deleted.
            {drafts > 0 && ` ${drafts === 1 ? 'One unsaved draft stays' : `${drafts} unsaved drafts stay`} on this device.`}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="page narrow">
      <header className="chapter-head">
        <p className="kicker">Our writing mode</p>
        <h1>Connect to our journey</h1>
        <p className="subtitle">
          Anyone can read this book. To save reflections into our journey repository from this device, connect your GitHub account.
        </p>
      </header>

      <ol className="steps">
        <li>
          Open{' '}
          <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noreferrer">
            GitHub → Settings → Fine-grained tokens → Generate new token
          </a>
          .
        </li>
        <li>
          Under <em>Repository access</em>, choose <em>Only select repositories</em> and pick{' '}
          <a href={repoUrl} target="_blank" rel="noreferrer">
            {repo.owner}/{repo.repo}
          </a>
          , and nothing else.
        </li>
        <li>
          Under <em>Repository permissions</em>, set <em>Contents</em> to <em>Read and write</em>. Leave every other permission off.
        </li>
        <li>Generate the token, copy it, and paste it below.</li>
      </ol>

      <form className="connect" onSubmit={submit}>
        <label>
          GitHub access token
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
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Remember on this device
        </label>
        <button className="button" disabled={busy || !value.trim()}>
          {busy ? 'Checking…' : 'Connect'}
        </button>
        {message && <p className="notice">{message}</p>}
      </form>

      <p className="note">
        The token stays in this browser only. It is never written into the journey, never sent anywhere except GitHub, and
        you can remove it at any time with <em>Forget this device</em>. Each device connects separately.
      </p>
    </div>
  )
}
