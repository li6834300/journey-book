import { useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { config, nameOf, repoUrl } from '../lib/config'
import { useSession } from '../lib/session'

export default function Layout() {
  const { token, me, writing, setWriting } = useSession()
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className={`shell ${token && writing ? 'is-writing' : ''}`}>
      <header className="masthead">
        <Link to="/" className="wordmark">
          {config.title}
        </Link>
        <nav className="nav" aria-label="Ways to read">
          <NavLink to="/" end>Contents</NavLink>
          <NavLink to="/time">Time</NavLink>
          <NavLink to="/people">People</NavLink>
          <NavLink to="/notebook">Notebook</NavLink>
          <NavLink to="/letters">Letters</NavLink>
        </nav>
        {token && (
          <div className="mode" role="group" aria-label="Mode">
            <button className={!writing ? 'on' : ''} onClick={() => setWriting(false)}>
              Reading
            </button>
            <button className={writing ? 'on' : ''} onClick={() => setWriting(true)}>
              Our writing{me ? ` · ${nameOf(me)}` : ''}
            </button>
          </div>
        )}
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="colophon">
        <p>The website is the experience. The repository is the memory.</p>
        <p>
          <a href={repoUrl} target="_blank" rel="noreferrer">
            The whole journey, with its history
          </a>
          <span aria-hidden> · </span>
          <Link to="/connect">{token ? 'This device' : 'Our writing mode'}</Link>
        </p>
      </footer>
    </div>
  )
}
