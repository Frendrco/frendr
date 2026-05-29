import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "img.clerk.com"          },
      { hostname: "videodelivery.net"      },
      { hostname: "imagedelivery.net"      },
    ],
  },
};

export default nextConfig;
