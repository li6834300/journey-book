import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { config } from './config'
import { verifyToken } from './github'

// Write access is per device. The token lives only in this browser's storage:
// localStorage when "remember this device" is chosen, otherwise sessionStorage.

const TOKEN = 'journey.token'
const LOGIN = 'journey.login'
const ME = 'journey.me'
const MODE = 'journey.mode'

const read = (key: string) => {
  try {
    return localStorage.getItem(key) ?? sessionStorage.getItem(key)
  } catch {
    return null
  }
}

const write = (key: string, value: string, remember: boolean) => {
  try {
    ;(remember ? localStorage : sessionStorage).setItem(key, value)
  } catch {
    // Storage blocked: access lasts only while this page is open.
  }
}

const remove = (key: string) => {
  try {
    localStorage.removeItem(key)
    sessionStorage.removeItem(key)
  } catch {
    // Nothing stored.
  }
}

interface Session {
  token: string | null
  login: string | null
  me: string | null
  /** Connected and showing "Our writing mode" rather than the reading view. */
  writing: boolean
  canWrite: boolean
  setWriting: (on: boolean) => void
  setMe: (id: string) => void
  connect: (token: string, remember: boolean) => Promise<{ login: string; canPush: boolean }>
  forget: () => void
}

const Ctx = createContext<Session | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(() => read(TOKEN))
  const [login, setLogin] = useState(() => read(LOGIN))
  const [me, setMeState] = useState(() => read(ME))
  const [writing, setWritingState] = useState(() => read(MODE) !== 'reading')

  const setWriting = useCallback((on: boolean) => {
    setWritingState(on)
    write(MODE, on ? 'writing' : 'reading', true)
  }, [])

  const setMe = useCallback((id: string) => {
    setMeState(id)
    write(ME, id, true)
  }, [])

  const connect = useCallback(
    async (candidate: string, remember: boolean) => {
      const result = await verifyToken(candidate)
      if (result.canPush) {
        write(TOKEN, candidate, remember)
        write(LOGIN, result.login, remember)
        setToken(candidate)
        setLogin(result.login)
        setWriting(true)
        const match = config.people.find((p) => p.github && p.github.toLowerCase() === result.login.toLowerCase())
        if (match) setMe(match.id)
      }
      return result
    },
    [setMe, setWriting],
  )

  const forget = useCallback(() => {
    remove(TOKEN)
    remove(LOGIN)
    remove(ME)
    setToken(null)
    setLogin(null)
    setMeState(null)
  }, [])

  const value = useMemo<Session>(
    () => ({
      token,
      login,
      me,
      writing,
      canWrite: Boolean(token && me && writing),
      setWriting,
      setMe,
      connect,
      forget,
    }),
    [token, login, me, writing, setWriting, setMe, connect, forget],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useSession() {
  const s = useContext(Ctx)
  if (!s) throw new Error('useSession outside SessionProvider')
  return s
}
