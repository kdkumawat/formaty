import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  transpilePackages: ["jsoncrack-react"],
  env: {
    FORMATY_API_URL: process.env.FORMATY_API_URL,
    SITE_URL: process.env.SITE_URL,
    NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
  },
  turbopack: {},
};

export default nextConfig;
