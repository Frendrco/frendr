import React from "react"

interface Props { body: string }

// Safe inline markdown renderer — no dangerouslySetInnerHTML
export function MarkdownBody({ body }: Props) {
  const lines = body.split("\n")

  return (
    <div className="mt-5 flex flex-col gap-2">
      {lines.map((line, i) => (
        <p key={i} className="font-sans text-sm text-foreground/80 leading-relaxed">
          {parseLine(line)}
        </p>
      ))}
    </div>
  )
}

function parseLine(line: string): React.ReactNode[] {
  // Pattern order matters: bold before italic to avoid partial matches
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g
  const parts = line.split(pattern)

  return parts.map((part, i) => {
    const bold = part.match(/^\*\*([^*]+)\*\*$/)
    if (bold) return <strong key={i} className="font-semibold text-foreground">{bold[1]}</strong>

    const italic = part.match(/^\*([^*]+)\*$/)
    if (italic) return <em key={i}>{italic[1]}</em>

    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (link) {
      const href = link[2].startsWith("http") ? link[2] : `https://${link[2]}`
      return (
        <a key={i} href={href} target="_blank" rel="noopener noreferrer"
          className="underline underline-offset-2 hover:opacity-70 transition-opacity">
          {link[1]}
        </a>
      )
    }

    return part
  })
}
