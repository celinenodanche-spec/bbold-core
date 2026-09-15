/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  // Chrome (rendu des visuels) reste hors du bundle serverless : trop lourd à bundler,
  // @sparticuz/chromium fournit le binaire sur Vercel.
  experimental: {
    serverComponentsExternalPackages: ["puppeteer-core", "@sparticuz/chromium", "puppeteer"],
  },
};
export default nextConfig;
