import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  transpilePackages: ["jsoncrack-react"],
  env: {
    FORMATY_API_URL: process.env.FORMATY_API_URL,
    SITE_URL: process.env.SITE_URL,
  },
  turbopack: {},
};

export default nextConfig;
