# ORBITONE: NASA Data Attribution & Scientific Honesty Review

## 1. Verified NASA Sources and Challenge References

ORBITONE was developed for the NASA Space Apps Challenge 2026 under the *"Space Mission Design Game"* challenge statement. The application draws inspiration, structural taxonomy, and reference standards from the following official publications:

| Document / Asset | Official Source / Publisher | Role in ORBITONE |
| --- | --- | --- |
| **CubeSat 101: Basic Concepts and Processes for First-Time CubeSat Developers** (Rev. Oct 2017) | NASA CubeSat Launch Initiative (CSLI), NASA Headquarters | Form factor limits (1U, 1.5U, 2U, 3U), dispenser mechanics, licensing requirements, and real mission reference catalog (`missions_real.json`). |
| **Design and Develop Science Missions** (Webinar Slides, Mar 26, 2025) | NASA Small Satellite Institute | Four mission segments (Launch, Space, Ground, User), systems engineering lifecycle ("begin with the end in mind"), Level-1 requirement formulation, and verification methods (Test, Analysis, Inspection, Demonstration). |
| **Space Mission Concept Development Using Concept Maturity Levels** (Wessen et al., 2013) | NASA Jet Propulsion Laboratory (JPL), NASA Dataverse | Informs the conceptual stage gate progression (CML 1: Cocktail Napkin through CML 4: Point Design) and 5×5 risk matrix format. *(Educational adaptation only; see limitations below).* |
| **Goddard Mission Design Lab (MDL)** Architecture | NASA Goddard Space Flight Center (GSFC) Integrated Design Center | Informs study depth tiers (Office Hours, Concept Development, Trade Study, Point Design), subsystem discipline list, and Master Equipment List (MEL) accounting. |
| **NASA POWER Dataset (CERES SYN1deg)** | NASA Langley Research Center | Surface and top-of-atmosphere solar irradiance concepts informing aerosol optical depth ($AOD_{55}$) educational objectives and solar cell illumination fractions. |
| **General Mission Analysis Tool (GMAT R2025a)** | NASA Goddard Space Flight Center | Used strictly as an offline reference tool to benchmark Keplerian orbit parameters and eclipse periods; GMAT binaries are **not embedded** within the web application. |

---

## 2. Historic NASA & Partner CubeSat Mission References

To give students tangible historical context, Stage 7 (Flight Debrief) matches the cadet's spacecraft configuration with a real-world CubeSat mission from the NASA CubeSat 101 catalog (`shared/src/data/missions_real.json`):

* **IceCube (NASA Goddard / Earth Science Technology Office)**: 3U CubeSat testing an 857 GHz sub-millimeter wave radiometer to measure cloud ice at altitudes of 5–15 km (CubeSat 101, p. 31). Matches Earth Observation 3U point designs.
* **MinXSS (University of Colorado Boulder / NASA Solar Physics)**: 3U CubeSat observing soft X-ray emissions from solar coronal flares to study coronal heating (CubeSat 101, p. 30).
* **CADRE (University of Michigan / NSF)**: 3U CubeSat investigating upper atmospheric dynamics, thermosphere densities, and ionospheric plasma (CubeSat 101, p. 30).
* **BisonSat (Salish Kootenai College)**: 100-meter visible Earth imagery satellite utilizing passive magnetic attitude stabilization (CubeSat 101, p. 47).
* **STMSat-1 (St. Thomas More Cathedral School)**: 1U Earth-imaging educational CubeSat, notable as the first primary-school-developed satellite deployed by NASA (CubeSat 101, p. 17).

---

## 3. Taxonomy of Data: NASA-Derived vs. Engine-Calculated vs. Game-Design Values

To maintain complete transparency and scientific integrity, ORBITONE strictly distinguishes between authentic aerospace facts, physical calculations, and simplified game mechanics:

### A. Authentic NASA-Derived Facts & Physical Constants
* **Standard Gravitational Parameter ($\mu_\oplus$):** $398,600.44\text{ km}^3/\text{s}^2$.
* **Mean Earth Radius ($R_\oplus$):** $6,378.14\text{ km}$.
* **CubeSat Standard Dimensions:** $1\text{U} = 10\times 10\times 10\text{ cm}$. Mass ceilings: $1\text{U} \le 1.33\text{ kg}$, $1.5\text{U} \le 2.00\text{ kg}$, $2\text{U} \le 2.66\text{ kg}$, $3\text{U} \le 4.00\text{ kg}$ (CubeSat 101, pp. 79–83).
* **Orbital Sunlight Fractions & Eclipse Times:** Circular LEO (~60% sunlight, ~35 min eclipse) and SSO (~72% sunlight, ~27 min eclipse) derived from orbital altitude geometry.

### B. Shared-Engine Physical & Engineering Formulas
* **Total Spacecraft Mass:** $\sum m_{\text{subsystems}} + m_{\text{fuel}}$ evaluated against class ceilings and launch vehicle capacities.
* **Continuous Daylight Power Generation:** $P_{\text{gen}} = \text{Area} \times \text{Efficiency} \times \text{Sunlight Fraction}$.
* **Subsystem Power Consumption:** $\sum P_{\text{subsystem}} \times \text{Duty Cycle}$.
* **Daily Telemetry Downlink:** $\text{Data Rate} \times \text{Contact Minutes/Day} \times \text{Link Efficiency}$.
* **Orbital Speed:** $v = \sqrt{\frac{\mu_\oplus}{R_\oplus + h}}$.

### C. Game-Design Assumptions & Educational Simplifications
* **Financial Costs & Budgets:** The \$2.5M budget, \$0.30M rideshare cost (based on historic 2017 CSLI estimates), and individual component costs are **game-balance values**. They represent relative subsystem trade-offs rather than current commercial aerospace pricing.
* **Component Performance Figures:** Mass, power consumption, and data generation numbers for catalog items (e.g. Multispectral Imager, Langmuir Probe) are normalized educational proxies designed to produce meaningful engineering tensions.
* **Mission Scoring & Ranks:** The 0–100 composite scoring scale (Mission Success 30, Science Value 20, Resource Efficiency 20, Engineering Quality 30) is a pedagogical construct to incentivize balanced engineering, not an official NASA grading rubric.

---

## 4. Scientific & Operational Limitations

1. **Not a Flight Dynamics Tool:** ORBITONE does not perform high-fidelity orbital propagation, non-spherical Earth gravity perturbation ($J_2/J_4$) modeling, space radiation total ionizing dose (TID) degradation modeling, or thermal finite-element analysis.
2. **Simplified Orbital Trajectories:** Orbits are treated as circular two-body Keplerian approximations with simplified contact window heuristics.
3. **Pedagogical JPL CML Adaptation:** The game uses the conceptual framework of JPL's Concept Maturity Levels (CML 1–4) to structure the cadet's workflow. It does **not** claim formal compliance with institutional NASA Systems Engineering Handbook (SP-6105) gate review criteria.
