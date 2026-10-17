import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Shared UI is written against react-native primitives; on web they come from react-native-web.
  transpilePackages: ['react-native-web'],
  turbopack: {
    resolveAlias: {
      'react-native': 'react-native-web',
    },
    resolveExtensions: ['.web.tsx', '.web.ts', '.web.js', '.tsx', '.ts', '.jsx', '.js', '.mjs', '.json'],
  },
};

export default nextConfig;
