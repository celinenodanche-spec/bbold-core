import { listPosts } from "@/lib/studio/store";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const brand = new URL(req.url).searchParams.get("brand") || undefined;
  return Response.json({ posts: await listPosts(brand) });
}
