const fs = require("fs");
const path = require("path");

const dir = "scratch/stitch_screens";
const files = fs.readdirSync(dir).filter(f => f.endsWith(".html"));

const allImages = new Set();
const screensInfo = [];

for (const f of files) {
  const content = fs.readFileSync(path.join(dir, f), "utf-8");
  const imgMatches = [...content.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/g)];
  const titleMatch = content.match(/<title>([^<]+)<\/title>/) || content.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  const imgs = imgMatches.map(m => m[1]);
  imgs.forEach(i => allImages.add(i));

  screensInfo.push({
    file: f,
    h1: titleMatch ? titleMatch[1].trim().replace(/\s+/g, ' ') : "N/A",
    imageCount: imgs.length,
    images: imgs
  });
}

console.log("Screens Summary:");
console.log(JSON.stringify(screensInfo, null, 2));
console.log("\nTotal unique images referenced:", allImages.size);
for (const img of allImages) {
  console.log("-", img);
}

