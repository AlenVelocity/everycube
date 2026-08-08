/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next 14 build workers intermittently crash with 0xC0000409 on Windows;
  // running static generation in-process avoids it.
  experimental: {
    workerThreads: false,
    cpus: 1,
  },
};

export default nextConfig;
