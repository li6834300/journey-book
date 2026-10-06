import { HashRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import { ContentProvider } from './lib/content'
import { I18nProvider } from './lib/i18n'
import { SessionProvider } from './lib/session'
import ConnectPage from './pages/ConnectPage'
import EntryPage from './pages/EntryPage'
import HomePage from './pages/HomePage'
import LettersPage from './pages/LettersPage'
import NotebookPage from './pages/NotebookPage'
import PeoplePage from './pages/PeoplePage'
import StagePage from './pages/StagePage'
import TimelinePage from './pages/TimelinePage'
import WritePage from './pages/WritePage'

// Hash routing keeps every page reachable on GitHub Pages without a server.
export default function App() {
  return (
    <I18nProvider>
      <SessionProvider>
        <ContentProvider>
          <HashRouter>
            <Routes>
              <Route element={<Layout />}>
                <Route index element={<HomePage />} />
                <Route path="stage/:id" element={<StagePage />} />
                <Route path="time" element={<TimelinePage />} />
                <Route path="people/:id?" element={<PeoplePage />} />
                <Route path="notebook" element={<NotebookPage />} />
                <Route path="letters" element={<LettersPage />} />
                <Route path="read/*" element={<EntryPage />} />
                <Route path="connect" element={<ConnectPage />} />
                <Route path="write" element={<WritePage />} />
                <Route path="*" element={<HomePage />} />
              </Route>
            </Routes>
          </HashRouter>
        </ContentProvider>
      </SessionProvider>
    </I18nProvider>
  )
}
