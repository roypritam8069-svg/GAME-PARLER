// TEMPORARY diagnostic — deleted after the investigation.
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** ff d8 ff = JPEG, 89 50 4e 47 = PNG, 52 49 46 46 ... 57 45 42 50 = WebP. */
function sniff(buf) {
  if (buf.length < 12) return "TOO_SHORT";
  const hex = buf.subarray(0, 4).toString("hex");
  const ascii = buf.subarray(0, 4).toString("latin1");
  if (hex.startsWith("ffd8ff")) return `JPEG (${hex})`;
  if (hex === "89504e47") return `PNG (${hex})`;
  if (ascii === "RIFF") return `RIFF/WebP? (${hex}, tail=${buf.subarray(8, 12).toString("latin1")})`;
  return `UNKNOWN ascii="${ascii.replace(/[^\x20-\x7e]/g, ".")}" hex=${hex}`;
}

const games = await prisma.game.findMany({
  select: { name: true, slug: true, imageUrl: true, isActive: true },
  orderBy: { name: "asc" },
});

console.log("PRICING_RULES=" + (await prisma.pricingRule.count()));
console.log("--- GAMES ---");
for (const g of games) {
  console.log(`name=${g.name} slug=${g.slug} active=${g.isActive} imageUrl=${JSON.stringify(g.imageUrl)}`);
  if (!g.imageUrl) {
    console.log("   -> imageUrl is NULL in DB (fallback will render)");
    continue;
  }
  const diskPath = path.join(process.cwd(), "public", ...g.imageUrl.replace(/^\//, "").split("/"));
  const exists = fs.existsSync(diskPath);
  console.log(`   -> disk: ${diskPath}`);
  console.log(`   -> exists=${exists}`);
  if (exists) {
    const buf = fs.readFileSync(diskPath);
    console.log(`   -> size=${buf.length} bytes, magic=${sniff(buf)}`);
    const end = buf.subarray(-2).toString("hex");
    console.log(`   -> last2hex=${end} (ffd9 = proper JPEG EOI)`);
  }
}

console.log("--- public/games listing ---");
for (const f of fs.readdirSync(path.join(process.cwd(), "public", "games"))) {
  const p = path.join(process.cwd(), "public", "games", f);
  const st = fs.statSync(p);
  console.log(`${f} ${st.size} bytes ${st.isFile() ? "" : "(dir)"}`);
}

await prisma.$disconnect();
