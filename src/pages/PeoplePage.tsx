import { NavLink, useParams } from 'react-router-dom'
import { config, TOGETHER } from '../lib/config'
import { useContent } from '../lib/content'
import { useI18n } from '../lib/i18n'
import { EntryLine, usePeopleAndTogether } from '../components/Entry'

export default function PeoplePage() {
  const { id = config.people[0]?.id } = useParams()
  const { entries } = useContent()
  const { t } = useI18n()
  const people = usePeopleAndTogether()
  const list = entries.filter((e) =>
    id === TOGETHER ? e.scope === 'shared' : e.scope === 'individual' && e.authors.includes(id),
  )
  const name = people.find((p) => p.id === id)?.name ?? id

  return (
    <div className="page">
      <header className="chapter-head">
        <p className="kicker">{t.people.kicker}</p>
        <h1>{name}</h1>
      </header>
      <nav className="tabs">
        {people.map((p) => (
          <NavLink key={p.id} to={`/people/${p.id}`} className={p.id === id ? 'active' : ''}>
            {p.name}
          </NavLink>
        ))}
      </nav>
      {list.length === 0 ? (
        <p className="empty">{t.people.empty}</p>
      ) : (
        <ul className="entry-list">
          {list.map((e) => (
            <EntryLine key={e.path} e={e} />
          ))}
        </ul>
      )}
    </div>
  )
}
