import { repo } from './config'

// The token is passed in per call and never logged, stored here, or put in a URL.

const API = 'https://api.github.com'

export class NetworkError extends Error {}
export class ConflictError extends Error {}
export class AccessError extends Error {}

async function request(token: string, path: string, init: RequestInit = {}) {
  let res: Response
  try {
    res = await fetch(API + path, {
      ...init,
      cache: 'no-store',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      },
    })
  } catch {
    throw new NetworkError('offline')
  }
  if (res.status === 401 || res.status === 403) throw new AccessError(String(res.status))
  return res
}

const contentsPath = (path: string) =>
  `/repos/${repo.owner}/${repo.repo}/contents/${path.split('/').map(encodeURIComponent).join('/')}`

function toBase64(text: string) {
  let bin = ''
  for (const b of new TextEncoder().encode(text)) bin += String.fromCharCode(b)
  return btoa(bin)
}

function fromBase64(b64: string) {
  const bin = atob(b64.replace(/\s/g, ''))
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)))
}

export interface RemoteFile {
  sha: string
  content: string
}

/** The current version of a file on the journey branch, or null if it does not exist yet. */
export async function getFile(token: string, path: string): Promise<RemoteFile | null> {
  const res = await request(token, `${contentsPath(path)}?ref=${encodeURIComponent(repo.branch)}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`GitHub responded ${res.status}`)
  const json = await res.json()
  return { sha: json.sha, content: fromBase64(json.content) }
}

/**
 * Creates or updates a file as one commit. `sha` must be the version the
 * writer started from; GitHub refuses the write if the file moved on since.
 */
export async function putFile(token: string, path: string, content: string, message: string, sha: string | null) {
  const res = await request(token, contentsPath(path), {
    method: 'PUT',
    body: JSON.stringify({ message, content: toBase64(content), branch: repo.branch, ...(sha ? { sha } : {}) }),
  })
  if (res.status === 409 || res.status === 422) throw new ConflictError('changed')
  if (!res.ok) throw new Error(`GitHub responded ${res.status}`)
  const json = await res.json()
  return { sha: json.content.sha as string, commit: json.commit.sha as string, url: json.commit.html_url as string }
}

/** Checks a token: who it belongs to and whether it can see and push to the journey. */
export async function verifyToken(token: string) {
  const user = await request(token, '/user')
  if (!user.ok) throw new AccessError(String(user.status))
  const { login } = await user.json()
  const r = await request(token, `/repos/${repo.owner}/${repo.repo}`)
  if (r.status === 404) throw new AccessError('repo')
  if (!r.ok) throw new Error(`GitHub responded ${r.status}`)
  const json = await r.json()
  return { login: login as string, canPush: Boolean(json.permissions?.push) }
}
