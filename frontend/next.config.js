/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  images: {
    domains: ['icgwpkroorulmsfdiuoh.supabase.co'],
  }
};

module.exports = nextConfig;
