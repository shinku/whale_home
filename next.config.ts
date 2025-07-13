import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  distDir: "./dist",
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fms.whalepea.com',
        // 可选：限制特定路径
        // pathname: '/upload/**',
      },
      // 可以添加更多允许的域名
      {
        protocol: 'https',
        hostname: '**.whalepea.com', // 使用通配符允许所有子域名
      },
    ],
  },
};

export default nextConfig;
