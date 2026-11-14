/**
 * Stage 4: Point Design (CML 4)
 *
 * Implements Google Stitch Screen 35fcc636dafb44cd921b737cdfcf3bd5 (3D Spacecraft Assembly)
 * and Screen 82a4d657a38042e694180838e6243223 (Spacecraft Body Selection).
 *
 * Features:
 * - 3D live turntable spacecraft rig with rotation & diagnostics controls
 * - Stitch CubeSat chassis selection cards with 3D art previews
 * - Mounted Module Array (Equipped Parts Tray)
 * - Subsystem component library with category tabs & 1-click equip/remove
 * - Real-time sync with Three.js scene and authoritative @shared engine
 */

import type { CubeSatClass, Part, Meters } from '@shared';
import { renderEquippedModuleTray, renderModularPartsCatalog, type PartRowItem } from '../partsTable';
import { renderIcon } from '../icons';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const CHASSIS_ART_MAP: Record<string, { image: string; tag: string; description: string }> = {
  '1U': {
    image: '/assets/stitch/asset_9.jpg',
    tag: 'Standard 1U CubeSat Frame',
    description: 'Compact 10×10×10 cm aluminum envelope, ultra-lightweight standard dispenser integration.'
  },
  '3U': {
    image: '/assets/stitch/asset_10.jpg',
    tag: 'Extended 3U Triple-Unit Bus',
    description: 'Triple-length 10×10×34 cm chassis allowing dedicated payload bays, deployable arrays, and ADCS reaction wheels.'
  }
};

export function renderPointDesignStage(
  classes: CubeSatClass[],
  selectedClassId: string,
  parts: Part[],
  selectedPartIds: string[],
  activePartCategory: string = 'all',
  meters?: Meters,
  onSelectClassAction: string = 'select-class',
  onTogglePartAction: string = 'toggle-part',
  onCategoryFilterAction: string = 'filter-category',
  onFocusPartAction: string = 'focus-part'
): string {
  // CubeSat class selection cards
  const classCards = classes
    .map((cls) => {
      const isSelected = cls.id === selectedClassId;
      const art = CHASSIS_ART_MAP[cls.id] || {
        image: '/assets/stitch/asset_9.jpg',
        tag: `${cls.name} Bus`,
        description: `Dispenser standard with ${cls.height_mm} mm height envelope.`
      };

      return `
        <article
          class="class-card stage-card group relative flex flex-col justify-between rounded-xl p-space-md cursor-pointer transition-all duration-300 transform hover:-translate-y-1 ${
            isSelected
              ? 'bg-surface-container-high/95 shadow-lg border-t-2 border-secondary'
              : 'bg-surface-container/70 hover:bg-surface-container-high shadow-md border border-white/5'
          }"
          tabindex="0"
          role="radio"
          aria-checked="${isSelected}"
          data-action="${onSelectClassAction}"
          data-id="${cls.id}"
        >
          <div class="flex items-center justify-between gap-space-xs mb-space-sm">
            <span class="px-space-xs py-0.5 rounded font-label-sm text-label-sm uppercase tracking-wider flex items-center gap-1 ${
              isSelected ? 'bg-secondary text-on-secondary font-bold' : 'bg-surface-variant text-on-surface-variant'
            }">
              <span class="material-symbols-outlined text-[14px]">${isSelected ? 'check_circle' : 'view_in_ar'}</span>
              ${isSelected ? 'CURRENTLY EQUIPPED' : 'SELECT CHASSIS'}
            </span>
            <span class="font-label-sm text-label-sm text-secondary font-mono">${cls.id}</span>
          </div>

          <div class="relative w-full h-36 rounded-lg overflow-hidden bg-surface-container-lowest flex items-center justify-center mb-space-sm">
            <img
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              src="${art.image}"
              alt="${escapeHtml(cls.name)}"
              onerror="this.onerror=null; this.src='https://lh3.googleusercontent.com/aida-public/AB6AXuDCzKLqI4F_epPky7FqSgfpQ5RWAQ_G7VXd5-LOsUa-PJhfMbOyWihsqYMCSG_ObhNVb9Yelp1gOCDZoMUiGmwHqpZ9bD7HUkoAZALsVwmvcGng3Cpt3hh0_MLkx9dMEAn0FqJaxj_i0pAk3hh0a0pufplBvLyBMBfr6FfWi4Dyy4CiapmeymxQAqJbN69-FKu_04N0VG-7i-HwkqmA2sysJ7KixHNd0b3dv-A86b4';"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-transparent to-transparent opacity-80"></div>
            <div class="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-container-lowest/80 backdrop-blur-sm">
              <span class="font-label-sm text-label-sm text-secondary font-bold">${art.tag}</span>
            </div>
          </div>

          <div class="flex flex-col gap-space-xs mb-space-sm">
            <h3 class="font-headline-sm text-headline-sm text-on-surface font-bold group-hover:text-secondary transition-colors">
              ${escapeHtml(cls.name)}
            </h3>
            <p class="font-body-sm text-body-sm text-on-surface-variant line-clamp-2">
              ${escapeHtml(art.description)}
            </p>
          </div>

          <div class="space-y-space-xs py-space-xs mb-space-sm bg-surface-container-low/60 rounded-lg p-space-sm">
            <div class="flex justify-between font-label-sm text-label-sm">
              <span class="text-on-surface-variant">MASS ENVELOPE</span>
              <span class="text-on-surface font-semibold">Max ${cls.mass_limit_kg.toFixed(2)} kg</span>
            </div>
            <div class="flex justify-between font-label-sm text-label-sm">
              <span class="text-on-surface-variant">DISPENSER HEIGHT</span>
              <span class="text-secondary font-mono">${cls.height_mm} mm</span>
            </div>
          </div>

          <button
            class="w-full py-space-xs px-space-md rounded-lg font-label-md text-label-md uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-1.5 ${
              isSelected
                ? 'bg-secondary/20 text-secondary border border-secondary/40'
                : 'bg-surface-container-high hover:bg-surface-variant text-on-surface'
            }"
            type="button"
          >
            <span class="material-symbols-outlined text-[18px]">${isSelected ? 'check_circle' : 'touch_app'}</span>
            <span>${isSelected ? 'Chassis Configured' : 'Select ' + cls.name}</span>
          </button>
        </article>
      `;
    })
    .join('');

  // Prepare Master Equipment List rows & cards
  const partItems: PartRowItem[] = parts.map((part) => {
    const isSelected = selectedPartIds.includes(part.id);
    return {
      part,
      selected: isSelected,
      disabled: false,
      disabledReason: undefined
    };
  });

  // Telemetry status strip for the hangar
  const massLimit = classes.find((c) => c.id === selectedClassId)?.mass_limit_kg ?? 4.0;
  const currentMass = meters ? meters.mass.value : 2.5;
  const netPower = meters ? (meters.power.limit - meters.power.value) : 10.0;
  const isOverMass = currentMass > massLimit;

  return `
    <section class="wizard-stage-view stage-point-design flex flex-col gap-space-lg w-full max-w-7xl mx-auto" aria-labelledby="stage-heading">
      <!-- Top Telemetry Progress & Overline -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-space-sm">
        <div class="flex items-center gap-space-xs">
          <span class="inline-flex items-center gap-1.5 px-space-md py-1 rounded-full bg-secondary/10 text-secondary font-label-sm text-label-sm uppercase tracking-widest shadow-[0_0_12px_rgba(123,208,255,0.2)]">
            <span class="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
            STEP 02B: SUBSYSTEM INTEGRATION
          </span>
          <span class="hidden sm:inline text-surface-variant font-label-sm text-label-sm">•</span>
          <span class="hidden sm:inline font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">CML 4: POINT DESIGN</span>
        </div>
      </div>

      <!-- Editorial Header -->
      <div class="space-y-space-xs">
        <h1 id="stage-heading" class="font-headline-lg lg:font-headline-xl text-headline-lg lg:text-headline-xl text-on-surface tracking-tight font-bold">
          Assemble your robotic explorer.
        </h1>
        <p class="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
          Assemble your spacecraft subsystem by subsystem in the cleanroom hangar.
          Adding components increases scientific capabilities, while consuming mass, electricity, and project reserves.
        </p>
      </div>

      <!-- 3D Turntable Spacecraft Viewport (Stitch Screen 35fcc636dafb44cd921b737cdfcf3bd5) -->
      <div class="spacecraft-hangar-panel rounded-2xl bg-surface-container-low/90 backdrop-blur-xl border border-secondary/20 p-space-md shadow-2xl overflow-hidden">
        <div class="flex flex-wrap justify-between items-center mb-space-sm gap-space-xs">
          <div class="flex items-center gap-space-xs">
            <span class="w-2.5 h-2.5 rounded-full bg-tertiary animate-pulse"></span>
            <span class="font-label-sm text-label-sm tracking-wider uppercase text-on-surface font-bold">
              3D SPACECRAFT ASSEMBLY TURNTABLE RIG
            </span>
          </div>
          <div class="flex items-center gap-space-md">
            <span class="font-label-sm text-label-sm font-mono ${isOverMass ? 'text-error font-bold' : 'text-tertiary font-bold'}">
              ${isOverMass ? '⚠ OVERWEIGHT WARNING' : '✓ MASS WITHIN LIMIT'}
            </span>
            <span class="font-label-sm text-label-sm font-mono text-secondary font-bold">
              NET POWER: ${netPower >= 0 ? '+' : ''}${netPower.toFixed(1)} W
            </span>
          </div>
        </div>

        <div class="scene-card turntable-scene-card relative w-full h-[320px] lg:h-[380px] rounded-xl overflow-hidden bg-surface-container-lowest shadow-inner flex items-center justify-center">
          <div class="scene-host" data-scene style="width:100%; height:100%"></div>

          <!-- Turntable Radial Grid SVG Overlay -->
          <svg class="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-80 h-24 pointer-events-none opacity-40 text-secondary" fill="none" viewBox="0 0 320 110">
            <ellipse cx="160" cy="55" rx="140" ry="40" stroke="currentColor" stroke-dasharray="4 4" stroke-width="1.5"></ellipse>
            <ellipse cx="160" cy="55" rx="100" ry="25" stroke="currentColor" stroke-width="1"></ellipse>
            <ellipse cx="160" cy="55" rx="50" ry="12" stroke="currentColor" stroke-width="2"></ellipse>
          </svg>

          <!-- Holographic Status Pills -->
          <div class="absolute top-4 left-4 hidden sm:flex items-center gap-space-xs px-space-sm py-space-xs rounded-full bg-surface-container-lowest/80 backdrop-blur-md shadow-md">
            <span class="w-2 h-2 rounded-full bg-tertiary"></span>
            <span class="font-label-sm text-label-sm text-on-surface uppercase tracking-wider">3D TURNTABLE ONLINE</span>
          </div>

          <!-- Turntable Camera Controls -->
          <div class="absolute bottom-4 left-4 flex items-center gap-space-xs z-10">
            <button type="button" class="w-8 h-8 rounded-lg bg-surface-container/80 hover:bg-surface-container-high text-on-surface flex items-center justify-center shadow-md transition-all active:scale-95 cursor-pointer" data-action="scene-rotate-left" title="Rotate Spacecraft Left" aria-label="Rotate Left">
              <span class="material-symbols-outlined text-[18px]">rotate_left</span>
            </button>
            <button type="button" class="w-8 h-8 rounded-lg bg-surface-container/80 hover:bg-surface-container-high text-on-surface flex items-center justify-center shadow-md transition-all active:scale-95 cursor-pointer" data-action="scene-rotate-right" title="Rotate Spacecraft Right" aria-label="Rotate Right">
              <span class="material-symbols-outlined text-[18px]">rotate_right</span>
            </button>
            <button type="button" class="px-space-sm py-1 rounded-lg bg-surface-container/80 hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface font-label-sm text-label-sm uppercase tracking-wider flex items-center gap-space-xs shadow-md transition-all cursor-pointer" data-action="scene-reset-camera" title="Reset View" aria-label="Reset View">
              <span class="material-symbols-outlined text-[16px] text-secondary">filter_center_focus</span>
              <span>Reset</span>
            </button>
          </div>

          <div class="absolute bottom-4 right-4 font-label-sm text-label-sm text-on-surface-variant uppercase font-mono pointer-events-none bg-surface-container-lowest/70 px-2 py-0.5 rounded backdrop-blur-sm">
            DRAG TO ROTATE · SCROLL TO ZOOM
          </div>
        </div>
      </div>

      <!-- Step 1: Form Factor (Chassis Body Selection - Stitch Screen 82a4d657a38042e694180838e6243223) -->
      <div class="point-design-section flex flex-col gap-space-md">
        <div class="flex items-center gap-space-xs">
          <span class="w-6 h-6 rounded-full bg-primary text-on-primary font-bold font-label-sm text-label-sm flex items-center justify-center">1</span>
          <h2 class="font-headline-sm text-headline-sm text-on-surface font-semibold">Select Spacecraft Form Factor (CubeSat Chassis)</h2>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-space-md" role="radiogroup" aria-label="CubeSat Class Selection">
          ${classCards}
        </div>
      </div>

      <!-- Step 2: Equipped Modules Tray -->
      <div class="point-design-section flex flex-col gap-space-md pt-space-xs">
        <div class="flex items-center gap-space-xs">
          <span class="w-6 h-6 rounded-full bg-primary text-on-primary font-bold font-label-sm text-label-sm flex items-center justify-center">2</span>
          <h2 class="font-headline-sm text-headline-sm text-on-surface font-semibold">Mounted Module Array (Equipped Subsystems)</h2>
        </div>
        ${renderEquippedModuleTray(partItems, onTogglePartAction)}
      </div>

      <!-- Step 3: Modular Subsystem Catalog -->
      <div class="point-design-section flex flex-col gap-space-md pt-space-xs">
        <div class="flex items-center gap-space-xs">
          <span class="w-6 h-6 rounded-full bg-primary text-on-primary font-bold font-label-sm text-label-sm flex items-center justify-center">3</span>
          <h2 class="font-headline-sm text-headline-sm text-on-surface font-semibold">Subsystem Hardware Catalog</h2>
        </div>
        ${renderModularPartsCatalog(partItems, activePartCategory, onTogglePartAction, onCategoryFilterAction, onFocusPartAction)}
      </div>
    </section>
  `;
}
