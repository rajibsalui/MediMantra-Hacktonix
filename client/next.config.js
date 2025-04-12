/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['plus.unsplash.com', 'images.unsplash.com','via.placeholder.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.unsplash.com',
      },
    ],
  },
  // Handle symlink issues
  webpack: (config, { isServer }) => {
    config.resolve.symlinks = false;
    return config;
  },
  
  // Disable new static export behavior that might cause symlink issues
  output: 'standalone',
}

module.exports = nextConfig;