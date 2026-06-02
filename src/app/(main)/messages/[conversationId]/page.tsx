import { redirect, notFound } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { ConversationList } from "@/components/messages/ConversationList"
import { NewMessageButton } from "@/components/messages/NewMessageButton"
import { ActiveConversation } from "./ActiveConversation"

type Props = { params: Promise<{ conversationId: string }> }

export default async function ConversationPage({ params }: Props) {
  const { conversationId } = await params
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect("/sign-in")

  const user = await prisma.user.findUnique({ where: { clerkId }, select: { id: true } })
  if (!user) redirect("/sign-in")

  // Verify participant
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId: user.id } },
  })
  if (!participant) notFound()

  // Fetch conversations list
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

  // Fetch active conversation messages
  const [messages, conversation] = await Promise.all([
    prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      include: {
        sender: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
      },
    }),
    prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          include: {
            user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
          },
        },
      },
    }),
  ])

  if (!conversation) notFound()

  const serializedMessages = messages.map((m) => ({
    ...m,
    createdAt: m.createdAt.toISOString(),
  }))

  const other = conversation.participants.find((p) => p.userId !== user.id)?.user ?? null

  return (
    <div className="mx-auto max-w-screen-lg md:px-6 md:py-8">
      <div className="flex h-[calc(100svh-4rem)] md:h-[calc(100vh-10rem)] overflow-hidden md:rounded-2xl border border-border bg-white shadow-sm">

        {/* Left: conversations list */}
        <div className="hidden md:flex w-72 shrink-0 flex-col border-r border-border">
          <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
            <h1 className="font-sans font-semibold text-sm text-core-black">Messages</h1>
            <NewMessageButton />
          </div>
          <div className="overflow-y-auto flex-1">
            <ConversationList initial={conversations} activeId={conversationId} />
          </div>
        </div>

        {/* Right: active conversation */}
        <ActiveConversation
          conversationId={conversationId}
          initialMessages={serializedMessages}
          currentUserId={user.id}
          other={other}
        />

      </div>
    </div>
  )
}
