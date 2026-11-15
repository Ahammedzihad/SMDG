/**
 * ORBITONE Reusable Loading System (Phase P4)
 *
 * Lightweight, accessible, indeterminate status indicators for authentic
 * asynchronous operations (Multiplayer room creation/joining, socket connection,
 * network reconnection).
 *
 * Requirements:
 * - Uses existing P2 typography (Fredoka, Nunito Sans, Quicksand).
 * - Preserves dark space theme and restrained cyan/yellow palette.
 * - Indeterminate orbital spinner: zero fake progress percentages or artificial delays.
 * - Screen reader accessible with role="status", aria-live="polite", aria-busy.
 * - Respects prefers-reduced-motion.
 * - 44px minimum touch target preserved.
 */

import { renderIcon, type IconName } from './icons';

export interface LoadingOptions {
  size?: 'sm' | 'md' | 'lg';
  color?: 'cyan' | 'yellow' | 'white';
}

function escapeHtml(str: string): string {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Renders an indeterminate orbital spinner ring.
 */
export function renderOrbitalSpinner(options?: LoadingOptions): string {
  const size = options?.size || 'sm';
  return `<span class="orbital-spinner orbital-spinner-${size}" role="status" aria-hidden="true"></span>`;
}

/**
 * Renders button content that dynamically adapts to pending/loading state.
 */
export function renderButtonLoadingContent(
  defaultText: string,
  isPending: boolean,
  options?: {
    loadingText?: string;
    icon?: IconName | string;
    size?: 'sm' | 'md';
  }
): string {
  if (isPending) {
    const text = options?.loadingText || 'Please wait…';
    return `
      ${renderOrbitalSpinner({ size: options?.size || 'sm' })}
      <span class="loading-label">${escapeHtml(text)}</span>
    `;
  }

  const iconHtml = options?.icon ? renderIcon(options.icon as IconName, 18) : '';
  return `
    ${iconHtml ? `<span class="btn-icon" aria-hidden="true">${iconHtml}</span>` : ''}
    <span>${escapeHtml(defaultText)}</span>
  `;
}

/**
 * Renders a scoped non-blocking card for awaiting asynchronous operations
 * (e.g. room handshakes, network sync, reconnection).
 */
export function renderLoadingCard(
  title: string,
  subtitle?: string,
  options?: {
    showNova?: boolean;
    novaTip?: string;
    size?: 'md' | 'lg';
  }
): string {
  const spinnerSize = options?.size || 'md';
  const novaHtml = options?.showNova
    ? `
      <div class="loading-nova-pill" role="note">
        <span class="material-symbols-outlined text-[14px]">tips_and_updates</span>
        <span>Commander Nova: ${escapeHtml(options.novaTip || 'Telemetry check in progress!')}</span>
      </div>
    `
    : '';

  return `
    <div class="loading-card glass-card" role="status" aria-live="polite" aria-busy="true">
      ${renderOrbitalSpinner({ size: spinnerSize })}
      <div class="loading-card-text">
        <h4 class="loading-card-title">${escapeHtml(title)}</h4>
        ${subtitle ? `<p class="loading-card-subtitle">${escapeHtml(subtitle)}</p>` : ''}
      </div>
      ${novaHtml}
    </div>
  `;
}

/**
 * Renders a compact inline loading badge for diagnostic/network updates.
 */
export function renderInlineLoadingBadge(message: string): string {
  return `
    <span class="inline-loading-badge" role="status" aria-live="polite" aria-busy="true">
      ${renderOrbitalSpinner({ size: 'sm' })}
      <span>${escapeHtml(message)}</span>
    </span>
  `;
}
