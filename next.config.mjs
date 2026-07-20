/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/app',
        destination: '/dashboard',
        permanent: true,
      },
      {
        source: '/app/:path*',
        destination: '/dashboard/:path*',
        permanent: true,
      },
    ];
  },
  async rewrites() {
    const backendUrl = process.env.BACKEND_API_URL || "http://localhost:3003";
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
