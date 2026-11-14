# ORBITONE: 3D Asset Acquisition Rules

These rules apply to any AI agent (Antigravity, Claude) or contributor who finds,
downloads, validates, or adds 3D assets to ORBITONE.

## Phase status

**Current phase: WAIT.**
Do not select or download final game assets until the official NASA challenge
statement has been provided. Until then, only build tooling (download script,
manifest schema, attribution files).

## Approved sources (in order)

1. NASA 3D Resources: https://science.nasa.gov/3d-resources/
2. NASA official GitHub mirror: https://github.com/nasa/NASA-3D-Resources
3. Procedural assets generated with the installed Three.js skills

Notes:
- Current NASA model files are hosted under `assets.science.nasa.gov`.
  Always take the file URL from the asset's own page. Never construct or guess URLs.
- The older `nasa3d.arc.nasa.gov` site is legacy. Prefer the official hub above.

## Per-asset workflow

1. **Select.** Choose only assets that the NASA challenge actually needs.
   No bulk downloads. Never clone the whole GitHub repo (use sparse checkout or
   fetch single files or folders).
2. **Read the asset page.** Record the title, contributor/creator, credit line,
   and any usage notes.
3. **Get the file URL from the page.** If there is no direct link, the download
   needs a click-through or login, or the site blocks automation, do not work
   around it. Add the asset to `MANUAL_DOWNLOADS.md` instead.
4. **Prefer GLB, then glTF.** If only OBJ, FBX, 3DS, or STL exists, log it in
   `MANUAL_DOWNLOADS.md` as "needs conversion". Do not convert silently.
5. **Download** to `app/public/assets/models/<slug>/` (textures to
   `app/public/assets/textures/<slug>/`).
   - If the target path already exists, **stop and ask**. Never overwrite.
6. **Validate** before integrating:
   - Run `npx gltf-validator <file>` and record errors and warnings.
   - Load it in a headless Three.js test.
   - Record the bounding box, triangle count, material count, and texture sizes.
7. **Optimize** only if the asset is over budget:
   - Suggested budget: model <= 5 MB, <= 100k triangles, textures <= 2048 px.
   - Use `gltf-transform optimize` (meshopt or Draco, WebP or KTX2 textures).
   - Keep the original in `app/public/assets/_originals/` (git-ignored).
   - Confirm the game's `GLTFLoader` has the matching decoder configured.
8. **Record** the asset in `app/public/assets/manifest.json`.
9. **Credit** the asset in `app/public/assets/ATTRIBUTION.md` and in the in-game
   credits screen.

## Hard rules

- Do not hotlink external models in the production game when local hosting is practical.
- Do not download the entire NASA collection.
- Do not replace existing working code or assets without showing a diff and asking first.
- Do not invent download URLs.
- Do not assume every site allows automated downloads. Respect `robots.txt`,
  site terms, and rate limits.
- Report anything uncertain (license, creator, format) instead of guessing.
- Procedural generation is preferred for simple objects (planets, starfields,
  orbit lines, basic satellites) when a downloaded model is not needed.

## Licensing and attribution

NASA assets follow the NASA Images and Media Usage Guidelines: generally free of
copyright, with these requirements:

- No implied NASA endorsement of ORBITONE.
- No misuse of NASA insignia (logos, meatball, worm).
- Credit NASA and the named contributor.

Some assets may have contributor-specific terms. Check each asset page and record
what you find in the manifest. If a license is unclear, treat the asset as
**not usable** until a human confirms.

## Manifest format

`app/public/assets/manifest.json` is a JSON array. Each entry:

```json
{
  "name": "Advanced Composition Explorer",
  "slug": "advanced-composition-explorer",
  "sourcePageUrl": "https://science.nasa.gov/3d-resources/advanced-composition-explorer/",
  "downloadUrl": "<exact file URL taken from the asset page>",
  "creator": "<contributor name from the asset page>",
  "license": "NASA Images and Media Usage Guidelines",
  "usageRequirements": "No implied endorsement; no misuse of NASA insignia; credit NASA and contributor",
  "format": "glb",
  "localPath": "app/public/assets/models/advanced-composition-explorer/advanced-composition-explorer.glb",
  "originalBytes": 0,
  "optimizedBytes": 0,
  "triangles": 0,
  "validation": "pass | warn | fail",
  "modifications": "",
  "retrievedAt": "2026-11-14T00:00:00Z"
}
```

The example values above show the format only. Fill every field from the real
asset page, never from memory.

## MANUAL_DOWNLOADS.md format

Keep this file at the repo root or in `app/public/assets/`. One row per asset:

| Asset | Page URL | Reason | Action needed |
|-------|----------|--------|---------------|
| (name) | (asset page URL) | no direct link / click-through / needs conversion / unclear license | (what a human must do) |

## ATTRIBUTION.md format

One line per asset:

```
- <Asset name>: NASA / <contributor>. Source: <asset page URL>. Used under the NASA Images and Media Usage Guidelines.
```

## Agent instructions

Before touching any asset, read this file in full. In each session:

1. State the current phase (WAIT or ACTIVE).
2. In WAIT, build tooling only. Test it on **one** small model and show the result.
3. In ACTIVE, work only from the approved shortlist derived from the NASA
   challenge statement.
4. End each session with a summary: downloaded, skipped, needs manual action,
   and open questions.
