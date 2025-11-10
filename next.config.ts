import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PWA configuration
  serverExternalPackages: ['redis-om', 'redis'],
  webpack: (config, { webpack }) => {
    config.externals = config.externals || [];
    config.externals.push({
      'node:crypto': 'node:crypto',
      'node:diagnostics_channel': 'node:diagnostics_channel',
      'node:net': 'node:net',
      'node:timers/promises': 'node:timers/promises',
      'node:tls': 'node:tls',
    });
    return config;
  },
};

export default nextConfig;
