import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { auth } from "@clerk/nextjs/server"
import { MessageSquare, MapPin } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { timeAgo } from "@/lib/utils"
import { SaveThreadButton } from "../SaveThreadButton"
import { SaveJobButton } from "../jobs/SaveJobButton"
import { SaveEventButton } from "../events/SaveEventButton"
import { SaveShopButton } from "../marketplace/SaveShopButton"

export default async function SavedPage() {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/sign-in")

  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) redirect("/sign-in")

  const [savedThreads, savedJobs, savedEvents, savedShops] = await Promise.all([
    prisma.savedThread.findMany({
      where: { userId: user.id },
      orderBy: { savedAt: "desc" },
      include: {
        thread: {
          include: {
            user: { select: { username: true, displayName: true, avatarUrl: true } },
            _count: { select: { comments: true } },
          },
        },
      },
    }),
    prisma.savedJob.findMany({
      where: { userId: user.id },
      orderBy: { savedAt: "desc" },
      include: {
        job: {
          include: { user: { select: { displayName: true, username: true } } },
        },
      },
    }),
    prisma.savedEvent.findMany({
      where: { userId: user.id },
      orderBy: { savedAt: "desc" },
      include: {
        event: {
          include: { user: { select: { displayName: true, username: true } } },
        },
      },
    }),
    prisma.savedShop.findMany({
      where: { userId: user.id },
      orderBy: { savedAt: "desc" },
      include: {
        shop: {
          include: { user: { select: { displayName: true, username: true, avatarUrl: true } } },
        },
      },
    }),
  ])

  const TYPE_LABELS: Record<string, string> = {
    "full-time":  "Full-time",
    "part-time":  "Part-time",
    "contract":   "Contract",
    "freelance":  "Freelance",
    "internship": "Internship",
  }

  return (
    <div className="flex flex-col gap-12">

      {/* Saved Discussions */}
      <section>
        <h2 className="font-sans font-semibold text-sm text-core-black mb-5">
          Saved Discussions
          {savedThreads.length > 0 && (
            <span className="ml-2 font-normal text-foreground/40">{savedThreads.length}</span>
          )}
        </h2>

        {savedThreads.length === 0 ? (
          <p className="font-sans text-sm text-foreground/40 py-8 text-center">
            No saved discussions yet. Bookmark threads to find them here.
          </p>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {savedThreads.map(({ thread }) => (
              <div key={thread.id} className="flex items-start gap-4 py-6">
                <div className="min-w-0 flex-1">
                  <Link href={`/community/${thread.id}`} className="group">
                    <p className="font-sans font-semibold text-base text-core-black group-hover:underline leading-snug">
                      {thread.title}
                    </p>
                  </Link>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                    <Link href={`/${thread.user.username}`} className="flex items-center gap-2 hover:opacity-70 transition-opacity">
                      <div className="h-5 w-5 overflow-hidden rounded-full bg-spring-green shrink-0 flex items-center justify-center">
                        {thread.user.avatarUrl ? (
                          <Image src={thread.user.avatarUrl} alt={thread.user.displayName} width={20} height={20} className="h-full w-full object-cover" />
                        ) : (
                          <span className="font-sans font-bold text-[8px] text-core-black">
                            {thread.user.displayName.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span className="font-sans text-sm text-foreground/50">{thread.user.displayName}</span>
                    </Link>

                    <span className="font-sans text-sm text-foreground/30">{timeAgo(thread.createdAt)}</span>

                    <Link href={`/community/${thread.id}`} className="flex items-center gap-1.5 text-foreground/30 hover:text-foreground/60 transition-colors">
                      <MessageSquare size={13} />
                      <span className="font-sans text-sm">{thread._count.comments}</span>
                    </Link>
                  </div>
                </div>

                <SaveThreadButton threadId={thread.id} initialSaved={true} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Saved Jobs */}
      <section>
        <h2 className="font-sans font-semibold text-sm text-core-black mb-5">
          Saved Jobs
          {savedJobs.length > 0 && (
            <span className="ml-2 font-normal text-foreground/40">{savedJobs.length}</span>
          )}
        </h2>

        {savedJobs.length === 0 ? (
          <p className="font-sans text-sm text-foreground/40 py-8 text-center">
            No saved jobs yet. Bookmark job postings to find them here.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {savedJobs.map(({ job }) => (
              <div key={job.id} className="rounded-2xl border border-border p-5 transition-colors hover:border-foreground/20">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-sans font-semibold text-sm text-core-black">{job.title}</p>
                    <p className="mt-0.5 font-sans text-sm text-foreground/60">{job.company}</p>

                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="inline-flex h-5 items-center rounded-full bg-foreground/[0.06] px-2 font-sans text-[10px] font-medium text-foreground/60 capitalize">
                        {TYPE_LABELS[job.type] ?? job.type}
                      </span>
                      {job.location && (
                        <span className="flex items-center gap-1 font-sans text-xs text-foreground/40">
                          <MapPin size={11} /> {job.location}
                        </span>
                      )}
                      <span className="font-sans text-xs text-foreground/30">{timeAgo(job.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <SaveJobButton jobId={job.id} initialSaved={true} />
                    {job.applyEmail && (
                      <a
                        href={`mailto:${job.applyEmail}`}
                        className="inline-flex h-8 items-center rounded-full bg-spring-green px-4 font-sans font-medium text-xs text-core-black transition-colors hover:bg-spring-green/90"
                      >
                        Apply
                      </a>
                    )}
                  </div>
                </div>

                <p className="mt-3 font-sans text-xs text-foreground/50 line-clamp-2 leading-relaxed">
                  {job.description}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Saved Events */}
      <section>
        <h2 className="font-sans font-semibold text-sm text-core-black mb-5">
          Saved Events
          {savedEvents.length > 0 && (
            <span className="ml-2 font-normal text-foreground/40">{savedEvents.length}</span>
          )}
        </h2>

        {savedEvents.length === 0 ? (
          <p className="font-sans text-sm text-foreground/40 py-8 text-center">
            No saved events yet. Bookmark events to find them here.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {savedEvents.map(({ event }) => (
              <div key={event.id} className="rounded-2xl border border-border p-5 transition-colors hover:border-foreground/20">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-sans font-semibold text-sm text-core-black">{event.title}</p>
                    <p className="mt-0.5 font-sans text-xs text-foreground/40">by {event.user.displayName}</p>
                    <p className="mt-2 font-sans text-xs text-foreground/50">
                      {event.date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                      {event.location ? ` · ${event.location}` : event.onlineUrl ? " · Online" : ""}
                    </p>
                  </div>
                  <SaveEventButton eventId={event.id} initialSaved={true} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Saved Shops */}
      <section>
        <h2 className="font-sans font-semibold text-sm text-core-black mb-5">
          Saved Shops
          {savedShops.length > 0 && (
            <span className="ml-2 font-normal text-foreground/40">{savedShops.length}</span>
          )}
        </h2>

        {savedShops.length === 0 ? (
          <p className="font-sans text-sm text-foreground/40 py-8 text-center">
            No saved shops yet. Bookmark shops to find them here.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {savedShops.map(({ shop }) => (
              <div key={shop.id} className="rounded-2xl border border-border p-5 transition-colors hover:border-foreground/20">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-sans font-semibold text-sm text-core-black">{shop.name}</p>
                    <p className="mt-0.5 font-sans text-xs text-foreground/40">by {shop.user.displayName}</p>
                    {shop.category && (
                      <span className="mt-2 inline-flex h-5 items-center rounded-full bg-foreground/[0.06] px-2 font-sans text-[10px] font-medium text-foreground/60">
                        {shop.category}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <SaveShopButton shopId={shop.id} initialSaved={true} />
                    <a
                      href={shop.shopUrl.startsWith("http") ? shop.shopUrl : `https://${shop.shopUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-8 items-center rounded-full bg-core-black px-4 font-sans font-medium text-xs text-white transition-colors hover:bg-core-black/80"
                    >
                      Visit Shop
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  )
}
