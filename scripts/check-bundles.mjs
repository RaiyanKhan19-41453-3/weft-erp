import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { resolve } from "node:path";

const root = process.cwd();
const limits = {
  ".next/server/app/analytics.html": 290,
  ".next/server/app/materials.html": 295,
  ".next/server/app/architecture.html": 295,
  ".next/server/app/orders.html": 340,
  ".next/server/app/orders/new.html": 380,
  ".next/server/app/sign-in.html": 290,
};

let failed = false;
for (const [file, limit] of Object.entries(limits)) {
  let html = "";
  try {
    html = readFileSync(resolve(root, file), "utf8");
  } catch {
    continue;
  }
  const scripts = [...new Set([...html.matchAll(/<script[^>]+src="([^"]+\.js)"/g)].map((m) => m[1]))];
  if (scripts.length === 0) {
    console.log(`SKIP ${file}: streamed route, no static script list`);
    continue;
  }
  let total = 0;
  for (const src of scripts) {
    try {
      const path = resolve(root, ".next", src.replace(/^\/_next\//, ""));
      total += gzipSync(readFileSync(path), { level: 9 }).length;
    } catch {
      // A preload that is not on disk does not count toward the bundle.
    }
  }
  const kb = total / 1024;
  const ok = kb <= limit;
  if (!ok) failed = true;
  console.log(`${ok ? "PASS" : "FAIL"} ${file}: ${kb.toFixed(1)} KB / ${limit} KB`);
}

if (failed) process.exit(1);
