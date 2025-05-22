import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true
  },
  basePath: isDev ? "" : "/product-stock-check",
  assetPrefix: isDev ? "" : "/product-stock-check/",
};

export default nextConfig;
