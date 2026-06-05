"use client"

import { useState } from "react"
import Image from "next/image"
import { Camera, Film } from "lucide-react"

interface Props {
  initialCoverUrl:      string | null
  initialCoverVideoUrl: string | null
  isOwn:                boolean
}

function pickFile(accept: string, onFile: (file: File) => void) {
  const input = document.createElement("input")
  input.type = "file"
  input.accept = accept
  input.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0"
  document.body.appendChild(input)
  input.onchange = () => {
    const file = input.files?.[0]
    document.body.removeChild(input)
    if (file) onFile(file)
  }
  input.click()
}

export function CoverImage({ initialCoverUrl, initialCoverVideoUrl, isOwn }: Props) {
  const [coverUrl,       setCoverUrl]       = useState(initialCoverUrl)
  const [coverVideoUrl,  setCoverVideoUrl]  = useState(initialCoverVideoUrl)
  const [uploading,      setUploading]      = useState(false)
  const [uploadingVideo, setUploadingVideo] = useState(false)

  const busy = uploading || uploadingVideo

  function handleImagePick(file: File) {
    setUploading(true)
    const form = new FormData()
    form.append("file", file)
    fetch("/api/users/upload-cover", { method: "POST", body: form })
      .then((r) => r.json())
      .then(async (data: { coverUrl?: string }) => {
        if (data.coverUrl) {
          await fetch("/api/users", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ coverImageUrl: data.coverUrl }),
          })
          setCoverUrl(data.coverUrl)
        }
      })
      .finally(() => setUploading(false))
  }

  function handleVideoPick(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      alert("Video must be under 5 MB. Aim for 2-3 MB — keep it 10-15 seconds, H.264/MP4.")
      return
    }
    setUploadingVideo(true)
    const form = new FormData()
    form.append("file", file)
    fetch("/api/users/upload-cover-video", { method: "POST", body: form })
      .then((r) => r.json())
      .then(async (data: { coverUrl?: string }) => {
        if (data.coverUrl) {
          await fetch("/api/users", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ coverVideoUrl: data.coverUrl }),
          })
          setCoverVideoUrl(data.coverUrl)
        }
      })
      .finally(() => setUploadingVideo(false))
  }

  return (
    <div className="relative w-full h-[200px] bg-mist-grey">

      <div className="absolute inset-0 overflow-hidden">
        {coverVideoUrl ? (
          <video
            src={coverVideoUrl}
            autoPlay loop muted playsInline
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : coverUrl ? (
          <Image src={coverUrl} alt="Cover" fill sizes="100vw" className="object-cover" />
        ) : null}
      </div>

      {isOwn && (
        <div className="absolute top-3 right-3 z-10 flex gap-1.5">
          <button
            type="button"
            disabled={busy}
            onClick={() => pickFile("image/jpeg,image/png,image/webp", handleImagePick)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/30 bg-black/40 px-3 py-1.5 font-sans text-xs text-white backdrop-blur transition-colors hover:bg-black/60 disabled:opacity-50"
          >
            <Camera size={12} />
            {uploading ? "Uploading…" : "Photo"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => pickFile("video/mp4", handleVideoPick)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/30 bg-black/40 px-3 py-1.5 font-sans text-xs text-white backdrop-blur transition-colors hover:bg-black/60 disabled:opacity-50"
          >
            <Film size={12} />
            {uploadingVideo ? "Uploading…" : "Video"}
          </button>
        </div>
      )}
    </div>
  )
}
