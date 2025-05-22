import type { NextConfig } from "next";

const isProd = process.env.NODE_NODE_ENV === 'production';

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true
  },
  basePath: isProd ? '/product-stock-check' : '',
  assetPrefix: isProd ? '/product-stock-check/' : '',
};

export default nextConfig;
