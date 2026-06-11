"use client"

import { useState, useCallback } from "react"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { VideoCard, type VideoCardData } from "@/components/common/VideoCard"
import { PinButton } from "./PinButton"

interface Props {
  initialVideos: VideoCardData[]
  pinnedVideoId: string | null
  username: string
  displayName: string
  avatarUrl: string | null
  isOwn: boolean
}

interface CardProps {
  video: VideoCardData
  pinnedVideoId: string | null
  username: string
  displayName: string
  avatarUrl: string | null
}

function SortableCard({ video, pinnedVideoId, username, displayName, avatarUrl }: CardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: video.id })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : undefined,
        opacity: isDragging ? 0.5 : 1,
      }}
      className="cursor-grab active:cursor-grabbing"
      {...attributes}
      {...listeners}
    >
      <VideoCard
        video={{ ...video, user: { username, displayName, avatarUrl } }}
        hideCreator
        hideTags
        actionsSlot={
          <PinButton videoId={video.id} isPinned={pinnedVideoId === video.id} />
        }
        mobileActionsSlot={
          <PinButton
            videoId={video.id}
            isPinned={pinnedVideoId === video.id}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground/40 transition-colors hover:border-foreground/30 hover:text-foreground disabled:opacity-50"
          />
        }
      />
    </div>
  )
}

export function ProfileVideoGrid({
  initialVideos,
  pinnedVideoId,
  username,
  displayName,
  avatarUrl,
  isOwn,
}: Props) {
  const [videos, setVideos] = useState(initialVideos)
  const [visibleCount, setVisibleCount] = useState(12)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const oldIndex = videos.findIndex((v) => v.id === active.id)
      const newIndex = videos.findIndex((v) => v.id === over.id)
      const reordered = arrayMove(videos, oldIndex, newIndex)
      setVideos(reordered)

      await fetch(`/api/users/${username}/video-order`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoIds: reordered.map((v) => v.id) }),
      })
    },
    [videos, username]
  )

  if (!isOwn) {
    return (
      <>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4">
          {videos.slice(0, visibleCount).map((video, i) => (
            <VideoCard
              key={video.id}
              video={{ ...video, user: { username, displayName, avatarUrl } }}
              hideCreator
              hideTags
              priority={i < 4}
            />
          ))}
        </div>
        {videos.length > visibleCount && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => setVisibleCount(c => c + 12)}
              className="h-10 px-6 rounded-full bg-core-black font-sans font-medium text-sm text-white hover:bg-spring-green hover:text-core-black transition-colors"
            >
              Load more
            </button>
          </div>
        )}
      </>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={videos.slice(0, visibleCount).map((v) => v.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4">
          {videos.slice(0, visibleCount).map((video) => (
            <SortableCard
              key={video.id}
              video={video}
              pinnedVideoId={pinnedVideoId}
              username={username}
              displayName={displayName}
              avatarUrl={avatarUrl}
            />
          ))}
        </div>
      </SortableContext>
      {videos.length > visibleCount && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => setVisibleCount(c => c + 12)}
            className="h-10 px-6 rounded-full bg-core-black font-sans font-medium text-sm text-white hover:bg-spring-green hover:text-core-black transition-colors"
          >
            Load more
          </button>
        </div>
      )}
    </DndContext>
  )
}
