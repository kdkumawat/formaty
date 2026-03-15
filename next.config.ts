import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  transpilePackages: ["jsoncrack-react"],
  webpack: (config) => {
    config.resolve.conditionNames = [
      "import",
      ...(config.resolve.conditionNames ?? []),
    ];
    return config;
  },
};

export default nextConfig;
