
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/digitransit/:path*',
        destination: 'https://api.digitransit.fi/routing/v2/routers/hsl/index/graphql/:path*', // Updated to v2
      },
    ];
  },
};

export default nextConfig;
