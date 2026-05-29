import { notFound } from "next/navigation"
import Link from "next/link"
import { Eye, Heart, Bookmark, Share2, MoreHorizontal } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { VideoPlayer } from "./VideoPlayer"
import type { Metadata } from "next"

async function getStreamReady(streamId: string): Promise<boolean> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  const token = process.env.CLOUDFLARE_STREAM_API_TOKEN
  if (!accountId || !token) return false
  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${streamId}`,
      { headers: { Authorization: `Bearer ${token}` }, next: { revalidate: 0 } }
    )
    if (!res.ok) return false
    const { result } = await res.json() as { result: { status: { state: string } } }
    return result?.status?.state === "ready"
  } catch {
    return false
  }
}

type Props = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const video = await prisma.video.findUnique({
    where: { id },
    include: { user: { select: { displayName: true } } },
  })
  if (!video) return {}
  return { title: `${video.title} by ${video.user.displayName} — frendr` }
}

export default async function VideoPage({ params }: Props) {
  const { id } = await params
  const video = await prisma.video.findUnique({
    where: { id },
    include: { user: true },
  })

  if (!video) notFound()

  const streamReady = video.streamId ? await getStreamReady(video.streamId) : false

  const formattedDate = new Date(video.createdAt).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  })

  return (
    <div className="min-h-screen bg-white">

      {/* ── Player ─────────────────────────────────────────── */}
      <div className="bg-core-black w-full">
        <div className="mx-auto max-w-screen-xl">
          <VideoPlayer streamId={video.streamId} title={video.title} streamReady={streamReady} />
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────── */}
      <div className="mx-auto max-w-screen-xl px-4 md:px-6 py-8">
        <div className="flex flex-col gap-10 lg:flex-row lg:gap-12">

          {/* ── Main column ── */}
          <div className="min-w-0 flex-1">

            {/* Title row */}
            <div className="flex items-start justify-between gap-4">
              <h1 className="font-sans font-bold text-xl md:text-2xl text-core-black leading-snug">
                {video.title}
              </h1>

              {/* Action buttons */}
              <div className="flex shrink-0 items-center gap-1">
                {[
                  { icon: <Heart size={15} />,          label: "Like"  },
                  { icon: <Bookmark size={15} />,       label: "Save"  },
                  { icon: <Share2 size={15} />,         label: "Share" },
                  { icon: <MoreHorizontal size={15} />, label: "More"  },
                ].map(({ icon, label }) => (
                  <button
                    key={label}
                    aria-label={label}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground/40 transition-colors hover:border-foreground/30 hover:text-foreground"
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Meta row */}
            <div className="mt-2 flex items-center gap-3 text-foreground/40">
              <span className="flex items-center gap-1 font-sans text-xs">
                <Eye size={12} /> 0 views
              </span>
              <span className="font-sans text-xs">·</span>
              <span className="font-sans text-xs">{formattedDate}</span>
            </div>

            {/* Tags */}
            {video.tags.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-1.5">
                {video.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-border px-3 py-1 font-sans text-xs text-foreground/50 hover:border-foreground/30 hover:text-foreground transition-colors cursor-pointer"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Description */}
            {video.description && (
              <div className="mt-6 border-t border-border pt-6">
                <p className="font-sans text-sm text-foreground/70 leading-relaxed whitespace-pre-wrap">
                  {video.description}
                </p>
              </div>
            )}

            {/* Comments placeholder */}
            <div className="mt-10 border-t border-border pt-8">
              <p className="font-sans text-xs font-medium uppercase tracking-widest text-foreground/30">
                Comments — coming soon
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
