/**
 * Top Persistent Resource Bar
 * Always displays the six core mission resources:
 * Mass (kg), Power (W), Budget ($M), Data (GB/day), Comms (GB/day), Time (months).
 *
 * Rules:
 * - Never use color alone: always show state word (OK, WARN, FAIL) + icon.
 * - Every meter includes an accessible tooltip explaining "Why?".
 */

import type { Meters, MeterItem } from '@shared';
import { renderIcon, type IconName } from './icons';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const METER_ICON_NAMES: Record<string, IconName> = {
  mass: 'mass',
  power: 'power',
  budget: 'budget',
  data: 'data',
  communications: 'communications',
  time: 'time'
};

const STATE_BADGES: Record<string, { label: string; iconName: IconName; className: string }> = {
  ok: { label: 'OK', iconName: 'check', className: 'meter-ok' },
  warning: { label: 'WARN', iconName: 'warning', className: 'meter-warn' },
  fail: { label: 'FAIL', iconName: 'fail', className: 'meter-fail' }
};

export function renderMeterItem(meter: MeterItem): string {
  const iconName = METER_ICON_NAMES[meter.id] || 'data';
  const badge = STATE_BADGES[meter.state] || STATE_BADGES.ok;
  const ratio = meter.limit > 0 ? Math.min(100, Math.round((meter.value / meter.limit) * 100)) : 0;

  const iconSvg = renderIcon(iconName, 18, 'meter-svg-icon');
  const badgeSvg = renderIcon(badge.iconName, 12, 'badge-svg-icon');

  return `
    <div class="meter-widget ${badge.className}" tabindex="0" role="group" aria-label="${escapeHtml(meter.label)}: ${meter.value} of ${meter.limit} ${escapeHtml(meter.unit)}, state is ${badge.label}">
      <div class="meter-header">
        <span class="meter-icon" aria-hidden="true">${iconSvg}</span>
        <strong class="meter-label">${escapeHtml(meter.label)}</strong>
        <span class="meter-badge" aria-label="Status: ${badge.label}">
          <span aria-hidden="true" style="display:inline-flex; align-items:center">${badgeSvg}</span> ${badge.label}
        </span>
      </div>
      <div class="meter-readout">
        <span class="meter-value">${meter.value.toFixed(1)} <small>${escapeHtml(meter.unit)}</small></span>
        <span class="meter-limit">/ ${meter.limit.toFixed(1)} ${escapeHtml(meter.unit)}</span>
      </div>
      <div class="meter-track" aria-hidden="true">
        <div class="meter-fill" style="width: ${ratio}%"></div>
      </div>
      <div class="meter-tooltip" role="tooltip">
        <strong>${escapeHtml(meter.label)}: ${badge.label}</strong>
        <p>${escapeHtml(meter.why)}</p>
      </div>
    </div>
  `;
}

export function renderResourceBar(meters: Meters): string {
  return `
    <header class="resource-bar" aria-label="Mission Resource Meters">
      <div class="resource-bar-brand">
        <span class="pulse-dot" aria-hidden="true"></span>
        <div>
          <strong>ORBITONE TELEMETRY</strong>
          <small>REAL-TIME ENGINE MARGINS</small>
        </div>
      </div>
      <div class="resource-meters-grid">
        ${renderMeterItem(meters.mass)}
        ${renderMeterItem(meters.power)}
        ${renderMeterItem(meters.budget)}
        ${renderMeterItem(meters.data)}
        ${renderMeterItem(meters.communications)}
        ${renderMeterItem(meters.time)}
      </div>
    </header>
  `;
}

