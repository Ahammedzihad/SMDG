const fs = require("fs");
const path = require("path");

const dir = "scratch/stitch_screens";
const files = fs.readdirSync(dir).filter(f => f.endsWith(".html"));
const targetDir = "app/public/assets/stitch";
if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

const urlMap = {};
let count = 0;

async function run() {
  for (const f of files) {
    const content = fs.readFileSync(path.join(dir, f), "utf-8");
    const imgMatches = [...content.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/g)];
    for (const m of imgMatches) {
      const url = m[1];
      if (url.startsWith("http") && !urlMap[url]) {
        count++;
        const filename = `asset_${count}.jpg`;
        urlMap[url] = filename;
        const filePath = path.join(targetDir, filename);
        if (!fs.existsSync(filePath)) {
          try {
            console.log(`Downloading ${filename} from ${url.slice(0, 60)}...`);
            const res = await fetch(url);
            if (res.ok) {
              const buffer = Buffer.from(await res.arrayBuffer());
              fs.writeFileSync(filePath, buffer);
              console.log(`Saved ${filename} (${buffer.length} bytes)`);
            } else {
              console.warn(`Failed ${filename}: HTTP ${res.status}`);
            }
          } catch (e) {
            console.warn(`Error downloading ${filename}:`, e.message);
          }
        }
      }
    }
  }

  // Also extract background-image urls
  for (const f of files) {
    const content = fs.readFileSync(path.join(dir, f), "utf-8");
    const bgMatches = [...content.matchAll(/background-image:\s*url\(['"]?([^'"\)]+)['"]?\)/g)];
    for (const m of bgMatches) {
      const url = m[1];
      if (url.startsWith("http") && !urlMap[url]) {
        count++;
        const filename = `asset_${count}.jpg`;
        urlMap[url] = filename;
        const filePath = path.join(targetDir, filename);
        if (!fs.existsSync(filePath)) {
          try {
            console.log(`Downloading bg ${filename} from ${url.slice(0, 60)}...`);
            const res = await fetch(url);
            if (res.ok) {
              const buffer = Buffer.from(await res.arrayBuffer());
              fs.writeFileSync(filePath, buffer);
              console.log(`Saved ${filename} (${buffer.length} bytes)`);
            } else {
              console.warn(`Failed ${filename}: HTTP ${res.status}`);
            }
          } catch (e) {
            console.warn(`Error downloading bg ${filename}:`, e.message);
          }
        }
      }
    }
  }

  fs.writeFileSync("app/public/assets/stitch/manifest.json", JSON.stringify(urlMap, null, 2));
  console.log(`Finished. Total assets downloaded: ${count}`);
}

run();

