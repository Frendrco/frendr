const DEFAULT_AVATARS = [
  "/images/ava-01.png",
  "/images/ava-02.png",
  "/images/ava-03.png",
  "/images/ava-04.png",
  "/images/ava-05.png",
]

export function pickDefaultAvatar(): string {
  return DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)]
}

export function isDefaultAvatar(url: string | null): boolean {
  if (!url) return true
  return DEFAULT_AVATARS.some((a) => url.endsWith(a))
}
