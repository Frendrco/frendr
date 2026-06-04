import Image from "next/image"
import Link from "next/link"
import { Heart } from "lucide-react"

export type RecessCardData = {
  id: string
  title: string
  thumbnailUrl: string | null
  streamId?: string | null
  externalUrl?: string | null
  tags: string[]
  categories: string[]
  likeCount?: number
  user: {
    username: string
    displayName: string
    avatarUrl: string | null
  }
}

const TOOL_COLORS: Record<string, string> = {
  "Blender":          "bg-winter-green text-core-black",
  "Cinema 4D":        "bg-spring-green text-core-black",
  "After Effects":    "bg-bloom-lavender text-core-black",
  "Cavalry":          "bg-hyper-blue text-white",
  "Houdini":          "bg-sunny-yellow text-core-black",
  "Moho":             "bg-sky-blue text-core-black",
  "Toon Boom":        "bg-sunny-yellow/80 text-core-black",
  "Rive":             "bg-sky-blue/70 text-core-black",
  "Nuke":             "bg-dream-lilac text-core-black",
  "DaVinci Resolve":  "bg-winter-green/70 text-core-black",
  "TouchDesigner":    "bg-bloom-lavender/60 text-core-black",
  "AI":               "bg-core-black text-white",
}

const TOOL_NAMES = Object.keys(TOOL_COLORS)

function getToolTag(categories: string[]): string | null {
  return categories.find((t) => TOOL_NAMES.includes(t)) ?? null
}

function cfThumb(url: string | null): string | null {
  if (!url || !url.includes("videodelivery.net")) return url
  if (url.includes("width=")) return url
  return url + (url.includes("?") ? "&" : "?") + "width=640"
}

type Props = {
  video: RecessCardData
  fixedWidth?: boolean
}

export function RecessCard({ video, fixedWidth = false }: Props) {
  const toolTag = getToolTag(video.categories)
  const tagColor = toolTag && TOOL_COLORS[toolTag] ? TOOL_COLORS[toolTag] : "bg-white/90 text-core-black"

  const initials = video.user.displayName
    .split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase()

  return (
    <div className={fixedWidth ? "w-[136px] sm:w-[168px] shrink-0" : "group flex flex-col gap-1.5"}>
      {/* Square thumbnail */}
      <Link href={`/v/${video.id}`} className="relative block aspect-square overflow-hidden rounded-xl bg-[#111] group">
        {video.thumbnailUrl ? (
          <Image
            src={cfThumb(video.thumbnailUrl)!}
            alt={video.title}
            fill
            sizes="(max-width: 640px) 50vw, 200px"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="h-full w-full bg-[#111]" />
        )}

        {/* Tool badge — bottom left */}
        {toolTag && (
          <span className={`absolute bottom-2 left-2 z-10 rounded-full px-2 py-0.5 font-sans text-[10px] font-semibold ${tagColor}`}>
            {toolTag}
          </span>
        )}
      </Link>

      {/* Meta row */}
      <div className="flex items-center gap-1.5">
        <Link href={`/${video.user.username}`} className="shrink-0">
          <div className="h-4 w-4 sm:h-5 sm:w-5 overflow-hidden rounded-full bg-spring-green flex items-center justify-center">
            {video.user.avatarUrl ? (
              <Image
                src={video.user.avatarUrl}
                alt={video.user.displayName}
                width={20}
                height={20}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="font-sans font-bold text-[8px] text-core-black">{initials}</span>
            )}
          </div>
        </Link>
        <Link href={`/${video.user.username}`} className="min-w-0">
          <p className="truncate font-sans text-xs text-core-black leading-none">{video.user.displayName}</p>
        </Link>
        {video.likeCount !== undefined && video.likeCount > 0 && (
          <div className="ml-auto flex items-center gap-0.5 shrink-0">
            <Heart size={9} className="text-foreground/40" />
            <span className="font-sans text-[10px] text-foreground/40">{video.likeCount}</span>
          </div>
        )}
      </div>
    </div>
  )
}
