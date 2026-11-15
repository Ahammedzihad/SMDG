/**
 * ORBITONE — Authoritative Scientific Inventory
 * Educational library grounded directly in NASA & NOAA mission documentation.
 * Structured into 3 distinct sections:
 *   A. Missions & Spacecraft Library (4 entries)
 *   B. Scientific Instrument Library (8 instruments)
 *   C. Space Technology & Infrastructure Library (3 entries)
 */

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export type InventoryCategory = 'instruments' | 'missions' | 'tech';

export interface InventoryEntry {
  id: string;
  name: string;
  category: InventoryCategory;
  kidNickname: string;
  whatItIs: string;
  parentMission: string;
  weight: string;
  battery: string;
  operatingPrinciple: string;
  missionRelevance: string;
  heritageSource: string;
  assetImg: string;
  badge: string;
  comboTip?: string;
  carriedInstruments?: string[];
  subsystems?: string[];
  provenanceNote?: string;
}

export const INVENTORY_ITEMS: InventoryEntry[] = [
  // ==========================================
  // SECTION A: MISSIONS & SPACECRAFT (4 ENTRIES)
  // ==========================================
  {
    id: 'quicksounder',
    name: 'QuickSounder',
    category: 'missions',
    kidNickname: 'The Storm-Chasing Mini Satellite',
    whatItIs: 'Complete Satellite Mission — A single small, fast weather mini-satellite built quickly from spare parts to orbit Low Earth Orbit.',
    parentMission: 'NOAA Near Earth Orbit Network (NEON Pathfinder)',
    weight: 'Not provided in the source (Unverified)',
    battery: 'Solar array powered (Exact wattage not provided in source)',
    operatingPrinciple: 'Flies in polar Low Earth Orbit carrying microwave sounders that see straight through hurricane clouds, warning meteorologists on the ground about dangerous storms.',
    missionRelevance: 'Pathfinder mission for NOAA’s NEON architecture, proving rapid-launch small satellites can replace large, aging weather flagships.',
    heritageSource: 'NOAA / NASA Near Earth Orbit Network (NEON)',
    assetImg: '/assets/inventory/quicksounder.jpg',
    badge: 'PATHFINDER MISSION',
    carriedInstruments: ['ATMS (Advanced Technology Microwave Sounder)'],
    provenanceNote: 'Authentic mission photo showing QuickSounder with deployed solar wing and ATMS scanner.'
  },
  {
    id: 'swfo-l1',
    name: 'Space Weather Follow On-Lagrange 1 (SWFO-L1)',
    category: 'missions',
    kidNickname: 'The Sun Storm Lookout',
    whatItIs: 'Complete Satellite Mission — A full solar-observing deep space spacecraft parked 1.5 million km toward the Sun at Sun-Earth L1.',
    parentMission: 'NOAA / NASA Space Weather Architecture',
    weight: 'Not provided in the source (Unverified)',
    battery: 'Continuous solar array generation at L1 (Exact wattage not provided in source)',
    operatingPrinciple: 'Maintains an uninterrupted 24/7 view of the Sun from the L1 balance point, detecting coronal mass ejections (CMEs) and fast solar wind hours before they hit Earth.',
    missionRelevance: 'Protects commercial power grids, satellite constellations, GPS networks, and Artemis astronauts from severe solar storms.',
    heritageSource: 'NOAA Space Weather Program / NASA Goddard',
    assetImg: '/assets/inventory/quicksounder.jpg',
    badge: 'L1 DEEP SPACE OBSERVATORY',
    carriedInstruments: [
      'Compact Coronagraph (CCOR)',
      'Solar Wind Catcher (SWiPS)',
      'Space Magnet Sensor (MAG)',
      'Fast-Particle Detector (STIS)'
    ],
    provenanceNote: 'Representative image — not an actual SWFO-L1 spacecraft photograph.'
  },
  {
    id: 'dragonfly',
    name: 'Dragonfly',
    category: 'missions',
    kidNickname: 'Nuclear Flying Drone on Titan',
    whatItIs: 'Complete Spacecraft / Lander — A car-sized 8-rotor helicopter drone powered by a nuclear MMRTG battery to explore Saturn’s moon Titan.',
    parentMission: 'NASA New Frontiers Program (JHU APL)',
    weight: 'Not provided in the source (Unverified)',
    battery: 'MMRTG (Multi-Mission Radioisotope Thermoelectric Generator)',
    operatingPrinciple: 'Takes advantage of Titan’s dense nitrogen atmosphere and low gravity to hop kilometers at a time between organic sand dunes and impact craters.',
    missionRelevance: 'Investigates prebiotic chemistry and habitability in an alien organic environment mirroring early Earth.',
    heritageSource: 'NASA New Frontiers 4 / Johns Hopkins Applied Physics Laboratory',
    assetImg: '/assets/inventory/dragonfly.jpg',
    badge: 'TITAN ROTORCRAFT',
    carriedInstruments: [
      'DraMS (Mass Spectrometer)',
      'DrACO (Ice Drills & Vacuum)',
      'DraGNS (Neutron/Gamma Ground Scanner)',
      'DraGMet (Geophysics & Weather)',
      'DragonCam (Microscope & Explorer Eyes)'
    ],
    provenanceNote: 'NASA/APL concept rendering of Dragonfly rotorcraft on the surface dunes of Titan.'
  },
  {
    id: 'davinci',
    name: 'The DAVINCI Mission',
    category: 'missions',
    kidNickname: 'Venus Cloud-Diving Probe',
    whatItIs: 'Complete Spacecraft + Probe — A carrier relay spacecraft and armored titanium descent sphere on a parachute diving into Venus’s crushing atmosphere.',
    parentMission: 'NASA Discovery Program (GSFC)',
    weight: 'Not provided in the source (Unverified)',
    battery: 'High-temperature thermal batteries for 63-minute descent',
    operatingPrinciple: 'Plunges through 460°C sulfuric acid clouds and 90 times Earth’s atmospheric pressure, sniffing atmospheric chemistry and snapping photos below the cloud base.',
    missionRelevance: 'Addresses whether Venus ever had habitable oceans and active plate tectonics before a runaway greenhouse event occurred.',
    heritageSource: 'NASA Discovery Program / Goddard Space Flight Center',
    assetImg: '/assets/inventory/davinci_probe.jpg',
    badge: 'VENUS DESCENT PROBE',
    carriedInstruments: [
      'VMS (Noble Gas Sniffer)',
      'VTLS (Laser Gas Detector)',
      'VASI (Atmosphere Dynamics)',
      'VenDI (Under-Cloud Descent Camera)'
    ],
    provenanceNote: 'NASA rendering of DAVINCI descent probe descending beneath Venus cloud layer.'
  },

  // ==========================================
  // SECTION B: SCIENTIFIC INSTRUMENTS (8 ENTRIES)
  // ==========================================
  {
    id: 'moma',
    name: 'Mars Organic Molecule Analyzer (MOMA)',
    category: 'instruments',
    kidNickname: 'Molecule Weighing Scale / Rover Chemistry Lab',
    whatItIs: 'True Scientific Instrument — A single payload box (mini chemistry lab) mounted inside the belly of a Mars Rover.',
    parentMission: 'ExoMars Rosalind Franklin Rover (NASA GSFC & ESA)',
    weight: '11.5 kg (toaster-oven sized) [Source: NASA GSFC / ExoMars]',
    battery: '45 W to 110 W [Source: NASA GSFC / ExoMars]',
    operatingPrinciple: 'Features a Linear Ion Trap Mass Spectrometer with dual ionization modes: a non-destructive UV laser (LDI) for unlimited rock zapping, and 32 single-use pyrolysis ovens (GC-MS) baking samples at 800°C.',
    missionRelevance: 'Weighs tiny organic molecules down to 10 parts-per-billion in underground rock samples drilled from 2 meters deep.',
    heritageSource: 'NASA Goddard Space Flight Center / Max Planck Institute',
    assetImg: '/assets/inventory/moma.jpg',
    badge: 'ROVER CHEMISTRY LAB',
    comboTip: 'Save your 32 single-use ovens for your deepest, most exciting drill samples!',
    provenanceNote: 'NASA GSFC flight hardware unit of MOMA undergoing cleanroom vacuum chamber testing.'
  },
  {
    id: 'polsir',
    name: 'Polarized Submillimeter Ice-cloud Radiometer (PolSIR)',
    category: 'instruments',
    kidNickname: 'Snowflake Shape Sorter',
    whatItIs: 'True Scientific Instrument — A pair of specialized cloud-scanning sensors mounted onto twin CubeSats flying in a tag-team.',
    parentMission: 'PolSIR Twin CubeSats (NASA EVI-6)',
    weight: '12.5 kg each (Super Light) [Source: NASA EVI-6]',
    battery: '28 W (Very Low) [Source: NASA EVI-6]',
    operatingPrinciple: 'Measures polarized submillimeter radiation emitted by ice crystals in tropical storm clouds to determine if they are flat plates or fluffy snowflakes.',
    missionRelevance: 'Resolves how high-altitude ice clouds trap planetary heat and alter global climate models.',
    heritageSource: 'NASA Earth Venture Instrument-6 (EVI-6)',
    assetImg: '/assets/inventory/polsir.jpg',
    badge: 'TWIN CUBESAT RADIOMETER',
    comboTip: 'Launch both Twin CubeSats a few hours apart to watch clouds evolve and unlock 100% science!',
    provenanceNote: 'NASA illustration of the twin PolSIR CubeSats scanning tropical convective clouds.'
  },
  {
    id: 'atms',
    name: 'Advanced Technology Microwave Sounder (ATMS)',
    category: 'instruments',
    kidNickname: 'Cloud-Peeking Microwave Scanner',
    whatItIs: 'True Scientific Instrument — Cross-track scanning microwave radiometer carried aboard weather satellites. ATMS uses microwave measurements to study atmospheric temperature and moisture profiles directly through clouds.',
    parentMission: 'QuickSounder & JPSS Series (NASA / NOAA)',
    weight: '75 kg (Medium) [Source: NOAA / NASA JPSS]',
    battery: '100 W (Medium) [Source: NOAA / NASA JPSS]',
    operatingPrinciple: 'Uses microwave measurements to penetrate dense cloud cover without attenuation, measuring microwave radiation across 22 channels to retrieve atmospheric temperature and moisture profiles from sea level up to 45 km altitude.',
    missionRelevance: 'Core instrument for hurricane warning models and numerical weather prediction, providing vital temperature and moisture soundings.',
    heritageSource: 'NASA / NOAA Joint Polar Satellite System (JPSS)',
    assetImg: '/assets/inventory/quicksounder.jpg',
    badge: 'MICROWAVE SOUNDER',
    comboTip: 'Add strong reaction wheels to your satellite bus because this spinning scanner creates momentum wobble!',
    provenanceNote: 'Representative instrument view: mounted on the forward earth-viewing deck of QuickSounder.'
  },
  {
    id: 'ccor',
    name: 'Compact Coronagraph (CCOR)',
    category: 'instruments',
    kidNickname: 'Artificial Eclipse Maker',
    whatItIs: 'True Scientific Instrument — Solar coronagraph carried aboard solar guard spacecraft.',
    parentMission: 'Space Weather Follow On-Lagrange 1 (SWFO-L1) & GOES-U',
    weight: '28 kg (Light) [Source: Naval Research Laboratory / NOAA]',
    battery: '32 W (Low) [Source: Naval Research Laboratory / NOAA]',
    operatingPrinciple: 'Uses a high-precision occulting disk to block the blinding center disk of the Sun, creating a miniature permanent solar eclipse to photograph faint coronal mass ejections.',
    missionRelevance: 'Provides early detection of high-velocity coronal mass ejections traveling toward Earth.',
    heritageSource: 'Naval Research Laboratory / NOAA / NASA',
    assetImg: '/assets/inventory/quicksounder.jpg',
    badge: 'SOLAR CORONAGRAPH',
    comboTip: 'Pair with solar wind particle counters (SWiPS) for complete space weather monitoring.',
    provenanceNote: 'Representative image — not an actual SWFO-L1/CCOR photograph. Carried on SWFO-L1 deep space observatory.'
  },
  {
    id: 'drams',
    name: 'Dragonfly Mass Spectrometer (DraMS)',
    category: 'instruments',
    kidNickname: 'Flying Alien-Recipe Lab',
    whatItIs: 'True Scientific Instrument — Chemical analysis laboratory carried aboard the Dragonfly Titan rotorcraft.',
    parentMission: 'Dragonfly (NASA New Frontiers)',
    weight: '28 kg (Light) [Source: NASA GSFC / JHU APL]',
    battery: '65 W (Medium) [Source: NASA GSFC / JHU APL]',
    operatingPrinciple: 'Utilizes laser desorption and gas chromatography mass spectrometry to inspect organic surface sands and water ice ingested by pneumatic vacuum drills.',
    missionRelevance: 'Determines whether organic synthesis on Titan has progressed toward amino acids and complex prebiotic chemistry.',
    heritageSource: 'NASA Goddard Space Flight Center / JHU APL',
    assetImg: '/assets/inventory/dragonfly.jpg',
    badge: 'TITAN CHEMISTRY LAB',
    comboTip: 'Powered directly from Dragonfly’s central nuclear MMRTG distribution bus.',
    provenanceNote: 'Carried within the forward fuselage of Dragonfly (represented by the flight rotorcraft).'
  },
  {
    id: 'dragns',
    name: 'Dragonfly Gamma-Ray and Neutron Spectrometer (DraGNS)',
    category: 'instruments',
    kidNickname: 'Underground Element Scanner',
    whatItIs: 'True Scientific Instrument — Subsurface remote sensing suite carried aboard Dragonfly.',
    parentMission: 'Dragonfly (NASA New Frontiers)',
    weight: '16.2 kg (Light) [Source: Johns Hopkins APL / NASA GSFC]',
    battery: '30 W (Low) [Source: Johns Hopkins APL / NASA GSFC]',
    operatingPrinciple: 'Fires pulsed neutrons 1 meter into Titan’s frozen crust and detects backscattered gamma rays and neutrons, revealing bulk Carbon, Hydrogen, Nitrogen, and Oxygen.',
    missionRelevance: 'Provides instant bulk elemental chemistry of surface materials without requiring sample acquisition or drilling.',
    heritageSource: 'Johns Hopkins Applied Physics Laboratory / NASA GSFC',
    assetImg: '/assets/inventory/dragonfly.jpg',
    badge: 'SUBSURFACE SENSOR',
    comboTip: 'Scans hidden elements up to 1 meter deep directly through the landing skids!',
    provenanceNote: 'Mounted above the landing skids of Dragonfly (represented by the flight rotorcraft).'
  },
  {
    id: 'vms',
    name: 'Venus Mass Spectrometer (VMS)',
    category: 'instruments',
    kidNickname: 'Ancient Ocean Detective',
    whatItIs: 'True Scientific Instrument — Gas sampling mass spectrometer inside the DAVINCI descent probe.',
    parentMission: 'The DAVINCI Mission (NASA Discovery)',
    weight: '19.2 kg (Light) [Source: NASA GSFC]',
    battery: '52 W (Medium) [Source: NASA GSFC]',
    operatingPrinciple: 'Ingests atmospheric gas samples through heated inlet ports during parachute descent, analyzing noble gases (Ne, Ar, Kr, Xe) and Deuterium-to-Hydrogen ratios.',
    missionRelevance: 'Provides decisive isotopic evidence on the volume of Venus’s primordial oceans and the timescale of atmospheric loss.',
    heritageSource: 'NASA Goddard Space Flight Center',
    assetImg: '/assets/inventory/davinci_probe.jpg',
    badge: 'NOBLE GAS SNIFFER',
    comboTip: 'Measures ancient noble gas isotopes that have remained unaltered since the solar system formed.',
    provenanceNote: 'Main internal sensor of the DAVINCI descent sphere (represented by the descent probe).'
  },
  {
    id: 'vendi',
    name: 'Venus Descent Imager (VenDI)',
    category: 'instruments',
    kidNickname: 'First Look at Venus’s Mountains',
    whatItIs: 'True Scientific Instrument — Downward-looking near-infrared descent camera on the DAVINCI probe.',
    parentMission: 'The DAVINCI Mission (NASA Discovery)',
    weight: '5.6 kg (Featherweight) [Source: Malin Space Science Systems / NASA GSFC]',
    battery: '15 W (Tiny) [Source: Malin Space Science Systems / NASA GSFC]',
    operatingPrinciple: 'Equipped with a ruggedized sapphire optical window to withstand 460°C and 90-bar pressure, capturing hundreds of high-contrast images of Alpha Regio below the cloud base.',
    missionRelevance: 'Produces the first close-up visual and near-infrared images of Venus’s ancient mountainous tessera terrain.',
    heritageSource: 'Malin Space Science Systems / NASA GSFC',
    assetImg: '/assets/inventory/davinci_probe.jpg',
    badge: 'DESCENT CAMERA',
    comboTip: 'Protected behind a thick sapphire window to survive extreme heat and pressure.',
    provenanceNote: 'Bottom-mounted camera aperture of DAVINCI (represented by the descent probe).'
  },

  // ==========================================
  // SECTION C: TECHNOLOGY & INFRASTRUCTURE (3 ENTRIES)
  // ==========================================
  {
    id: 'rsgs',
    name: 'Robotic Servicing of Geosynchronous Satellites (RSGS)',
    category: 'tech',
    kidNickname: 'Space Tow-Truck & Orbit Mechanic',
    whatItIs: 'Spacecraft Subsystem / Tech Demo — Robotic servicing toolkit (two dexterous arms + cameras) attached to a host satellite to repair other satellites in orbit.',
    parentMission: 'DARPA & SpaceLogistics (Northrop Grumman) / NASA',
    weight: '190 kg (Arms) + 28 kg (Vision) + 180 kg (Booster Pod) [Source: DARPA RSGS]',
    battery: '250 W (Arms) + 45 W (Vision) [Source: DARPA RSGS]',
    operatingPrinciple: 'Uses two gold-wrapped FREND robot arms with 3D laser vision and LED floodlights to gently grab tumbling satellites, untangle solar arrays, and install Mission Extension Pod rocket boosters.',
    missionRelevance: 'Pioneers in-orbit satellite servicing and orbital life extension, keeping vital communications satellites active and combating space junk.',
    heritageSource: 'DARPA Tactical Technology Office & NASA Goddard',
    assetImg: '/assets/inventory/rsgs.jpg',
    badge: 'ROBOTIC SERVICER',
    subsystems: [
      'FREND Dual Robotic Arms (190 kg, 250 W)',
      '3D Laser Vision & Spotlights (28 kg, 45 W)',
      'Mission Extension Pod Booster (180 kg, +10 yrs life)'
    ],
    provenanceNote: 'NASA/DARPA rendering showing RSGS robotic servicer performing grapple operations in GEO.'
  },
  {
    id: 'lcrns',
    name: 'Lunar Communications Relay & Navigation Systems (LCRNS)',
    category: 'tech',
    kidNickname: 'Lunar Communications & Navigation Infrastructure (Analogy: "Moon Wi-Fi & GPS")',
    whatItIs: 'Infrastructure / Network — Lunar communications and navigation infrastructure. A constellation of relay satellites and ground communication links providing continuous radio/laser data relay and precision navigation (PNT) around the Moon for Artemis missions.',
    parentMission: 'NASA LunaNet Architecture (SCaN)',
    weight: '42 kg (Antennas) + 8.5 kg (LunaNet PNT) + 24 kg (Laser Comms) [Source: NASA SCaN]',
    battery: '140 W (Antennas) + 18 W (PNT) + 65 W (Laser) [Source: NASA SCaN]',
    operatingPrinciple: 'Bounces Ka/S-band radio signals from dark lunar south-pole craters to NASA ground stations, beams atomic-clock GPS/PNT signals to landers, and transmits high-bandwidth scientific telemetry over optical laser links.',
    missionRelevance: 'Provides essential communications and precision navigation infrastructure for human and robotic exploration of the lunar south pole.',
    heritageSource: 'NASA Space Communications and Navigation (SCaN)',
    assetImg: '/assets/inventory/lcrns.jpg',
    badge: 'LUNAR INFRASTRUCTURE',
    subsystems: [
      'Ka/S-Band Lunar Antennas (42 kg, 140 W)',
      'LunaNet PNT Navigation Beacon (8.5 kg, 18 W)',
      'Space Laser Communicator (24 kg, 65 W, 10x faster)'
    ],
    provenanceNote: 'NASA SCaN architecture diagram showing lunar orbital relays and PNT data links.'
  },
  {
    id: 'neon',
    name: 'Near Earth Orbit Network (NEON)',
    category: 'tech',
    kidNickname: 'Earth’s Weather Watch Team',
    whatItIs: 'Umbrella Program — NOAA’s overarching program that manages and launches multiple distributed weather satellites (QuickSounder is the first satellite inside NEON).',
    parentMission: 'NOAA Office of Low Earth Orbit Observations',
    weight: 'Not provided in the source (Distributed multi-spacecraft architecture)',
    battery: 'Not provided in the source (Distributed architecture power)',
    operatingPrinciple: 'Replaces massive single flagships with a resilient fleet of agile satellites carrying microwave sounders (ATMS), infrared sounders (CrIS), imaging radiometers (VIIRS), and ozone trackers (OMPS).',
    missionRelevance: 'Ensures unbroken, lower-latency global weather forecasting and climate observation into the 2030s.',
    heritageSource: 'NOAA / NASA Joint Polar Satellite Program',
    assetImg: '/assets/inventory/neon.jpg',
    badge: 'NOAA UMBRELLA PROGRAM',
    subsystems: [
      'QuickSounder (1st Pathfinder Satellite)',
      'CrIS Infrared Temperature Sensor (165 kg, 120 W)',
      'VIIRS Day & Night Super Camera (252 kg, 200 W)',
      'OMPS Ozone Shield Tracker (56 kg, 45 W)'
    ],
    provenanceNote: 'NASA/NOAA concept rendering of the NEON distributed satellite constellation.'
  }
];

export function renderInventoryModal(activeId?: string, activeTab?: InventoryCategory): string {
  // Determine active item and tab
  let selected = INVENTORY_ITEMS.find((item) => item.id === activeId);
  const currentTab: InventoryCategory = activeTab || (selected ? selected.category : 'instruments');

  // Filter items for the active category
  const categoryItems = INVENTORY_ITEMS.filter((item) => item.category === currentTab);
  if (!selected || selected.category !== currentTab) {
    selected = categoryItems[0] || INVENTORY_ITEMS[0];
  }

  const instrumentsCount = INVENTORY_ITEMS.filter((i) => i.category === 'instruments').length;
  const missionsCount = INVENTORY_ITEMS.filter((i) => i.category === 'missions').length;
  const techCount = INVENTORY_ITEMS.filter((i) => i.category === 'tech').length;

  const cardsHtml = categoryItems
    .map((item) => {
      const isSelected = item.id === selected!.id;
      return `
      <div class="inventory-card ${isSelected ? 'is-active' : ''}" data-inventory-id="${item.id}" tabindex="0" role="button" aria-pressed="${isSelected}">
        <img src="${item.assetImg}" alt="${escapeHtml(item.name)}" class="inventory-card-thumb" loading="lazy" />
        <div class="inventory-card-info">
          <span class="inventory-badge-chip">${escapeHtml(item.badge)}</span>
          <h4 class="inventory-name">${escapeHtml(item.name)}</h4>
          <span class="inventory-nickname">"${escapeHtml(item.kidNickname)}"</span>
          <div class="inventory-mini-specs">
            <span>⚖️ ${escapeHtml(item.weight)}</span>
            <span>⚡ ${escapeHtml(item.battery)}</span>
          </div>
        </div>
      </div>
    `;
    })
    .join('');

  const carriedOrSubsystemsHtml = selected.carriedInstruments
    ? `
      <div class="spec-item spec-span-2">
        <span class="spec-label">CARRIED SCIENTIFIC INSTRUMENTS</span>
        <div class="spec-tags-wrap">
          ${selected.carriedInstruments.map((ci) => `<span class="spec-tag">${escapeHtml(ci)}</span>`).join('')}
        </div>
      </div>
    `
    : selected.subsystems
    ? `
      <div class="spec-item spec-span-2">
        <span class="spec-label">CORE SUBSYSTEMS & HARDWARE</span>
        <div class="spec-tags-wrap">
          ${selected.subsystems.map((sub) => `<span class="spec-tag">${escapeHtml(sub)}</span>`).join('')}
        </div>
      </div>
    `
    : '';

  const comboTipHtml = selected.comboTip
    ? `
      <div class="inventory-tip-box">
        <span class="material-symbols-outlined text-secondary text-[20px]">lightbulb</span>
        <div>
          <strong class="text-secondary text-xs uppercase tracking-wide">Engineer Tip:</strong>
          <p class="text-body-sm text-on-surface m-0">${escapeHtml(selected.comboTip)}</p>
        </div>
      </div>
    `
    : '';

  return `
    <div class="inventory-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="inventory-title">
      <div class="inventory-modal-container">
        
        <!-- Header -->
        <header class="inventory-modal-header">
          <div class="flex items-center gap-space-sm">
            <span class="material-symbols-outlined text-primary text-[28px]">biotech</span>
            <div>
              <span class="eyebrow"><span class="eyebrow-line"></span> NASA & NOAA SCIENTIFIC ARCHIVE</span>
              <h2 id="inventory-title" class="font-headline text-headline text-on-surface">Space Missions & Scientific Instruments</h2>
            </div>
          </div>
          <button class="inventory-close-btn" data-action="close-inventory" aria-label="Close Inventory">
            <span class="material-symbols-outlined">close</span>
          </button>
        </header>

        <!-- Category Tabs -->
        <nav class="inventory-tab-bar" aria-label="Inventory Sections">
          <button class="inventory-tab-btn ${currentTab === 'instruments' ? 'is-active' : ''}" data-inventory-tab="instruments">
            <span class="material-symbols-outlined text-[18px]">precision_manufacturing</span>
            <span>Scientific Instruments (${instrumentsCount})</span>
          </button>
          <button class="inventory-tab-btn ${currentTab === 'missions' ? 'is-active' : ''}" data-inventory-tab="missions">
            <span class="material-symbols-outlined text-[18px]">rocket_launch</span>
            <span>Missions & Spacecraft (${missionsCount})</span>
          </button>
          <button class="inventory-tab-btn ${currentTab === 'tech' ? 'is-active' : ''}" data-inventory-tab="tech">
            <span class="material-symbols-outlined text-[18px]">hub</span>
            <span>Tech & Infrastructure (${techCount})</span>
          </button>
        </nav>

        <!-- Body Grid -->
        <div class="inventory-body-grid">
          
          <!-- Left: Scrollable List -->
          <div class="inventory-list-pane">
            <div class="inventory-list-scroll">
              ${cardsHtml}
            </div>
          </div>

          <!-- Right: Detail Sheet -->
          <div class="inventory-detail-pane">
            
            <div class="inventory-hero-img-wrap">
              <img src="${selected.assetImg}" alt="${escapeHtml(selected.name)}" class="inventory-hero-img" />
              <div class="inventory-hero-badge">
                <span class="material-symbols-outlined text-[16px]">verified</span>
                <span>${escapeHtml(selected.badge)}</span>
              </div>
            </div>

            <div class="inventory-detail-content">
              
              <div class="mb-space-sm">
                <span class="text-tertiary font-label-sm uppercase tracking-widest">${escapeHtml(selected.parentMission)}</span>
                <h3 class="text-xl font-bold text-on-surface mt-1">${escapeHtml(selected.name)}</h3>
                <span class="inline-block text-secondary font-medium text-sm italic mt-0.5">"${escapeHtml(selected.kidNickname)}"</span>
              </div>

              <div class="inventory-what-it-is-box">
                <strong class="text-primary text-xs uppercase tracking-wider block mb-1">Classification & Nature</strong>
                <p class="text-body-sm text-on-surface leading-relaxed m-0">${escapeHtml(selected.whatItIs)}</p>
              </div>

              ${comboTipHtml}

              <div class="inventory-spec-grid">
                <div class="spec-item">
                  <span class="spec-label">WEIGHT / MASS</span>
                  <span class="spec-value text-primary font-medium">${escapeHtml(selected.weight)}</span>
                </div>
                <div class="spec-item">
                  <span class="spec-label">BATTERY / POWER NEEDED</span>
                  <span class="spec-value text-tertiary font-medium">${escapeHtml(selected.battery)}</span>
                </div>
                <div class="spec-item spec-span-2">
                  <span class="spec-label">HOW IT WORKS</span>
                  <span class="spec-value text-on-surface">${escapeHtml(selected.operatingPrinciple)}</span>
                </div>
                <div class="spec-item spec-span-2">
                  <span class="spec-label">WHY IT MATTERS (MISSION GOAL)</span>
                  <span class="spec-value text-secondary">${escapeHtml(selected.missionRelevance)}</span>
                </div>
                <div class="spec-item spec-span-2">
                  <span class="spec-label">HERITAGE & PROGRAM SOURCE</span>
                  <span class="spec-value text-on-surface-variant">${escapeHtml(selected.heritageSource)}</span>
                </div>
                ${carriedOrSubsystemsHtml}
              </div>

              ${
                selected.provenanceNote
                  ? `<div class="inventory-provenance-box ${selected.provenanceNote.includes('Representative') ? 'is-representative' : ''}">
                      <span class="material-symbols-outlined text-[15px]">${selected.provenanceNote.includes('Representative') ? 'info' : 'photo_camera'}</span>
                      <span><strong>Image Attribution:</strong> ${escapeHtml(selected.provenanceNote)}</span>
                    </div>`
                  : ''
              }

            </div>
          </div>
        </div>

        <!-- Footer -->
        <footer class="inventory-modal-footer">
          <div class="flex items-center gap-space-sm text-body-sm text-on-surface-variant">
            <span class="material-symbols-outlined text-primary text-[18px]">school</span>
            <span><strong>Educational Reference Only:</strong> Authentic NASA & NOAA missions and instruments. Not selectable CubeSat kit components.</span>
          </div>
          <button class="button button-primary" data-action="close-inventory" style="min-height: 44px; padding: 0 24px;">
            Return to Mission
          </button>
        </footer>

      </div>
    </div>
  `;
}
