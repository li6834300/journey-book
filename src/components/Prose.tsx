import Markdown from 'react-markdown'

/** Renders reflection Markdown. Raw HTML in files is ignored, never injected. */
export default function Prose({ children }: { children: string }) {
  return (
    <div className="prose">
      <Markdown>{children}</Markdown>
    </div>
  )
}
