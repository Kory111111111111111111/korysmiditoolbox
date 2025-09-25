import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: '/korysmiditoolbox',
  assetPrefix: '/korysmiditoolbox',
  images: {
    unoptimized: true
  },
  reactStrictMode: true,
};

export default nextConfig;
