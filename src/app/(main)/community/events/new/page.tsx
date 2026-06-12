import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { NewEventForm } from "../NewEventForm"

export default async function NewEventPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  return (
    <div>
      <Link
        href="/community/events"
        className="mb-6 inline-flex items-center gap-1.5 font-sans text-xs text-foreground/40 hover:text-foreground/70 transition-colors"
      >
        <ArrowLeft size={13} /> Back to Events
      </Link>

      <div className="mb-8">
        <h2 className="font-sans font-bold text-xl text-foreground">Create an Event</h2>
        <p className="mt-1 font-sans text-sm text-foreground/50">Invite the Frendr community to something great.</p>
      </div>

      <NewEventForm />
    </div>
  )
}
