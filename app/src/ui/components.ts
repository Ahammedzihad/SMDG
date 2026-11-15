/**
 * ORBITONE Reusable UI Components
 * Friendly space cartoon aesthetic with chunky buttons, glass cards,
 * star rank, and a glowing mission path.
 */

import { renderIcon, type IconName } from './icons';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function parseAttrs(actionOrAttrs?: string | Record<string, string>): string {
  if (!actionOrAttrs) return '';
  if (typeof actionOrAttrs === 'string') {
    return `data-action="${escapeHtml(actionOrAttrs)}"`;
  }
  return Object.entries(actionOrAttrs)
    .map(([key, val]) => `${escapeHtml(key)}="${escapeHtml(val)}"`)
    .join(' ');
}

/**
 * 1. Primary Button (Chunky Solar Yellow / Orange)
 * Contrast ratio > 11:1 with dark text on yellow.
 */
export function primaryButton(
  text: string,
  actionOrAttrs?: string | Record<string, string>,
  iconName?: IconName | string,
  options?: { loading?: boolean; loadingText?: string }
): string {
  const isLoading = Boolean(options?.loading);
  const extraAttrs = isLoading ? 'disabled aria-busy="true"' : '';
  const loadingClass = isLoading ? ' btn-loading' : '';
  const attrs = parseAttrs(actionOrAttrs);
  const iconHtml = isLoading
    ? `<span class="orbital-spinner orbital-spinner-sm" role="status" aria-hidden="true"></span>`
    : iconName
    ? `<span class="btn-icon" aria-hidden="true">${renderIcon(iconName as IconName, 18)}</span>`
    : '';
  const labelText = isLoading && options?.loadingText ? options.loadingText : text;
  return `
    <button type="button" class="button button-primary btn-chunky${loadingClass}" ${attrs} ${extraAttrs}>
      ${iconHtml}
      <span>${escapeHtml(labelText)}</span>
    </button>
  `;
}

/**
 * 2. Secondary Button (Chunky Cosmic Blue)
 * High-contrast white text on blue.
 */
export function secondaryButton(
  text: string,
  actionOrAttrs?: string | Record<string, string>,
  iconName?: IconName | string,
  options?: { loading?: boolean; loadingText?: string }
): string {
  const isLoading = Boolean(options?.loading);
  const extraAttrs = isLoading ? 'disabled aria-busy="true"' : '';
  const loadingClass = isLoading ? ' btn-loading' : '';
  const attrs = parseAttrs(actionOrAttrs);
  const iconHtml = isLoading
    ? `<span class="orbital-spinner orbital-spinner-sm" role="status" aria-hidden="true"></span>`
    : iconName
    ? `<span class="btn-icon" aria-hidden="true">${renderIcon(iconName as IconName, 18)}</span>`
    : '';
  const labelText = isLoading && options?.loadingText ? options.loadingText : text;
  return `
    <button type="button" class="button button-secondary btn-chunky${loadingClass}" ${attrs} ${extraAttrs}>
      ${iconHtml}
      <span>${escapeHtml(labelText)}</span>
    </button>
  `;
}

/**
 * 3. Glass Card Component
 */
export interface CardOptions {
  subtitle?: string;
  iconName?: IconName;
  className?: string;
  status?: 'normal' | 'selected' | 'success' | 'warning' | 'danger';
  headerRight?: string;
  footer?: string;
  attributes?: Record<string, string>;
}

export function card(
  title: string,
  content: string,
  options: CardOptions = {}
): string {
  const {
    subtitle,
    iconName,
    className = '',
    status = 'normal',
    headerRight = '',
    footer = '',
    attributes = {}
  } = options;

  const attrs = parseAttrs(attributes);
  const statusClass = status !== 'normal' ? `is-${status}` : '';
  const iconHtml = iconName ? `<span class="card-icon" aria-hidden="true">${renderIcon(iconName, 22)}</span>` : '';

  return `
    <article class="glass-card ${statusClass} ${className}" ${attrs}>
      <header class="glass-card-header" style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px">
        <div style="display:flex; align-items:center; gap:10px">
          ${iconHtml}
          <div>
            ${subtitle ? `<span class="panel-index" style="font-size:9px; letter-spacing:1px; color:var(--brand-cyan)">${escapeHtml(subtitle)}</span>` : ''}
            <h3 style="font-size:16px; font-weight:800; color:#fff; margin-top:2px">${escapeHtml(title)}</h3>
          </div>
        </div>
        ${headerRight ? `<div>${headerRight}</div>` : ''}
      </header>
      <div class="glass-card-body" style="font-size:13px; line-height:1.5; color:var(--text-muted)">
        ${content}
      </div>
      ${footer ? `<footer class="glass-card-footer" style="margin-top:14px; padding-top:12px; border-top:1px solid var(--border-light)">${footer}</footer>` : ''}
    </article>
  `;
}

/**
 * 4. Chunky Progress Bar Component
 * Displays percentage in text alongside label.
 */
export function progressBar(
  percent: number,
  label: string = 'Progress',
  options: { variant?: 'default' | 'yellow' | 'coral'; showText?: boolean; className?: string } = {}
): string {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  const { variant = 'default', showText = true, className = '' } = options;
  const fillVariantClass = variant === 'yellow' ? 'fill-yellow' : variant === 'coral' ? 'fill-coral' : '';

  return `
    <div class="chunky-progress-wrap ${className}" role="progressbar" aria-valuenow="${clamped}" aria-valuemin="0" aria-valuemax="100" aria-label="${escapeHtml(label)}">
      <div class="chunky-progress-header">
        <span class="chunky-progress-label">${escapeHtml(label)}</span>
        ${showText ? `<strong class="chunky-progress-pct">${clamped}%</strong>` : ''}
      </div>
      <div class="chunky-progress-track">
        <div class="chunky-progress-fill ${fillVariantClass}" style="width: ${clamped}%"></div>
      </div>
    </div>
  `;
}

/**
 * 5. Star Rank Display
 * 1 to 3 stars plus rank name in text.
 * Configured in a single configuration object.
 */
export interface RankDef {
  stars: number;
  title: string;
  badgeColor?: string;
}

export const RANK_CONFIG: Record<string, RankDef> = {
  cadet: { stars: 1, title: 'Cadet' },
  engineer: { stars: 2, title: 'Engineer' },
  'mission lead': { stars: 2, title: 'Mission Lead' },
  'flight director': { stars: 3, title: 'Flight Director' }
};

export function starRank(rankName: string): string {
  const normalized = (rankName || '').trim().toLowerCase();
  const config = RANK_CONFIG[normalized] || {
    stars: 1,
    title: rankName || 'Cadet'
  };

  const starsCount = Math.max(1, Math.min(3, config.stars));
  let starsHtml = '';
  for (let i = 0; i < 3; i++) {
    const isLit = i < starsCount;
    starsHtml += `<span class="star-rank-star ${isLit ? 'is-lit' : 'is-dim'}" aria-hidden="true" style="opacity:${isLit ? '1' : '0.2'}">${renderIcon('star', 18, '', isLit ? 'var(--brand-yellow)' : 'var(--text-subtle)')}</span>`;
  }

  return `
    <div class="star-rank-badge" role="status" aria-label="Player Rank: ${escapeHtml(config.title)}, ${starsCount} out of 3 stars">
      <div class="star-rank-cluster">${starsHtml}</div>
      <span class="star-rank-name">${escapeHtml(config.title)}</span>
    </div>
  `;
}

/**
 * 6. Mission Path Component
 * Glowing line connecting the 7 mission stages.
 * - Done nodes: filled with checkmark
 * - Current node: highlighted with pulsating halo
 * - Later nodes: dimmed
 * - Clickable to go back, never forward past an unfinished stage.
 */
export interface MissionStageItem {
  id?: string;
  name: string;
  stageNumber: number;
}

export function missionPath(
  stages: MissionStageItem[],
  currentIndex: number, // 0-based or 1-based (stageNumber 1..7)
  maxUnlockedStage: number = currentIndex
): string {
  const currentStageNum = currentIndex;
  const totalStages = stages.length;
  // Calculate progress width percentage between first and last node
  const activeFraction = Math.max(0, Math.min(1, (currentStageNum - 1) / Math.max(1, totalStages - 1)));
  const lineWidthPercent = Math.round(activeFraction * 100);

  const nodesHtml = stages
    .map((stage) => {
      const isDone = stage.stageNumber < currentStageNum;
      const isCurrent = stage.stageNumber === currentStageNum;
      const isUnlocked = stage.stageNumber <= maxUnlockedStage;
      const isLocked = !isUnlocked;

      const nodeClasses = [
        'mission-path-node',
        isDone ? 'is-done' : '',
        isCurrent ? 'is-current' : '',
        isLocked ? 'is-locked' : ''
      ]
        .filter(Boolean)
        .join(' ');

      const iconContent = isDone
        ? renderIcon('check', 16, '', '#042431')
        : isCurrent
        ? renderIcon('rocket', 16, '', '#1a1000')
        : `${stage.stageNumber}`;

      return `
        <button
          type="button"
          class="${nodeClasses}"
          data-action="go-to-stage"
          data-stage="${stage.stageNumber}"
          ${isLocked ? 'disabled aria-disabled="true"' : ''}
          aria-current="${isCurrent ? 'step' : 'false'}"
          title="${escapeHtml(stage.name)}"
        >
          <div class="mission-path-bubble" aria-hidden="true">
            ${iconContent}
          </div>
          <span class="mission-path-label">${escapeHtml(stage.name)}</span>
        </button>
      `;
    })
    .join('');

  return `
    <nav class="mission-path-nav" aria-label="Mission Workflow Path">
      <div class="mission-path-track">
        <div class="mission-path-progress-line" style="width: calc(${lineWidthPercent}% - 30px)"></div>
        ${nodesHtml}
      </div>
    </nav>
  `;
}

