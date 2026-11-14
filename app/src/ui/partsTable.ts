/**
 * Master Equipment List (MEL) Component
 * Table displaying parts by subsystem category, mass, power, cost, data rate,
 * and flight heritage badges. Grayed-out rows explain why an option cannot be used.
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

export function renderPartsTable(
  items: PartRowItem[],
  onToggleAction: string = 'toggle-part'
): string {
  const rows = items
    .map(({ part, selected, disabled, disabledReason }) => {
      const rowClass = [
        'mel-row',
        selected ? 'is-selected' : '',
        disabled ? 'is-disabled' : ''
      ]
        .filter(Boolean)
        .join(' ');

      const heritageBadge = part.heritage
        ? `<span class="badge-heritage" title="Flown in space on prior NASA or partner missions" style="display:inline-flex; align-items:center; gap:3px">${renderIcon('check', 12, '', 'var(--brand-green)')} Heritage</span>`
        : `<span class="badge-new-tech" title="New technology: lower maturity, higher risk" style="display:inline-flex; align-items:center; gap:3px">${renderIcon('star', 12, '', 'var(--brand-yellow)')} New Tech</span>`;

      const actionButton = disabled
        ? `<button type="button" class="button button-disabled" disabled title="${escapeHtml(disabledReason || 'Incompatible with current configuration')}">Disabled</button>`
        : `<button type="button" class="button ${selected ? 'button-remove' : 'button-add'}" data-action="${onToggleAction}" data-part-id="${part.id}" aria-pressed="${selected}">
            ${selected ? 'Remove' : 'Equip'}
          </button>`;

      return `
        <tr class="${rowClass}" data-part-id="${part.id}">
          <td class="col-name">
            <strong>${escapeHtml(part.name)}</strong>
            <small class="col-desc">${escapeHtml(part.explanation)}</small>
            ${disabled && disabledReason ? `<div class="mel-disabled-reason" role="note" style="display:flex; align-items:center; gap:4px">${renderIcon('warning', 12, '', 'var(--brand-coral)')} ${escapeHtml(disabledReason)}</div>` : ''}
          </td>
          <td class="col-category">
            <span class="category-pill category-${part.category}">${part.category.toUpperCase()}</span>
          </td>
          <td class="col-metric">${part.mass.toFixed(2)} kg</td>
          <td class="col-metric">${part.power >= 0 ? `${part.power.toFixed(1)} W` : `+${Math.abs(part.power).toFixed(1)} W`}</td>
          <td class="col-metric">${part.cost.toFixed(2)} $M</td>
          <td class="col-metric">${part.data_rate > 0 ? `${part.data_rate.toFixed(1)} GB/d` : '—'}</td>
          <td class="col-heritage">${heritageBadge}</td>
          <td class="col-action">${actionButton}</td>
        </tr>
      `;
    })
    .join('');

  return `
    <div class="mel-container">
      <div class="mel-header">
        <div>
          <h3>Master Equipment List (MEL)</h3>
          <p>Assembly-level subsystem components conforming to NASA CML 4 point design standards.</p>
        </div>
        <span class="mel-tag">CML 4 POINT DESIGN</span>
      </div>
      <div class="mel-table-wrapper">
        <table class="mel-table" aria-label="Master Equipment List">
          <thead>
            <tr>
              <th scope="col">Subsystem / Part</th>
              <th scope="col">Category</th>
              <th scope="col"><span style="display:inline-flex; align-items:center; gap:3px">${renderIcon('mass', 12)} Mass</span></th>
              <th scope="col"><span style="display:inline-flex; align-items:center; gap:3px">${renderIcon('power', 12)} Power</span></th>
              <th scope="col"><span style="display:inline-flex; align-items:center; gap:3px">${renderIcon('budget', 12)} Cost</span></th>
              <th scope="col"><span style="display:inline-flex; align-items:center; gap:3px">${renderIcon('data', 12)} Data Rate</span></th>
              <th scope="col">Heritage</th>
              <th scope="col">Action</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

