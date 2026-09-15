import { listPosts } from "@/lib/studio/store";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() { return Response.json({ posts: await listPosts() }); }
