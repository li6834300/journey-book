# Journey Book

A book two people write together, kept in a Git repository and read through a
small website on GitHub Pages.

> The website is the experience. The repository is the memory.

- **`journey/`**: the journey itself. Plain Markdown with YAML front matter,
  readable without this application. See [`journey/README.md`](journey/README.md).
- **Git history**: the second timeline. Every save is one commit, with a
  message written for people, such as `旅程：知恩关于「看见」的反思`.
- **`src/`**: the React + Vite website that reads the journey as a book and,
  for the two of us, writes to it.

## Principles

Public by choice. Human-readable by default. Git-native, not database-dependent.
Cross-device through the repository. Static hosting wherever possible.
**Credentials remain local; reflections do not.**

## How it works

```
Reflection saved in the browser
      ↓  GitHub Contents API (with that device's own token)
Commit on main
      ↓  .github/workflows/deploy.yml
Vite build (journey/**/*.md bundled at build time)
      ↓
GitHub Pages updated (usually within a few minutes)
```

**Reading** needs nothing: the content is compiled into the site at build
time, and the build also reads `git log` for each file to show *Written … ·
Last revisited …*. CI checks out the full history (`fetch-depth: 0`) for this.

**Writing** happens in the browser through the GitHub Contents API:

1. While writing, a draft is kept in this browser's `localStorage`.
2. On save, the current file is fetched from GitHub and its SHA is compared
   with the version the writer started from.
3. If they differ, the editor stops and says *This reflection changed since you
   opened it*, then offers **Review latest version**, **Copy my draft**, or
   **Cancel**. Nothing is overwritten unless the writer has reviewed the newer
   version and chosen to continue. Even then, the older text remains in Git
   history.
4. Otherwise the file is committed with the matching SHA. GitHub also refuses
   the write if the file moved on in the meantime.
5. The local draft is cleared, and the page says *Saved to our journey.*

If the save fails because the device is offline, the draft stays on the
device: *Your reflection is still saved on this device.*

## Content model

| Folder | File | `type` |
|---|---|---|
| `journey/sessions/NN-stage/` | `person-a.md`, `person-b.md`, `together.md` | `session-reflection` |
| `journey/final-journey/` | `person-a.md`, `person-b.md`, `together.md` | `final-journey` (shown as the stage *Growing*) |
| `journey/journal/` | `YYYY-MM-DD-person-a.md` / `-together.md` | `journal` |
| `journey/experiments/` | `YYYY-MM-DD-name.md` | `experiment` |
| `journey/future-letters/` | `YYYY-MM-DD-person-a.md` | `future-letter` |

`scope: individual` or `scope: shared` describes **authorship**, not privacy.
Everything committed here is public.

The stages, their prompts, the people, and the names of chapters in time
(for example `"winter-2026": { "zh": "学着留心", "en": "Learning to notice" }`)
live in [`journey/config.json`](journey/config.json).

## Languages

The interface is in Chinese by default (`"defaultLanguage": "zh"`), with an
EN / 中文 switch in the header that each device remembers. Every text in
`config.json` (stage titles, intros, prompts, names, chapters) can be a plain
string or a `{ "zh": …, "en": … }` pair.

Reflections are never translated. They stay in the language they were
written in. When a reflection is revisited in the other language, headings
already written in either language are recognized and kept as they are.
Commit messages follow the language of the writer's interface, for example
`旅程：知恩关于「看见」的反思` or `Journey: Zhien reflection on Seeing`.

### About sealed letters

A future letter with `sealed: true` is hidden on the website, which shows only
*Written 21 December 2026 · Intended to be opened 21 December 2031*. On its
`open_on` date it opens.

**This is a symbolic seal, not a security feature.** The letter's text sits in
this public repository and its history, readable by anyone who looks at the
files. That is intentional.

## Security: public content, private credentials

The journey content is public. The ability to change it is not.

- Each writer creates a **fine-grained personal access token** limited to
  *only this repository*, with **Contents: Read and write** and nothing else.
- The token is pasted into the *Connect to our journey* screen on each device
  and stored only in that browser (`localStorage` if *Remember on this
  device* is ticked, otherwise `sessionStorage`). It is sent only to
  `api.github.com`, in a header, never in a URL.
- **Forget this device** removes it. No journey content is deleted.
- Tokens are never hard-coded, never put in `VITE_*` environment variables,
  never committed, never logged, and the site has no analytics.
- `npm run check-secrets` runs in CI after the build and fails the deploy if
  anything resembling a GitHub token appears in `dist/`.

Visitors without a token see only the reading interface. Editing controls
do not appear for them.

## Setup

1. Push this folder to a public GitHub repository, and update `repository` in
   `journey/config.json` (owner, repo, branch) to match.
2. In the repository settings, go to **Pages** and set **Source** to
   **GitHub Actions**.
3. Edit `people` in `journey/config.json` (currently 知恩 / Zhien and
   启启 / Qiqi), plus each person's GitHub login. The login is optional; it
   lets the site recognize who is writing.
4. Each writer opens the site, follows *Our writing mode* in the footer, and
   connects with their own token.

Local development:

```bash
npm install
npm run dev
```

## Backup

There is no export or import. The repository is the archive: clone it,
download it as a ZIP, or read its history.
