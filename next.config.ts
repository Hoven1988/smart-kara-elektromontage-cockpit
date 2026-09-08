import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
  experimental: {
    serverActions: {
      // Standard-Limit von 1 MB reicht nicht für normale Handyfotos.
      bodySizeLimit: "15mb",
    },
  },
};

export default nextConfig;
