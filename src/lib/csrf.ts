export function hasForbiddenOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const normalize = (host: string) =>
      host.startsWith("localhost:") ? `127.0.0.1:${host.slice("localhost:".length)}` : host;
    const requestHost = normalize(new URL(request.url).host);
    const originHost = normalize(new URL(origin).host);
    return requestHost !== originHost;
  } catch {
    return true;
  }
}
