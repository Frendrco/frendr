import Link from "next/link"
import { auth } from "@clerk/nextjs/server"
import { CalendarDays, MapPin, Globe, Users } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { cn } from "@/lib/utils"
import { EventActions } from "./EventActions"
import { EventRsvpButton } from "./EventRsvpButton"
import { SaveEventButton } from "./SaveEventButton"

function formatEventDate(date: Date) {
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
}

function formatEventTime(date: Date) {
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
}

export default async function EventsPage() {
  const { userId: clerkId } = await auth()

  const now = new Date()
  const [events, currentUser] = await Promise.all([
    prisma.event.findMany({
      orderBy: { date: "asc" },
      include: {
        user: { select: { displayName: true, username: true, avatarUrl: true } },
        _count: { select: { rsvps: true } },
      },
    }),
    clerkId ? prisma.user.findUnique({ where: { clerkId }, select: { id: true } }) : null,
  ])

  const eventIds = events.map(e => e.id)
  const [rsvpedIds, savedEventIds] = currentUser
    ? await Promise.all([
        prisma.eventRsvp.findMany({ where: { userId: currentUser.id, eventId: { in: eventIds } }, select: { eventId: true } })
          .then(r => new Set(r.map(x => x.eventId))),
        prisma.savedEvent.findMany({ where: { userId: currentUser.id, eventId: { in: eventIds } }, select: { eventId: true } })
          .then(r => new Set(r.map(x => x.eventId))),
      ])
    : [new Set<string>(), new Set<string>()]

  const upcoming = events.filter(e => e.date >= now)
  const past = events.filter(e => e.date < now)

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="font-sans text-sm text-foreground/40">
          {upcoming.length === 0 ? "No upcoming events" : `${upcoming.length} upcoming event${upcoming.length === 1 ? "" : "s"}`}
        </p>
        {clerkId && (
          <Link
            href="/community/events/new"
            className="inline-flex h-8 items-center rounded-full border border-border px-4 font-sans text-xs font-medium text-foreground/60 transition-colors hover:border-foreground/30 hover:text-foreground"
          >
            + Create Event
          </Link>
        )}
      </div>

      {events.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <CalendarDays size={32} className="text-foreground/20" />
          <p className="font-sans font-medium text-sm text-core-black">No events yet</p>
          <p className="font-sans text-sm text-foreground/40">Be the first to create one for the community.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {upcoming.length > 0 && (
            <div className="flex flex-col gap-3">
              {upcoming.map(event => {
                const isPast = event.date < now
                const isOwner = currentUser?.id === event.userId
                return (
                  <div key={event.id} className={cn("rounded-2xl border p-5 transition-colors", isPast ? "border-border opacity-60" : "border-border hover:border-foreground/20")}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-sans font-semibold text-sm text-core-black">{event.title}</p>
                        <p className="mt-0.5 font-sans text-xs text-foreground/40">by {event.user.displayName}</p>

                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                          <span className="flex items-center gap-1.5 font-sans text-xs text-foreground/60">
                            <CalendarDays size={11} />
                            {formatEventDate(event.date)} · {formatEventTime(event.date)}
                          </span>
                          {event.location && (
                            <span className="flex items-center gap-1.5 font-sans text-xs text-foreground/50">
                              <MapPin size={11} /> {event.location}
                            </span>
                          )}
                          {event.onlineUrl && (
                            <span className="flex items-center gap-1.5 font-sans text-xs text-foreground/50">
                              <Globe size={11} /> Online
                            </span>
                          )}
                          {event.maxAttendees && (
                            <span className="flex items-center gap-1.5 font-sans text-xs text-foreground/40">
                              <Users size={11} /> {event._count.rsvps} / {event.maxAttendees} spots
                            </span>
                          )}
                          {event.lgbtqFriendly && (
                            <span className="font-sans text-xs text-foreground/60">🏳️‍🌈 LGBTQ+ friendly</span>
                          )}
                        </div>

                        <p className="mt-3 font-sans text-xs text-foreground/50 line-clamp-2 leading-relaxed">
                          {event.description}
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <div className="flex items-center gap-2">
                          {currentUser && !isPast && (
                            <EventRsvpButton
                              eventId={event.id}
                              initialAttending={rsvpedIds.has(event.id)}
                              initialCount={event._count.rsvps}
                            />
                          )}
                          {!currentUser && !isPast && (
                            <span className="font-sans text-xs text-foreground/30">{event._count.rsvps} attending</span>
                          )}
                          {currentUser && (
                            <SaveEventButton eventId={event.id} initialSaved={savedEventIds.has(event.id)} />
                          )}
                        </div>
                        {isOwner && <EventActions eventId={event.id} />}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {past.length > 0 && (
            <div>
              <p className="mb-3 font-sans text-xs font-medium uppercase tracking-widest text-foreground/30">Past Events</p>
              <div className="flex flex-col gap-3 opacity-50">
                {past.map(event => (
                  <div key={event.id} className="rounded-2xl border border-border p-5">
                    <p className="font-sans font-semibold text-sm text-core-black">{event.title}</p>
                    <div className="mt-1 flex items-center gap-4">
                      <span className="flex items-center gap-1.5 font-sans text-xs text-foreground/50">
                        <CalendarDays size={11} /> {formatEventDate(event.date)}
                      </span>
                      <span className="font-sans text-xs text-foreground/40">{event._count.rsvps} attended</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
