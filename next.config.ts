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
  async rewrites() {
    return [{ source: "/favicon.ico", destination: "/icon.svg" }];
  },
};

export default nextConfig;
