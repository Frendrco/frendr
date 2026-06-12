"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { Sparkles, Star, Users, Plus, ChevronUp, ChevronDown } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { CreateChannelSheet } from "./CreateChannelSheet"
import { cn } from "@/lib/utils"

const COLOR_MAP: Record<string, string> = {
  "spring-green":   "bg-spring-green/60",
  "winter-green":   "bg-winter-green",
  "bloom-lavender": "bg-bloom-lavender",
  "sky-blue":       "bg-sky-blue",
  "sunny-yellow":   "bg-sunny-yellow",
  "hyper-blue":     "bg-hyper-blue/50",
  "dream-lilac":    "bg-dream-lilac",
}

const FALLBACK_COLORS = Object.values(COLOR_MAP)
function getFallbackColor(index: number) {
  return FALLBACK_COLORS[index % FALLBACK_COLORS.length]
}

type ChannelData = {
  id: string
  name: string
  slug: string
  description: string | null
  coverUrl: string | null
  color: string | null
  type: string
  featured: boolean
  sortOrder: number
  _count: { videos: number; followers: number }
  videos: { video: { thumbnailUrl: string | null; streamId: string | null } }[]
}

type Props = {
  adminChannels: ChannelData[]
  userChannels: ChannelData[]
  isSignedIn: boolean
  isAdmin?: boolean
}

export function ChannelsClient({ adminChannels: initialAdminChannels, userChannels, isSignedIn, isAdmin = false }: Props) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [adminChannels, setAdminChannels] = useState(initialAdminChannels)

  const moveChannel = useCallback(async (id: string, direction: "up" | "down") => {
    const idx = adminChannels.findIndex((c) => c.id === id)
    const swapIdx = direction === "up" ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= adminChannels.length) return

    // Optimistic local swap
    const next = [...adminChannels]
    ;[next[idx], next[swapIdx]] = [next[swapIdx], next[idx]]
    setAdminChannels(next)

    await fetch(`/api/channels/${id}/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ direction }),
    })
  }, [adminChannels])

  return (
    <div className="min-h-screen bg-background">
      <CreateChannelSheet open={sheetOpen} onOpenChange={setSheetOpen} isAdmin={isAdmin} />

      <div className="mx-auto max-w-screen-xl px-4 md:px-6 py-12">

        {/* Header */}
        <div className="mb-8 flex flex-col items-center gap-4 md:flex-row md:items-end md:justify-between">
          <div className="text-center md:text-left">
            <h1 className="display-sm text-foreground">Channels</h1>
            <p className="mt-2 font-sans text-sm text-foreground/50">
              Curated collections of the best work on Frendr
            </p>
          </div>
          {isSignedIn && (
            <button
              onClick={() => setSheetOpen(true)}
              className="inline-flex items-center gap-2 h-9 px-5 rounded-full bg-spring-green font-sans font-medium text-sm text-core-black hover:bg-spring-green/90 transition-colors shrink-0"
            >
              <Plus size={14} />
              Start a Channel
            </button>
          )}
        </div>

        <Tabs defaultValue="frendr">
          <TabsList variant="line" className="mb-8 mx-auto md:mx-0">
            <TabsTrigger value="frendr" className="font-sans text-sm px-3 gap-1.5">
              <Sparkles size={12} />
              Frendr Picks
            </TabsTrigger>
            <TabsTrigger value="creator" className="font-sans text-sm px-3 gap-1.5">
              <Users size={12} />
              Creator Channels
            </TabsTrigger>
          </TabsList>

          {/* Frendr Picks tab */}
          <TabsContent value="frendr">
            {adminChannels.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {adminChannels.map((channel, i) => (
                  <ChannelCard
                    key={channel.id}
                    channel={channel}
                    index={i}
                    isFrendrPick
                    isAdmin={isAdmin}
                    isFirst={i === 0}
                    isLast={i === adminChannels.length - 1}
                    onMoveUp={() => moveChannel(channel.id, "up")}
                    onMoveDown={() => moveChannel(channel.id, "down")}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No Frendr Picks yet"
                subtitle="Our editorial team is curating the best work. Check back soon."
              />
            )}
          </TabsContent>

          {/* Creator Channels tab */}
          <TabsContent value="creator">
            {userChannels.length > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {userChannels.map((channel, i) => (
                    <ChannelCard key={channel.id} channel={channel} index={i} isAdmin={isAdmin} />
                  ))}
                </div>
              </>
            ) : (
              <CreatorEmptyState isSignedIn={isSignedIn} onCreateClick={() => setSheetOpen(true)} />
            )}
          </TabsContent>
        </Tabs>

      </div>
    </div>
  )
}

function ChannelCard({
  channel,
  isFrendrPick = false,
  isAdmin = false,
  isFirst = false,
  isLast = false,
  onMoveUp,
  onMoveDown,
  index,
}: {
  channel: ChannelData
  isFrendrPick?: boolean
  isAdmin?: boolean
  isFirst?: boolean
  isLast?: boolean
  onMoveUp?: () => void
  onMoveDown?: () => void
  index: number
}) {
  const [featuredState, setFeaturedState] = useState(channel.featured)
  const [toggling, setToggling] = useState(false)

  const toggleFeature = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault()
    if (toggling) return
    setToggling(true)
    const res = await fetch(`/api/channels/${channel.id}/feature`, { method: "POST" })
    if (res.ok) {
      const data = await res.json() as { featured: boolean }
      setFeaturedState(data.featured)
    }
    setToggling(false)
  }, [channel.id, toggling])

  const vid = channel.videos[0]?.video
  const cover = channel.coverUrl
    ?? vid?.thumbnailUrl
    ?? (vid?.streamId ? `https://videodelivery.net/${vid.streamId}/thumbnails/thumbnail.jpg` : null)
  const colorClass = channel.color
    ? (COLOR_MAP[channel.color] ?? getFallbackColor(index))
    : getFallbackColor(index)

  return (
    <Link href={`/channels/${channel.slug}`} className="group flex flex-col gap-3">
      <div className="relative aspect-video overflow-hidden rounded-xl">
        {cover ? (
          <Image
            src={cover}
            alt={channel.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={index === 0}
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className={`h-full w-full ${colorClass} transition-opacity group-hover:opacity-90`} />
        )}
        {isAdmin && (
          <>
            <button
              onClick={toggleFeature}
              disabled={toggling}
              aria-label={featuredState ? "Remove from discover page" : "Feature on discover page"}
              title={featuredState ? "Remove from discover page" : "Feature on discover page"}
              className={cn(
                "absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full border backdrop-blur-sm transition-all disabled:opacity-50",
                featuredState
                  ? "border-spring-green bg-spring-green/20 text-spring-green"
                  : "border-white/30 bg-black/30 text-white opacity-0 group-hover:opacity-100"
              )}
            >
              <Star size={12} className={cn(featuredState && "fill-current")} />
            </button>
            {isFrendrPick && (
              <div className="absolute bottom-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onMoveUp?.() }}
                  disabled={isFirst}
                  title="Move up"
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm disabled:opacity-30 hover:bg-black/70 transition-colors"
                >
                  <ChevronUp size={12} />
                </button>
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onMoveDown?.() }}
                  disabled={isLast}
                  title="Move down"
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm disabled:opacity-30 hover:bg-black/70 transition-colors"
                >
                  <ChevronDown size={12} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <div>
        <p className="font-sans font-semibold text-sm text-foreground leading-snug line-clamp-1">
          {channel.name}
        </p>
        {channel.description && (
          <p className="mt-0.5 font-sans text-xs text-foreground/50 line-clamp-1">{channel.description}</p>
        )}
        <p className="mt-1 font-sans text-xs text-foreground/40">
          {channel._count.videos} {channel._count.videos === 1 ? "video" : "videos"}
          {channel._count.followers > 0 &&
            ` · ${channel._count.followers} ${channel._count.followers === 1 ? "follower" : "followers"}`}
        </p>
      </div>
    </Link>
  )
}

function CreatorEmptyState({
  isSignedIn,
  onCreateClick,
}: {
  isSignedIn: boolean
  onCreateClick: () => void
}) {
  const placeholders = [
    "bg-bloom-lavender",
    "bg-sky-blue",
    "bg-sunny-yellow",
    "bg-winter-green",
    "bg-dream-lilac",
    "bg-hyper-blue/50",
    "bg-spring-green/60",
    "bg-bloom-lavender/60",
  ]

  return (
    <div className="relative">
      {/* Blurred placeholder grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 opacity-30 pointer-events-none select-none">
        {placeholders.map((bg, i) => (
          <div key={i} className="flex flex-col gap-3">
            <div className={`aspect-video rounded-xl ${bg}`} />
            <div className="flex flex-col gap-1.5">
              <div className="h-3 w-3/4 rounded bg-foreground/20" />
              <div className="h-2.5 w-1/2 rounded bg-foreground/10" />
            </div>
          </div>
        ))}
      </div>

      {/* Overlay CTA */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center">
        <div>
          <p className="font-sans font-semibold text-base text-foreground">No creator channels yet</p>
          <p className="mt-1 font-sans text-sm text-foreground/50 max-w-xs">
            Be the first to curate a channel and share your taste with the community.
          </p>
        </div>
        {isSignedIn ? (
          <button
            onClick={onCreateClick}
            className="inline-flex items-center gap-2 h-10 px-6 rounded-full bg-spring-green font-sans font-medium text-sm text-core-black hover:bg-spring-green/90 transition-colors"
          >
            <Plus size={14} />
            Start the first channel
          </button>
        ) : (
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-2 h-10 px-6 rounded-full bg-spring-green font-sans font-medium text-sm text-core-black hover:bg-spring-green/90 transition-colors"
          >
            Sign in to create a channel
          </Link>
        )}
      </div>
    </div>
  )
}

function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-32 text-center">
      <p className="font-sans font-semibold text-base text-foreground">{title}</p>
      <p className="font-sans text-sm text-foreground/40 max-w-sm">{subtitle}</p>
    </div>
  )
}
