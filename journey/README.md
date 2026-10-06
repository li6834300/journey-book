# The Journey

This folder is our journey. Everything we write lives here as plain Markdown,
readable without any software. The website is only a way to read it.

```
journey/
├── config.json          the stages, their prompts, and who we are
├── sessions/            one folder per stage of the journey
│   └── 01-seeing/
│       ├── person-a.md  an individual reflection
│       ├── person-b.md
│       └── together.md  a reflection we wrote together
├── journal/             YYYY-MM-DD-<who>.md: small daily notes
├── experiments/         YYYY-MM-DD-<name>.md: things we tried
├── final-journey/       "Growing": looking back over the whole road
└── future-letters/      YYYY-MM-DD-<who>.md: letters to our future selves
```

Every file starts with a small header (YAML front matter):

```yaml
---
author: person-a          # or: authors: [person-a, person-b]
scope: individual         # individual or shared: authorship, not privacy
date: 2026-10-18          # when it was first written
session: seeing           # for stage reflections
type: session-reflection  # session-reflection, journal, experiment,
                          # final-journey, future-letter
---
```

The Git history of this folder is the second timeline of the journey:

```bash
git log --follow -p journey/sessions/01-seeing/person-a.md
```

shows how one reflection changed over time.

**About sealed letters:** a letter in `future-letters/` with `sealed: true` is
hidden on the website until its `open_on` date. That seal is symbolic. The text
is still here in the repository, by choice.
