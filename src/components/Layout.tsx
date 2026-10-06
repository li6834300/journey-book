import { useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { config, repoUrl } from '../lib/config'
import { useI18n } from '../lib/i18n'
import { useSession } from '../lib/session'

export default function Layout() {
  const { token, me, writing, setWriting } = useSession()
  const { t, L, name, lang, setLang } = useI18n()
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className={`shell ${token && writing ? 'is-writing' : ''}`}>
      <header className="masthead">
        <Link to="/" className="wordmark">
          {L(config.title)}
        </Link>
        <nav className="nav" aria-label={t.nav.label}>
          <NavLink to="/" end>{t.nav.contents}</NavLink>
          <NavLink to="/time">{t.nav.time}</NavLink>
          <NavLink to="/people">{t.nav.people}</NavLink>
          <NavLink to="/notebook">{t.nav.notebook}</NavLink>
          <NavLink to="/letters">{t.nav.letters}</NavLink>
        </nav>
        <div className="masthead-end">
          {token && (
            <div className="mode" role="group" aria-label={t.mode.label}>
              <button className={!writing ? 'on' : ''} onClick={() => setWriting(false)}>
                {t.mode.reading}
              </button>
              <button className={writing ? 'on' : ''} onClick={() => setWriting(true)}>
                {t.mode.writing}
                {me ? ` · ${name(me)}` : ''}
              </button>
            </div>
          )}
          <button
            className="lang"
            onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
            lang={lang === 'zh' ? 'en' : 'zh-CN'}
            aria-label={lang === 'zh' ? 'Read in English' : '切换到中文'}
          >
            {t.langSwitch}
          </button>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="colophon">
        <p>{t.footer.motto}</p>
        <p>
          <a href={repoUrl} target="_blank" rel="noreferrer">
            {t.footer.repo}
          </a>
          <span aria-hidden> · </span>
          <Link to="/connect">{token ? t.footer.device : t.footer.writingMode}</Link>
        </p>
      </footer>
    </div>
  )
}
