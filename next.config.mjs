/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  experimental: {
    // Chrome reste hors du bundle (trop lourd) ; @sparticuz/chromium fournit le binaire.
    serverComponentsExternalPackages: ["puppeteer-core", "@sparticuz/chromium", "puppeteer"],
    // ...mais son dossier bin/ (binaire Chrome, non-JS) n'est pas tracé automatiquement.
    // On force son inclusion dans les fonctions qui rendent des visuels.
    outputFileTracingIncludes: {
      "/api/studio/content/**": ["./node_modules/@sparticuz/chromium/**"],
    },
  },
};
export default nextConfig;
