import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options",  value: "nosniff" },
  { key: "X-Frame-Options",         value: "SAMEORIGIN" },
  { key: "X-XSS-Protection",        value: "1; mode=block" },
  { key: "Referrer-Policy",         value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy",      value: "camera=(), microphone=(), geolocation=()" },
]

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }]
  },
  images: {
    remotePatterns: [
      { hostname: "img.clerk.com"          },
      { hostname: "videodelivery.net"      },
      { hostname: "imagedelivery.net"      },
      { hostname: "*.r2.dev"               },
      { hostname: "img.youtube.com"        },
      { hostname: "i.vimeocdn.com"         },
      { hostname: "*.supabase.co"          },
      { hostname: "public.rive.app"        },
    ],
  },
};

export default nextConfig;
