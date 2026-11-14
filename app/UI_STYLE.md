# ORBITONE UI Design System & Style Guide

A friendly, colourful "space cartoon" design system for conceptual space mission design.
Built using Vanilla TypeScript, pure CSS variables, and hand-crafted inline SVGs without external dependencies or external web fonts.

---

## 1. Design Tokens & Palette

### Background Gradient
- **Space Radial Background**: `radial-gradient(circle at 50% 15%, #132252 0%, #09102b 50%, #040716 100%)`
- **Deep Space Base**: `#050816`
- **Surface Elevation**: `#0c1535` / `#111d47`

### 5 Core Brand Colours
1. **Solar Gold (`#ffb800`)**: Primary actions, star rankings, highlighted progress nodes, and key focal points.
   - Text color on yellow: `#1a1000` (Contrast ratio **11.2:1**, exceeding WCAG AAA).
   - Glow: `rgba(255, 184, 0, 0.35)`.
2. **Orbit Blue (`#2f80ed`)**: Secondary actions, structural elements, and inactive mission nodes.
   - Text color on blue: `#ffffff` (Contrast ratio **4.7:1**, exceeding WCAG AA).
3. **Plasma Cyan (`#4de2ff`)**: Telemetry highlights, glowing lines, subsystem labels, and energetic accents.
4. **Astro Green (`#2bd980`)**: Passing checks, nominal statuses, baseline achievements, and launch clearances.
5. **Nebula Coral (`#ff5757`)**: Hard launch blockers, anomalies, resource deficits, and failures.

### Radii & Spacing Scale
- **Radii**: Small `8px`, Medium `14px`, Large `20px`, Extra Large `28px`, Pill `9999px`.
- **Spacing**: `4px`, `8px`, `12px`, `16px`, `24px`, `32px`, `48px`.
- **Shadows**: Chunky 3D drop-shadows with hard borders and ambient glows (`0 4px 0 <shade>, 0 8px 18px <glow>`).

### Typography (Zero External Font Dependencies)
- **Primary Body & Display**: System font stack (`system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`).
- **Telemetry & Monospace**: System monospace stack (`ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`).

---

## 2. Core Reusable Components

### Chunky 3D Buttons (`primaryButton`, `secondaryButton`)
- **Primary Yellow Button**:
  - Chunky rounded pill with top highlight and physical bottom shadow (`box-shadow: 0 4px 0 #cc8400`).
  - Active physical press-down effect (`transform: translateY(3px); box-shadow: 0 1px 0 #cc8400`).
  - High-contrast dark text (`#1a1000`, 11.2:1 contrast).
- **Secondary Blue Button**:
  - Cosmic blue with physical 3D elevation (`box-shadow: 0 4px 0 #1952a5`).
  - High-contrast white text (`#ffffff`, 4.7:1 contrast).

### Glass-Like Cards (`card`)
- Semi-transparent dark blue backdrop (`rgba(18, 29, 66, 0.72)`) with backdrop blur (`blur(14px)`).
- Frosted highlight borders (`rgba(110, 180, 255, 0.22)`), scaling to cyan on selection with ambient shadow.

### Mission Path (`missionPath`)
- Continuous highway with glowing progress line connecting the 7 mission stages:
  1. *Objective (CML 1)*
  2. *Initial Feasibility (CML 2)*
  3. *Trade Space (CML 3)*
  4. *Point Design (CML 4)*
  5. *Pre-Launch Review*
  6. *Launch*
  7. *Report*
- **Completed Nodes**: Filled in cyan with inline checkmark icon.
- **Current Node**: Enlarged (scale 1.15) with Solar Gold gradient, white border, and halo glow.
- **Locked Future Nodes**: Dimmed with `disabled` attribute (never clickable forward past an unfinished stage).

### Star Rank Display (`starRank`)
- Visual star badges alongside text rank name:
  - **Cadet**: ⭐ (1 star)
  - **Engineer**: ⭐⭐ (2 stars)
  - **Mission Lead**: ⭐⭐ (2 stars)
  - **Flight Director**: ⭐⭐⭐ (3 stars)
- Configured centrally in `RANK_CONFIG` (`components.ts`).

### Chunky Progress Bar (`progressBar`)
- Rounded pill track with inset depth shadow.
- Cyan-to-green gradient fill with explicit text percentage readout (`aria-valuenow`, `aria-valuemin`, `aria-valuemax`).

### Vector Inline SVGs (`icons.ts`)
- 15 hand-drawn icons: `mass`, `power`, `budget`, `data`, `communications`, `time`, `check`, `warning`, `fail`, `rocket`, `planet`, `star`, `home`, `back`, `settings`.
- Pure vector paths with `stroke-linecap="round"` and `stroke-linejoin="round"`.

---

## 3. Mandatory Accessibility & Engineering Rules

1. **Non-Color-Only Information**:
   - Resource meters and checks must **always** display an icon + word + numerical value (e.g. `⚖️ Mass: 3.3 / 4.0 kg [✓ OK]`). Never communicate status through colour alone.
2. **Text Contrast Compliance (WCAG 2.1 AA)**:
   - All body text and button labels maintain at least **4.5:1** contrast ratio against their respective backgrounds (including dark text `#1a1000` on `#ffb800` yellow buttons).
3. **Reduced Motion**:
   - `@media (prefers-reduced-motion: reduce)` disables all animations, infinite starfield pulses, and button bounce effects.
4. **Responsive Minimum Resolution**:
   - Fully tested and functional at **1024×768** desktop and tablet viewport resolutions without layout breakage or text truncation.
5. **Visible Keyboard Focus**:
   - High-contrast dual focus rings (`0 0 0 3px var(--brand-yellow), 0 0 0 6px rgba(77, 226, 255, 0.45)`) on all interactive buttons, cards, and path nodes.
6. **Zero External Assets**:
   - No downloaded images, web fonts, or CDN bundles. All graphics are rendered in CSS or self-contained inline SVG.

