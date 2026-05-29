import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@clerk/nextjs/server"
import { ArrowLeft } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { EditThreadForm } from "../../EditThreadForm"

type Props = { params: Promise<{ threadId: string }> }

export default async function EditThreadPage({ params }: Props) {
  const { threadId } = await params
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/sign-in")

  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) redirect("/sign-in")

  const thread = await prisma.thread.findUnique({
    where: { id: threadId },
    select: { id: true, title: true, body: true, tags: true, videoUrl: true, imageUrls: true, riveUrls: true, userId: true },
  })
  if (!thread) notFound()
  if (thread.userId !== user.id) notFound()

  return (
    <div>
      <Link
        href={`/community/${threadId}`}
        className="mb-6 inline-flex items-center gap-1.5 font-sans text-xs text-foreground/40 hover:text-foreground/70 transition-colors"
      >
        <ArrowLeft size={13} /> Back to Thread
      </Link>

      <h1 className="mb-6 font-sans font-bold text-xl text-core-black">Edit Thread</h1>

      <EditThreadForm
        threadId={thread.id}
        initial={{
          title:     thread.title,
          body:      thread.body,
          tags:      thread.tags,
          videoUrl:  thread.videoUrl,
          imageUrls: thread.imageUrls,
          riveUrls:  thread.riveUrls,
        }}
      />
    </div>
  )
}
