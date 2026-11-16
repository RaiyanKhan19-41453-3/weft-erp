import bwipjs from "bwip-js/node";

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const value = (searchParams.get("value") ?? "").toUpperCase();
  const scale = Math.min(4, Math.max(1, Number(searchParams.get("scale")) || 2));

  if (!/^[0-9A-Z\-.* $]{1,32}$/.test(value)) {
    return new Response("Invalid barcode value", { status: 400 });
  }

  const svg = bwipjs.toSVG({
    bcid: "code39",
    text: value,
    scale,
    height: 12,
    includetext: false,
    backgroundcolor: "FFFFFF",
    barcolor: "111111",
  });

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
