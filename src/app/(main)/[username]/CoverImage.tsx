"use client"

import { useRef, useState } from "react"
import { Camera } from "lucide-react"

interface Props {
  initialCoverUrl: string | null
  isOwn: boolean
}

export function CoverImage({ initialCoverUrl, isOwn }: Props) {
  const [coverUrl, setCoverUrl]   = useState(initialCoverUrl)
  const [uploading, setUploading] = useState(false)
  const inputRef                  = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const form = new FormData()
    form.append("file", file)
    const res  = await fetch("/api/users/upload-cover", { method: "POST", body: form })
    const data = await res.json() as { coverUrl?: string }
    if (data.coverUrl) {
      await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coverImageUrl: data.coverUrl }),
      })
      setCoverUrl(data.coverUrl)
    }
    setUploading(false)
    e.target.value = ""
  }

  return (
    <div className="relative w-full h-[200px] overflow-hidden bg-mist-grey">
      {coverUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={coverUrl} alt="Cover" className="h-full w-full object-cover" />
      )}

      {isOwn && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFile}
          />
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-lg border border-white/30 bg-black/40 px-3 py-1.5 font-sans text-xs text-white backdrop-blur transition-colors hover:bg-black/60 disabled:opacity-50"
          >
            <Camera size={12} />
            {uploading ? "Uploading…" : "Edit cover"}
          </button>
        </>
      )}
    </div>
  )
}
