import { z } from "zod";
import { log, requestId } from "@/lib/log";
import { allowRequest } from "@/lib/rate-limit";

const schema = z.object({
  message: z.string().max(500),
  stack: z.string().max(2000).optional(),
  url: z.string().max(500),
});

export async function POST(request: Request) {
  if (!(await allowRequest(request, "client-errors", 20))) {
    return Response.json({ ok: false }, { status: 429 });
  }
  const id = requestId(request);
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return Response.json({ ok: false }, { status: 400 });

  log("error", "client_error", {
    requestId: id,
    message: parsed.data.message,
    url: parsed.data.url,
    stack: parsed.data.stack?.slice(0, 1000),
  });

  return Response.json({ ok: true });
}
