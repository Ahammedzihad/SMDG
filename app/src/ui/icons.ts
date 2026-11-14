/**
 * ORBITONE Inline SVG Icons
 * Hand-drawn, clean vector SVG icons in a friendly space-cartoon style.
 * Zero external font or image dependencies.
 */

export type IconName =
  | 'mass'
  | 'power'
  | 'budget'
  | 'data'
  | 'communications'
  | 'time'
  | 'check'
  | 'warning'
  | 'fail'
  | 'rocket'
  | 'planet'
  | 'star'
  | 'home'
  | 'back'
  | 'settings';

export interface IconOptions {
  size?: number;
  className?: string;
  color?: string;
  strokeWidth?: number;
}

export const ICONS: Record<IconName, (opt?: IconOptions) => string> = {
  // 1. Mass (Balance scale with weights)
  mass: ({ size = 20, className = '', color = 'currentColor', strokeWidth = 2 } = {}) => `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="orbitone-icon icon-mass ${className}" aria-hidden="true" focusable="false">
      <path d="M12 3v17"/>
      <path d="M5 21h14"/>
      <path d="M4 7h16"/>
      <path d="M6 7l-3 6h6l-3-6z"/>
      <path d="M18 7l-3 6h6l-3-6z"/>
      <circle cx="12" cy="4" r="1.5" fill="${color}"/>
    </svg>
  `,

  // 2. Power (Chunky energy lightning bolt)
  power: ({ size = 20, className = '', color = 'currentColor', strokeWidth = 2 } = {}) => `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="orbitone-icon icon-power ${className}" aria-hidden="true" focusable="false">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="${color}"/>
    </svg>
  `,

  // 3. Budget (Space credit coin with ring & star emblem)
  budget: ({ size = 20, className = '', color = 'currentColor', strokeWidth = 2 } = {}) => `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="orbitone-icon icon-budget ${className}" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="9"/>
      <circle cx="12" cy="12" r="6" stroke-dasharray="2 2"/>
      <path d="M12 8v8"/>
      <path d="M9.5 9.5a2.5 2.5 0 0 1 5 0c0 1.5-2 2-2.5 2.5s-2.5 1-2.5 2.5a2.5 2.5 0 0 0 5 0"/>
    </svg>
  `,

  // 4. Data (Storage memory microchip with pins)
  data: ({ size = 20, className = '', color = 'currentColor', strokeWidth = 2 } = {}) => `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="orbitone-icon icon-data ${className}" aria-hidden="true" focusable="false">
      <rect x="4" y="4" width="16" height="16" rx="3"/>
      <rect x="8" y="8" width="8" height="8" rx="1.5" fill="${color}" fill-opacity="0.2"/>
      <path d="M8 1v3M16 1v3M8 20v3M16 20v3M1 8h3M1 16h3M20 8h3M20 16h3"/>
    </svg>
  `,

  // 5. Communications (Satellite dish broadcasting signal arcs)
  communications: ({ size = 20, className = '', color = 'currentColor', strokeWidth = 2 } = {}) => `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="orbitone-icon icon-comms ${className}" aria-hidden="true" focusable="false">
      <path d="M4 11a8 8 0 0 1 8-8"/>
      <path d="M4 7a4 4 0 0 1 4-4"/>
      <path d="M19 14l-7 7-2-2 7-7"/>
      <path d="M14 9l-4 4"/>
      <path d="M8.5 14.5l-4 4a2 2 0 0 0 3 3l4-4"/>
      <circle cx="18.5" cy="8.5" r="2.5" fill="${color}"/>
    </svg>
  `,

  // 6. Time (Chunky mission chronometer / clock)
  time: ({ size = 20, className = '', color = 'currentColor', strokeWidth = 2 } = {}) => `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="orbitone-icon icon-time ${className}" aria-hidden="true" focusable="false">
      <circle cx="12" cy="13" r="8"/>
      <path d="M12 9v4l2.5 2.5"/>
      <path d="M10 2h4"/>
      <path d="M12 2v3"/>
    </svg>
  `,

  // 7. Check (Rounded checkmark badge)
  check: ({ size = 20, className = '', color = 'currentColor', strokeWidth = 2.5 } = {}) => `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="orbitone-icon icon-check ${className}" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="9" fill="${color}" fill-opacity="0.18"/>
      <path d="M8 12.5l2.5 2.5 5.5-5.5"/>
    </svg>
  `,

  // 8. Warning (Rounded alert triangle)
  warning: ({ size = 20, className = '', color = 'currentColor', strokeWidth = 2.5 } = {}) => `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="orbitone-icon icon-warning ${className}" aria-hidden="true" focusable="false">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" fill="${color}" fill-opacity="0.18"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <circle cx="12" cy="17" r="1" fill="${color}"/>
    </svg>
  `,

  // 9. Fail (Rounded critical alert X)
  fail: ({ size = 20, className = '', color = 'currentColor', strokeWidth = 2.5 } = {}) => `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="orbitone-icon icon-fail ${className}" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="9" fill="${color}" fill-opacity="0.18"/>
      <line x1="9" y1="9" x2="15" y2="15"/>
      <line x1="15" y1="9" x2="9" y2="15"/>
    </svg>
  `,

  // 10. Rocket (Friendly chunky cartoon spacecraft)
  rocket: ({ size = 20, className = '', color = 'currentColor', strokeWidth = 2 } = {}) => `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="orbitone-icon icon-rocket ${className}" aria-hidden="true" focusable="false">
      <path d="M12 2C8 4 6 9 6 15l3 3c6 0 11-2 13-6-2-6-6-10-10-10z" fill="${color}" fill-opacity="0.15"/>
      <circle cx="14" cy="10" r="2" fill="${color}"/>
      <path d="M6 15l-3 2 1 3 3-1"/>
      <path d="M9 18l-1 3 3 1 2-3"/>
      <path d="M4 22l3-3"/>
    </svg>
  `,

  // 11. Planet (Ringed cartoon celestial body)
  planet: ({ size = 20, className = '', color = 'currentColor', strokeWidth = 2 } = {}) => `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="orbitone-icon icon-planet ${className}" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="7" fill="${color}" fill-opacity="0.2"/>
      <ellipse cx="12" cy="12" rx="11" ry="4" transform="rotate(-25 12 12)"/>
    </svg>
  `,

  // 12. Star (Friendly 5-point glowing star)
  star: ({ size = 20, className = '', color = 'currentColor', strokeWidth = 1.5 } = {}) => `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="orbitone-icon icon-star ${className}" aria-hidden="true" focusable="false">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  `,

  // 13. Home (Cute space habitat dome / home base)
  home: ({ size = 20, className = '', color = 'currentColor', strokeWidth = 2 } = {}) => `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="orbitone-icon icon-home ${className}" aria-hidden="true" focusable="false">
      <path d="M3 10.5L12 3l9 7.5"/>
      <path d="M5 9v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9"/>
      <path d="M10 21v-6a2 2 0 0 1 4 0v6"/>
    </svg>
  `,

  // 14. Back (Rounded left navigation arrow)
  back: ({ size = 20, className = '', color = 'currentColor', strokeWidth = 2.5 } = {}) => `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="orbitone-icon icon-back ${className}" aria-hidden="true" focusable="false">
      <path d="M19 12H5"/>
      <path d="M12 19l-7-7 7-7"/>
    </svg>
  `,

  // 15. Settings (Mechanical gear / mission control dial)
  settings: ({ size = 20, className = '', color = 'currentColor', strokeWidth = 2 } = {}) => `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" class="orbitone-icon icon-settings ${className}" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  `
};

export function renderIcon(name: IconName, size = 20, className = '', color = 'currentColor'): string {
  const iconRenderer = ICONS[name];
  if (!iconRenderer) {
    return `<span class="icon-fallback" aria-hidden="true">✦</span>`;
  }
  return iconRenderer({ size, className, color });
}

