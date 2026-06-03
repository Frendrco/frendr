import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "img.clerk.com"          },
      { hostname: "videodelivery.net"      },
      { hostname: "imagedelivery.net"      },
      { hostname: "*.r2.dev"               },
      { hostname: "img.youtube.com"        },
      { hostname: "i.vimeocdn.com"         },
      { hostname: "*.supabase.co"          },
    ],
  },
};

export default nextConfig;
