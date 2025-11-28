/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  basePath: "", // nooit "undefined"
  assetPrefix: "", // leeg = standaard /_next/
  experimental: {
    // niets exotisch
  },
  async redirects() {
    return [
      {
        source: "/dashboard",
        destination: "/",
        permanent: true,
      },
    ];
  },
};
export default nextConfig;
