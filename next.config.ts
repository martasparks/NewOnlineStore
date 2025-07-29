import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "martas-mebeles-images.s3.amazonaws.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
