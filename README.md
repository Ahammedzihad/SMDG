# ORBITONE — NASA Space Mission Design Game

> **NASA Space Apps Challenge 2026** // Challenge: *Space Mission Design Game*  
> **Target Audience:** Intermediate, Beginner/Youth, Education & Games  
> **Live Deployment:** [https://smdg.vercel.app/](https://smdg.vercel.app/)

---

## 1. Project Overview
**ORBITONE** is an interactive, browser-based space mission design simulator and educational game built for the NASA Space Apps Challenge 2026. Designed for cadets, students, and space enthusiasts with no prior aerospace background, ORBITONE guides players through the authentic systems engineering process used by NASA to conceptualize, design, evaluate, and fly robotic satellite missions.

Whether playing solo or collaborating with up to four players in real-time multiplayer, cadets balance six competing engineering resources—**Mass, Power, Budget, Data, Communications, and Time**—while designing a CubeSat to answer authentic scientific questions.

---

## 2. Problem Statement
Conceptual space mission design is one of humanity's most complex multidisciplinary endeavors. However, traditional aerospace tools (such as GMAT, FreeFlyer, or Systems Tool Kit) have steep mathematical learning curves, requiring extensive training in orbital mechanics, astrodynamics, and telemetry analysis. 

Consequently, aspiring students and young engineers struggle to grasp the fundamental principle of aerospace systems engineering: **Every choice costs something somewhere else. There is no single perfect design.** Existing educational games often oversimplify space flight into arcade mechanics without teaching the real trade-offs between scientific instrumentation, electrical power balances, link budgets, and form factor limits.

---

## 3. The ORBITONE Solution
ORBITONE bridges high-level NASA systems engineering principles and engaging interactive game design:
* **"Begin with the End in Mind":** Players state their scientific objective before purchasing a single piece of hardware, mirroring NASA SmallSat Institute guidelines.
* **Concept Maturity Levels (CML):** The workflow transitions through structured design gates (CML 1 Cocktail Napkin $\to$ CML 2 Requirements $\to$ CML 3 Trade Space $\to$ CML 4 Point Design), adapted conceptually from JPL CML methodologies for educational progression.
* **Deterministic Rules Engine:** Spacecraft feasibility, solar illumination, battery depth-of-discharge during eclipse, and downlink contact throughput are dynamically computed by a verified physics engine (`@orbitone/shared`).
* **Plain-Language Flight Debrief:** Upon orbital simulation, an AI Flight Director explains *why* the mission succeeded or failed, highlights top risks in a 5×5 matrix, and delivers quantitative, actionable design recommendations.

---

## 4. Seven-Stage Gameplay (CML Mission Wizard)

The single-player and cooperative campaign guides cadets across seven sequential milestones:

```
┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│  STAGE 01   │──►│  STAGE 02   │──►│  STAGE 03   │──►│  STAGE 04   │
│  Objective  │   │Requirements │   │ Trade Space │   │Point Design │
│   (CML 1)   │   │   (CML 2)   │   │   (CML 3)   │   │   (CML 4)   │
└─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘
                                                             │
┌─────────────┐   ┌─────────────┐   ┌─────────────┐          │
│  STAGE 07   │◄──│  STAGE 06   │◄──│  STAGE 05   │◄─────────┘
│Flight Report│   │Launch Ascent│   │ Pre-Launch  │
│  & Debrief  │   │& Insertion  │   │ Audit Gate  │
└─────────────┘   └─────────────┘   └─────────────┘
```

1. **Stage 1 — Objective (CML 1 Cocktail Napkin):** Select a core scientific investigation (e.g. Earth Surface & Weather Imaging, Deep Space Trajectory Demo). The objective dictates sensor payloads, target data rates, and operating constraints.
2. **Stage 2 — Initial Feasibility (CML 2 Requirements):** Decompose the science goal into five Level-1 engineering requirements, each paired with an authentic verification method (Test, Analysis, Inspection, Demonstration).
3. **Stage 3 — Trade Space (CML 3 Trade Study):** Explore architecture trades between orbital altitude/inclination (LEO, SSO, Polar) and certified launch vehicle accommodations (Rideshare Dispenser vs. Dedicated Micro-Launcher).
4. **Stage 4 — Point Design (CML 4 Spacecraft Assembly):** Assemble the satellite subsystem-by-subsystem across seven categories: Structure, Solar Arrays, Batteries, Communications, Flight Computer (OBC), Attitude Determination & Control (ADCS), and Scientific Instruments. Watch the 3D model update in real time.
5. **Stage 5 — Pre-Launch Review Gate:** An automated flight readiness audit evaluates all four hard physical constraints (Mass under class limit, Power balanced, Within budget, Mass fits vehicle).
6. **Stage 6 — Launch & Orbit Insertion:** Experience an interactive 3D ascent from the launchpad through fairing separation, dispenser spring ejection, and solar array deployment.
7. **Stage 7 — Flight Debrief & Engineering Evaluation:** A comprehensive mission report featuring the 0–100 composite score, badge rank, trade-off explanation, 5×5 risk matrix, telemetry table, similar real NASA CubeSat match, and two concrete design recommendations.

---

## 5. How the Mission Simulation Works

Mission simulation in ORBITONE is deterministic and managed by `@orbitone/shared`:

### Resource Balance Equations:
* **Total Wet Mass:**
  $$m_{\text{total}} = \sum_{i} m_{\text{part}, i} + m_{\text{fuel}} \le m_{\text{class\_limit}}$$
* **Effective Daylight Generation:**
  $$P_{\text{gen}} = A_{\text{solar}} \times \eta_{\text{solar}} \times f_{\text{sunlight}} \ge P_{\text{draw}} \times d$$
  *(where $f_{\text{sunlight}}$ is the orbital daylight fraction: ~0.72 in SSO, ~0.60 in LEO, and $d$ is duty cycle).*
* **Downlink Contact Capacity:**
  $$\text{Data}_{\text{sent}} = R_{\text{downlink}} \times t_{\text{contact}} \times \eta_{\text{link}}$$
* **Eclipse Survival:**
  During orbital night, battery capacity must sustain bus keep-alive draw without depleting below reserve thresholds.

### Simulation Outcomes:
* **`baseline_met`:** Full mission success; all primary science objectives downlinked within required margins.
* **`threshold_met`:** Partial mission success; concept viability confirmed, minimum science collected, but accepting reduced payload duty cycles or sub-optimal margins.
* **`failure`:** Spacecraft lost to orbital decay, negative power balance, memory buffer overflow, or pre-launch constraint violations.

---

## 6. NASA Datasets & References

ORBITONE directly integrates principles and historical data from official NASA publications:

1. **NASA CubeSat 101 Guide (Rev. Oct 2017):** Informs form-factor mass ceilings (1U: 1.33 kg, 1.5U: 2.00 kg, 2U: 2.66 kg, 3U: 4.00 kg), dispenser geometry, and the real-world historical CubeSat catalog (`missions_real.json` including *IceCube*, *MinXSS*, *STMSat-1*, *CADRE*, and *BisonSat*).
2. **NASA SmallSat Institute (2025):** The four-segment mission architecture (Launch, Space, Ground, User), requirement traceability, and heritage hardware rules.
3. **JPL Concept Maturity Levels (CML):** The progressive milestone workflow and 5×5 risk likelihood/consequence matrix format.
4. **NASA POWER (CERES SYN1deg):** Satellite solar irradiance geometry and aerosol optical depth ($AOD_{55}$) reference values.
5. **GMAT R2025a:** Used offline to benchmark Keplerian orbit periods and daylight/eclipse fractions.

*See [submission/NASA_DATA_REVIEW.md](submission/NASA_DATA_REVIEW.md) for full citations and distinction between authentic NASA facts, engine calculations, and game-balance assumptions.*

---

## 7. Recommendation System

Upon mission completion, `shared/src/report.ts` inspects flight telemetry, battery depth-of-discharge, data buffer queues, and subsystem margins to generate **two concrete, mathematically justified design changes** (`what_to_try_next`).

### Example (Baseline 75-Point Mission):
* **Recommendation 1 (Payload Observation Tuning):**
  > *"Increase payload observation time fraction (observe_time_fraction) from 0.50 to 0.53 to increase science data collection from 360.0 GB to 381.6 GB (+2.4 science points) while keeping 30-day cumulative volume (31.8 GB) within the 32 GB flash memory buffer."*
* **Recommendation 2 (Mass Margin Recovery):**
  > *"Reduce fuel mass (fuel_mass_kg) from 0.1 kg to 0.0 kg to lower total spacecraft mass from 3.30 kg to 3.20 kg and expand 3U CubeSat class mass margin from 17.5% to 20.0%."*

*See [submission/RECOMMENDATION_SYSTEM.md](submission/RECOMMENDATION_SYSTEM.md) for data flow diagrams and governing mathematical derivations.*

---

## 8. Technology Stack

* **Frontend:** Vite, TypeScript, TailwindCSS, HTML5 Canvas & WebGL.
* **3D Visualization:** Three.js procedural orbital and spacecraft renderer (with responsive camera controls and launch animations).
* **Shared Rules Engine (`@orbitone/shared`):** Pure, platform-agnostic TypeScript library containing all physical formulas, catalog data, constraint checkers, and simulation engines (100% test coverage with Vitest).
* **Backend Server (`@orbitone/server`):** Node.js, Express, Socket.IO, and Zod for authoritative room state management and synchronization.
* **Testing & Verification:** Vitest unit test suites and Playwright end-to-end browser automation.

---

## 9. Multiplayer Architecture

ORBITONE features an authoritative multiplayer mode where 2 to 4 players assemble in a shared Mission Control Room via Socket.IO:

* **Role Specialization:**
  * **Mission Planner:** Owns mission objectives, Level-1 requirements, target orbit, and final sign-offs.
  * **Spacecraft Engineer:** Owns structural chassis, solar arrays, battery sizing, OBC selection, and mass/power margins.
  * **Science Lead:** Owns scientific instruments, sensor duty cycles, science point yield, and data volume.
  * **Comms & Budget Officer:** Owns radio transmitters, ground station downlink passes, budget allocation, and launch vehicle selection.
* **Consensus Decisions & Voting:** Critical architecture trades (Target Orbit, Science Objective, Launch Vehicle, Final Launch) require synchronized cryptographic-style crew voting.
* **Server Authority:** The server (`@orbitone/server`) validates all client intents against `shared/src/protocol.ts` before broadcasting updated room state.

---

## 10. Educational Impact
ORBITONE transforms abstract systems engineering concepts into intuitive, exploratory gameplay:
* Cadets discover why a high-resolution multispectral imager is useless without sufficient downlink bandwidth or battery storage for orbital eclipse passes.
* Students learn why choosing a cheaper rideshare launch limits spacecraft mass, necessitating trade studies or descope options.
* Team mode fosters communication, negotiation, and consensus building around technical constraints.

---

## 11. Scientific Limitations and Assumptions
* **Educational Scope:** ORBITONE is an educational simulation designed to teach trade-offs, **not** a flight dynamics or orbital propagation tool.
* **Two-Body Approximation:** Orbital mechanics assume spherical Earth two-body circular Keplerian orbits without non-spherical ($J_2$) perturbations or third-body lunar/solar gravitational pulls.
* **Simplified Economics:** Financial budgets and component costs are normalized educational game-balance values, not actual commercial quotes.
* **CML Alignment:** The game uses the conceptual principles of JPL Concept Maturity Levels for stage gating, but does not claim institutional NASA SP-6105 handbook compliance.

---

## 12. How to Run the Application Locally

### Prerequisites:
* **Node.js:** v18.0.0 or higher (v20+ recommended)
* **npm:** v9.0.0 or higher

### Step-by-Step Setup:

1. **Install Dependencies:**
   ```bash
   # Install root and workspace dependencies
   npm --prefix shared install
   npm --prefix app install
   npm --prefix server install
   ```

2. **Run Test Suites:**
   ```bash
   # Run all 155 shared unit tests
   npm --prefix shared test

   # Run server multiplayer tests
   npm --prefix server test
   ```

3. **Build Packages:**
   ```bash
   npm --prefix shared run build
   npm --prefix app run build
   npm --prefix server run build
   ```

4. **Start Local Development Servers:**
   * **Terminal 1 (Multiplayer Server):**
     ```bash
     npm --prefix server start
     # Server listening on http://localhost:3000
     ```
   * **Terminal 2 (Frontend Client):**
     ```bash
     npm --prefix app run dev
     # Client ready on http://localhost:5173
     ```
   * Open `http://localhost:5173/` in your browser.

---

## 13. Demo Mission Configuration & Expected Results

To reproduce the verified 75-point baseline demo mission:

### Configuration:
* **Objective:** Earth Surface & Weather Imaging (`earth_observation`)
* **Orbit:** Sun-Synchronous Orbit (`sso`, 550 km altitude)
* **Launch Vehicle:** SmallSat Rideshare Dispenser (`rideshare_dispenser`)
* **Chassis Class:** 3U CubeSat (`3U`, 4.0 kg limit)
* **Equipped Subsystems (7 parts):**
  1. `struct_3u` (3U Primary Chassis Structure)
  2. `solar_deployable_3u` (3U Deployable Solar Array)
  3. `batt_space_30wh` (30Wh Space-Grade Battery Pack)
  4. `comms_sband_patch` (S-Band Patch Transceiver)
  5. `obc_rad_hard` (Rad-Hardened System-on-Chip OBC)
  6. `adcs_3axis_wheels` (3-Axis Reaction Wheels & Star Tracker)
  7. `inst_multispectral_imager` (Multispectral Earth Observation Imager)
* **Mission Lifetime:** 12 months
* **Authorized Budget:** \$2.5M
* **Fuel Mass:** 0.1 kg
* **Duty Cycle:** 0.50
* **Observation Time Fraction:** 0.50
* **Link Efficiency:** 0.95
* **Simulation Seed:** 42 | **Level:** 1

### Expected Results:
* **Outcome:** `threshold_met` (*Partial Mission Success*)
* **Composite Score:** `75 / 100` (Rank: *Mission Lead*)
  * *Mission Success:* 20 / 30
  * *Science Value:* 8 / 20
  * *Resource Efficiency:* 20 / 20
  * *Engineering Quality:* 27 / 30
* **Science Data Collected:** 40.0 pts (360.0 GB downlinked, 0.0 GB lost)
* **Anomalies / Disruptions:** 0
* **Recommendations Rendered:**
  1. Increase `observe_time_fraction` to 0.53 (+2.4 science pts).
  2. Reduce `fuel_mass_kg` to 0.0 kg (expand mass margin to 20.0%).

---

## 14. Submission Evidence & Screenshots

All high-resolution verification screenshots are archived in the [`submission/evidence/`](submission/evidence/) directory:

| Filename | Stage / View | Description |
| --- | --- | --- |
| `01_landing_page.png` | Landing Page | Hero portal with interactive 3D Earth view, featured NASA dataset info, and mode selection. |
| `02_science_objective.png` | Stage 1 (CML 1) | Science objective investigation selection card and Level-1 payload requirements. |
| `03_mission_requirements.png` | Stage 2 (CML 2) | Level-1 engineering requirements and explicit verification method mapping. |
| `04_trade_space.png` | Stage 3 (CML 3) | Architecture trade study comparing orbits and certified launch accommodations. |
| `05_spacecraft_configuration_3d.png`| Stage 4 (CML 4) | Modular spacecraft workbench with 3D turntable assembly and equipped subsystem inventory. |
| `06_prelaunch_review.png` | Stage 5 | Pre-launch flight readiness review gate and constraint verification checklist. |
| `07_launch_orbital_insertion.png` | Stage 6 | 3D launch sequence showing countdown, atmospheric ascent, and dispenser separation. |
| `08_flight_debrief_75pts.png` | Stage 7 | Post-mission debrief dashboard displaying 75/100 composite score, badge rank, and risk matrix. |
| `09_report_recommendations.png` | Stage 7 Close-Up | Focused capture of both mathematically validated next-step design recommendations. |
| `10_multiplayer_lobby.png` | Multiplayer Lobby | Dispatch screen connected to the live authoritative Socket.IO backend at `http://localhost:3000`. |
| `11_multiplayer_room_host.png` | Mission Control (Host View) | Initial flight room creation on the live authoritative backend showing host lease and discipline selector. |
| `12_multiplayer_room_live.png` | Mission Control (Live Crew & Voting) | Live session showing two independently connected players (Mission Planner & Science Lead) and active synchronized consensus voting over Socket.IO. |

---

## 15. Team Contributions
* **Shared Physics & Rules Engine (`@orbitone/shared`):** Pure deterministic astrodynamics formulas, catalog definitions, scoring algorithms, and recommendation logic.
* **Authoritative Multiplayer Server (`@orbitone/server`):** Express & Socket.IO server implementing room synchronization, role leases, consensus voting, and validation gates.
* **Frontend Client & 3D Visualizer (`app/`):** Responsive mission wizard, Commander Nova co-pilot assistant, Three.js 3D satellite renderer, and debrief dashboard.
