# Upload Smoothing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Start the TUS upload immediately on file drop, show a success screen after save, and fix the dark grey video thumbnail on the detail page.

**Architecture:** `UploadClient.tsx` gets a new `bgUpload` state object that tracks the background TUS upload independently of the save step. File selection triggers `startBgUpload()`. The submit button waits for `bgUpload.status === 'complete'` before enabling. On successful save, set `savedVideo` state to render a success screen in-place. On the video detail page, pass `thumbnailUrl` to `VideoPlayer` as a `poster` attribute so the `<video>` element shows the thumbnail while HLS loads.

**Tech Stack:** Next.js 15 App Router, TypeScript, tus-js-client, Tailwind v4, Cloudflare Stream

**No test framework is configured in this project.** Each task includes manual verification steps instead.

---

## File Map

| File | What changes |
|---|---|
| `src/app/(main)/dashboard/upload/UploadClient.tsx` | Add `bgUpload` state, `startBgUpload()`, `cancelBgUpload()`, `handleSave()`, success screen, updated drop zone + submit button |
| `src/app/(main)/v/[id]/VideoPlayer.tsx` | Add `thumbnailUrl?: string` prop, use as `poster` on `<video>` |
| `src/app/(main)/v/[id]/page.tsx` | Pass `video.thumbnailUrl` to `VideoPlayer` |

---

## Task 1: Add bgUpload state and startBgUpload()

**Files:**
- Modify: `src/app/(main)/dashboard/upload/UploadClient.tsx`

This task adds the background upload state type, the state itself, a ref to the active TUS instance, and the `startBgUpload` function. No UI changes yet.

- [ ] **Step 1: Add the BgUpload type and state after the existing state declarations**

Find this block (around line 228):
```typescript
  // Submit state
  const [uploading, setUploading]     = useState(false)
  const [progress, setProgress]       = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
```

Add immediately after it:
```typescript
  // Background upload state (single-file modes only)
  type BgUploadStatus = 'idle' | 'uploading' | 'complete' | 'error'
  const [bgUpload, setBgUpload] = useState<{ status: BgUploadStatus; progress: number; uid: string | null; error: string | null }>({ status: 'idle', progress: 0, uid: null, error: null })
  const tusRef = useRef<TusUpload | null>(null)

  // Success screen state
  const [savedVideo, setSavedVideo] = useState<{ id: string; slug: string | null; title: string } | null>(null)
  const [saving, setSaving] = useState(false)
```

- [ ] **Step 2: Add startBgUpload() and cancelBgUpload() after the existing helper functions**

Add these two functions after the `switchMode` function (around line 365):

```typescript
  function cancelBgUpload() {
    if (tusRef.current) {
      try { tusRef.current.abort() } catch { /* ignore */ }
      tusRef.current = null
    }
    setBgUpload({ status: 'idle', progress: 0, uid: null, error: null })
  }

  function startBgUpload(f: File) {
    cancelBgUpload()
    setBgUpload({ status: 'uploading', progress: 0, uid: null, error: null })
    let uid = ''
    const upload = new TusUpload(f, {
      endpoint: "/api/videos/upload-url",
      chunkSize: 150 * 1024 * 1024,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      metadata: {
        name:               title.trim() || f.name,
        filename:           f.name,
        filetype:           f.type,
        maxDurationSeconds: "600",
        allowedOrigins:     "frendr.co,www.frendr.co",
      },
      onAfterResponse: (_req, res) => {
        const mediaId = res.getHeader("stream-media-id")
        if (mediaId) uid = mediaId
      },
      onError: (err) => {
        const status = (err as { originalResponse?: { getStatus: () => number } }).originalResponse?.getStatus()
        if (status === 402) { setShowPaywall(true) }
        setBgUpload({ status: 'error', progress: 0, uid: null, error: 'Upload failed — check your connection and try again.' })
        tusRef.current = null
      },
      onProgress: (bytesUploaded, bytesTotal) => {
        setBgUpload((prev) => ({ ...prev, progress: Math.round((bytesUploaded / bytesTotal) * 100) }))
      },
      onSuccess: () => {
        setBgUpload({ status: 'complete', progress: 100, uid, error: null })
        tusRef.current = null
      },
    })
    tusRef.current = upload
    upload.start()
  }
```

- [ ] **Step 3: Verify the file compiles**

```bash
cd /Users/wonderlust/Developer/frendr && pnpm build 2>&1 | tail -20
```

Expected: no TypeScript errors in `UploadClient.tsx`. (Other errors unrelated to this file are fine.)

- [ ] **Step 4: Commit**

```bash
cd /Users/wonderlust/Developer/frendr
git add src/app/(main)/dashboard/upload/UploadClient.tsx
git commit -m "feat: add background upload state and startBgUpload to UploadClient"
```

---

## Task 2: Wire startBgUpload to file selection

**Files:**
- Modify: `src/app/(main)/dashboard/upload/UploadClient.tsx`

Call `startBgUpload` when a single file is selected (drop or input), and cancel+reset when the user changes their file.

- [ ] **Step 1: Update handleVideoInput to trigger background upload for single-file case**

Find `handleVideoInput` (around line 428):
```typescript
  function handleVideoInput(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length > 1) {
      const items = filesToBatch(files)
      if (items.length) { setBatchFiles(items); setBatchStarted(false) }
    } else {
      const f = files[0]
      if (f && ACCEPTED_VIDEO_TYPES.includes(f.type)) setFile(f)
    }
  }
```

Replace with:
```typescript
  function handleVideoInput(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length > 1) {
      const items = filesToBatch(files)
      if (items.length) { setBatchFiles(items); setBatchStarted(false) }
    } else {
      const f = files[0]
      if (f && ACCEPTED_VIDEO_TYPES.includes(f.type)) {
        setFile(f)
        startBgUpload(f)
      }
    }
  }
```

- [ ] **Step 2: Update handleVideoDrop to trigger background upload for single-file case**

Find `handleVideoDrop` (around line 416):
```typescript
  function handleVideoDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 1) {
      const items = filesToBatch(files)
      if (items.length) { setBatchFiles(items); setBatchStarted(false) }
    } else {
      const f = files[0]
      if (f && ACCEPTED_VIDEO_TYPES.includes(f.type)) setFile(f)
    }
  }
```

Replace with:
```typescript
  function handleVideoDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 1) {
      const items = filesToBatch(files)
      if (items.length) { setBatchFiles(items); setBatchStarted(false) }
    } else {
      const f = files[0]
      if (f && ACCEPTED_VIDEO_TYPES.includes(f.type)) {
        setFile(f)
        startBgUpload(f)
      }
    }
  }
```

- [ ] **Step 3: Reset bgUpload when switchMode is called**

In `switchMode` (around line 365), add a reset after the existing resets:
```typescript
  function switchMode(next: Mode) {
    setMode(next)
    setUploadError(null)
    setProgress(0)
    setUploading(false)
    setDropboxUrlError(null)
    cancelBgUpload()      // ← add this line
    setSavedVideo(null)   // ← add this line
    if (next === "import") {
      setBulkItems([newBulkItem()])
    }
    // ... rest unchanged
  }
```

- [ ] **Step 4: Verify by running dev and selecting a file**

```bash
cd /Users/wonderlust/Developer/frendr && pnpm dev
```

Open http://localhost:3000/dashboard/upload. Select a video file. Open browser DevTools → Network tab. You should see a TUS `POST` request to `/api/videos/upload-url` starting immediately on file select, before clicking any button.

- [ ] **Step 5: Commit**

```bash
cd /Users/wonderlust/Developer/frendr
git add src/app/(main)/dashboard/upload/UploadClient.tsx
git commit -m "feat: trigger background TUS upload on file select"
```

---

## Task 3: Update drop zone UI to show background upload progress

**Files:**
- Modify: `src/app/(main)/dashboard/upload/UploadClient.tsx`

The drop zone's "file selected" state should show live progress during background upload, a ready state when complete, and an error state with retry when failed. This applies to both the Portfolio (tabbed) and Recess drop zones. Both drop zones currently render identical "file selected" JSX — update both.

The "file selected" JSX block (appears twice, inside Portfolio and Recess sections) currently looks like:

```typescript
{file || uploading ? (
  <div ...>
    {uploading ? (
      // old uploading UI
    ) : (
      <div className="flex flex-col items-center gap-3 px-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-spring-green/15">
          <Upload size={20} className="text-spring-green" />
        </div>
        <div>
          <p className="font-sans font-medium text-sm text-core-black">{file!.name}</p>
          <p className="font-sans text-xs text-foreground/40 mt-0.5">{(file!.size / 1024 / 1024).toFixed(1)} MB</p>
        </div>
        <button type="button" onClick={(e) => { e.stopPropagation(); cancelBgUpload(); setFile(null); setThumbnail(null) }}
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 font-sans text-xs text-foreground/50 hover:border-foreground/30 hover:text-foreground transition-colors"
        >
          <X size={11} /> Change file
        </button>
      </div>
    )}
  </div>
) : (
  // empty drop zone
)}
```

- [ ] **Step 1: Replace the file-selected inner content in both drop zones**

For BOTH the Portfolio drop zone (`{tab === "basics" && ...}`) and the Recess drop zone, replace the entire `{file || uploading ? ... : ...}` block's inner content with this unified version:

```typescript
{file ? (
  <div
    onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
    onDragLeave={() => setDragging(false)}
    onDrop={handleVideoDrop}
    className="relative flex aspect-video w-full flex-col items-center justify-center rounded-2xl border-2 border-border transition-all duration-150"
  >
    {bgUpload.status === 'error' ? (
      <div className="flex flex-col items-center gap-3 px-8 text-center">
        <p className="font-sans text-sm font-medium text-red-500">Upload failed</p>
        <p className="font-sans text-xs text-foreground/40">{bgUpload.error}</p>
        <button
          type="button"
          onClick={() => startBgUpload(file)}
          className="inline-flex items-center gap-1.5 rounded-full bg-core-black px-4 py-1.5 font-sans text-xs font-medium text-white hover:bg-spring-green hover:text-core-black transition-colors"
        >
          Try again
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); cancelBgUpload(); setFile(null); setThumbnail(null) }}
          className="inline-flex items-center gap-1.5 font-sans text-xs text-foreground/40 hover:text-foreground transition-colors"
        >
          <X size={11} /> Choose a different file
        </button>
      </div>
    ) : bgUpload.status === 'uploading' ? (
      <div className="flex w-full flex-col items-center gap-4 px-8 text-center">
        <p className="font-sans text-sm font-medium text-core-black">Uploading…</p>
        <div className="w-full max-w-xs">
          <div className="mb-2 flex items-center justify-between">
            <span className="max-w-[180px] truncate font-sans text-xs text-foreground/50">{file.name}</span>
            <span className="font-sans text-xs text-foreground/50">{bgUpload.progress}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
            {bgUpload.progress === 0 || bgUpload.progress === 100 ? (
              <div className="h-full w-full animate-pulse rounded-full bg-spring-green/50" />
            ) : (
              <div className="h-full rounded-full bg-spring-green transition-all duration-500" style={{ width: `${bgUpload.progress}%` }} />
            )}
          </div>
        </div>
      </div>
    ) : (
      <div className="flex flex-col items-center gap-3 px-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-spring-green/15">
          <Upload size={20} className="text-spring-green" />
        </div>
        <div>
          <p className="font-sans font-medium text-sm text-core-black">{file.name}</p>
          <p className="font-sans text-xs text-foreground/40 mt-0.5">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); cancelBgUpload(); setFile(null); setThumbnail(null) }}
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 font-sans text-xs text-foreground/50 hover:border-foreground/30 hover:text-foreground transition-colors"
        >
          <X size={11} /> Change file
        </button>
      </div>
    )}
  </div>
) : (
  // ← the existing empty drop zone label stays unchanged
)}
```

- [ ] **Step 2: Verify progress UI in dev**

```bash
cd /Users/wonderlust/Developer/frendr && pnpm dev
```

Open http://localhost:3000/dashboard/upload. Drop or select a video file. The drop zone should immediately show "Uploading… X%" with an animated green progress bar. When complete, it should show the file name + size + "Change file" button.

- [ ] **Step 3: Commit**

```bash
cd /Users/wonderlust/Developer/frendr
git add src/app/(main)/dashboard/upload/UploadClient.tsx
git commit -m "feat: show background upload progress in drop zone"
```

---

## Task 4: Update submit button and add handleSave()

**Files:**
- Modify: `src/app/(main)/dashboard/upload/UploadClient.tsx`

Replace `handleUpload()` with `handleSave()` that just POSTs to `/api/videos` with the already-captured `bgUpload.uid`. Update the single-file submit button to reflect `bgUpload.status` and `saving`.

- [ ] **Step 1: Add handleSave() — the new single-file submit handler**

Add this function after `startBgUpload` / `cancelBgUpload`:

```typescript
  async function handleSave() {
    if (bgUpload.status !== 'complete' || !bgUpload.uid || !title.trim()) return
    setSaving(true)
    setUploadError(null)
    try {
      const effectiveThumbnail = videoType === "RECESS" && !thumbnail && videoFrames.length > 0
        ? videoFrames[0]
        : thumbnail
      const res = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          streamId:      bgUpload.uid,
          title:         title.trim(),
          description:   description || null,
          categories,
          tags,
          visibility:    toApiVisibility(visibility),
          password:      password.trim() || null,
          hideFromFeeds,
          allowComments,
          allowDownloads,
          isAiGenerated,
          videoType,
          thumbnailUrl:  effectiveThumbnail || null,
          collaborators: collabs.map((c) => ({ userId: c.id, role: c.role.trim() || null })),
        }),
      })
      if (!res.ok) throw new Error("Could not save video")
      const video = await res.json() as { id: string; slug?: string | null }
      setSavedVideo({ id: video.id, slug: video.slug ?? null, title: title.trim() })
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setSaving(false)
    }
  }
```

- [ ] **Step 2: Remove the old handleUpload() function**

Delete the entire `handleUpload` function (from `async function handleUpload()` through its closing `}`). It is no longer called anywhere in single-file mode.

- [ ] **Step 3: Update the single-file submit button**

There is one submit button shared by Portfolio and Recess single-file modes, just above the closing of the batch check (around line 1617):

```typescript
<button
  type="button"
  onClick={handleUpload}
  disabled={!file || !title.trim() || uploading}
  className="inline-flex h-10 items-center rounded-full bg-core-black px-6 font-sans font-medium text-sm text-white transition-colors hover:bg-spring-green hover:text-core-black disabled:opacity-35 disabled:cursor-not-allowed"
>
  {uploading ? (progress < 100 ? "Uploading…" : "Finalising…") : videoType === "RECESS" ? "Drop into Recess" : "Upload Video"}
</button>
```

Replace with:

```typescript
<button
  type="button"
  onClick={handleSave}
  disabled={bgUpload.status !== 'complete' || !title.trim() || saving}
  className="inline-flex h-10 items-center rounded-full bg-core-black px-6 font-sans font-medium text-sm text-white transition-colors hover:bg-spring-green hover:text-core-black disabled:opacity-35 disabled:cursor-not-allowed"
>
  {saving
    ? "Saving…"
    : bgUpload.status === 'uploading'
    ? `Uploading ${bgUpload.progress}%…`
    : bgUpload.status === 'error'
    ? "Upload failed"
    : videoType === "RECESS"
    ? "Drop into Recess"
    : "Save Video"}
</button>
```

- [ ] **Step 4: Verify full flow in dev**

```bash
cd /Users/wonderlust/Developer/frendr && pnpm dev
```

1. Go to http://localhost:3000/dashboard/upload
2. Select a video file — upload starts immediately, progress bar appears in drop zone
3. Fill in a title while the upload runs
4. When upload completes, the "Save Video" button becomes enabled
5. Click "Save Video" — button shows "Saving…" briefly, then the page redirects to the video detail page (redirect is still happening — success screen comes in Task 5)

- [ ] **Step 5: Commit**

```bash
cd /Users/wonderlust/Developer/frendr
git add src/app/(main)/dashboard/upload/UploadClient.tsx
git commit -m "feat: replace handleUpload with handleSave, background upload drives submit state"
```

---

## Task 5: Add success screen

**Files:**
- Modify: `src/app/(main)/dashboard/upload/UploadClient.tsx`

When `savedVideo` is set, render a success screen instead of the form. The success screen shows the thumbnail, title, and three actions: View Video, Copy Link, Upload another.

- [ ] **Step 1: Add a copied state for the Copy Link button**

Find the existing `const [copied, setCopied] = useState(false)` line — it's already there for the embed copy button. Add a separate one for the share link copy:

```typescript
const [linkCopied, setLinkCopied] = useState(false)
```

- [ ] **Step 2: Add the success screen as the first thing rendered inside the main content div**

Inside the `<div className="mx-auto max-w-3xl px-4 md:px-6 py-10">` (around line 1081), add this block immediately after the opening div, before the `{/* Back */}` link:

```typescript
{/* ══ SUCCESS SCREEN ══════════════════════════════════ */}
{savedVideo && (
  <div className="flex flex-col items-center gap-8 py-10 text-center">
    {thumbnail ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={thumbnail}
        alt={savedVideo.title}
        className="w-full max-w-md rounded-2xl object-cover aspect-video bg-foreground/5"
      />
    ) : (
      <div className="flex w-full max-w-md aspect-video items-center justify-center rounded-2xl bg-foreground/5">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-foreground/40" />
      </div>
    )}

    <div className="flex flex-col gap-1">
      <h1 className="font-sans font-bold text-2xl text-core-black">{savedVideo.title}</h1>
      <p className="font-sans text-sm text-foreground/40">Still processing — the player will be ready in a moment.</p>
    </div>

    <div className="flex flex-wrap items-center justify-center gap-3">
      <Link
        href={`/v/${savedVideo.slug ?? savedVideo.id}`}
        className="inline-flex h-11 items-center px-8 rounded-full bg-spring-green text-core-black font-sans font-medium text-sm transition-colors hover:bg-spring-green/90"
      >
        View Video
      </Link>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard.writeText(`${window.location.origin}/v/${savedVideo.slug ?? savedVideo.id}`)
          setLinkCopied(true)
          setTimeout(() => setLinkCopied(false), 2000)
        }}
        className="inline-flex h-11 items-center gap-2 px-8 rounded-full border border-border font-sans font-medium text-sm text-foreground/70 transition-colors hover:border-foreground/40 hover:text-foreground"
      >
        <Copy size={14} />
        {linkCopied ? "Copied!" : "Copy Link"}
      </button>
      <button
        type="button"
        onClick={() => {
          setSavedVideo(null)
          setFile(null)
          cancelBgUpload()
          setTitle("")
          setDescription("")
          setCategories([])
          setTags([])
          setThumbnail(null)
          setSelectedFrame(null)
          setVideoFrames([])
          setTab("basics")
          setCollabs([])
          setUploadError(null)
        }}
        className="font-sans text-sm text-foreground/40 hover:text-foreground transition-colors"
      >
        Upload another
      </button>
    </div>
  </div>
)}
```

- [ ] **Step 3: Wrap the rest of the page content so it only renders when savedVideo is null**

After the success screen block and before the `{/* Back */}` link, add:

```typescript
{!savedVideo && (
  <>
```

And close it with `</>}` just before the closing `</div>` of the `max-w-3xl` container.

- [ ] **Step 4: Verify success screen in dev**

```bash
cd /Users/wonderlust/Developer/frendr && pnpm dev
```

1. Upload a video with a title
2. After "Save Video" completes, the form disappears and the success screen appears
3. "View Video" navigates to the video page
4. "Copy Link" copies the URL and briefly shows "Copied!"
5. "Upload another" resets the form to its empty initial state

- [ ] **Step 5: Commit**

```bash
cd /Users/wonderlust/Developer/frendr
git add src/app/(main)/dashboard/upload/UploadClient.tsx
git commit -m "feat: show success screen after video save instead of redirecting"
```

---

## Task 6: Fix dark grey thumbnail on video detail page

**Files:**
- Modify: `src/app/(main)/v/[id]/VideoPlayer.tsx`
- Modify: `src/app/(main)/v/[id]/page.tsx`

The `<video>` element has no `poster` attribute, so it renders a black/grey box while HLS.js initialises and buffers. Adding the video's `thumbnailUrl` as the poster fixes this immediately. The existing `router.refresh()` polling in VideoPlayer already handles the `processing → ready` transition.

- [ ] **Step 1: Add thumbnailUrl prop to VideoPlayer**

In `VideoPlayer.tsx`, update the `Props` interface:

```typescript
interface Props {
  streamId:      string | null
  externalUrl:   string | null
  title:         string
  thumbnailUrl?: string | null   // ← add this
  streamStatus?: StreamStatus
  autoPlay?:     boolean
  loop?:         boolean
}
```

Update the function signature:

```typescript
export function VideoPlayer({ streamId, externalUrl, title, thumbnailUrl, streamStatus = "unknown", autoPlay = false, loop = false }: Props) {
```

- [ ] **Step 2: Add poster to the <video> element**

Find the ready/HLS `<video>` element (around line 136):

```typescript
<video
  ref={videoRef}
  controls
  autoPlay={autoPlay}
  loop={loop}
  muted={autoPlay}
  className="absolute inset-0 h-full w-full bg-black"
/>
```

Replace with:

```typescript
<video
  ref={videoRef}
  controls
  autoPlay={autoPlay}
  loop={loop}
  muted={autoPlay}
  poster={thumbnailUrl ?? undefined}
  className="absolute inset-0 h-full w-full bg-black"
/>
```

- [ ] **Step 3: Pass thumbnailUrl from page.tsx**

In `page.tsx`, find the `<VideoPlayer>` usage (around line 216):

```typescript
<VideoPlayer
  streamId={video.streamId}
  externalUrl={video.externalUrl}
  title={video.title}
  streamStatus={streamStatus}
  autoPlay={video.embedAutoplay || video.videoType === "RECESS"}
  loop={video.embedLoop || video.videoType === "RECESS"}
/>
```

Replace with:

```typescript
<VideoPlayer
  streamId={video.streamId}
  externalUrl={video.externalUrl}
  title={video.title}
  thumbnailUrl={video.thumbnailUrl}
  streamStatus={streamStatus}
  autoPlay={video.embedAutoplay || video.videoType === "RECESS"}
  loop={video.embedLoop || video.videoType === "RECESS"}
/>
```

- [ ] **Step 4: Verify poster in dev**

```bash
cd /Users/wonderlust/Developer/frendr && pnpm dev
```

Navigate to any existing video detail page that has a `thumbnailUrl`. Before the video plays, you should see the thumbnail image instead of a grey box. It should disappear naturally when HLS loads the first frame.

- [ ] **Step 5: Commit**

```bash
cd /Users/wonderlust/Developer/frendr
git add src/app/(main)/v/[id]/VideoPlayer.tsx src/app/(main)/v/[id]/page.tsx
git commit -m "fix: show video thumbnail as poster while HLS loads"
```

---

## Done

All three changes are independent and can be verified separately:

1. **Background upload** — file selected → upload starts → progress visible in drop zone → submit enabled when complete
2. **Success screen** — after save, form replaced with thumbnail + title + View/Copy/Upload another
3. **Poster attribute** — no more grey box on the video detail page while HLS buffers
