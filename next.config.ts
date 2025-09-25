import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  // Only use basePath and assetPrefix for production builds
  ...(process.env.NODE_ENV === 'production' && {
    basePath: '/korysmiditoolbox',
    assetPrefix: '/korysmiditoolbox',
  }),
  images: {
    unoptimized: true
  },
  reactStrictMode: true,
};

export default nextConfig;
