import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { ConversationList } from "@/components/messages/ConversationList"
import { NewMessageButton } from "@/components/messages/NewMessageButton"
import { MessageCircle } from "lucide-react"

export const metadata = { title: "Messages — frendr" }

export default async function MessagesPage() {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/sign-in")

  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) redirect("/sign-in")

  const participations = await prisma.conversationParticipant.findMany({
    where: { userId: user.id },
    include: {
      conversation: {
        include: {
          participants: {
            include: {
              user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
            },
          },
          messages: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
    orderBy: { conversation: { updatedAt: "desc" } },
  })

  const conversations = participations.map((p) => {
    const other = p.conversation.participants.find((cp) => cp.userId !== user.id)
    const lastMessage = p.conversation.messages[0] ?? null
    const unreadCount = lastMessage && (!p.lastReadAt || lastMessage.createdAt > p.lastReadAt) ? 1 : 0
    return {
      id: p.conversation.id,
      updatedAt: p.conversation.updatedAt.toISOString(),
      other: other?.user ?? null,
      lastMessage: lastMessage ? { body: lastMessage.body, createdAt: lastMessage.createdAt.toISOString() } : null,
      unreadCount,
    }
  })

  return (
    <div className="mx-auto max-w-screen-lg md:px-6 md:py-8">
      <div className="flex h-[calc(100svh-4rem)] md:h-[calc(100vh-10rem)] overflow-hidden md:rounded-2xl border border-border bg-background shadow-sm">

        {/* Left: conversations list */}
        <div className="flex w-full md:w-72 md:shrink-0 flex-col border-r border-border">
          <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
            <h1 className="font-sans font-semibold text-sm text-foreground">Messages</h1>
            <NewMessageButton />
          </div>
          <div className="overflow-y-auto flex-1">
            <ConversationList initial={conversations} />
          </div>
        </div>

        {/* Right: empty state */}
        <div className="hidden md:flex flex-1 flex-col items-center justify-center gap-3 text-center p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-foreground/5">
            <MessageCircle size={22} className="text-foreground/30" />
          </div>
          <div>
            <p className="font-sans font-medium text-sm text-foreground/60">Select a conversation</p>
            <p className="font-sans text-xs text-foreground/30 mt-0.5">or start a new one with the pencil icon</p>
          </div>
        </div>

      </div>
    </div>
  )
}
