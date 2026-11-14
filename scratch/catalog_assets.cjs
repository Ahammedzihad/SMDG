const fs = require("fs");
const path = require("path");

const dir = "scratch/stitch_screens";
const files = fs.readdirSync(dir).filter(f => f.endsWith(".html"));
const manifest = JSON.parse(fs.readFileSync("app/public/assets/stitch/manifest.json", "utf-8"));

const assetUsage = {};
for (const [url, filename] of Object.entries(manifest)) {
  assetUsage[filename] = {
    url,
    screens: [],
    alts: []
  };
}

for (const f of files) {
  const content = fs.readFileSync(path.join(dir, f), "utf-8");
  for (const [url, filename] of Object.entries(manifest)) {
    if (content.includes(url)) {
      assetUsage[filename].screens.push(f.replace(".html", ""));
      // find alt or context
      const escapedUrl = url.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      const imgRegex = new RegExp(`<img[^>]+src=["']${escapedUrl}["'][^>]*>`, 'g');
      const match = imgRegex.exec(content);
      if (match) {
        const altMatch = match[0].match(/data-alt=["']([^"']+)["']/) || match[0].match(/alt=["']([^"']+)["']/);
        if (altMatch && !assetUsage[filename].alts.includes(altMatch[1])) {
          assetUsage[filename].alts.push(altMatch[1]);
        }
      }
    }
  }
}

fs.writeFileSync("app/public/assets/stitch/asset_catalog.json", JSON.stringify(assetUsage, null, 2));
console.log("Wrote asset_catalog.json");
for (const [fn, info] of Object.entries(assetUsage)) {
  console.log(`${fn}: ${info.screens.join(', ')} | Alt: ${(info.alts[0] || 'bg').slice(0, 70)}`);
}

