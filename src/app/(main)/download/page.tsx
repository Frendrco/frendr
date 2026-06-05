import Image from "next/image"
import Link from "next/link"
import { InstallButton } from "./InstallButton"

const PLATFORMS = [
  {
    id: "chrome",
    label: "Chrome / Edge",
    subtitle: "Desktop & Android",
    color: "bg-spring-green/20",
    steps: [
      "Open frendr.co in Chrome or Edge",
      'Click the install icon in the address bar (or the ⋮ menu → "Install Frendr")',
      "Click Install in the prompt",
      "Frendr opens as a standalone app — find it in your dock or start menu",
    ],
  },
  {
    id: "ios",
    label: "iPhone / iPad",
    subtitle: "Safari required",
    color: "bg-sky-blue/30",
    steps: [
      "Open frendr.co in Safari",
      "Tap the Share button at the bottom of the screen",
      'Scroll down and tap "Add to Home Screen"',
      'Tap "Add" — Frendr appears on your home screen like any app',
    ],
  },
  {
    id: "mac",
    label: "Mac",
    subtitle: "Safari on macOS Sonoma+",
    color: "bg-bloom-lavender/40",
    steps: [
      "Open frendr.co in Safari",
      'In the menu bar, go to File → "Add to Dock"',
      "Frendr opens as a standalone app in your dock",
      "On older macOS: use Chrome or Edge for the best install experience",
    ],
  },
]

const FEATURES = [
  {
    icon: "🔔",
    title: "Push notifications",
    description: "Get notified when someone follows you, likes your work, or replies to a thread.",
  },
  {
    icon: "⚡",
    title: "App-like speed",
    description: "No browser chrome. Opens straight to Frendr, full screen, instantly.",
  },
  {
    icon: "📱",
    title: "Works on everything",
    description: "Mac, Windows, iPhone, Android. One app, every device.",
  },
  {
    icon: "🔒",
    title: "No app store needed",
    description: "Install directly from the browser. No downloads, no updates to manage.",
  },
]

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-white text-core-black">

      {/* ── Hero ── */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-screen-xl px-4 md:px-6 py-20 md:py-28 flex flex-col items-center text-center gap-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-spring-green shadow-md p-4">
            <Image
              src="/images/logo-symbol.svg"
              alt="Frendr"
              width={64}
              height={64}
              className="h-full w-full object-contain"
            />
          </div>

          <div className="flex flex-col items-center gap-3">
            <h1 className="display-md text-core-black">
              Frendr on your desktop
            </h1>
            <p className="font-sans text-lg text-foreground/60 max-w-md">
              Install Frendr as an app. Get push notifications, open instantly, and skip the browser.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <InstallButton />
            <Link
              href="/"
              className="inline-flex h-11 items-center px-8 rounded-full border border-border font-sans font-medium text-sm text-foreground/60 transition-colors hover:border-foreground/30 hover:text-foreground"
            >
              Open in browser
            </Link>
          </div>

          <p className="font-sans text-xs text-foreground/40">
            Free forever · No app store required · Works on Mac, Windows, iOS, Android
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-screen-xl px-4 md:px-6 py-16 flex flex-col gap-16">

        {/* ── Features ── */}
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map(f => (
              <div
                key={f.title}
                className="flex flex-col gap-2 rounded-2xl border border-border p-6"
              >
                <span className="text-2xl">{f.icon}</span>
                <p className="font-sans font-semibold text-sm text-core-black">{f.title}</p>
                <p className="font-sans text-sm text-foreground/50 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Platform instructions ── */}
        <section className="flex flex-col gap-6">
          <div>
            <h2 className="font-sans font-bold text-xl text-core-black">How to install</h2>
            <p className="mt-1 font-sans text-sm text-foreground/50">Pick your device below.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLATFORMS.map(p => (
              <div key={p.id} className={`rounded-2xl p-6 flex flex-col gap-4 ${p.color}`}>
                <div>
                  <p className="font-sans font-bold text-base text-core-black">{p.label}</p>
                  <p className="font-sans text-xs text-foreground/50 mt-0.5">{p.subtitle}</p>
                </div>
                <ol className="flex flex-col gap-3">
                  {p.steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-core-black/10 font-sans font-bold text-xs text-core-black/60">
                        {i + 1}
                      </span>
                      <span className="font-sans text-sm text-core-black/70 leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </section>

        {/* ── Bottom CTA ── */}
        <section className="rounded-2xl bg-spring-green px-8 py-12 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-1">
            <p className="font-sans font-bold text-lg text-core-black">Already a member?</p>
            <p className="font-sans text-sm text-core-black/50">Sign in and start sharing your work.</p>
          </div>
          <Link
            href="/sign-in"
            className="shrink-0 inline-flex h-11 items-center px-8 rounded-full bg-core-black text-white font-sans font-medium text-sm transition-transform hover:scale-105"
          >
            Sign in
          </Link>
        </section>

      </div>
    </div>
  )
}
