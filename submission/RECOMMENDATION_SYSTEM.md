# ORBITONE: Mission Recommendation & Flight Feedback System

## 1. Architectural Overview & Data Flow

The ORBITONE recommendation engine adheres to a strict shared-package-to-frontend pipeline. Recommendations are mathematically computed by the deterministic `@orbitone/shared` rules engine based on flight telemetry, subsystem margins, and constraint evaluations. The frontend operates solely as a presentation layer and does not generate, mutate, or improvise recommendations.

```
┌────────────────────────────────────────────────────────┐
│                   @orbitone/shared                     │
│                                                        │
│  [runSimulation()] ──► [scoreMission()]                │
│         │                     │                        │
│         ▼                     ▼                        │
│             [buildReport(sim, score)]                  │
│                        │                               │
│              populates what_to_try_next                │
└────────────────────────┼───────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────┐
│               app/src/engine/engineAdapter.ts          │
│                                                        │
│   buildReport(sim, score)                              │
│   maps directly to sharedBuildReport(sim, score)       │
└────────────────────────┼───────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────┐
│                 app/src/ui/wizard.ts                   │
│                                                        │
│   Stores state.report = report                         │
│   Passes report to renderReportStage()                 │
└────────────────────────┼───────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────┐
│             app/src/ui/stages/report.ts                │
│                                                        │
│   Maps report.what_to_try_next to .next-steps-list     │
│   Visibly renders both concrete action cards           │
└────────────────────────────────────────────────────────┘
```

### Component Roles:
1. **`shared/src/report.ts` (`buildReport`)**:
   - Evaluates simulation results (`SimResult`), cause tags (`sim.cause_tags`), subsystem catalogs, and scoring breakdown (`ScoreBreakdown`).
   - Identifies whether the spacecraft suffered hard pre-launch failure, an in-flight anomaly (e.g. eclipse battery exhaustion, buffer overflow), or completed a nominal flight that met baseline/threshold goals.
   - Computes deterministic, parameter-bounded optimizations (`what_to_try_next`) backed by actual physical formulas (`data_made_per_day_gb`, `data_sent_per_day_gb`, `total_mass_kg`, `power_used_w`).
2. **`app/src/engine/engineAdapter.ts`**:
   - Serves as the single architectural bridge between the UI and the physics engine.
   - When `USE_REAL_ENGINE = true`, delegates directly to `sharedBuildReport(simResult, effectiveScore)`.
3. **`app/src/ui/wizard.ts`**:
   - Manages state across all seven Concept Maturity Level (CML) stages.
   - Upon simulation completion or navigation to Stage 7, caches `this.state.report` and invokes `renderReportStage`.
4. **`app/src/ui/stages/report.ts`**:
   - Renders the post-mission debrief dashboard.
   - Maps `report.what_to_try_next` to styled DOM elements (`<ul class="next-steps-list"><li class="next-step-item">...</li></ul>`), ensuring full visibility and semantic hierarchy.

---

## 2. Analysis of the Baseline 75-Point Mission Recommendations

For the baseline Earth Observation mission (3U CubeSat, SSO orbit, SmallSat Rideshare Dispenser, Rad-Hardened OBC, 30Wh Space-Grade Battery, S-Band Patch Transceiver, Multispectral Imager, Seed 42, Level 1), the engine records partial success (`threshold_met`, 75/100 composite score). 

Because the satellite suffered **zero anomalies**, downlinked all **360.0 GB** generated without packet loss, and had sufficient battery reserves, the engine does not suggest unnecessary battery or radio hardware upgrades. Instead, it evaluates parametric optimization headroom to help the cadet achieve full baseline success (`baseline_met`).

### Recommendation 1: Observation Time Fraction Optimization
* **Rendered Text:**
  > *"Increase payload observation time fraction (observe_time_fraction) from 0.50 to 0.53 to increase science data collection from 360.0 GB to 381.6 GB (+2.4 science points) while keeping 30-day cumulative volume (31.8 GB) within the 32 GB flash memory buffer."*
* **Triggering Condition:**
  `sim.outcome === 'threshold_met'`, `sim.data_lost_total_gb === 0`, and the onboard flash buffer (`32.0 GB`) has unused capacity beyond the current 30-day accumulation cycle.
* **Governing Math:**
  $$\text{Daily Downlink} = \text{data\_sent\_per\_day\_gb}(0.025, 50, 0.95) = 1.1875\text{ GB/day}$$
  $$\text{Storage Limit} = \frac{32.0\text{ GB}}{30\text{ days}} = 1.0667\text{ GB/day}$$
  $$\text{Max Safe Duty} = \left\lfloor \frac{\min(1.0667, 1.1875)}{2.0\text{ GB/day}} \times 100 \right\rfloor \div 100 = 0.53$$
* **Engineering Trade-off:**
  Increasing payload observation time increases science return (+21.6 GB downlinked over 12 months, yielding +2.4 science points). However, higher duty cycles push memory buffer accumulation closer to maximum capacity ($31.8\text{ GB} \le 32.0\text{ GB}$). In educational contexts, this illustrates the delicate balance between maximizing payload utilization and risking data overflow during ground station communication blackouts.

### Recommendation 2: Unused Propellant Descoping (Mass Margin Optimization)
* **Rendered Text:**
  > *"Reduce fuel mass (fuel_mass_kg) from 0.1 kg to 0.0 kg to lower total spacecraft mass from 3.30 kg to 3.20 kg and expand 3U CubeSat class mass margin from 17.5% to 20.0%."*
* **Triggering Condition:**
  `sim.design.fuel_mass_kg > 0` on an Earth Observation mission in a circular Sun-Synchronous Orbit (SSO) where orbital maneuvers or drag-makeup propulsion are not required by the Level 1 mission rules.
* **Governing Math:**
  $$\text{New Mass} = 3.30\text{ kg} - 0.10\text{ kg} = 3.20\text{ kg}$$
  $$\text{Current Margin} = \frac{4.00 - 3.30}{4.00} \times 100\% = 17.5\%$$
  $$\text{New Margin} = \frac{4.00 - 3.20}{4.00} \times 100\% = 20.0\%$$
* **Engineering Trade-off:**
  Carrying unused propellant incurs parasitic mass, compressing structural margins against the strict 4.0 kg 3U dispenser threshold. Removing this propellant eliminates deadweight and improves mass margin to 20.0%. In real spacecraft engineering, whether propellant can be removed depends on whether orbit raising, collision avoidance, or controlled deorbiting is required by mission licensing.

---

## 3. Educational Design Principles
1. **Explain the "Why":** The engine pairs every recommendation with the physical justification (memory capacity, mass margin, power draw) rather than arbitrary game directives.
2. **Actionable & Quantitative:** Every recommendation specifies both the parameter to adjust and the expected quantitative outcome.
3. **No Phantom Warnings:** The engine validates that recommended parts are not already equipped (e.g., it will not advise installing an S-band patch if one is already present).
