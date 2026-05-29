import Link from "next/link"
import { auth } from "@clerk/nextjs/server"
import { MapPin } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { timeAgo, cn } from "@/lib/utils"

const TYPE_LABELS: Record<string, string> = {
  "full-time":  "Full-time",
  "part-time":  "Part-time",
  "contract":   "Contract",
  "freelance":  "Freelance",
  "internship": "Internship",
}

const TYPE_FILTERS = ["all", "full-time", "part-time", "contract", "freelance", "internship"]

type Props = { searchParams: Promise<{ type?: string }> }

export default async function JobsPage({ searchParams }: Props) {
  const { type } = await searchParams
  const { userId } = await auth()

  const jobs = await prisma.job.findMany({
    where: type && type !== "all" ? { type } : undefined,
    orderBy: { createdAt: "desc" },
    include: { user: { select: { displayName: true, username: true } } },
  })

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          {TYPE_FILTERS.map(f => (
            <Link
              key={f}
              href={f === "all" ? "/community/jobs" : `/community/jobs?type=${f}`}
              className={cn(
                "inline-flex h-7 items-center rounded-full px-3 font-sans text-xs font-medium capitalize transition-colors",
                (f === "all" && !type) || type === f
                  ? "bg-core-black text-white"
                  : "border border-border text-foreground/50 hover:border-foreground/30 hover:text-foreground"
              )}
            >
              {f === "all" ? "All" : TYPE_LABELS[f]}
            </Link>
          ))}
        </div>
        {userId && (
          <Link
            href="/community/jobs/new"
            className="inline-flex h-8 items-center rounded-full border border-border px-4 font-sans text-xs font-medium text-foreground/60 transition-colors hover:border-foreground/30 hover:text-foreground"
          >
            Post a Job
          </Link>
        )}
      </div>

      {jobs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <p className="font-sans font-medium text-sm text-core-black">No jobs posted yet</p>
          <p className="font-sans text-sm text-foreground/40">Check back soon, or post a role for the community.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {jobs.map(job => (
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

                {job.applyEmail && (
                  <a
                    href={`mailto:${job.applyEmail}`}
                    className="shrink-0 inline-flex h-8 items-center rounded-full bg-spring-green px-4 font-sans font-medium text-xs text-core-black transition-colors hover:bg-spring-green/90"
                  >
                    Apply
                  </a>
                )}
              </div>

              <p className="mt-3 font-sans text-xs text-foreground/50 line-clamp-2 leading-relaxed">
                {job.description}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
