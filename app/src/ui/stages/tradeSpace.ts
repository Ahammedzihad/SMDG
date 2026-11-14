/**
 * Stage 3: Trade Space (CML 3)
 *
 * Side-by-side exploration of architectural trades:
 * Orbit selection and Launch Vehicle selection.
 * Illustrates how orbit altitude, lighting, contact time, and launcher cost interact.
 */

import type { Orbit, Vehicle } from '@shared';
import { renderIcon } from '../icons';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderTradeSpaceStage(
  orbits: Orbit[],
  vehicles: Vehicle[],
  selectedOrbitId: string,
  selectedVehicleId: string,
  onSelectOrbitAction: string = 'select-orbit',
  onSelectVehicleAction: string = 'select-vehicle'
): string {
  // Orbit comparison cards
  const orbitCards = orbits
    .map((orbit) => {
      const isSelected = orbit.id === selectedOrbitId;
      const sunlightPercent = Math.round(orbit.sunlight_fraction * 100);
      const eclipsePercent = 100 - sunlightPercent;
      const selectionIcon = isSelected ? renderIcon('check', 14, '', 'var(--brand-cyan)') : '○';

      return `
        <article class="stage-card trade-card glass-card ${isSelected ? 'is-selected' : ''}" tabindex="0" role="radio" aria-checked="${isSelected}" data-action="${onSelectOrbitAction}" data-id="${orbit.id}">
          <div class="card-header">
            <span class="cml-tag" style="display:inline-flex; align-items:center; gap:4px">${renderIcon('planet', 13)} ORBIT ARCHITECTURE</span>
            <span class="selection-marker" aria-hidden="true" style="display:inline-flex; align-items:center; gap:4px">
              ${selectionIcon} ${isSelected ? 'SELECTED' : 'SELECT'}
            </span>
          </div>

          <h3 class="card-title">${escapeHtml(orbit.name)}</h3>
          <p class="card-description">${escapeHtml(orbit.explanation)}</p>

          <div class="trade-stats-grid">
            <div class="stat-box">
              <span class="stat-label">ALTITUDE</span>
              <strong>${orbit.altitude_km.toLocaleString()} km</strong>
            </div>
            <div class="stat-box">
              <span class="stat-label" style="display:inline-flex; align-items:center; gap:3px">${renderIcon('power', 12)} SUNLIGHT / ECLIPSE</span>
              <strong>${sunlightPercent}% Sun / ${eclipsePercent}% Shade</strong>
            </div>
            <div class="stat-box">
              <span class="stat-label" style="display:inline-flex; align-items:center; gap:3px">${renderIcon('time', 12)} GROUND CONTACT</span>
              <strong>${orbit.contact_min_per_day} min/day</strong>
            </div>
            <div class="stat-box">
              <span class="stat-label">LAUNCH ENERGY</span>
              <strong>${orbit.launch_energy} C3 index</strong>
            </div>
          </div>

          <div class="manifest-flex-pill">
            <span>Launch Manifest Flexibility: <b>${escapeHtml(orbit.manifest_flexibility.toUpperCase())}</b></span>
          </div>
        </article>
      `;
    })
    .join('');

  // Vehicle comparison cards
  const vehicleCards = vehicles
    .map((veh) => {
      const isSelected = veh.id === selectedVehicleId;
      const capacityForOrbit = veh.capacity_by_orbit?.[selectedOrbitId] ?? 0;
      const isCapable = capacityForOrbit > 0;
      const selectionIcon = isSelected ? renderIcon('check', 14, '', 'var(--brand-cyan)') : '○';

      return `
        <article class="stage-card trade-card glass-card ${isSelected ? 'is-selected' : ''} ${!isCapable ? 'is-incompatible' : ''}" tabindex="0" role="radio" aria-checked="${isSelected}" data-action="${isCapable ? onSelectVehicleAction : ''}" data-id="${veh.id}">
          <div class="card-header">
            <span class="cml-tag" style="display:inline-flex; align-items:center; gap:4px">${renderIcon('rocket', 13)} LAUNCH SEGMENT</span>
            <span class="selection-marker" aria-hidden="true" style="display:inline-flex; align-items:center; gap:4px">
              ${selectionIcon} ${isSelected ? 'SELECTED' : 'SELECT'}
            </span>
          </div>

          <h3 class="card-title">${escapeHtml(veh.name)}</h3>
          <p class="card-description">${escapeHtml(veh.explanation)}</p>

          <div class="trade-stats-grid">
            <div class="stat-box">
              <span class="stat-label" style="display:inline-flex; align-items:center; gap:3px">${renderIcon('budget', 12)} LAUNCH COST</span>
              <strong>$${veh.cost.toFixed(2)} $M</strong>
            </div>
            <div class="stat-box">
              <span class="stat-label">PAYLOAD CAPACITY</span>
              <strong>${capacityForOrbit > 0 ? `${capacityForOrbit} kg` : 'INCOMPATIBLE'}</strong>
            </div>
            <div class="stat-box">
              <span class="stat-label">FAIRING ENVELOPE</span>
              <strong>${escapeHtml(veh.fairing_size)}</strong>
            </div>
            <div class="stat-box">
              <span class="stat-label">DATA SOURCE</span>
              <strong>${escapeHtml(veh.source)}</strong>
            </div>
          </div>
        </article>
      `;
    })
    .join('');

  return `
    <section class="wizard-stage-view stage-trade-space" aria-labelledby="stage-heading">
      <div class="stage-heading-block">
        <span class="stage-pill">STAGE 3 OF 7 // MISSION ARCHITECTURE</span>
        <h2 id="stage-heading">Trade Space Exploration (CML 3)</h2>
        <p>
          Evaluate architecture trade-offs between orbital parameters and launch vehicles.
          Orbits dictate eclipse cycles, solar generation, and ground station passes, while launch vehicles dictate capacity and cost.
        </p>
      </div>

      <div class="orbit-preview-panel glass-card" style="margin-bottom: 24px; padding: 16px; border-radius: 12px; background: rgba(14,24,37,0.7); border: 1px solid var(--border-light)">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 12px">
          <div style="display:flex; align-items:center; gap:8px">
            <span class="live-dot"></span>
            <strong style="font-size:11px; letter-spacing:1px; color:#fff; font-family:var(--mono)">ORBITAL TRAJECTORY 3D SIMULATION</strong>
          </div>
          <span style="font-size:10px; color:var(--cyan); font-family:var(--mono)">UPDATES INCLINATION &amp; PATH DYNAMICALLY</span>
        </div>
        <div class="scene-card" style="height: 240px; border-radius: 8px; position:relative; overflow:hidden">
          <div class="scene-host" data-scene style="width:100%; height:100%"></div>
          <div class="scene-scale">CLICK &amp; DRAG TO ROTATE EARTH · SCROLL TO ZOOM</div>
        </div>
      </div>

      <div class="trade-section">
        <div class="sub-heading">
          <span class="step-badge">1</span>
          <h3>Select Target Orbit</h3>
        </div>
        <div class="trade-cards-grid" role="radiogroup" aria-label="Target Orbit Selection">
          ${orbitCards}
        </div>
      </div>

      <div class="trade-section" style="margin-top: 28px;">
        <div class="sub-heading">
          <span class="step-badge">2</span>
          <h3>Select Launch Vehicle</h3>
        </div>
        <div class="trade-cards-grid" role="radiogroup" aria-label="Launch Vehicle Selection">
          ${vehicleCards}
        </div>
      </div>
    </section>
  `;
}
