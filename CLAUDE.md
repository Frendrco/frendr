# Frendr — Claude Code Guide

## Project
Creative video platform. Think Dribbble meets Vimeo — for motion designers, animators, and video creators to share and discover work.

**Stack:** Next.js 16 (App Router, Turbopack) · TypeScript · Tailwind v4 · Clerk v7 · Prisma · Cloudflare Stream (video) · Algolia (search) · AWS S3 · shadcn/ui

**Run dev:** `cd /Users/wonderlust/Developer/frendr && pnpm dev`
**Design system preview:** http://localhost:3000/design

---

## Design System

### Fonts
- **Display / Headings:** Louize (205TF) — serif
- **Body / UI:** PP Neue Montreal (Pangram Pangram) — sans

### Type classes (use these, don't invent new ones)
- `.display-lg` — Louize 96px, weight 400, leading 95%, tracking -5%
- `.display-lg-bold` — Louize 96px, weight 700
- `.display-md` — Louize 64px, weight 700
- `.display-sm` — Louize 40px, weight 700

### Brand colours
| Token | Hex | Usage |
|---|---|---|
| `spring-green` | #5CE65C | Primary CTA, accents |
| `core-black` | #000000 | Text on light |
| `mist-grey` | #F1ECE9 | Light mode background |
| `winter-green` | #B9FFB2 | Secondary accent |
| `bloom-lavender` | #EDC1F6 | Secondary accent |
| `sky-blue` | #ADD8F6 | Secondary accent |
| `sunny-yellow` | #FFDC7C | Secondary accent |
| `hyper-blue` | #619EF1 | Secondary accent |
| `dream-lilac` | #DCE0FA | Secondary accent |

### CTA button pattern
```tsx
<Link className="inline-flex h-11 items-center px-8 rounded-full bg-spring-green text-core-black font-sans font-medium text-sm transition-colors hover:bg-spring-green/90">
  Join Free
</Link>
```

---

## Video (Cloudflare Stream)

Chosen over Mux for lower cost — pay-per-minute stored/viewed, no seat fees.

**Upload flow (Direct Creator Upload):**
1. Client calls `POST /api/videos/upload-url` → server requests a one-time upload URL from Cloudflare
2. Client uploads the file directly to Cloudflare (no server bandwidth used)
3. Cloudflare returns the video `uid`; client saves it via `POST /api/videos`

**Key values (set in `.env.local`):**
```
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_STREAM_API_TOKEN=
```

**Useful URLs:**
- Player iframe: `https://iframe.videodelivery.net/{uid}`
- Thumbnail: `https://videodelivery.net/{uid}/thumbnails/thumbnail.jpg`
- API docs: https://developers.cloudflare.com/stream/

**Prisma field:** `streamId String?` on the `Video` model (replaces the old `muxAssetId` / `muxPlaybackId` fields).

---

## Auth (Clerk v7)
- `ClerkProvider` wraps the app in `layout.tsx`
- Protected routes defined in `src/proxy.ts` (Next.js 16 uses `proxy.ts` not `middleware.ts`)
- Currently protected: `/feed`, `/dashboard`, `/admin`
- Sign-in page: `/sign-in` · Sign-up page: `/sign-up`

---

## Pages & Status

| Page | Route | Status |
|---|---|---|
| Landing / Hero + Discover | `/` | ✅ Built — hero, colour placeholders, category filters |
| Sign In | `/sign-in` | ✅ Clerk UI |
| Sign Up | `/sign-up` | ✅ Clerk UI |
| Design system | `/design` | ✅ Internal only |
| Creator profile | `/[username]` | ✅ Built — avatar ring, available-for-work, colour placeholders |
| Upload | `/dashboard/upload` | ✅ Built — Basics / Privacy / Embed tabs, frame picker |
| Settings | `/dashboard/settings` | ✅ Built — Basic info + About Me tabs |
| Video detail | `/v/[id]` | ✅ Built — Cloudflare Stream player, creator sidebar |
| Following feed | `/feed` | 🔲 Not started |
| Search | `/search` | 🔲 Not started |

---

## Key Files
- `src/app/layout.tsx` — Root layout with ClerkProvider + ThemeProvider
- `src/app/page.tsx` — Landing page (hero)
- `src/app/globals.css` — All design tokens + font faces
- `src/components/layout/Header.tsx` — Sticky nav with auth state
- `src/components/layout/Footer.tsx` — Footer
- `src/proxy.ts` — Auth middleware (Clerk)
- `public/images/logo-3d.png` — 3D frendr wordmark (hero asset)
- `public/images/logo-wordmark.svg` etc — Logo variants

---

## Conventions
- Use `font-sans font-medium` for all UI text
- Use display classes for headings, never raw `text-7xl` etc.
- Circular thumbnails use `rounded-full overflow-hidden`
- Hero backgrounds tend to be `bg-white`, app backgrounds use `bg-background` (Mist Grey in light mode)
- Don't add new UI libraries without asking
- Always use Next.js `<Image>` not `<img>`
- Use `<Link>` not `<a>` for internal navigation
