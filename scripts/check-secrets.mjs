// Fails the build if anything resembling a GitHub credential reached the bundle.
// The journey is public by choice; write credentials never are.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const patterns = [/github_pat_[A-Za-z0-9_]{20,}/, /\bgh[pousr]_[A-Za-z0-9]{30,}/]
const hits = []
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p)
    else if (patterns.some((re) => re.test(readFileSync(p, 'utf8')))) hits.push(p)
  }
}
walk(process.argv[2] ?? 'dist')
if (hits.length) {
  console.error('Possible GitHub credential found in:', hits.join(', '))
  process.exit(1)
}
console.log('No credentials in the build output.')
