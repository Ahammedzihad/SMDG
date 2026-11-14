# Design System: Orbit Mission Academy (ORBITONE)
**Project ID:** 1937526940901217389

## 1. Visual Theme & Atmosphere
"Orbit Mission Academy" presents an inspiring, premium "Aero-Sci-Fi Command Deck" aesthetic. The atmosphere balances professional aerospace mission control precision with welcoming, gamified educational clarity designed for budding aerospace cadets (ages 7–12 and students).

* **Mood:** Deep cosmic exploration, tactile engineering command deck, high-tech telemetry precision, encouraging and approachable mentorship.
* **Atmosphere:** Deep space obsidian surfaces bathed in subtle radial starlight glows, crisp cyan data streams, warm solar amber action vectors, and luminous telemetry indicators.
* **Elevation & Layering:** Deep cosmic background with whisper-soft radial glow gradients (`radial-gradient(ellipse_at_top, #17202f, #0a1322, #060e1d)`), layered over translucent frosted glass panels with `backdrop-filter: blur(16px)` and subtle high-contrast borders (`rgba(123, 208, 255, 0.12)`).
* **Depth & Shadows:** Soft, diffuse ambient glows paired with crisp inset highlights and floating command deck drop shadows (`0 8px 32px rgba(0, 0, 0, 0.45)`).

---

## 2. Color Palette & Roles

### Core Background & Surface Hierarchy
| Token Name | Hex Code | Descriptive Name | Functional Role |
| :--- | :--- | :--- | :--- |
| `background` / `surface` | `#0a1322` | Deep Cosmic Void Navy | Primary app background canvas and foundational stage viewport |
| `surface-container-lowest` | `#060e1d` | Obsidian Space Floor | Deepest recessed panels, code blocks, and data readouts |
| `surface-container-low` | `#131c2b` | Dark Slate Deck | Secondary panel background, cards, and modal containers |
| `surface-container` | `#17202f` | Orbital Steel Blue | Default surface container for interactive cards, lists, and grids |
| `surface-container-high` | `#222a3a` | Elevated Command Deck | Floating cards, active toolbars, hover states, and popovers |
| `surface-container-highest`| `#2c3545` | High-Orbit Surface | Active highlighted cards, pill badges, and input borders |

### Functional Accents & Semantic Signals
| Token Name | Hex Code | Descriptive Name | Functional Role |
| :--- | :--- | :--- | :--- |
| `primary` | `#ffc174` | Warm Solar Gold | Primary brand color, headline highlights, and critical mission targets |
| `primary-container` | `#f59e0b` | Solar Amber Flame | Primary call-to-action button gradient base and launch actuators |
| `on-primary` | `#472a00` | Deep Umber Gold | Text on solar primary elements (high-contrast WCAG AAA 11:1) |
| `secondary` | `#7bd0ff` | Plasma Cyan Glow | Navigation accents, active orbital lines, telemetry links, and data rates |
| `secondary-container`| `#00a6e0` | Deep Cyber Cyan | Secondary actions, active tab indicators, and progress highlights |
| `tertiary` | `#51e77b` | Astro Ion Green | Success indicators, verified constraints, nominal systems, and passes |
| `tertiary-container` | `#2bca62` | Deep Emerald Engine | Resource margin OK badges and battery charge state indicators |
| `error` | `#ffb4ab` | Stellar Flare Salmon | Critical check warnings, violated constraints, and failure readouts |
| `error-container` | `#93000a` | Deep Warning Red | Failed launch checks, over-budget alerts, and depleted power warnings |

### Neutral Text & Outlines
| Token Name | Hex Code | Descriptive Name | Functional Role |
| :--- | :--- | :--- | :--- |
| `on-surface` | `#dae2f8` | Icy Starlight White | Primary readable text, card titles, and high-emphasis labels |
| `on-surface-variant` | `#d8c3ad` | Warm Pale Stardust | Secondary descriptive text, supporting guidance, and metadata |
| `outline` | `#a08e7a` | Subtle Brass Edge | Focus rings, structural dividers, and prominent card borders |
| `outline-variant` | `#534434` | Subdued Orbital Bronze | Inactive component borders, subtle grid lines, and card strokes |

---

## 3. Typography Rules

* **Display & Headlines (`Space Grotesk`):**
  - Geometric, technical, and futuristic personality.
  - Used for mission titles, step headers, telemetry meters, numerical readouts, and callout numbers.
  - Generous letter-spacing on small labels (`letter-spacing: 0.08em` to `0.12em`).
  - Tight letter-spacing on giant hero titles (`letter-spacing: -0.02em` to `-0.03em`).

* **Body & Explanatory Copy (`Plus Jakarta Sans`):**
  - Clean, humanist sans-serif with high x-height for maximum legibility on dark screens.
  - Used for educational engineering descriptions, mission briefings, trade-off notes, and tooltips.
  - Line-height: `1.5` to `1.6` for comfortable reading by students and cadets.

---

## 4. Component Stylings

### A. Buttons & Interactive Controls
* **Primary "Continue / Launch" Button:**
  - Gradient: Linear gradient from Solar Amber (`#f59e0b`) to Solar Gold (`#ffc174`).
  - Text: Deep Umber (`#472a00`), bold uppercase with `letter-spacing: 0.06em`.
  - Shape: Rounded rectangle (`border-radius: 12px` to `16px`) with chunky bottom-shadow (`box-shadow: 0 4px 20px rgba(245, 158, 11, 0.35)`).
  - Hover state: Brightness 110% with energetic glow expansion.
  - Active state: Subtle scale compression (`transform: scale(0.97)`).
* **Secondary / Navigation Button:**
  - Background: Glass pill (`rgba(34, 42, 58, 0.8)`) with `backdrop-filter: blur(12px)`.
  - Border: Subtle cyan stroke (`rgba(123, 208, 255, 0.2)`).
  - Text: Plasma Cyan (`#7bd0ff`) or Icy Starlight (`#dae2f8`).
  - Icon: Leading inline SVG or Material symbol with 8px margin.
* **Pill Chips & Badges:**
  - Fully rounded pill shape (`border-radius: 9999px`).
  - Padding: `4px 12px`.
  - Background: Semi-transparent tinted container with pulsing dot indicator.

### B. Cards & Glass Panels
* **Mission Phase Cards:**
  - Background: `rgba(19, 28, 43, 0.88)` with `backdrop-filter: blur(16px)`.
  - Border: 1px solid `rgba(255, 255, 255, 0.08)`.
  - Radius: Generously rounded corners (`border-radius: 16px` to `20px`).
  - Active / Current Phase: Radiant accent glow on top-right (`rgba(123, 208, 255, 0.12)`) and bright secondary border.
* **Telemetry & Resource Vitals HUD:**
  - Floating topbar and sidebar readout cards.
  - Background: Frosted obsidian (`rgba(6, 14, 29, 0.9)`).
  - Metrics display: High-contrast value, unit, limit bar, and categorical status dot (Green nominal, Amber warn, Red error).

### C. Co-Pilot Guidance Callouts (Commander Nova)
* **Avatar Container:**
  - Circular badge (`56px` x `56px`) with soft accent ring.
  - Companion persona providing educational encouragement and plain-English engineering trade-off reminders.
* **Speech Bubble / Guidance Card:**
  - Background: `rgba(6, 14, 29, 0.8)` with inner shadow.
  - Italicized friendly speech copy with highlighted key engineering concepts.

---

## 5. Layout Principles & Grid System

* **Top Command Bar:**
  - Fixed height: `64px` (`4rem`).
  - Backdrop: `rgba(6, 14, 29, 0.85)` with `backdrop-filter: blur(20px)` and bottom shadow `0 4px 24px rgba(0, 0, 0, 0.4)`.
  - Brand mark on left, mission stage breadcrumbs in center, cadet profile & status on right.
* **Workspace Operations Deck:**
  - Asymmetric 12-column grid layout on desktop:
    - 8 columns: Interactive stage workflow, part selection cards, trade-off comparisons, and configuration options.
    - 4 columns: Telemetry HUD, live 3D spacecraft viewport, resource budget meters, and co-pilot guidance panel.
* **Bottom Flight Action Bar:**
  - Fixed height: `80px` (`5rem`).
  - Backdrop: Frosted glass bar with navigation controls (`← Mission Map` on left, flight tips in center, `CONTINUE MISSION →` on right).
