"use client"

interface Props {
  streamId: string | null
  title: string
}

export function VideoPlayer({ streamId, title }: Props) {
  if (!streamId) {
    return (
      <div className="flex aspect-video w-full items-center justify-center bg-black/10">
        <p className="font-sans text-sm text-white/40">Video processing…</p>
      </div>
    )
  }

  return (
    <div className="relative aspect-video w-full">
      <iframe
        src={`https://iframe.videodelivery.net/${streamId}?autoplay=false&controls=true&muted=false`}
        title={title}
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 h-full w-full border-0"
      />
    </div>
  )
}
