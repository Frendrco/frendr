import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { NewThreadForm } from "../NewThreadForm"

export default async function NewThreadPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  return (
    <div>
      <Link
        href="/community"
        className="mb-6 inline-flex items-center gap-1.5 font-sans text-xs text-foreground/40 hover:text-foreground/70 transition-colors"
      >
        <ArrowLeft size={13} /> Back to Community
      </Link>

      <div className="mb-8">
        <h2 className="font-sans font-bold text-xl text-foreground">New Thread</h2>
        <p className="mt-1 font-sans text-sm text-foreground/50">Start a discussion with the community.</p>
      </div>

      <NewThreadForm />
    </div>
  )
}
