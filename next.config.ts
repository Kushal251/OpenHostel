import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  allowedDevOrigins: ['192.168.102.129'],

  experimental: {
    staleTimes: {
      // Reuse visited route data during client navigation for two minutes.
      dynamic: 120,
      static: 120,
    },
  },
};

export default nextConfig;
