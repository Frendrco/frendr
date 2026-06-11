# Upload Smoothing Design

**Date:** 2026-06-11  
**Status:** Approved

## Problem

Three friction points in the current upload flow at `/dashboard/upload`:

1. **Upload starts too late.** The TUS upload only begins when the creator clicks the Submit button. For large files this means they fill in all metadata, click Submit, and then wait. The progress bar appears inside the drop zone at the top of the page — far away from the Submit button they just pressed.

2. **No post-upload moment.** After upload + save, the page hard-redirects to `/v/[slug]` or `/recess`. No confirmation, no share link, no next step.

3. **Video detail page shows a dark grey thumbnail until manually refreshed.** Cloudflare Stream takes time to process a newly uploaded video. The video detail page renders before processing completes, leaving the thumbnail and player in a grey placeholder state until the creator refreshes.

---

## Design

### 1. Background upload

The TUS upload begins the moment a file is dropped or selected — no Submit click required. Upload state is tracked independently from form/save state:

```
uploadState: {
  status: 'idle' | 'uploading' | 'complete' | 'error'
  progress: number        // 0–100
  uid: string | null      // Cloudflare stream-media-id
  error: string | null
}
```

The drop zone shows upload progress as it does today, but now it runs *concurrently* with the creator filling in title, thumbnail, categories, etc. By the time they reach the Submit button, the upload is often already done.

**Submit button states:**

| Condition | Label | Enabled |
|---|---|---|
| No file selected | "Upload Video" | No |
| Upload in progress | "Uploading 34%…" | No |
| Upload complete, no title | "Save Video" | No |
| Upload complete, title present | "Save Video" | Yes |
| Saving to DB | "Saving…" | No |

On submit, the TUS step is skipped entirely — we just POST to `/api/videos` with the `uid` already in hand.

**Error handling:**
- If upload fails before submit: show an inline error in the drop zone with a "Try again" action that restarts the TUS upload for the same file.
- If upload fails mid-save (uid captured but POST fails): show error near Submit button, allow retry.
- File size/type validation still happens client-side on select, same as today.

**Scope:** This change applies to single-file Portfolio and Recess upload modes. Batch upload and Import modes are unaffected — they have their own submit flows.

---

### 2. Success screen

After the `/api/videos` POST succeeds, the page transitions to a success state in-place rather than redirecting.

**Contents:**
- Thumbnail preview (or a neutral placeholder if still processing)
- Video title
- Three actions:
  - **View Video** — link to `/v/[slug]`
  - **Copy Link** — copies the full URL to clipboard, button briefly shows "Copied!"
  - **Upload another** — resets the entire form back to the initial empty state

**Processing note:** Always show a soft line beneath the actions on the success screen: *"Still processing — the player will be ready in a moment."* Since the video was just uploaded, it is always still processing at this point. The note is static; the creator will see the real state when they navigate to the video page.

No redirect, no disorientation. The creator gets a moment to share before moving on.

---

### 3. Thumbnail polling on the video detail page

A lightweight client component on `/v/[id]` handles the processing delay.

**New API endpoint:** `GET /api/videos/[id]/stream-status`
- Server-side: calls Cloudflare's video status API using the video's `streamId`
- Returns `{ ready: boolean }`
- Returns `{ ready: true }` for videos without a `streamId` (imported/embed videos)

**Client behaviour:**
- The polling component is mounted for any video that has a `streamId` and was created within the last 30 minutes (checked server-side from the DB `createdAt` field — no extra Cloudflare API call needed)
- On mount, fetch the status endpoint immediately; if already ready, show content and stop
- If not ready, poll every 5 seconds until `ready: true`, then refresh the thumbnail `src` and unhide the player iframe
- Stop polling immediately on success
- Show a subtle "Processing…" badge on the thumbnail placeholder while waiting

**Zero overhead for existing videos:** The server component only renders the polling component when `streamId` is set and `createdAt` is within the 30-minute window. All other videos skip it entirely.

---

## Files affected

| File | Change |
|---|---|
| `src/app/(main)/dashboard/upload/UploadClient.tsx` | Background upload logic, new `uploadState`, updated submit button, success screen |
| `src/app/(main)/v/[id]/page.tsx` | Pass `readyToStream` prop to polling component |
| `src/app/(main)/v/[id]/VideoPlayer.tsx` (or new `ProcessingPoller.tsx`) | Polling client component |
| `src/app/api/videos/[id]/stream-status/route.ts` | New endpoint — calls Cloudflare status API |

---

## Out of scope

- Simplifying the Portfolio form tabs (Basics / Privacy / Embed) — separate task
- Batch upload UX changes
- Import mode changes
- The hardcoded `VIDEO_ID` in the Embed tab (blocked on upload completing first anyway)
