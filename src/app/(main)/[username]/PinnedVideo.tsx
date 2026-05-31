import Image from "next/image"
import Link from "next/link"
import { Pin } from "lucide-react"
import { UnpinButton } from "./UnpinButton"

interface VideoData {
  id: string
  title: string
  description: string | null
  thumbnailUrl: string | null
  createdAt: Date
}

interface Props {
  video: VideoData
  isOwn: boolean
}

export function PinnedVideo({ video, isOwn }: Props) {
  const date = new Date(video.createdAt).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  })

  return (
    <div className="mb-8">
      <div className="mb-3 flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-sans text-[10px] font-medium uppercase tracking-widest text-foreground/40">
          <Pin size={10} />
          Pinned
        </span>
        {isOwn && <UnpinButton videoId={video.id} />}
      </div>

      <Link
        href={`/v/${video.id}`}
        className="group flex flex-col gap-0 overflow-hidden rounded-2xl border border-border transition-shadow hover:shadow-md sm:flex-row"
      >
        {/* Thumbnail */}
        <div className="relative aspect-video w-full shrink-0 overflow-hidden bg-mist-grey sm:w-[52%]">
          {video.thumbnailUrl ? (
            <Image
              src={video.thumbnailUrl}
              alt={video.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="h-full w-full bg-mist-grey" />
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col justify-center gap-2 px-5 py-4 sm:py-6">
          <h3 className="font-sans font-semibold text-base text-core-black leading-snug line-clamp-2">
            {video.title}
          </h3>
          {video.description && (
            <p className="font-sans text-sm text-foreground/50 leading-relaxed line-clamp-3">
              {video.description}
            </p>
          )}
          <p className="font-sans text-xs text-foreground/30">{date}</p>
        </div>
      </Link>
    </div>
  )
}
