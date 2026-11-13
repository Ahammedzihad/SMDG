# GAME_RULES.md: Space Mission Design Game

NASA Space Apps Challenge 2026: "Space Mission Design Game" (Intermediate, Beginner/Youth, Games).
This file is the source of truth for the agent. Build the game from it. If something here conflicts with a later chat message, ask before changing it.

---

## 1. What we are building

A browser game where 1 to 4 players design, launch and run a complete space mission, then see a 3D simulation and a report that explains why it succeeded or failed.

The goal is **learning trade-offs**. Every choice must cost something somewhere else. There is no single perfect design.

Target audience: students with no space background. Explain every concept in plain words, inside the game.

### Challenge requirements we must cover (from the challenge text)
1. Pick a mission objective first.
2. Design a spacecraft: structure, power, batteries, comms, computer, attitude control, instruments.
3. Choose instruments, a launch vehicle and an orbit.
4. Show and manage six resources: **mass, power, budget, data, communications, time**.
5. Check the spacecraft mass and orbit against the launch vehicle.
6. Single-player and team mode, up to 4 players, with roles.
7. A simulation, a scoring system and feedback that explains *why*.
8. Difficulty levels, several scenarios, random events, a sandbox mode, a mission report.

---

## 2. Where the ideas come from (NASA resources given by the organizers)

| Resource | What we take from it |
| --- | --- |
| Design and Develop Science Missions (NASA Small Satellite Institute webinar, 2025) | Four mission segments (launch, space, ground, user). Process: Identify need and goals, Define concept, Define requirements, Design, Build and verify, Implement. "Begin with the end in mind." Each requirement needs a way to verify it. Example missions: PUNCH, Dawn, BioNutrients-2. |
| Concept Maturity Levels, CML 1 to 4 (JPL) | Our mission wizard stages (section 5). Note: JPL's page blocks automated reading, so the exact CML wording was not checked. The CML 1 to 4 outline above comes from the Goddard MDL page. |
| Goddard Mission Design Lab (MDL) | Study depth levels: Office Hours, Concept Development, Trade Study, Point Design. Discipline list. Products: block diagram, orbit analysis, comms analysis, launch accommodation, equipment list. |
| GMAT (General Mission Analysis Tool) | Real orbit tool. We do NOT embed GMAT. We use simple orbit formulas and name GMAT in the "learn more" links. |
| NASA Mission Viz | 3D visual style: orrery, Earth to Moon transfer, orbit shown as an ellipse, user can rotate the camera. |
| "Build It Yourself" telescope game (Webb) | Science goals drive engineering. Incompatible options are grayed out. 3 levels. Animated launch. Result screen names a real similar mission. |
| CubeSat 101 (NASA CubeSat Launch Initiative) | Beginner spacecraft class. Phases from ConOps to launch to operations. The PDF itself was not readable by our tools, so the size and mass numbers below come from public CubeSat summaries. Check them against the PDF. |
| Space Apps 2023 "Visualize a Space Mission Using VR" | Show concept, trajectory and timeline together in 3D. |
| Canadian Space Agency digital games | Tone: friendly, short missions, for all ages. Reference games: RADARSAT Constellation Mission, OSIRIS-REx. |

Real facts used (keep them accurate in the UI):
- CubeSat unit "1U" is a 10 cm cube. Max mass about 1 to 1.33 kg. 2U about 2 kg, 3U about 3 kg, 6U about 6 kg.
- A small CubeSat typically has only a few watts of power (often quoted around 2 W).
- GMAT supports low Earth orbit, geostationary and highly elliptical orbits, lunar, libration-point and deep-space missions.

**Important:** all other numbers in this file (budgets, masses, costs, scores) are **game-balance values we invented**. They are not NASA data. Show them as "game values" and do not present them as real mission figures.

---

## 3. Players and roles

Modes: **Solo**, **Team (2 to 4)**, **Sandbox**. Optional later: **Competitive** (teams get the same objective and are ranked).

In team mode each player has a role. In solo mode the player switches between roles in one UI.

| Role | Owns | Typical conflict |
| --- | --- | --- |
| Mission Planner | Objective, requirements, orbit, mission time, final sign-off | Wants longer mission and better orbit, which costs money and fuel |
| Spacecraft Engineer | Structure, power, battery, computer, attitude control, mass and power margins | Every added part adds mass and power draw |
| Science Lead | Instruments, science value, data volume | Wants more instruments, which add mass, power and data |
| Comms and Budget Officer | Antenna, ground stations, data downlink, total cost, launch vehicle | Wants to cut cost, but data cannot be sent home |

Team rules:
- Each role edits only its own panel. Everyone sees everything (read-only).
- Shared decisions (objective, orbit, launch vehicle, final launch) need a **vote**: majority of players. In a 2-player team both must agree.
- "Negotiation card" events force a trade-off between two roles (section 9).
- Team coordination score (section 8) rewards: all roles active, resolved conflicts, no last-second edits.

---

## 4. Mission segments (shown in the UI as four tabs)

From NASA's four-segment model:
1. **Launch segment**: launch vehicle, orbit insertion.
2. **Space segment**: the spacecraft and instruments.
3. **Ground segment**: ground stations, downlink windows, mission control.
4. **User segment**: who uses the data. The mission objective is chosen here first ("begin with the end in mind").

---

## 5. Game flow (mission wizard)

Stages follow the CML idea: the design gets more detailed at each step. Players can go back at any time before launch, and every change updates all resources live.

1. **Objective (CML 1)**: pick a science objective and read what it needs.
2. **Requirements (CML 2)**: the game turns the objective into 4 to 6 simple requirements, for example "carry an imager", "downlink at least X data per day", "last at least N months". Each requirement shows how it will be checked ("verified by: mass check at launch").
3. **Trade study (CML 3)**: compare 2 to 3 options for orbit, launch vehicle and instrument set side by side.
4. **Point design (CML 4)**: build the spacecraft part by part. See the 3D model update.
5. **Pre-launch review**: automatic checklist. All hard checks must pass to launch (section 7). Soft warnings are allowed.
6. **Launch**: animated launch, then orbit insertion.
7. **Operations**: mission simulation over the planned lifetime with random events.
8. **Report**: score, timeline, why it worked or failed, similar real missions.

Difficulty tiers (these also map to MDL study depth):

| Level | Name | Spacecraft class | What is unlocked |
| --- | --- | --- | --- |
| 1 | Office Hours | CubeSat (1U to 6U) | 1 objective, 3 orbits, 2 vehicles, 4 instruments, hints always on, no random events |
| 2 | Trade Study | Small satellite | 2 objectives, 5 orbits, 4 vehicles, 8 instruments, mild random events |
| 3 | Point Design | Science mission class | Multi-objective, all orbits, all vehicles, ground-station planning, full events |
| S | Sandbox | Any | No scoring pressure, all limits adjustable, all parts unlocked |

Start the game with a 60 to 90 second guided tutorial that builds one tiny CubeSat mission.

---

## 6. Resources (always visible in a top bar)

Six meters, each with a green / yellow / red state and a "why?" tooltip.

| Resource | Meaning (plain words) | Over the limit means |
| --- | --- | --- |
| Mass (kg) | Total weight of spacecraft plus fuel | Launch vehicle cannot lift it (hard fail) |
| Power (W) | Electricity the solar panels and battery can give vs. what parts use | Instruments switch off, mission loses science |
| Budget ($M, game money) | Money for build, launch and operations | Cannot launch |
| Data (GB per day) | Amount of data the instruments make | Onboard storage fills, data is lost |
| Communications (GB per day) | How much data can be sent to Earth | Data waits or is lost |
| Time (months) | Build time plus mission lifetime | Missing the launch window or ending early |

Core relations (use these formulas, keep them in one `config/balance.ts` file so the team can tune them):

```
total_mass      = sum(part.mass) + fuel_mass
power_generated = solar_area * efficiency * orbit.sunlight_fraction
power_used      = sum(part.power) * duty_cycle
data_made_per_day    = sum(instrument.data_rate) * observe_time_fraction
data_sent_per_day    = antenna.rate * ground_contact_minutes_per_day * link_efficiency
cost_total      = build_cost + launch_cost + ops_cost_per_month * lifetime_months
```

Orbit effects (simple, honest and explainable):
- **Low Earth orbit (LEO)**: cheap, high resolution, many short ground contacts, orbit decays slowly, more eclipse time so battery matters.
- **Sun-synchronous orbit (SSO)**: steady lighting for imaging, medium cost.
- **Geostationary orbit (GEO)**: sees one area continuously, constant contact with one ground station, expensive launch, low resolution from far away.
- **Highly elliptical / lunar / deep space**: needs more launch energy (higher launch capability needed), long delays and low data rates.
Keep orbit as a parameter set: altitude, sunlight fraction, ground contact minutes, launch energy needed, lifetime penalty. Show the one-line reason for each effect.

---

## 7. Hard checks and validation (the "grayed out" rule)

Hard checks block launch. Each failure shows a plain explanation and a suggested fix.

1. `total_mass <= vehicle.capacity_to(orbit)`. This is the launch compatibility check required by the challenge.
2. `power_used <= power_generated` (averaged over an orbit, including eclipse and battery).
3. `cost_total <= budget`.
4. Every selected instrument has a compatible mounting, pointing and data path (comms and computer can handle it).
5. Every requirement from stage 2 is met or knowingly waived (waiving costs score).
6. Spacecraft fits the vehicle fairing or dispenser size.

Compatibility rules (inspired by the telescope game): options that do not fit the objective or the chosen class are **grayed out** with a tooltip saying why, not hidden.

Soft warnings: low margins (under 10% on mass, power or data), single point of failure, very short lifetime.

---

## 8. Simulation and scoring

### Simulation
- Run month by month (or day by day on fast-forward) over the mission lifetime.
- Each step: update power state, data stored, data sent, science collected, random event check, health.
- The player can pause, speed up, and watch the 3D view and the resource graphs.
- Same design plus same random seed gives the same result (so teams can compare). Different seeds give different events.

### Score (0 to 100, shown with a breakdown)

| Part | Weight | Rewards |
| --- | --- | --- |
| Mission success | 30 | Objective requirements actually met |
| Science value | 20 | Science data delivered to the user segment |
| Resource efficiency | 20 | Margins used well, little waste, under budget |
| Engineering quality | 15 | Healthy margins, redundancy where it matters |
| Team coordination | 15 | Team mode only. In solo mode this weight moves to Engineering quality |

Ranks: Cadet (0 to 39), Engineer (40 to 59), Mission Lead (60 to 79), Flight Director (80 to 100).

Leaderboard and saved designs: store the design as JSON (section 12) so players can save, share a code, and compare.

---

## 9. Random events

Frequency by level: none (L1), rare (L2), normal (L3). Each event explains the cause and how a different design would have helped.

Examples (game events, not claims about real missions):
- Solar storm: raises radiation risk, a shielded computer survives, an unshielded one reboots.
- Ground station outage: data waits, more onboard storage means no loss.
- Launch delay: lose 1 month, hurts if the launch window is tight.
- Budget cut (team negotiation card): remove $X from one role's area, the team must agree who loses.
- Instrument anomaly: one instrument loses performance, redundancy or margin helps.
- Orbit decay faster than expected: lifetime shortened in low orbit.

---

## 10. Post-mission report (must-have)

Auto-generated page, printable, with:
1. Result: success, partial success, or failure.
2. Timeline of mission events (launch, orbit insertion, each event, end).
3. Resource graphs over time (power, data stored, budget).
4. "Why did this happen?" in 3 to 5 plain sentences. Always name the cause and the trade-off ("Your battery was too small for LEO eclipses, so the camera shut off every orbit").
5. "What to try next": two concrete design changes.
6. **Similar real mission**: match the design to a real NASA or partner mission by objective and size, as the Webb telescope game does. Use only missions confirmed in the resource files or the NASA site, for example PUNCH (four small satellites in low Earth orbit studying the Sun's corona), Dawn (orbited Vesta and Ceres), Webb, Hubble, OSIRIS-REx. Never invent a match, and show a link.
7. Score breakdown and rank.

---

## 11. Visuals and UI

Tech target: Three.js in the browser. Use the installed Three.js skills.

3D scenes (inspired by NASA Mission Viz):
- Earth with atmosphere glow, Moon, optional Mars.
- Orbit drawn as a line. Spacecraft moves along it. Camera can orbit around and zoom.
- Spacecraft 3D model assembled from the parts the player chose (box body, solar panel wings, antenna dish, instrument shapes). Simple low-poly is fine.
- Launch animation and orbit insertion animation.
- Earth to Moon transfer scenario as a level 3 mission.

UI rules:
- Resource bar always on top. Role panels on the left. 3D view in the center. "Explain this" panel on the right.
- Every term (apogee, payload, downlink, duty cycle, etc.) has a hover definition written for a 12-year-old.
- Colors never carry meaning alone (use icons or text with red/yellow/green) for accessibility. Works on laptop and tablet (at least 1024x768). Provide keyboard focus and readable contrast.
- Use Stitch for the UI design, then convert to code.

---

## 12. Data model (keep game content in JSON, not in code)

```
/data/objectives.json    id, name, description, needs: [capabilities], recommended_orbits
/data/orbits.json        id, name, altitude_km, sunlight_fraction, contact_min_per_day, launch_energy, lifetime_penalty, explanation
/data/vehicles.json      id, name, cost, capacity_by_orbit: {orbitId: kg}, fairing_size
/data/parts.json         id, category (structure|power|battery|comms|computer|adcs|instrument), mass, power, cost, data_rate, level_unlocked, requires
/data/events.json        id, trigger, effect, explanation, min_level
/data/missions_real.json real mission matches for the report (name, objective, size, orbit type, url)
/designs/<code>.json     saved player designs
```

Every number must have `source: "game"` or `source: "NASA <url>"`.

---

## 13. Multiplayer (team of up to 4)

- Node server with Socket.IO rooms. One room per team, 4-letter join code.
- **Server is the authority**: it holds mission state, validates every change, and broadcasts results. Clients send intents only.
- Events: `join_room`, `set_role`, `edit_part`, `propose_decision`, `vote`, `start_sim`, `state_update`.
- Reconnect: a player who drops can rejoin with the same code and gets the full state.
- Solo mode runs the same logic locally with no server.
- Use the `web-realtime-socket-io` and `realtime-multiplayer` skills.

---

## 14. Suggested tech stack

- Frontend: Vite plus React (or plain TypeScript), Three.js.
- Server: Node.js plus Socket.IO.
- State and logic: one shared TypeScript package (`/shared`) used by both client and server, so the simulation gives the same result everywhere.
- Tests: unit tests for the formulas and the hard checks (these are the heart of the game).

---

## 15. Build order for the hackathon (do in this order, ship at each step)

1. **Core loop, solo, no 3D**: objective, parts list, six resource meters, launch check, simple sim, text report. Playable.
2. **Content**: 3 objectives, 4 orbits, 3 vehicles, ~15 parts, 5 events, with plain-language explanations.
3. **3D**: Earth, orbit line, spacecraft that changes with parts, launch animation.
4. **Report and scoring** with "why" explanations and similar-mission match.
5. **Team mode**: rooms, roles, voting.
6. **Polish**: tutorial, difficulty levels, sandbox, save and share code, leaderboard, accessibility.

Definition of done for the demo: a new player can finish Level 1 in under 5 minutes, see why they won or lost, and a 2-person team can finish a mission together.

---

## 16. Rules for the coding agent

- Follow this file. If something is unclear, ask a short question instead of guessing.
- Keep all balance numbers in `config/balance.ts` and `/data/*.json`.
- Never put API keys in code, logs or this repo. Use `.env` (listed in `.gitignore`).
- Do not claim game values are real NASA values.
- Credit NASA and partner resources on an "About and Sources" screen. Include the NASA disclaimer: NASA does not endorse any non-U.S. Government entity.
- Respect each outside resource's use terms. Do not copy text, images or game assets from the NASA, JPL, Webb or CSA games. Build our own.
- Prefer clear, small, tested functions. Explain the *why* in every player-facing message.
