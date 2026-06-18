/** @type {import('next').NextConfig} */
const apiTarget = process.env.API_PROXY_TARGET || "http://localhost:8787";

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@ark/shared"],
  async rewrites() {
    // Proxy API + socket.io through the web origin so the browser only needs one
    // host (reverse-proxy friendly; PLANNING.md → UI access).
    return [
      { source: "/api/:path*", destination: `${apiTarget}/api/:path*` },
      { source: "/socket.io/:path*", destination: `${apiTarget}/socket.io/:path*` },
    ];
  },
};

export default nextConfig;
