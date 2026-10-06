# 旅程 · The Journey

这个文件夹就是我们的旅程。我们写下的一切都以普通 Markdown 文件保存在这里，
不需要任何软件也能读。网站只是阅读它的一种方式。

- `sessions/`：旅程的各个阶段，每段一个文件夹。`person-a.md` 是知恩写的，`person-b.md` 是启启写的，`together.md` 是两人一起写的
- `journal/`：日记；`experiments/`：生活实验；`final-journey/`：「成长」，回望整条路
- `future-letters/`：写给未来的信。`sealed: true` 的信在网站上会隐藏到 `open_on` 那天。
  **这种封存只是象征性的**：信的原文仍然在这个公开仓库里，这是我们有意的选择

用 `git log --follow -p <文件>` 可以看到一篇反思随时间的变化。

---

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
author: person-a          # person-a = 知恩 Zhien, person-b = 启启 Qiqi
                          # shared: authors: [person-a, person-b]
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
