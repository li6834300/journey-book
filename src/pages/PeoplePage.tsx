import { NavLink, useParams } from 'react-router-dom'
import { config, TOGETHER } from '../lib/config'
import { useContent } from '../lib/content'
import { EntryLine, peopleAndTogether } from '../components/Entry'

export default function PeoplePage() {
  const { id = config.people[0]?.id } = useParams()
  const { entries } = useContent()
  const list = entries.filter((e) =>
    id === TOGETHER ? e.scope === 'shared' : e.scope === 'individual' && e.authors.includes(id),
  )
  const name = peopleAndTogether().find((p) => p.id === id)?.name ?? id

  return (
    <div className="page">
      <header className="chapter-head">
        <p className="kicker">By person</p>
        <h1>{name}</h1>
      </header>
      <nav className="tabs">
        {peopleAndTogether().map((p) => (
          <NavLink key={p.id} to={`/people/${p.id}`} className={({ isActive }) => (isActive || (p.id === id) ? 'active' : '')}>
            {p.name}
          </NavLink>
        ))}
      </nav>
      {list.length === 0 ? (
        <p className="empty">Nothing here yet.</p>
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
