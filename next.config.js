/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export' retiré → active les API routes (Claude streaming)
  images: { unoptimized: true },
}
module.exports = nextConfig
