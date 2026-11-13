# GAME_RULES_ADDENDUM.md: Additions from the two NASA resource PDFs

Sources read in full:
- **[CML]** "Space Mission Concept Development Using Concept Maturity Levels", Wessen, Borden, Ziemer, Kwok (JPL, 2013).
- **[CS101]** "CubeSat 101: Basic Concepts and Processes for First-Time CubeSat Developers", NASA CubeSat Launch Initiative (rev. Oct 2017). Page numbers below are the printed page numbers.

This file extends GAME_RULES.md. Where it contradicts GAME_RULES.md, this file wins, because it is checked against the sources.

Rules for using this file:
- Facts marked **(source)** come from the PDFs. Everything marked **(game)** is a balance value we invent. Label game values as such in the UI.
- CubeSat 101 is dated 2017. Do not present its launch-vehicle list or its $300,000 figure as current. Show "as of 2017".
- Paraphrase in the game. Do not copy text or images from these documents. Credit NASA and JPL on the About screen.

---

## A. Corrections to GAME_RULES.md

**A1. CubeSat class table (replaces the numbers in GAME_RULES section 2).** The earlier numbers ("2U about 2 kg, 3U about 3 kg, 6U about 6 kg") were not from a source and are wrong. Use:

| Class | Mass limit (source) | Height (source) |
| --- | --- | --- |
| 1U | under 1.33 kg | 113.5 mm (width 100 mm) |
| 1.5U | under 2.00 kg | 170.2 mm |
| 2U | under 2.66 kg | 227.0 mm |
| 3U | under 4.00 kg | 340.5 mm |
| 3U+ | under 4.00 kg | same as 3U, plus a small extra volume (length up to 36 mm, diameter up to 64 mm) |

Source: CS101 acceptance checklists, pp. 79 to 83. A 1U is a 10 cm cube (p. 4). Sizes 6U and 12U exist (p. 4) but the PDF gives no mass limit for them, so mark any 6U mass as **(game)**. A "small satellite" is generally anything under 300 kg (p. 4).

**A2. CML names and stage mapping (replaces the stage names in GAME_RULES section 5).** [CML] section II:

| CML | Real name | What it means (paraphrased) |
| --- | --- | --- |
| 1 | Cocktail Napkin | Science questions stated, rough sketch, what makes the idea unique |
| 2 | Initial Feasibility | Lower-level objectives, key performance numbers, first-order calculations to see if it is viable |
| 3 | Trade Space | Explore trades between science, spacecraft, ground and mission design; see how science return, cost and risk relate |
| 4 | Point Design | One specific design and cost, down to major subsystems, with margins and reserves |

Use these as the wizard stage names: Objective (CML 1), Initial Feasibility (CML 2), Trade Space (CML 3), Point Design (CML 4).
- The paper stresses an iterative loop between CML 2, 3 and 4. Players must be able to go back from Point Design to Trade Space when a problem appears. Show it as a feature, not as a mistake.
- The paper's key idea: understand how science return changes as mass, data volume or orbit change (the "science partials"). The Trade Space screen should show science value as a curve against those parameters.

**A3. Margin thresholds (replaces "under 10%" in GAME_RULES section 7 soft warnings).** Two different real numbers exist:
- **Budget reserve: at least 10%** (CS101 p. 13).
- **Technical margins at Point Design (CML 4 checklist, [CML] Fig. 8b):** spacecraft dry mass 35% or more, power 35% or more, energy 35% or more, flight software 100% (CPU timing and memory), telecom 3 dB or more for deep space and 6 dB or more for proximity links. Propellant, data storage and attitude control have no margin requirement at CML 4. A footnote about relaxing the 35% is partly illegible in the PDF, so treat 35% as the strict-mode value.
- These are JPL values for larger missions. Use them as the **Level 3** thresholds. For Level 1 use a gentler **(game)** warning, for example 15%, and say so.

---

## B. Add these first (best value for the demo)

1. **CubeSat class and dispenser check.** Add `cubesat_classes.json` from A1. Hard checks: total mass under the class limit, and class fits the dispenser. Dispenser facts (source, pp. 5 to 6): the 3U dispenser holds up to three units in any combination (three 1U, two 1.5U, one 3U); 6U dispensers (since 2014) take any combination up to 6U, for example one 6U, six 1U, two 3U.
2. **Concept Maturity meter (stage gate).** Each stage has a checklist grouped by functional area (science, mission, spacecraft, ground, risk, cost). Each item is green (done), yellow (in progress) or red (not started). Rules from [CML] section V:
   - A stage passes at **80% green**.
   - But 80% is not enough if critical items are missing. The paper's example: 90% green yet no Science Traceability Matrix, no Level 1 requirements and no Master Equipment List is not mature. Mark those as **critical items** that must be green.
   - The checklist only measures completeness, not quality, and does not weight items. Say so in the UI.
   - The paper warns that self-assessment is too optimistic. In team mode another role signs off the gate. In solo mode an automated reviewer does.
3. **Science Traceability and two success levels.** CML 4 asks for a draft Science Traceability Matrix (objective, measurement, instrument, requirement) and one **Baseline** and one **Threshold** science investigation. Use this for outcomes: Failure, **Threshold met** (partial success), **Baseline met** (full success). Add `baseline_science` and `threshold_science` to `objectives.json`.
4. **Master Equipment List (MEL) view.** One table of every part with mass, power, data rate and cost. CML 3 and 4 require mass of major elements and a MEL at assembly level (antenna, tank, star tracker, etc.). This is also the player's parts list.
5. **Descope options.** CML 4 asks for descope and backup options. When a hard check fails, offer "descope" choices (drop an instrument, smaller antenna) with the science lost, instead of only a red error.
6. **Heritage flag.** CS101 advises using components that have flown before (p. 16), especially batteries, antennas and attitude control. Add `heritage: true/false` to `parts.json`: heritage parts lower failure risk, new technology costs more and adds risk. The CML matrix also tracks technology readiness (TRL), so optionally add `trl` as 1 to 9 **(game)**.
7. **5x5 risk matrix in the report.** The CML 4 checklist lists risk drivers and top risks in a 5x5 matrix (likelihood x consequence) with selected mitigations. Show the player's top risks in the end report this way.
8. **Launch period and flexibility.** CML 4 lists a launch period of 20 days. CS101: the more flexible the orbit and date, the easier to get a ride (manifesting takes 1 to 36 months, p. 18), and only the primary mission or rocket can move the launch date. If your CubeSat is late, the rocket leaves without it (p. 28). Add a "flexibility" choice: flexible orbit gives earlier and cheaper launch, a very specific orbit adds waiting months **(game values)**.

---

## C. Add if there is time

- **Licensing delays (Level 2 and up).** Any radio needs an RF licence. An imager needs a NOAA remote-sensing licence (CS101 pp. 20 to 21, 43 to 52). Facts: the FCC needs at least 90 days after receiving a complete application (p. 50); NOAA approval for Earth-only imagers takes about 120 days (p. 51); imaging anything other than Earth needs an extra waiver; missing licences before delivery gets you removed from the launch (demanifested). Game rule: comms part adds RF licence months, imager adds remote-sensing months, and failing to finish in time is a hard fail with the plain reason.
- **Test campaign.** Real tests: Day-In-The-Life, vibration, and thermal vacuum bakeout (CS101 pp. 59 to 63). Game rule: tests cost time and money and reduce launch-failure risk; changing the design after the tests invalidates them and forces a retest (p. 60 to 61).
- **Spare unit.** Building an engineering test unit and FlatSat plus two flight units costs more but lowers risk (p. 23). Offer as a "build spares" option.
- **Independent merit and feasibility reviews (team mode).** Real reviews are done by people not on the project team (pp. 14 to 15). In team mode, a teammate outside the owner's role reviews. Merit review: does it serve a NASA goal. Feasibility review: can the team deliver on time and on budget.
- **Propulsion penalty.** CS101 (p. 16): propulsion systems can make launch providers nervous and some will not carry them, so finding a ride may take longer. Level 1 locks propulsion off. Level 2 and up allows it with fewer launch options and longer manifesting.
- **Ground station.** Needs at least a radio and an antenna, should be built and tested early, and an inadequate station is a mission killer (pp. 22 to 23). Tie it to the Communications meter and ground contact minutes.
- **Re-entry materials.** Prefer low-melting materials such as aluminium and steel over tantalum, titanium or tungsten, because parts that survive re-entry are a hazard (p. 16 and p. 54). Add a `material` field and a small end-of-life warning. The PDF does not give a deorbit time limit, so do not state one.
- **Commissioning sequence at the start of Operations.** The notional example (p. 70): after deployment timers start, antennas deploy at 30 minutes, beacon at 45 minutes, first passes are checkouts, payload tests begin about 4 days later. Make the first simulated days a short "commissioning" step where deployables and ground station can fail.
- **Cost items to show.** Materials, labour, environmental testing and travel (p. 12). CSLI covers the launch only, and the document says up to $300,000 typically covers a 3U to low Earth orbit (2017 figure, p. 11).
- **Typical schedule numbers (source, pp. 9 to 10).** A CubeSat can be built in as little as 9 months but usually takes 18 to 24. Licensing is 4 to 6 months, ground station 2 to 12, hardware 2 to 12, mission coordination 9 to 18, selection list about 12 to 16 weeks after the deadline (p. 18).

---

## D. Real missions for `missions_real.json` (all named in CubeSat 101)

Use only for the end-of-mission "similar real mission" match. Always show the source page. Match by objective and size.

| Mission | Objective (paraphrased) | Source |
| --- | --- | --- |
| LightSail (Planetary Society) | 3U technology demo of a solar sail, crowdfunded | p. 13 |
| KickSat (Cornell) | Technology demo deploying 104 tiny "Sprite" chip satellites | p. 13 |
| STMSat-1 (St. Thomas More Cathedral School) | 1U education mission photographing Earth; first CubeSat from a primary school | p. 17 |
| TJ3Sat (Thomas Jefferson High School) | Education mission with a voice synthesizer; first high-school-built CubeSat | pp. 33, 63 |
| BisonSat (Salish Kootenai College) | Earth science: imagery at 100 m or better using passive magnetic stabilisation | p. 47 |
| MinXSS (Univ. of Colorado Boulder) | Solar flare and Sun X-ray science | p. 30 |
| CADRE (Univ. of Michigan) | Space weather in the thermosphere and ionosphere | p. 30 |
| IceCube | Test a sub-millimetre-wave radiometer to sense cloud ice at 5 to 15 km | p. 31 |
| HaloSat (Univ. of Iowa) | Map hot gas in the Milky Way using X-rays | p. 60 |
| SporeSat (NASA Ames) | Space biology: how cells sense gravity | p. 25 |
| CXBN (Morehead State) | Measure the cosmic X-ray background at 30 to 50 keV | p. 50 |
| ChargerSat-1 (Univ. of Alabama Huntsville) | Technology demos: gravity-gradient stabilisation, deployable solar panels, antenna gain | p. iv |
| ARMADILLO (Univ. of Texas Austin) | 3U attitude manoeuvres and debris instrument in low orbit | p. 3 |
| Dellingr (NASA Goddard) | 6U CubeSat | pp. 6, 49 |
| Fox-1 (AMSAT) | Education, amateur radio communications package | p. 45 |

Also useful (p. 3): about half of NASA CSLI missions do science, most often space weather and Earth science, and 66% do technology demonstration or development. Use this to weight how often the game offers each objective type.

---

## E. Tutorial mission (Level 1, 60 to 90 seconds)

Use the notional "CubeSat-1" example from CS101 p. 70 as the guided first mission: a 1U that demonstrates commercial off-the-shelf parts, tests a high-speed comms link and characterises an Earth observation imager; aluminium structure; lithium-ion batteries with protection circuits. It naturally teaches the class limit, the comms and data meters, and (because it has a radio and an imager) the licensing delay.

---

## F. Data and balance changes

- New: `/data/cubesat_classes.json` (id, mass_limit_kg, height_mm, source).
- `objectives.json`: add `baseline_science`, `threshold_science`, `critical_checklist_items`.
- `parts.json`: add `heritage`, `trl` (optional), `descopable`, `material`.
- `orbits.json` or `launch.json`: add `manifest_flexibility`, `launch_period_days`.
- `config/balance.ts`: `BUDGET_RESERVE_MIN = 0.10`, `TECH_MARGIN_STRICT = 0.35`, `TECH_MARGIN_L1 = 0.15` **(game)**, `STAGE_GATE_PASS = 0.80`.
- New checks: `classFitsDispenser`, `massUnderClassLimit`, `stageGateReady` (80% green plus all critical items green), `licensesInTime` (Level 2 and up).

---

## G. Do NOT add

- The paperwork deliverables (ODAR, transmitter survey, materials list, MSPSP, compliance letter). Too heavy and not fun. Mention in the report only that they exist.
- The five launch mission models (NASA-procured, ORS, NRO, commercial broker, ISS) as separate mechanics.
- CML 5 to 9 (baseline concept, PDR, CDR). The paper itself limits its focus to CML 1 to 4.
- Any copied NASA or JPL text, figures or photos.
