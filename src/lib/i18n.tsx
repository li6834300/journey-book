import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { config, nameOf, pick, type Lang, type Localized } from './config'

// The interface speaks Chinese by default, English on request. Reflections
// themselves are never translated: they stay in the words they were written in.

const en = {
  nav: { contents: 'Contents', time: 'Time', people: 'People', notebook: 'Notebook', letters: 'Letters', label: 'Ways to read' },
  mode: { label: 'Mode', reading: 'Reading', writing: 'Our writing' },
  langSwitch: '中文',
  footer: {
    device: 'This device',
    writingMode: 'Our writing mode',
  },
  home: {
    begun: (label: string) => `Begun ${label}`,
    contents: 'Contents',
    count: (n: number) => (n === 0 ? 'prompts, for now' : n === 1 ? 'one reflection' : `${n} reflections`),
    byTime: ['By time', 'Everything in the order it was written'],
    byPerson: ['By person', 'Each of us, and what we wrote together'],
    notebook: ['Notebook', 'Journal entries and small experiments'],
    letters: ['Letters', 'Written now, to be opened later'],
  },
  stage: {
    missing: 'This part of the journey does not exist.',
    of: (i: number, n: number) => `Stage ${i} of ${n}`,
    prompts: 'Prompts',
    writeMine: 'Write my reflection',
    revisitMine: 'Revisit my reflection',
    writeTogether: 'Write together',
    revisitTogether: 'Revisit what we wrote together',
    empty: 'Nothing written here yet. The questions are waiting.',
  },
  time: { kicker: 'By time', title: 'As it was written', empty: 'The first page has not been written yet.' },
  people: { kicker: 'By person', together: 'Together', empty: 'Nothing here yet.' },
  notebook: {
    kicker: 'Notebook',
    title: 'Between the chapters',
    subtitle: 'Small notes from ordinary days, and the things we tried.',
    writeJournal: "Write today's journal",
    journalTogether: 'A journal entry together',
    beginExperiment: 'Begin an experiment',
    experiments: 'Experiments',
    noExperiments: 'No experiments yet.',
    journal: 'Journal',
    noJournal: 'No journal entries yet.',
  },
  letters: {
    kicker: 'Letters',
    title: 'To the people we will be',
    subtitle: 'A sealed letter keeps its words to itself until the day it was meant for.',
    write: 'Write a letter to the future',
    together: 'Write one together',
    empty: 'No letters yet.',
    opened: 'Opened',
  },
  entry: {
    missing: 'This page is not in the book (yet). If it was just written, it will appear after the site refreshes.',
    earlier: '← earlier',
    later: 'later →',
    written: (d: string) => `Written ${d}`,
    revisited: (d: string) => `Last revisited ${d}`,
    pending: 'on its way to the book',
    revisit: 'Revisit',
    reviseSealed: 'Revise (opens the seal for you)',
    openOn: (d: string) => `Intended to be opened ${d}`,
    sealedNoDate: 'Sealed until we choose to open it',
    from: (who: string) => `from ${who}`,
    on: (who: string, stage: string) => `${who} on ${stage}`,
    opens: (y: string) => `opens ${y}`,
    and: ' & ',
    kind: { journal: 'Journal', experiment: 'Experiment', sealed: 'Sealed letter', letter: 'Letter' },
    defaultTitle: { journal: 'Journal', letter: 'A letter to the future', experiment: 'An experiment', reflection: 'Reflection' },
  },
  connect: {
    kicker: 'Our writing mode',
    title: 'Connect to our journey',
    intro: 'Anyone can read this book. To save reflections into our journey repository from this device, connect your GitHub account.',
    steps: [
      ['Open ', 'GitHub → Settings → Fine-grained tokens → Generate new token', '.'],
      ['Under Repository access, choose Only select repositories and pick ', '', ', and nothing else.'],
      ['Under Repository permissions, set Contents to Read and write. Leave every other permission off.'],
      ['Generate the token, copy it, and paste it below.'],
    ],
    tokenLabel: 'GitHub access token',
    remember: 'Remember on this device',
    connect: 'Connect',
    checking: 'Checking…',
    privacy:
      'The token stays in this browser only. It is never written into the journey, never sent anywhere except GitHub, and you can remove it at any time with Forget this device. Each device connects separately.',
    cannotWrite: (login: string) => `That access belongs to ${login}, but it cannot write to our journey.`,
    offline: 'This device seems to be offline. Try again when you are connected.',
    cannotSee: (r: string) => `That access cannot see ${r}.`,
    rejected: 'GitHub did not accept that access token.',
    deviceKicker: 'This device',
    connected: 'Connected to our journey',
    signedIn: (login: string) => `Signed in to GitHub as ${login}.`,
    who: 'Who is writing on this device?',
    signedAs: (name: string) => `Reflections written here will be signed ${name}.`,
    forget: 'Forget this device',
    forgetNote: 'Removes the access stored in this browser. Nothing in the journey is deleted.',
    draftsStay: (n: number) => (n === 1 ? ' One unsaved draft stays on this device.' : ` ${n} unsaved drafts stay on this device.`),
  },
  write: {
    nothing: 'There is nothing to write here.',
    opening: 'Opening…',
    writing: 'Writing',
    revisiting: 'Revisiting',
    heading: (what: string, who: string) => `${what}, ${who}`,
    together: 'together',
    journal: 'Journal',
    experiment: 'Living experiment',
    letter: 'A letter to the future',
    letterNote: 'A sealed letter is hidden on the website until its day. The words still live in the repository.',
    firstWritten: (d: string) => `First written ${d}`,
    restored: (d: string) => `Restored your unsaved draft from this device (${d}).`,
    experimentName: 'What shall we call this experiment?',
    titleOptional: 'A title (optional)',
    nothingYet: '_Nothing written yet._',
    dear: 'Dear future us,',
    onMind: 'What is on your mind today?',
    openOn: 'Intended to be opened',
    seal: 'Seal this letter',
    historyLine: 'A line for our history (optional)',
    historyPlaceholder: 'adds thoughts on childhood rules',
    save: 'Save to our journey',
    saving: 'Saving…',
    preview: 'Preview',
    keepWriting: 'Keep writing',
    back: 'Back to the book',
    saved: 'Saved to our journey.',
    details: 'Details',
    rebuild: 'the public site updates after GitHub Pages rebuilds, usually within a few minutes.',
    offline: 'Your reflection is still saved on this device. You can try again when you are online.',
    unreachable: 'Could not reach the journey just now. You can still write; it stays on this device until it can be saved.',
    empty: 'There is nothing written yet.',
    needName: 'Give the experiment a name first.',
    noAccess: 'This device is not allowed to save right now. Your words are kept here; reconnect on the "This device" page.',
    failed: 'Saving did not work this time. Your reflection is still saved on this device.',
    copied: 'Your draft is copied. It is also still kept on this device.',
    copyBlocked: 'Copying was not allowed by this browser. Your draft is still kept on this device.',
    conflictTitle: 'This reflection changed since you opened it.',
    conflictBody: 'Someone saved a newer version. Nothing has been overwritten, and your draft is safe on this device.',
    latest: 'The latest version',
    removed: 'The file was removed.',
    keepMine: 'I have read it — keep my draft as the newer version',
    review: 'Review latest version',
    copy: 'Copy my draft',
    cancel: 'Cancel',
  },
  commit: {
    adds: (who: string, note: string) => `Journey: ${who} ${note}`,
    we: 'we',
    growingNew: (who: string) => `Journey: ${who} looks back on the whole journey`,
    growingAgain: (who: string) => `Journey: ${who} revisits the final journey`,
    togetherNew: (s: string) => `Journey: together on ${s}`,
    togetherAgain: (s: string) => `Journey: we revisit ${s} together`,
    mineNew: (who: string, s: string) => `Journey: ${who} reflection on ${s}`,
    mineAgain: (who: string, s: string) => `Journey: ${who} revisits ${s}`,
    journal: (who: string, d: string, extra: string) => `Journal: ${who} — ${d}${extra}`,
    revisited: ' (revisited)',
    experimentNote: (note: string, t: string) => `Journey: ${note} — ${t}`,
    experimentNew: (t: string) => `Journey: begin living experiment — ${t}`,
    experimentAgain: (t: string) => `Journey: update living experiment reflection — ${t}`,
    letterNew: (who: string, y: string) => `Letter: ${who} writes to ${y}`,
    letterAgain: (who: string) => `Letter: ${who} revises a letter to the future`,
    future: 'the future',
    together: 'together',
  },
}

export type Strings = typeof en

const zh: Strings = {
  nav: { contents: '目录', time: '时间', people: '人', notebook: '笔记', letters: '信', label: '阅读方式' },
  mode: { label: '模式', reading: '阅读', writing: '我们的书写' },
  langSwitch: 'EN',
  footer: {
    device: '这台设备',
    writingMode: '我们的书写模式',
  },
  home: {
    begun: (label) => `始于${label}`,
    contents: '目录',
    count: (n) => (n === 0 ? '暂时只有问题' : `${n} 篇反思`),
    byTime: ['按时间', '按写下的先后，读全部'],
    byPerson: ['按人', '我们各自写的，和一起写的'],
    notebook: ['笔记', '日记，和那些小小的实验'],
    letters: ['信', '现在写下，将来再打开'],
  },
  stage: {
    missing: '旅程里没有这一段。',
    of: (i, n) => `第 ${i} 段，共 ${n} 段`,
    prompts: '问题',
    writeMine: '写下我的反思',
    revisitMine: '重读并修改我的反思',
    writeTogether: '一起写',
    revisitTogether: '重读我们一起写的',
    empty: '这里还没有人写。问题在等着。',
  },
  time: { kicker: '按时间', title: '按写下的顺序', empty: '第一页还没有写。' },
  people: { kicker: '按人', together: '一起', empty: '这里还什么都没有。' },
  notebook: {
    kicker: '笔记',
    title: '章节之间',
    subtitle: '平常日子里的小记录，和我们试过的事。',
    writeJournal: '写今天的日记',
    journalTogether: '一起写一篇日记',
    beginExperiment: '开始一个实验',
    experiments: '实验',
    noExperiments: '还没有实验。',
    journal: '日记',
    noJournal: '还没有日记。',
  },
  letters: {
    kicker: '信',
    title: '写给将来的我们',
    subtitle: '封存的信，在约定的那天之前不会打开。',
    write: '写一封给未来的信',
    together: '一起写一封',
    empty: '还没有信。',
    opened: '已打开',
  },
  entry: {
    missing: '书里（还）没有这一页。如果刚刚写完，网站更新后就会出现。',
    earlier: '← 更早',
    later: '更晚 →',
    written: (d) => `写于 ${d}`,
    revisited: (d) => `最近一次重读修改 ${d}`,
    pending: '正在写进书里',
    revisit: '重读并修改',
    reviseSealed: '修改（会为你拆开这封信）',
    openOn: (d) => `约定于 ${d} 打开`,
    sealedNoDate: '封存着，等我们决定何时打开',
    from: (who) => `来自 ${who}`,
    on: (who, stage) => `${who} · ${stage}`,
    opens: (y) => `${y} 年打开`,
    and: '与',
    kind: { journal: '日记', experiment: '实验', sealed: '封存的信', letter: '信' },
    defaultTitle: { journal: '日记', letter: '一封给未来的信', experiment: '一个实验', reflection: '反思' },
  },
  connect: {
    kicker: '我们的书写模式',
    title: '连接到我们的旅程',
    intro: '任何人都可以读这本书。要在这台设备上把反思保存进我们的旅程仓库，请连接你的 GitHub 账号。',
    steps: [
      ['打开 ', 'GitHub → Settings → Fine-grained tokens → Generate new token', '。'],
      ['在 Repository access 中选择 Only select repositories，只勾选 ', '', '，不选其他仓库。'],
      ['在 Repository permissions 中，把 Contents 设为 Read and write，其他权限一律不开。'],
      ['生成 token，复制，粘贴到下面。'],
    ],
    tokenLabel: 'GitHub 访问令牌（token）',
    remember: '在这台设备上记住',
    connect: '连接',
    checking: '正在确认…',
    privacy:
      'token 只保存在这个浏览器里。它不会写进旅程，除了 GitHub 不会发往任何地方，你随时可以用「忘记这台设备」把它删掉。每台设备需要分别连接。',
    cannotWrite: (login) => `这个令牌属于 ${login}，但它没有写入我们旅程的权限。`,
    offline: '这台设备好像没有联网。联网后再试一次。',
    cannotSee: (r) => `这个令牌看不到 ${r}。`,
    rejected: 'GitHub 没有接受这个令牌。',
    deviceKicker: '这台设备',
    connected: '已连接到我们的旅程',
    signedIn: (login) => `已用 GitHub 账号 ${login} 登录。`,
    who: '谁在这台设备上写？',
    signedAs: (name) => `在这里写下的反思，署名为${name}。`,
    forget: '忘记这台设备',
    forgetNote: '删除这个浏览器里保存的访问权限。旅程里的内容不会被删除。',
    draftsStay: (n) => `还有 ${n} 份未保存的草稿会留在这台设备上。`,
  },
  write: {
    nothing: '这里没有可以写的东西。',
    opening: '正在打开…',
    writing: '正在写',
    revisiting: '重读与修改',
    heading: (what, who) => `${what} · ${who}`,
    together: '一起',
    journal: '日记',
    experiment: '生活实验',
    letter: '给未来的信',
    letterNote: '封存的信在约定的日子之前不会在网站上显示，但文字仍然保存在仓库里。',
    firstWritten: (d) => `初次写于 ${d}`,
    restored: (d) => `已恢复这台设备上未保存的草稿（${d}）。`,
    experimentName: '这个实验叫什么？',
    titleOptional: '标题（可不填）',
    nothingYet: '_还什么都没写。_',
    dear: '亲爱的未来的我们：',
    onMind: '今天在想什么？',
    openOn: '约定打开的日子',
    seal: '封存这封信',
    historyLine: '给历史留一句话（可不填）',
    historyPlaceholder: '补充了关于童年规则的想法',
    save: '保存到我们的旅程',
    saving: '正在保存…',
    preview: '预览',
    keepWriting: '继续写',
    back: '回到书里',
    saved: '已保存到我们的旅程。',
    details: '详情',
    rebuild: 'GitHub Pages 重新构建后公开网站就会更新，通常几分钟内。',
    offline: '你的反思还保存在这台设备上。联网后可以再试一次。',
    unreachable: '暂时连不上旅程仓库。你仍然可以写，内容会留在这台设备上，等能保存时再保存。',
    empty: '还什么都没写。',
    needName: '先给这个实验起个名字。',
    noAccess: '这台设备现在没有保存的权限。你写的字都还在这里；请到「这台设备」页面重新连接。',
    failed: '这次没有保存成功。你的反思还保存在这台设备上。',
    copied: '草稿已复制，这台设备上也还留着一份。',
    copyBlocked: '这个浏览器不允许复制。草稿仍然保存在这台设备上。',
    conflictTitle: '你打开之后，这篇反思被改过了。',
    conflictBody: '有人保存了更新的版本。没有任何内容被覆盖，你的草稿安全地留在这台设备上。',
    latest: '最新版本',
    removed: '这个文件已被删除。',
    keepMine: '我已经读过了，以我的草稿为新版本',
    review: '查看最新版本',
    copy: '复制我的草稿',
    cancel: '取消',
  },
  commit: {
    adds: (who, note) => `旅程：${who}${note}`,
    we: '我们',
    growingNew: (who) => `旅程：${who}回望整段旅程`,
    growingAgain: (who) => `旅程：${who}重读终章`,
    togetherNew: (s) => `旅程：一起写「${s}」`,
    togetherAgain: (s) => `旅程：一起重读「${s}」`,
    mineNew: (who, s) => `旅程：${who}关于「${s}」的反思`,
    mineAgain: (who, s) => `旅程：${who}重读「${s}」`,
    journal: (who, d, extra) => `日记：${who} — ${d}${extra}`,
    revisited: '（重读）',
    experimentNote: (note, t) => `旅程：${note} — ${t}`,
    experimentNew: (t) => `旅程：开始生活实验 — ${t}`,
    experimentAgain: (t) => `旅程：更新生活实验的反思 — ${t}`,
    letterNew: (who, y) => `信：${who}写给 ${y}`,
    letterAgain: (who) => `信：${who}修改一封给未来的信`,
    future: '未来',
    together: '我们一起',
  },
}

const STRINGS: Record<Lang, Strings> = { zh, en }
const KEY = 'journey.lang'

const initial = (): Lang => {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'zh' || saved === 'en') return saved
  } catch {
    // Storage blocked: use the default.
  }
  return config.defaultLanguage ?? 'zh'
}

interface I18n {
  lang: Lang
  setLang: (l: Lang) => void
  t: Strings
  /** Picks this language's version of a config text. */
  L: (v: Localized | undefined) => string
  name: (who?: string) => string
  /** "18 October 2026" / "2026年10月18日" */
  date: (iso: string) => string
}

const Ctx = createContext<I18n | null>(null)

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export const formatDate = (iso: string, lang: Lang) => {
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso)
  return lang === 'zh'
    ? `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
    : `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

export const formatMonth = (ym: string, lang: Lang) =>
  lang === 'zh' ? `${ym.slice(0, 4)}年${Number(ym.slice(5, 7))}月` : `${MONTHS[Number(ym.slice(5, 7)) - 1]} ${ym.slice(0, 4)}`

const SEASONS: Record<string, Record<Lang, string>> = {
  winter: { zh: '冬', en: 'Winter' },
  spring: { zh: '春', en: 'Spring' },
  summer: { zh: '夏', en: 'Summer' },
  autumn: { zh: '秋', en: 'Autumn' },
}

/** "winter-2026" -> "2026年冬" / "Winter 2026" */
export const formatSeason = (key: string, lang: Lang) => {
  const [season, year] = key.split('-')
  return lang === 'zh' ? `${year}年${SEASONS[season].zh}` : `${SEASONS[season].en} ${year}`
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initial)
  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    try {
      localStorage.setItem(KEY, l)
    } catch {
      // Remembered only for this visit.
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en'
    document.title = pick(config.title, lang)
  }, [lang])

  const value = useMemo<I18n>(
    () => ({
      lang,
      setLang,
      t: STRINGS[lang],
      L: (v) => pick(v, lang),
      name: (who) => nameOf(who, lang),
      date: (iso) => formatDate(iso, lang),
    }),
    [lang, setLang],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useI18n() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useI18n outside I18nProvider')
  return c
}

export const stringsFor = (lang: Lang) => STRINGS[lang]
