import { getVideoEmbedUrl } from "@/lib/videoEmbed"

interface Props {
  videoUrl:  string | null
  imageUrls: string[]
  riveUrls:  string[]
}

export function ThreadEmbeds({ videoUrl, imageUrls, riveUrls }: Props) {
  const hasContent = videoUrl || imageUrls.length > 0 || riveUrls.length > 0
  if (!hasContent) return null

  return (
    <div className="mt-6 flex flex-col gap-5">
      {/* Video */}
      {videoUrl && (
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="relative aspect-video w-full">
            <iframe
              src={getVideoEmbedUrl(videoUrl)}
              className="absolute inset-0 h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* Images */}
      {imageUrls.length > 0 && (
        <div className={imageUrls.length === 1 ? "block" : "grid grid-cols-2 gap-2"}>
          {imageUrls.map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={url}
              alt={`Image ${i + 1}`}
              className="w-full rounded-xl border border-border object-cover"
            />
          ))}
        </div>
      )}

      {/* Rive embeds */}
      {riveUrls.map((url, i) => (
        <div key={i} className="w-full" style={{ height: 600 }}>
          <iframe
            src={url}
            className="h-full w-full border-0"
            allowFullScreen
          />
        </div>
      ))}
    </div>
  )
}
