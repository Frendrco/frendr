"use client"

import { useState } from "react"
import Image from "next/image"
import { Camera, Film } from "lucide-react"

interface Props {
  initialCoverUrl:      string | null
  initialCoverVideoUrl: string | null
  isOwn:                boolean
}

export function CoverImage({ initialCoverUrl, initialCoverVideoUrl, isOwn }: Props) {
  const [coverUrl,       setCoverUrl]       = useState(initialCoverUrl)
  const [coverVideoUrl,  setCoverVideoUrl]  = useState(initialCoverVideoUrl)
  const [uploading,      setUploading]      = useState(false)
  const [uploadingVideo, setUploadingVideo] = useState(false)

  async function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
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

  async function handleVideoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      alert("Video must be under 5 MB. Aim for 2-3 MB — keep it 10-15 seconds, H.264/MP4.")
      e.target.value = ""
      return
    }
    setUploadingVideo(true)
    const form = new FormData()
    form.append("file", file)
    const res  = await fetch("/api/users/upload-cover-video", { method: "POST", body: form })
    const data = await res.json() as { coverUrl?: string }
    if (data.coverUrl) {
      await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coverVideoUrl: data.coverUrl }),
      })
      setCoverVideoUrl(data.coverUrl)
    }
    setUploadingVideo(false)
    e.target.value = ""
  }

  const busy = uploading || uploadingVideo

  return (
    <div className="relative w-full h-[200px] overflow-hidden bg-mist-grey">

      {/* Video takes priority over static image */}
      {coverVideoUrl ? (
        <video
          src={coverVideoUrl}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover pointer-events-none"
        />
      ) : coverUrl ? (
        <Image src={coverUrl} alt="Cover" fill sizes="100vw" className="object-cover pointer-events-none" />
      ) : null}

      {isOwn && (
        <div className="absolute top-3 right-3 z-10 flex gap-1.5">
          <label className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/30 bg-black/40 px-3 py-1.5 font-sans text-xs text-white backdrop-blur transition-colors hover:bg-black/60 ${busy ? "pointer-events-none opacity-50" : ""}`}>
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageFile} />
            <Camera size={12} />
            {uploading ? "Uploading…" : "Photo"}
          </label>
          <label className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/30 bg-black/40 px-3 py-1.5 font-sans text-xs text-white backdrop-blur transition-colors hover:bg-black/60 ${busy ? "pointer-events-none opacity-50" : ""}`}>
            <input type="file" accept="video/mp4" className="hidden" onChange={handleVideoFile} />
            <Film size={12} />
            {uploadingVideo ? "Uploading…" : "Video"}
          </label>
        </div>
      )}
    </div>
  )
}
