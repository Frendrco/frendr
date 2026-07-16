# Replace Video File — Design

## Problem

The "Edit video" modal (`VideoOwnerActions.tsx`) lets creators edit a video's
title, description, categories, and thumbnail, but there is no way to swap the
underlying video file. A disabled "Replace video" stub already exists in the
Basics tab (lines 534-550) but is not wired to anything, and the API has no
path to change a video's `streamId`.

## Goal

Let a video owner replace the underlying Cloudflare Stream file from the Edit
modal while **keeping the same video record** — same slug/URL, view count,
likes, comments, tags, and collaborators. Only the file (and its derived
duration/auto-thumbnail) changes.

## Non-goals

- No new database fields or tables.
- No cleanup of orphaned Cloudflare uploads (see Tradeoffs).
- No re-encoding/processing state UI (the unused `isProcessed` flag stays as-is).

## User flow

1. In the Basics tab, the creator clicks **Replace video** → a hidden
   `<input type="file" accept="video/*">` opens.
2. On file pick → a confirm dialog:
   > "Replace the video file? The current file will be permanently deleted when
   > you save. Views, likes, comments, and the link stay the same."
   Cancel / Replace.
3. On confirm → a background **TUS upload** starts. The row shows a progress
   bar. When it finishes, the row shows "New video ready — save to apply."
4. The new Cloudflare `uid` is held in component state.
5. **Save changes** includes the new `uid` as `streamId` in the PATCH body.
   If the replacement upload is still in flight, Save is blocked with
   "Video still uploading…".

## Client — `src/components/video/VideoOwnerActions.tsx`

Wire the existing stub (lines 534-550) into a working control.

New state:
- `replaceUpload: { status: 'idle' | 'uploading' | 'complete' | 'error'; progress: number; uid?: string }`

Behavior mirrors `startBgUpload` in
`src/app/(main)/dashboard/upload/UploadClient.tsx` (lines 410-454):
- `POST /api/videos/upload-url` with `{ fileSize, name, filename, filetype }`
  → `{ uploadUrl, uid }`.
- `new TusUpload(file, { uploadUrl, chunkSize: 150MB, retryDelays, onProgress, onSuccess })`.
- `onProgress` updates `replaceUpload.progress`; `onSuccess` sets
  `status: 'complete'` and stores `uid`.

`handleSave` (lines 223-264): if `replaceUpload.status === 'complete'`, add
`streamId: replaceUpload.uid` to the PATCH body. If `replaceUpload.status ===
'uploading'`, block save (disable button + inline "Video still uploading…").

## Server — `PATCH /api/videos/[id]` (`src/app/api/videos/[id]/route.ts`)

Accept an optional `streamId` in the body. When present **and different** from
the current `video.streamId`:

1. Capture `oldStreamId = video.streamId`.
2. Set `data.streamId = newStreamId`.
3. **Thumbnail:** if the current `video.thumbnailUrl` was auto-derived from the
   old stream (i.e. contains `oldStreamId`), regenerate it from the new stream's
   default:
   `https://videodelivery.net/${newStreamId}/thumbnails/thumbnail.jpg?time=1s&width=1280`.
   If `thumbnailUrl` is a custom R2 upload (does not contain `oldStreamId`),
   leave it untouched.
4. **Duration:** reset and repopulate from the new stream using the same async
   fetch pattern as `POST /api/videos` (GET
   `.../stream/${newStreamId}` → `result.duration` → update `video.duration`).
5. After the DB update succeeds, **delete the old Cloudflare asset** by reusing
   the CF call from the DELETE handler (lines 162-170):
   `DELETE https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${oldStreamId}`.
   Old-asset deletion is best-effort; a failure here does not fail the request
   (the DB already points at the new stream).

Ownership check (`video.userId !== user.id → 403`) already guards the route and
applies unchanged.

## Data flow summary

```
pick file → POST /api/videos/upload-url → { uploadUrl, uid }
          → TUS upload bytes to Cloudflare
          → hold uid in state
Save      → PATCH /api/videos/[id] { ...fields, streamId: uid }
          → swap streamId, regen auto-thumbnail, reset duration,
            delete old CF asset (best-effort)
```

## Tradeoffs (accepted)

- **Orphaned upload on Cancel:** if a replacement is uploaded but the creator
  clicks Cancel instead of Save, the new Cloudflare asset exists but is unused,
  and the old asset stays intact. Accepted — no cleanup logic for now.
- **Confirm at file-pick:** the confirm fires before the upload starts (so a
  large file is not uploaded by accident), with wording that the old file is
  deleted on save.

## Testing

- **Server (PATCH):** replacing `streamId` updates the record, regenerates an
  auto-derived thumbnail, leaves a custom thumbnail untouched, resets duration,
  and attempts old-asset deletion. A non-owner gets 403. Omitting `streamId`
  leaves the file unchanged (existing behavior).
- **Client:** file pick shows the confirm; confirming starts the upload and
  shows progress; Save is blocked while uploading and sends `streamId` once
  complete; Cancel discards the pending `uid`.
- **Manual:** replace a real video, confirm the slug/URL, views, and comments
  persist and the player shows the new file after save + reload.
