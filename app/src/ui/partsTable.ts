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

export const CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
  all: { label: 'All Subsystems', icon: 'wrench' },
  power: { label: 'Power & Solar', icon: 'power' },
  battery: { label: 'Energy Storage', icon: 'power' },
  instrument: { label: 'Science Payloads', icon: 'data' },
  comms: { label: 'Communications', icon: 'communications' },
  adcs: { label: 'Attitude Pointing', icon: 'planet' },
  computer: { label: 'Avionics & Computers', icon: 'settings' },
  structure: { label: 'Chassis & Structure', icon: 'rocket' }
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
      const netPower = part.power >= 0 ? `-${part.power.toFixed(1)}W` : `+${Math.abs(part.power).toFixed(1)}W`;
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
          <button type="button" class="chip-remove-btn" data-action="${onToggleAction}" data-part-id="${part.id}" aria-label="Remove ${escapeHtml(part.name)}" title="Remove component">
            ✕
          </button>
        </div>
      `;
    })
    .join('');

  return `
    <div class="equipped-tray glass-card" style="padding:14px; border-radius:12px; margin-bottom:20px; background:rgba(12,24,43,0.7); border:1px solid var(--border-glass)">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px">
        <div style="display:flex; align-items:center; gap:8px">
          <span class="pulse-dot" style="width:8px; height:8px"></span>
          <strong style="font-size:11px; letter-spacing:1px; color:#fff; font-family:var(--mono)">
            MOUNTED MODULE ARRAY (${equipped.length} SUBSYSTEMS INSTALLED)
          </strong>
        </div>
        <span style="font-size:10px; color:var(--brand-cyan); font-family:var(--mono)">1-CLICK REMOVE / SWAP</span>
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
  // Category navigation tabs
  const tabKeys = ['all', 'power', 'battery', 'instrument', 'comms', 'adcs', 'computer'];
  const tabsHtml = tabKeys
    .map((catKey) => {
      const isTabActive = activeCategory === catKey;
      const catMeta = CATEGORY_LABELS[catKey] || { label: catKey, icon: 'wrench' };
      return `
        <button type="button" class="mel-tab-btn ${isTabActive ? 'is-active' : ''}" data-action="${onCategoryFilterAction}" data-category="${catKey}">
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
      const heritageBadge = part.heritage
        ? `<span class="badge-heritage" title="Proven flight history on prior NASA missions" style="display:inline-flex; align-items:center; gap:3px">${renderIcon('check', 12, '', 'var(--brand-green)')} Heritage</span>`
        : `<span class="badge-new-tech" title="Advanced technology development" style="display:inline-flex; align-items:center; gap:3px">${renderIcon('star', 12, '', 'var(--brand-yellow)')} New Tech</span>`;

      const powerStr = part.power >= 0 ? `${part.power.toFixed(1)} W Load` : `+${Math.abs(part.power).toFixed(1)} W Gen`;
      const powerColor = part.power < 0 ? 'var(--brand-green)' : 'var(--brand-yellow)';

      const cardClass = [
        'modular-part-card',
        'glass-card',
        selected ? 'is-selected' : '',
        disabled ? 'is-disabled' : ''
      ]
        .filter(Boolean)
        .join(' ');

      const actionButton = disabled
        ? `<button type="button" class="button button-disabled btn-pill-sm" disabled title="${escapeHtml(disabledReason || 'Incompatible')}">Disabled</button>`
        : `<button type="button" class="button ${selected ? 'button-remove' : 'button-add'} btn-pill-sm" data-action="${onToggleAction}" data-part-id="${part.id}">
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

          ${
            disabled && disabledReason
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
            ${
              part.data_rate > 0
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
