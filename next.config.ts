import type { NextConfig } from "next";
import path from "path";

// Your Express/Node backend (the one that serves /api/...)
const API_ORIGIN = process.env.API_ORIGIN || "http://192.168.200.161:5000"  ;

const nextConfig: NextConfig = {
  // Allow your network IP / localhost while running `npm run dev`
  allowedDevOrigins: ["192.168.200.161", "localhost", "*.trycloudflare.com",],

  // Removes the pnpm-workspace warning
  outputFileTracingRoot: path.resolve(process.cwd()),

  // Forward every /api/... call from Next.js to your backend
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_ORIGIN}/api/:path*`,
      },
      { source: "/imageUploads/:path*", destination: `${API_ORIGIN}/imageUploads/:path*` },
    ];
  },
};

export default nextConfig;