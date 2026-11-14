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
              <span class="stat-label" style="display:inline-flex; align-items:center; gap:3px">${renderIcon('mass', 12)} LIFT CAPACITY</span>
              <strong style="color: ${isCapable ? 'var(--cyan)' : 'var(--brand-coral)'}">
                ${isCapable ? `${capacityForOrbit.toLocaleString()} kg` : '0 kg (Incompatible)'}
              </strong>
            </div>
          </div>

          <div class="fairing-note">
            <small>Payload Fairing: ${escapeHtml(veh.fairing_size)}</small>
          </div>

          ${
            !isCapable
              ? `<div class="incompatible-warning" role="alert" style="display:flex; align-items:center; gap:6px">
                  ${renderIcon('warning', 14, '', 'var(--brand-coral)')} This launch vehicle cannot lift payloads to the currently selected orbit.
                </div>`
              : ''
          }
        </article>
      `;
    })
    .join('');

  return `
    <section class="wizard-stage-view stage-trade-space" aria-labelledby="stage-heading">
      <div class="stage-heading-block">
        <span class="stage-pill">STAGE 3 OF 7 // TRADE SPACE EXPLORATION</span>
        <h2 id="stage-heading">Trade Space (CML 3)</h2>
        <p>
          Compare system options side by side. Higher orbits increase ground contact and solar lighting, but require more launch energy.
          Dedicated rockets cost more than rideshare, but allow custom orbits and deployment timing.
        </p>
      </div>

      <div class="trade-section-block">
        <div class="sub-heading">
          <span class="step-badge">A</span>
          <h3>Select Target Orbit</h3>
        </div>
        <div class="trade-cards-grid" role="radiogroup" aria-label="Target Orbit Selection">
          ${orbitCards}
        </div>
      </div>

      <div class="trade-section-block">
        <div class="sub-heading">
          <span class="step-badge">B</span>
          <h3>Select Launch Vehicle</h3>
        </div>
        <div class="trade-cards-grid" role="radiogroup" aria-label="Launch Vehicle Selection">
          ${vehicleCards}
        </div>
      </div>
    </section>
  `;
}

