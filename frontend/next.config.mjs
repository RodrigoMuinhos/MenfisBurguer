/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  async redirects() {
    return [
      {
        source: "/KDS",
        destination: "/kds",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
