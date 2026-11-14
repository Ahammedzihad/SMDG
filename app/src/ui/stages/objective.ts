/**
 * Stage 1: Objective (CML 1 Cocktail Napkin)
 *
 * Implements Google Stitch Screen 9b4c98a5c71f4105b73f37e76cf74b98:
 * "Science Objective Selection - Orbit Mission Academy"
 *
 * Features:
 * - Top Telemetry Progress & Cadet XP pill
 * - Editorial Header: "What will your spacecraft discover?"
 * - Quick guidance chip: "PAYLOAD CONFIGURATION: 1 Primary + 2 Secondary Goals"
 * - High-fidelity Stitch 3D art cards with ambient halos, category badges,
 *   instrument specifications, and active primary status checkmarks.
 * - Full accessibility with keyboard navigation & ARIA attributes.
 */

import type { Objective } from '@shared';
import { renderIcon } from '../icons';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const OBJECTIVE_ART_MAP: Record<string, { image: string; tag: string; icon: string; code: string; difficulty: string }> = {
  earth_observation: {
    image: '/assets/stitch/asset_13.jpg',
    tag: 'Optical Survey',
    icon: 'photo_camera',
    code: 'OBS-01',
    difficulty: 'STARTER'
  },
  space_weather: {
    image: '/assets/stitch/asset_14.jpg',
    tag: 'Spectral Resonance',
    icon: 'water_drop',
    code: 'MAG-02',
    difficulty: 'EXPLORER'
  },
  deep_space_astronomy: {
    image: '/assets/stitch/asset_15.jpg',
    tag: 'Elevation LiDAR',
    icon: 'terrain',
    code: 'AST-03',
    difficulty: 'ADVANCED'
  }
};

export function renderObjectiveStage(
  objectives: Objective[],
  selectedId: string,
  onSelectAction: string = 'select-objective'
): string {
  const cards = objectives
    .map((obj) => {
      const isSelected = obj.id === selectedId;
      const art = OBJECTIVE_ART_MAP[obj.id] || {
        image: '/assets/stitch/asset_13.jpg',
        tag: 'Scientific Survey',
        icon: 'biotech',
        code: `OBJ-${obj.id.slice(0, 3).toUpperCase()}`,
        difficulty: 'EXPLORER'
      };

      const shortDesc = obj.description.split('.')[0] + '.';
      const needsHtml = obj.needs
        .map((need) => `<span class="need-pill px-2 py-0.5 rounded bg-surface-container text-secondary text-[11px] font-mono">${escapeHtml(need.replace(/_/g, ' '))}</span>`)
        .join(' ');

      return `
        <article
          class="stage-card objective-card group relative flex flex-col justify-between rounded-xl p-space-lg cursor-pointer transition-all duration-300 transform hover:-translate-y-1 ${
            isSelected
              ? 'bg-surface-container-high/95 shadow-[0_12px_32px_-4px_rgba(2,6,18,0.7)] border-t-2 border-secondary'
              : 'bg-surface-container/70 hover:bg-surface-container-high shadow-md border border-white/5'
          }"
          tabindex="0"
          role="radio"
          aria-checked="${isSelected}"
          data-action="${onSelectAction}"
          data-id="${obj.id}"
        >
          ${
            isSelected
              ? `<div class="absolute inset-0 rounded-xl bg-gradient-to-b from-secondary/15 via-transparent to-transparent pointer-events-none"></div>
                 <div class="absolute top-0 left-0 right-0 h-1 bg-secondary rounded-t-xl shadow-[0_0_12px_#7bd0ff]"></div>`
              : ''
          }

          <div class="relative space-y-space-md">
            <!-- Card Header Badges -->
            <div class="flex items-center justify-between">
              <span class="px-space-sm py-1 rounded-full font-label-sm text-label-sm uppercase tracking-wider font-bold ${
                isSelected
                  ? 'bg-secondary text-on-secondary shadow-[0_0_10px_rgba(123,208,255,0.4)]'
                  : 'bg-surface-variant text-on-surface-variant'
              }">
                ${isSelected ? 'PRIMARY OBJECTIVE' : 'SECONDARY OBJECTIVE'}
              </span>
              <span class="px-space-sm py-0.5 rounded bg-surface-container-lowest/80 text-primary font-label-sm text-label-sm uppercase tracking-wider">
                ${art.difficulty}
              </span>
            </div>

            <!-- 3D Celestial Art Preview -->
            <div class="relative w-full h-44 rounded-lg overflow-hidden bg-surface-container-lowest flex items-center justify-center">
              <img
                class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                src="${art.image}"
                alt="${escapeHtml(obj.name)}"
                onerror="this.onerror=null; this.src='https://lh3.googleusercontent.com/aida-public/AB6AXuCYM5e26dyjEl7Rc4by-rfftbOeT1XteVwliIYttW70mrZ9XkIxO5fw8tZCaPZfIbLjubA_0T5HHNS3g2Rd4h_CzVi2BY-iBgeeFu3RW_gobExSCrCuJloS66MTSC7s6wrqu-on-3Sy3Ket7AIciLamPav99SBXHiTLwlVNqQK5FELCJXf22sdFdS1cTIjx8fM2SvOgjuwCRJ6d0zRsumw12GpuciHzdOIzh9bc-e8';"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-surface-container-high via-transparent to-transparent"></div>
              <div class="absolute bottom-space-xs left-space-xs flex items-center gap-1.5 px-space-xs py-1 rounded bg-surface-container-lowest/80 backdrop-blur-sm text-secondary font-label-sm text-label-sm">
                <span class="material-symbols-outlined text-[14px]">${art.icon}</span>
                <span>${art.tag}</span>
              </div>
            </div>

            <!-- Content Title & Description -->
            <div class="space-y-space-xs">
              <h3 class="font-headline-sm text-headline-sm text-on-surface font-bold group-hover:text-secondary transition-colors">
                ${escapeHtml(obj.name)}
              </h3>
              <p class="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                ${escapeHtml(shortDesc)}
              </p>
            </div>

            <!-- Scientific Telemetry & Specs Rows -->
            <div class="pt-space-xs space-y-space-xs">
              <div class="flex items-center justify-between p-space-xs px-space-sm rounded-lg bg-surface-container-low/70">
                <span class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Required Tool</span>
                <span class="font-label-sm text-label-sm text-on-surface font-semibold flex items-center gap-1">
                  ${needsHtml}
                </span>
              </div>
              <div class="flex items-center justify-between p-space-xs px-space-sm rounded-lg bg-surface-container-low/70">
                <span class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Target Data</span>
                <span class="font-label-sm text-label-sm text-tertiary font-bold flex items-center gap-1">
                  <span class="material-symbols-outlined text-[14px]">bolt</span>
                  ${obj.target_data_gb_per_day} GB/day
                </span>
              </div>
            </div>
          </div>

          <!-- Bottom Selection Check Indicator -->
          <div class="mt-space-md pt-space-sm flex items-center justify-between border-t border-white/5">
            <div class="flex items-center gap-space-xs">
              <span class="w-6 h-6 rounded-full flex items-center justify-center ${
                isSelected
                  ? 'bg-secondary text-on-secondary shadow-[0_0_8px_#7bd0ff]'
                  : 'bg-surface-container-highest text-on-surface-variant'
              }">
                <span class="material-symbols-outlined text-[16px] font-bold">
                  ${isSelected ? 'check' : 'add'}
                </span>
              </span>
              <span class="font-label-sm text-label-sm uppercase font-bold tracking-wider ${
                isSelected ? 'text-secondary' : 'text-on-surface-variant'
              }">
                ${isSelected ? 'SELECTED AS PRIMARY' : 'TAP TO SELECT'}
              </span>
            </div>
            <span class="font-label-sm text-label-sm text-on-surface-variant font-mono">${art.code}</span>
          </div>
        </article>
      `;
    })
    .join('');

  return `
    <section class="wizard-stage-view stage-objective flex flex-col gap-space-lg w-full max-w-7xl mx-auto" aria-labelledby="stage-heading">
      <!-- Top Telemetry Progress & Overline -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-space-sm">
        <div class="flex items-center gap-space-xs">
          <span class="inline-flex items-center gap-1.5 px-space-md py-1 rounded-full bg-secondary/10 text-secondary font-label-sm text-label-sm uppercase tracking-widest shadow-[0_0_12px_rgba(123,208,255,0.2)]">
            <span class="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
            STEP 01A: MISSION OBJECTIVES
          </span>
          <span class="hidden sm:inline text-surface-variant font-label-sm text-label-sm">•</span>
          <span class="hidden sm:inline font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">CML 1: COCKTAIL NAPKIN</span>
        </div>
        <div class="flex items-center gap-space-md bg-surface-container-low px-space-md py-1.5 rounded-full">
          <span class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">ACADEMY CADET XP</span>
          <div class="flex items-center gap-1">
            <span class="material-symbols-outlined text-[16px] text-primary" style="font-variation-settings: 'FILL' 1;">stars</span>
            <span class="font-label-md text-label-md text-primary font-bold">1,050 XP</span>
          </div>
        </div>
      </div>

      <!-- Editorial Header & Narrative Anchor -->
      <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-space-lg">
        <div class="max-w-3xl space-y-space-xs">
          <h1 id="stage-heading" class="font-headline-lg lg:font-headline-xl text-headline-lg lg:text-headline-xl text-on-surface tracking-tight font-bold">
            What will your spacecraft discover?
          </h1>
          <p class="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
            Every historic space probe sets out with a burning question. Select your core scientific investigation.
            Your objective dictates instrument payload, power consumption, and data telemetry.
          </p>
        </div>

        <!-- Quick Guidance Chip / Scientific Quota Pill -->
        <div class="flex items-center gap-space-sm bg-surface-container/70 backdrop-blur-md px-space-md py-space-sm rounded-xl self-start lg:self-auto shadow-md">
          <div class="w-8 h-8 rounded-lg bg-secondary/15 flex items-center justify-center text-secondary">
            <span class="material-symbols-outlined text-[20px]">biotech</span>
          </div>
          <div>
            <div class="font-label-sm text-label-sm text-secondary uppercase tracking-wider">PAYLOAD CONFIGURATION</div>
            <div class="font-label-md text-label-md text-on-surface">1 Primary Science Goal</div>
          </div>
        </div>
      </div>

      <!-- Main Dynamic Interactive Cards Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-lg pt-space-xs" role="radiogroup" aria-label="Mission Science Objectives">
        ${cards}
      </div>
    </section>
  `;
}
