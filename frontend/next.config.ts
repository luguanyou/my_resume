import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  basePath: "/myresume",
  // 配置 webpack 以支持在 Docker/Windows 环境下进行轮询监听
  webpack: (config, context) => {
    if (context.dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
};

export default nextConfig;
