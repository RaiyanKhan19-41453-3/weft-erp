import { getViewer, hasPermission } from "@/lib/auth-guards";
import { previewOrderCsv } from "@/lib/csv-import";

export async function POST(request: Request) {
  const viewer = await getViewer();
  if (!viewer.authenticated) return Response.json({ error: "Sign in required." }, { status: 401 });
  if (!hasPermission(viewer, "order", "create")) {
    return Response.json({ error: "Your role cannot import orders." }, { status: 403 });
  }

  const text = await request.text();
  if (text.length > 100_000) {
    return Response.json({ error: "CSV is too large." }, { status: 413 });
  }
  return Response.json(previewOrderCsv(text));
}
