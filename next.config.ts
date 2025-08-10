import { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "martas-mebeles-images.s3.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https", 
        hostname: "martas-mebeles-images.s3.eu-north-1.amazonaws.com",
        pathname: "/**",
      },
    ],
  },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);