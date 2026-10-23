import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  allowedDevOrigins: ["10.97.109.*", "192.168.0.*", "192.168.*.*"],
};

export default nextConfig;