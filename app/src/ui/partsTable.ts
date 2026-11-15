/**
 * Master Equipment List (MEL) & Modular Spacecraft Component Library
 *
 * Implements the Spaceflight Simulator inspired modular assembly hangar
 * conforming to NASA CML 4 standards and Stitch Project 1937526940901217389.
 *
 * Features:
 * - Subsystem category filter tabs
 * - Equipped Module Array (Assembly Tray)
 * - Kid-friendly module cards with 1-click Equip/Remove
 * - Real flight heritage badges
 * - Clear disabled states with explanation reasons
 */

import type { Part } from '@shared';
import { renderIcon } from './icons';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export interface PartRowItem {
  part: Part;
  selected: boolean;
  disabled: boolean;
  disabledReason?: string;
}

export const CATEGORY_LABELS: Record<string, { label: string; icon: string; slotName: string }> = {
  all: { label: 'All Subsystems', icon: 'wrench', slotName: 'All Modules' },
  structure: { label: 'Chassis & Structure', icon: 'rocket', slotName: 'Structural Envelope' },
  power: { label: 'Power & Solar', icon: 'power', slotName: 'Power Generation' },
  battery: { label: 'Energy Storage', icon: 'power', slotName: 'Energy Storage' },
  instrument: { label: 'Science Payloads', icon: 'data', slotName: 'Primary Instrument' },
  comms: { label: 'Communications', icon: 'communications', slotName: 'Telemetry & Downlink' },
  adcs: { label: 'Attitude Pointing', icon: 'planet', slotName: 'Attitude Determination' },
  computer: { label: 'Avionics & Computers', icon: 'settings', slotName: 'On-Board Computer' }
};

export function renderEquippedModuleTray(
  items: PartRowItem[],
  onToggleAction: string = 'toggle-part'
): string {
  const equipped = items.filter((i) => i.selected);

  if (equipped.length === 0) {
    return `
      <div class="equipped-tray glass-card empty-tray" style="padding:14px; text-align:center; color:var(--text-muted); border:1px dashed var(--border-glass); border-radius:12px">
        <span>No subsystem modules equipped yet. Select components from the catalog below!</span>
      </div>
    `;
  }

  const chips = equipped
    .map(({ part }) => {
      const isSolar = part.category === 'power' && (part.solar_area_m2 ?? 0) > 0;
      const peakGen = isSolar ? ((part.solar_area_m2 || 0) * (part.solar_efficiency_w_per_m2 || 220)).toFixed(1) : '0';
      const netPower = isSolar ? `+${peakGen}W Peak` : `-${part.power.toFixed(1)}W Load`;
      return `
        <div class="equipped-module-chip glass-card" data-action="focus-part" data-part-id="${part.id}" title="${escapeHtml(part.name)} (${escapeHtml(part.explanation)})">
          <div class="chip-main">
            <span class="chip-category">${part.category.toUpperCase()}</span>
            <strong class="chip-name">${escapeHtml(part.name)}</strong>
            <div class="chip-specs">
              <span>${part.mass.toFixed(2)} kg</span>
              <span class="spec-divider">·</span>
              <span style="color:${part.power < 0 ? 'var(--brand-green)' : 'var(--brand-yellow)'}">${netPower}</span>
            </div>
          </div>
          <button
            type="button"
            class="chip-remove-btn"
            data-action="${onToggleAction}"
            data-part-id="${part.id}"
            aria-label="Remove ${escapeHtml(part.name)}"
            title="Remove component"
            style="min-width: 44px; min-height: 44px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; border-radius: 8px;"
          >
            ✕
          </button>
        </div>
      `;
    })
    .join('');

  return `
    <div class="equipped-tray glass-card" style="padding:16px; border-radius:14px; margin-bottom:20px; background:rgba(12,24,43,0.78); border:1px solid var(--border-glass)">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px">
        <div style="display:flex; align-items:center; gap:8px">
          <span class="pulse-dot" style="width:8px; height:8px"></span>
          <strong style="font-size:12px; letter-spacing:1px; color:#fff; font-family:var(--mono)">
            MOUNTED MODULE ARRAY (${equipped.length} SUBSYSTEMS INSTALLED)
          </strong>
        </div>
        <span style="font-size:11px; color:var(--brand-cyan); font-family:var(--mono)">1-CLICK REMOVE / SWAP</span>
      </div>
      <div class="equipped-chips-grid">
        ${chips}
      </div>
    </div>
  `;
}

export function renderModularPartsCatalog(
  items: PartRowItem[],
  activeCategory: string = 'all',
  onToggleAction: string = 'toggle-part',
  onCategoryFilterAction: string = 'filter-category',
  onFocusPartAction: string = 'focus-part'
): string {
  // Category navigation tabs (all 7 CubeSat subsystems + all)
  const tabKeys = ['all', 'power', 'battery', 'instrument', 'comms', 'adcs', 'computer', 'structure'];
  const tabsHtml = tabKeys
    .map((catKey) => {
      const isTabActive = activeCategory === catKey;
      const catMeta = CATEGORY_LABELS[catKey] || { label: catKey, icon: 'wrench' };
      return `
        <button
          type="button"
          class="mel-tab-btn ${isTabActive ? 'is-active' : ''}"
          data-action="${onCategoryFilterAction}"
          data-category="${catKey}"
          style="min-height: 44px; min-width: 44px; padding: 10px 16px; font-weight: 600; cursor: pointer;"
        >
          ${catMeta.label}
        </button>
      `;
    })
    .join('');

  // Filtered items
  const filtered = activeCategory === 'all'
    ? items
    : items.filter((i) => i.part.category === activeCategory);

  const cardsHtml = filtered
    .map(({ part, selected, disabled, disabledReason }) => {
      const HERITAGE_MAP: Record<string, { type: 'heritage' | 'analogue'; label: string; tooltip: string }> = {
        struct_1u: { type: 'heritage', label: 'Flight Heritage', tooltip: 'Standard 1U CubeSat specification flown across NASA CSLI missions (NASA CubeSat 101 §2.1)' },
        struct_3u: { type: 'heritage', label: 'Flight Heritage', tooltip: 'Standard 3U CubeSat specification flown on NASA O/OREOS & BioNutrients-2 (NASA CubeSat 101 §2.2)' },
        solar_body_1u: { type: 'heritage', label: 'Flight Heritage', tooltip: 'Body-mounted triple-junction GaAs solar cells with extensive orbital flight history (NASA SST §3.2.1)' },
        batt_liion_10wh: { type: 'heritage', label: 'Flight Heritage', tooltip: 'COTS 18650-cell Li-ion space battery array with extensive SmallSat flight history (NASA CubeSat 101 §3.3)' },
        comms_uhf_vhf: { type: 'heritage', label: 'Flight Heritage', tooltip: 'Tape-spring dipole radio with extensive flight heritage on university & NASA CSLI missions (NASA CubeSat 101 §3.4)' },
        adcs_passive_magnetorquer: { type: 'heritage', label: 'Flight Heritage', tooltip: 'Permanent magnet & hysteresis rod passive stabilization flown on BisonSat & GeneSat (NASA CubeSat 101 §3.2)' },
        comms_sband_patch: { type: 'analogue', label: 'NASA Analogue', tooltip: 'High-throughput S-band patch transceiver technology analogue (NASA SST §8.2.1 / MarCO)' },
        inst_plasma_probe: { type: 'analogue', label: 'NASA Analogue', tooltip: 'Ionospheric Langmuir electrostatic probe technology analogue (NASA PetitSat / DICE)' },
        inst_multispectral_imager: { type: 'analogue', label: 'NASA Analogue', tooltip: 'Four-band visible/near-IR optical camera technology analogue (NASA SST §10.2 / Planet Dove)' },
        obc_cots_mcu: { type: 'analogue', label: 'NASA Analogue', tooltip: 'Commercial off-the-shelf microcontroller flight computer analogue (NASA SST §2.2)' },
        obc_rad_hard: { type: 'analogue', label: 'NASA Analogue', tooltip: 'Radiation-hardened multi-core aerospace processor architecture analogue (NASA SST §2.3)' },
        batt_space_30wh: { type: 'analogue', label: 'NASA Analogue', tooltip: 'Space-grade shielded battery pack technology analogue (NASA SST §3.3.2)' },
        solar_deployable_3u: { type: 'analogue', label: 'NASA Analogue', tooltip: 'Deployable tracking solar wing mechanism analogue (NASA SST §3.2.2)' },
        solar_gainp_high_eff: { type: 'analogue', label: 'NASA Analogue', tooltip: 'High-efficiency optical concentrator array development analogue (NASA SST §3.4)' },
        adcs_3axis_wheels: { type: 'analogue', label: 'NASA Analogue', tooltip: 'Miniaturized 3-axis reaction wheel & star tracker assembly analogue (NASA SST §4.2)' },
        inst_xray_photometer: { type: 'analogue', label: 'NASA Analogue', tooltip: 'Solar flare soft X-ray photometer payload analogue (NASA SST §10.3 / MinXSS)' }
      };

      const meta = HERITAGE_MAP[part.id] || { type: 'analogue', label: 'NASA Analogue', tooltip: 'NASA technology development analogue' };
      const heritageBadge = meta.type === 'heritage'
        ? `<span class="badge-heritage" title="${escapeHtml(meta.tooltip)}" style="display:inline-flex; align-items:center; gap:3px">${renderIcon('check', 12, '', 'var(--brand-green)')} ${meta.label}</span>`
        : `<span class="badge-analogue" title="${escapeHtml(meta.tooltip)}" style="display:inline-flex; align-items:center; gap:3px; color:var(--brand-cyan); background:rgba(123,208,255,0.12); padding:2px 8px; border-radius:9999px; font-size:11px; font-weight:600; border:1px solid rgba(123,208,255,0.25)">${renderIcon('data', 12, '', 'var(--brand-cyan)')} ${meta.label}</span>`;

      const isSolar = part.category === 'power' && (part.solar_area_m2 ?? 0) > 0;
      const peakGen = isSolar ? ((part.solar_area_m2 || 0) * (part.solar_efficiency_w_per_m2 || 220)).toFixed(1) : '0';
      const powerStr = isSolar ? `+${peakGen} W Peak Gen` : `${part.power.toFixed(1)} W Load`;
      const powerColor = isSolar ? 'var(--brand-green)' : 'var(--brand-yellow)';

      const cardClass = [
        'modular-part-card',
        'glass-card',
        selected ? 'is-selected' : '',
        disabled ? 'is-disabled' : ''
      ]
        .filter(Boolean)
        .join(' ');

      const actionButton = disabled
        ? `<button type="button" class="button button-disabled btn-pill-sm" disabled title="${escapeHtml(disabledReason || 'Incompatible')}" style="min-height: 44px; min-width: 44px; display: inline-flex; align-items: center; justify-content: center;">Disabled</button>`
        : `<button type="button" class="button ${selected ? 'button-remove' : 'button-add'} btn-pill-sm" data-action="${onToggleAction}" data-part-id="${part.id}" style="min-height: 44px; min-width: 44px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; font-weight: 700;">
             ${selected ? '✓ Equipped (Remove)' : '+ Equip Subsystem'}
           </button>`;

      return `
        <article class="${cardClass}" data-action="${onFocusPartAction}" data-part-id="${part.id}" tabindex="0" role="button" aria-pressed="${selected}">
          <div class="part-card-header">
            <span class="category-pill category-${part.category}">${part.category.toUpperCase()}</span>
            ${heritageBadge}
          </div>

          <h4 class="part-card-title">${escapeHtml(part.name)}</h4>
          <p class="part-card-purpose">${escapeHtml(part.explanation)}</p>

          ${disabled && disabledReason
          ? `<div class="part-disabled-note" role="note" style="display:flex; align-items:center; gap:4px; font-size:11px; color:var(--brand-coral); margin-bottom:8px">
                   ${renderIcon('warning', 12, '', 'var(--brand-coral)')} ${escapeHtml(disabledReason)}
                 </div>`
          : ''
        }

          <div class="part-specs-row">
            <div class="spec-cell">
              <span class="spec-lbl" style="display:inline-flex; align-items:center; gap:2px">${renderIcon('mass', 11)} Mass</span>
              <strong>${part.mass.toFixed(2)} kg</strong>
            </div>
            <div class="spec-cell">
              <span class="spec-lbl" style="display:inline-flex; align-items:center; gap:2px">${renderIcon('power', 11)} Power</span>
              <strong style="color:${powerColor}">${powerStr}</strong>
            </div>
            <div class="spec-cell">
              <span class="spec-lbl" style="display:inline-flex; align-items:center; gap:2px">${renderIcon('budget', 11)} Cost</span>
              <strong>$${part.cost.toFixed(2)}M</strong>
            </div>
            ${part.data_rate > 0
          ? `<div class="spec-cell">
                     <span class="spec-lbl" style="display:inline-flex; align-items:center; gap:2px">${renderIcon('data', 11)} Data</span>
                     <strong>${part.data_rate.toFixed(1)} GB/d</strong>
                   </div>`
          : ''
        }
          </div>

          <div class="part-card-footer">
            ${actionButton}
          </div>
        </article>
      `;
    })
    .join('');

  return `
    <div class="modular-catalog-container">
      <div class="catalog-tabs-bar" role="tablist" aria-label="Subsystem Categories">
        ${tabsHtml}
      </div>
      <div class="modular-cards-grid">
        ${cardsHtml}
      </div>
    </div>
  `;
}
