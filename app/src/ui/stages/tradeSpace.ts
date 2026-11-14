/**
 * Stage 3: Trade Space (CML 3)
 *
 * Implements Google Stitch Screen 46c87188a28b4703acd52acb61b5dcc0:
 * "Launch Vehicle Selection - Orbit Mission Academy"
 *
 * Features:
 * - Side-by-side exploration of architectural trades: Orbit and Launch Vehicle.
 * - Stitch rocket cards with 3D art previews, class pills, payload capacity bars,
 *   flight reliability meters, cost tags, and dedicated action triggers.
 * - Orbit cards with altitude, sunlight/eclipse ratio, and ground contact.
 * - Preserves full keyboard accessibility, ARIA radio roles, and live compatibility checks.
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

const VEHICLE_ART_MAP: Record<string, { image: string; rocketClass: string; reliability: string }> = {
  rideshare_dispenser: {
    image: '/assets/stitch/asset_2.jpg',
    rocketClass: 'Small-Sat Rideshare Dispenser',
    reliability: '99.4%'
  },
  dedicated_small: {
    image: '/assets/stitch/asset_3.jpg',
    rocketClass: 'Dedicated Small Launcher',
    reliability: '99.8%'
  },
  heavy_expendable: {
    image: '/assets/stitch/asset_4.jpg',
    rocketClass: 'Deep Space Super-Heavy',
    reliability: '99.9%'
  }
};

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

      return `
        <article
          class="stage-card trade-card group relative flex flex-col justify-between rounded-xl p-space-md cursor-pointer transition-all duration-300 transform hover:-translate-y-1 ${
            isSelected
              ? 'bg-surface-container-high/95 shadow-[0_8px_24px_-4px_rgba(2,6,18,0.7)] border-t-2 border-secondary'
              : 'bg-surface-container/70 hover:bg-surface-container-high shadow-md border border-white/5'
          }"
          tabindex="0"
          role="radio"
          aria-checked="${isSelected}"
          data-action="${onSelectOrbitAction}"
          data-id="${orbit.id}"
        >
          <div class="flex items-center justify-between gap-space-xs mb-space-sm">
            <span class="px-space-xs py-0.5 rounded font-label-sm text-label-sm uppercase tracking-wider flex items-center gap-1 ${
              isSelected ? 'bg-secondary text-on-secondary font-bold' : 'bg-surface-variant text-on-surface-variant'
            }">
              <span class="material-symbols-outlined text-[14px]">public</span>
              ${isSelected ? 'ACTIVE ORBIT' : 'ORBIT OPTION'}
            </span>
            <span class="font-label-sm text-label-sm text-secondary font-mono">${orbit.id.toUpperCase()}</span>
          </div>

          <h3 class="font-headline-sm text-headline-sm text-on-surface font-bold group-hover:text-secondary transition-colors mb-space-xs">
            ${escapeHtml(orbit.name)}
          </h3>

          <div class="space-y-space-xs py-space-xs mb-space-sm bg-surface-container-low/60 rounded-lg p-space-sm">
            <div class="flex justify-between font-label-sm text-label-sm">
              <span class="text-on-surface-variant">INSERTION ALTITUDE</span>
              <span class="text-primary font-bold">${orbit.altitude_km.toLocaleString()} km</span>
            </div>
            <div class="flex justify-between font-label-sm text-label-sm">
              <span class="text-on-surface-variant">SUNLIGHT / ECLIPSE</span>
              <span class="text-on-surface font-semibold">${sunlightPercent}% Sun / ${eclipsePercent}% Shade</span>
            </div>
            <div class="w-full h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
              <div class="h-full bg-primary rounded-full" style="width: ${sunlightPercent}%"></div>
            </div>
            <div class="flex justify-between font-label-sm text-label-sm pt-1">
              <span class="text-on-surface-variant">GROUND CONTACT</span>
              <span class="text-secondary font-semibold">${orbit.contact_min_per_day} min/day</span>
            </div>
          </div>

          <button
            class="w-full py-space-xs px-space-md rounded-lg font-label-md text-label-md uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-1.5 ${
              isSelected
                ? 'bg-secondary/20 text-secondary border border-secondary/40'
                : 'bg-surface-container-high text-on-surface hover:text-secondary'
            }"
            type="button"
          >
            <span class="material-symbols-outlined text-[18px]">${isSelected ? 'done' : 'touch_app'}</span>
            <span>${isSelected ? 'Target Orbit Selected' : 'Select Target Orbit'}</span>
          </button>
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
      const art = VEHICLE_ART_MAP[veh.id] || {
        image: '/assets/stitch/asset_2.jpg',
        rocketClass: 'Orbital Launcher',
        reliability: '99.5%'
      };

      return `
        <article
          class="stage-card trade-card rocket-card group relative flex flex-col justify-between rounded-xl p-space-md transition-all duration-300 transform hover:-translate-y-1 ${
            !isCapable ? 'opacity-70 bg-surface-container-low/60' : isSelected ? 'bg-surface-container-high/95 shadow-lg border-t-2 border-secondary' : 'bg-surface-container/70 hover:bg-surface-container-high shadow-md'
          }"
          tabindex="${isCapable ? '0' : '-1'}"
          role="radio"
          aria-checked="${isSelected}"
          aria-disabled="${!isCapable}"
          data-action="${isCapable ? onSelectVehicleAction : ''}"
          data-id="${veh.id}"
        >
          <!-- Status Indicator Pill -->
          <div class="flex items-center justify-between gap-space-xs mb-space-sm">
            <span class="px-space-xs py-0.5 rounded font-label-sm text-label-sm uppercase tracking-wider flex items-center gap-1 ${
              !isCapable
                ? 'bg-error-container/40 text-error'
                : isSelected
                ? 'bg-secondary/20 text-secondary font-bold'
                : 'bg-surface-variant text-on-surface-variant'
            }">
              <span class="material-symbols-outlined text-[14px]">${!isCapable ? 'lock' : isSelected ? 'done' : 'speed'}</span>
              ${!isCapable ? 'UNAVAILABLE' : isSelected ? 'SELECTED FOR LAUNCH' : 'AVAILABLE'}
            </span>
            <div class="flex items-center gap-1 text-primary">
              <span class="material-symbols-outlined text-[16px]">toll</span>
              <span class="font-label-md text-label-md text-primary font-bold">$${veh.cost.toFixed(2)}M</span>
            </div>
          </div>

          <!-- Visual Art Representation -->
          <div class="relative w-full h-44 rounded-lg overflow-hidden bg-surface-container-lowest flex items-center justify-center mb-space-sm">
            <img
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${!isCapable ? 'grayscale' : ''}"
              src="${art.image}"
              alt="${escapeHtml(veh.name)}"
              onerror="this.onerror=null; this.src='https://lh3.googleusercontent.com/aida-public/AB6AXuBBE3h-BYUfmKHiPkbKNRtdDyYD3k0_1OYETNJ1jkUpslmJ8HuMGE9x_gWm3imCySDfxQiNQSbQxOrz0sZsAb871L038LqPguGHZuViKhLbgZUXg9PU_NvX_hSGZ-bptSxhAQWzzaUHmsh9y2LsSoC-FjVnzrSrWYg9squW0eq1eeVa53LlBDImSCayRok65KwWcq2BY1P2j1IUjfSVnyetBFSntceESVSMKWHjSWU';"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-transparent to-transparent opacity-80"></div>
            <div class="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-container-lowest/80 backdrop-blur-sm">
              <span class="font-label-sm text-label-sm text-on-surface-variant">Class:</span>
              <span class="font-label-sm text-label-sm text-secondary font-bold">${art.rocketClass}</span>
            </div>
          </div>

          <!-- Details & Stats -->
          <div class="flex flex-col gap-space-xs mb-space-md">
            <h3 class="font-headline-sm text-headline-sm text-on-surface font-bold group-hover:text-secondary transition-colors">
              ${escapeHtml(veh.name)}
            </h3>
            <p class="font-body-sm text-body-sm text-on-surface-variant line-clamp-2">
              Fairing: <span class="text-on-surface font-semibold uppercase">${escapeHtml(veh.fairing_size)}</span>.
              ${isCapable ? `Rated for orbital insertion with ${capacityForOrbit} kg capacity.` : 'Cannot reach target orbit insertion parameters.'}
            </p>
          </div>

          <!-- Metric Bars & Telemetry -->
          <div class="space-y-space-xs py-space-xs mb-space-md bg-surface-container-low/50 rounded-lg p-space-sm">
            <div>
              <div class="flex justify-between font-label-sm text-label-sm mb-1">
                <span class="text-on-surface-variant">MAX PAYLOAD CAPACITY</span>
                <span class="text-on-surface font-semibold">${isCapable ? `${capacityForOrbit} kg` : '0 kg'}</span>
              </div>
              <div class="w-full h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
                <div class="h-full bg-secondary rounded-full" style="width: ${Math.min(100, (capacityForOrbit / 500) * 100)}%"></div>
              </div>
            </div>
            <div>
              <div class="flex justify-between font-label-sm text-label-sm mb-1">
                <span class="text-on-surface-variant">FLIGHT RELIABILITY</span>
                <span class="text-tertiary font-semibold">${art.reliability}</span>
              </div>
              <div class="w-full h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
                <div class="h-full bg-tertiary rounded-full" style="width: 99.5%"></div>
              </div>
            </div>
          </div>

          <!-- Active Selector Button -->
          <button
            class="w-full py-space-xs px-space-md rounded-lg font-label-md text-label-md uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-1.5 ${
              !isCapable
                ? 'bg-surface-container text-outline cursor-not-allowed'
                : isSelected
                ? 'bg-secondary/20 text-secondary border border-secondary/40'
                : 'bg-surface-container-high hover:bg-surface-variant text-on-surface'
            }"
            type="button"
            ${!isCapable ? 'disabled' : ''}
          >
            <span class="material-symbols-outlined text-[18px]">
              ${!isCapable ? 'lock' : isSelected ? 'done' : 'touch_app'}
            </span>
            <span>${!isCapable ? 'Incompatible Orbit' : isSelected ? 'Selected for Launch' : 'Equip Launcher'}</span>
          </button>
        </article>
      `;
    })
    .join('');

  return `
    <section class="wizard-stage-view stage-trade-space flex flex-col gap-space-lg w-full max-w-7xl mx-auto" aria-labelledby="stage-heading">
      <!-- Top Telemetry Progress & Overline -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-space-sm">
        <div class="flex items-center gap-space-xs">
          <span class="inline-flex items-center gap-1.5 px-space-md py-1 rounded-full bg-secondary/10 text-secondary font-label-sm text-label-sm uppercase tracking-widest shadow-[0_0_12px_rgba(123,208,255,0.2)]">
            <span class="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
            STEP 02A: ARCHITECTURAL TRADES
          </span>
          <span class="hidden sm:inline text-surface-variant font-label-sm text-label-sm">•</span>
          <span class="hidden sm:inline font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">CML 3: TRADE SPACE</span>
        </div>
      </div>

      <!-- Editorial Header -->
      <div class="space-y-space-xs">
        <h1 id="stage-heading" class="font-headline-lg lg:font-headline-xl text-headline-lg lg:text-headline-xl text-on-surface tracking-tight font-bold">
          Choose your ride to space.
        </h1>
        <p class="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
          Balance orbital lighting and ground station contact minutes against launch vehicle cost.
          Changing your orbit alters power generation in sunlight and eclipse periods.
        </p>
      </div>

      <!-- Trade 1: Operational Orbit -->
      <div class="flex flex-col gap-space-md">
        <div class="flex items-center gap-space-xs">
          <span class="w-6 h-6 rounded-full bg-primary text-on-primary font-bold font-label-sm text-label-sm flex items-center justify-center">1</span>
          <h2 class="font-headline-sm text-headline-sm text-on-surface font-semibold">Select Target Operational Orbit</h2>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-md" role="radiogroup" aria-label="Target Orbit Selection">
          ${orbitCards}
        </div>
      </div>

      <!-- Trade 2: Launch Vehicle -->
      <div class="flex flex-col gap-space-md pt-space-md">
        <div class="flex items-center gap-space-xs">
          <span class="w-6 h-6 rounded-full bg-primary text-on-primary font-bold font-label-sm text-label-sm flex items-center justify-center">2</span>
          <h2 class="font-headline-sm text-headline-sm text-on-surface font-semibold">Select Launch Vehicle Provider</h2>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-space-lg" role="radiogroup" aria-label="Launch Vehicle Selection">
          ${vehicleCards}
        </div>
      </div>
    </section>
  `;
}
