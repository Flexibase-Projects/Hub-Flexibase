import type { NextConfig } from "next";

/** Hosts adicionais para HMR e scripts internos em dev (acesso por IP na rede local). */
const LAN_DEV_HOST_PATTERNS = [
  "127.0.0.1",
  "192.168.*.*",
  "10.*.*.*",
  "172.*.*.*",
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",
  allowedDevOrigins: LAN_DEV_HOST_PATTERNS,
  experimental: {
    serverActions: {
      // Accept banner uploads up to the app-level 10 MB limit plus multipart overhead.
      bodySizeLimit: "12mb",
    },
  },
  async rewrites() {
    return [{ source: "/favicon.ico", destination: "/icon.svg" }];
  },
};

export default nextConfig;
