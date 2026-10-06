/// <reference types="vite/client" />

declare module 'virtual:journey-history' {
  const history: {
    began: string | null
    files: Record<string, { first: string; last: string; commits: number }>
  }
  export default history
}
