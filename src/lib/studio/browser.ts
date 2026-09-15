/**
 * Lanceur Chrome headless, adapté à l'environnement :
 *  - LOCAL : puppeteer complet (Chrome mis en cache par `puppeteer browsers install`).
 *  - VERCEL / Lambda : puppeteer-core + @sparticuz/chromium (binaire compatible
 *    serverless). Détecté via VERCEL / AWS_LAMBDA_FUNCTION_NAME.
 */
import type { Browser } from "puppeteer-core";

const isServerless = (): boolean => !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;

export async function launchBrowser(): Promise<Browser> {
  if (isServerless()) {
    const chromium = (await import("@sparticuz/chromium")).default;
    const puppeteer = await import("puppeteer-core");
    return puppeteer.launch({
      args: [...chromium.args, "--disable-dev-shm-usage"],
      executablePath: await chromium.executablePath(),
      headless: true,
      defaultViewport: { width: 1080, height: 1350 },
    }) as unknown as Browser;
  }
  // Local : import non statique pour que le bundler serverless ne trace pas puppeteer complet.
  const mod = "puppeteer";
  const puppeteer = await import(/* webpackIgnore: true */ mod);
  return puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"] }) as unknown as Browser;
}
