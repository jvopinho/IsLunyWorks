import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  output: "standalone",
  compiler: {
    styledComponents: true,
  },
};

export default nextConfig;
