// Unsaved drafts are the one exception to "the repository is the source of
// truth": they protect long reflections until GitHub has them.

const PREFIX = 'journey.draft:'

export interface Draft<T> {
  state: T
  baseSha: string | null
  savedAt: string
}

export function loadDraft<T>(key: string): Draft<T> | null {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw ? (JSON.parse(raw) as Draft<T>) : null
  } catch {
    return null
  }
}

export function saveDraft<T>(key: string, state: T, baseSha: string | null) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ state, baseSha, savedAt: new Date().toISOString() }))
    return true
  } catch {
    return false
  }
}

export function clearDraft(key: string) {
  try {
    localStorage.removeItem(PREFIX + key)
  } catch {
    // Nothing to clear.
  }
}

export function draftKeys(): string[] {
  try {
    return Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .map((k) => k.slice(PREFIX.length))
  } catch {
    return []
  }
}
