const fs = require("fs");
const path = require("path");

const dir = "scratch/stitch_screens";
const files = fs.readdirSync(dir).filter(f => f.endsWith(".html"));

for (const f of files) {
  const content = fs.readFileSync(path.join(dir, f), "utf-8");
  
  // Extract key sections: header, main h1, buttons, key cards
  const h1Match = content.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const h2Matches = [...content.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)].map(m => m[1].replace(/<[^>]+>/g, '').trim());
  const h3Matches = [...content.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/gi)].map(m => m[1].replace(/<[^>]+>/g, '').trim());
  const stepMatch = content.match(/STEP\s+\d+[A-Z]*:[^<]+/i);
  const buttonMatches = [...content.matchAll(/<button[^>]*>([\s\S]*?)<\/button>/gi)].map(m => m[1].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' '));
  
  console.log("==================================================");
  console.log("FILE:", f);
  console.log("H1:", h1Match ? h1Match[1].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ') : "NONE");
  console.log("STEP:", stepMatch ? stepMatch[0].trim() : "NONE");
  console.log("H2s:", h2Matches.slice(0, 5));
  console.log("H3s (first 6):", h3Matches.slice(0, 6));
  console.log("BUTTONS:", buttonMatches.filter(b => b.length > 0 && b.length < 50).slice(0, 8));
}

