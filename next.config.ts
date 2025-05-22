import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true
  },
  basePath: '/product-stock-check',
  assetPrefix: '/product-stock-check/',
};

export default nextConfig;
