import * as THREE from 'three';

export type SceneConfig = {
  objective?: string;
  platform?: string;
  instrument?: string;
  power?: string;
  communications?: string;
  adcs?: string;
  orbit?: string;
  suitColor?: string;
};

export type SimVisualState = {
  mode: 'orbit' | 'launch' | 'deploy' | 'observe' | 'downlink';
  progress: number; // 0 to 1
  stageText?: string;
};

/**
 * Maps authentic shared engine mission design selections to 3D scene visual config.
 */
export function mapDesignToSceneConfig(
  design: {
    cubesat_class_id?: string;
    orbit_id?: string;
    part_ids?: string[];
    objective_id?: string;
  },
  suitColor?: string
): SceneConfig {
  const parts = design.part_ids || [];

  // 1. Platform / CubeSat Class
  let platform = design.cubesat_class_id || '3U';
  if (!design.cubesat_class_id) {
    if (parts.includes('struct_1u')) platform = '1U';
    else if (parts.includes('struct_3u')) platform = '3U';
  }

  // 2. Power Subsystem
  let power: string | undefined;
  if (parts.includes('solar_gainp_high_eff')) {
    power = 'solar_gainp_high_eff';
  } else if (parts.includes('solar_deployable_3u')) {
    power = 'solar_deployable_3u';
  } else if (parts.includes('solar_body_1u')) {
    power = 'solar_body_1u';
  }

  // 3. Scientific Instrument
  let instrument: string | undefined;
  if (parts.includes('inst_multispectral_imager')) {
    instrument = 'inst_multispectral_imager';
  } else if (parts.includes('inst_plasma_probe')) {
    instrument = 'inst_plasma_probe';
  } else if (parts.includes('inst_xray_photometer')) {
    instrument = 'inst_xray_photometer';
  } else if (parts.includes('inst_polarimeter')) {
    instrument = 'inst_polarimeter';
  } else {
    const inst = parts.find((p) => p.startsWith('inst_'));
    if (inst) instrument = inst;
  }

  // 4. Communications Subsystem
  let communications: string | undefined;
  if (parts.includes('comms_sband_patch')) {
    communications = 'comms_sband_patch';
  } else if (parts.includes('comms_uhf_vhf')) {
    communications = 'comms_uhf_vhf';
  }

  // 5. ADCS Subsystem
  let adcs: string | undefined;
  if (parts.includes('adcs_3axis_wheels')) {
    adcs = 'adcs_3axis_wheels';
  } else if (parts.includes('adcs_passive_magnetorquer')) {
    adcs = 'adcs_passive_magnetorquer';
  }

  // 6. Orbit
  const orbit = design.orbit_id || 'sso';

  return {
    objective: design.objective_id,
    platform,
    power,
    instrument,
    communications,
    adcs,
    orbit,
    suitColor: suitColor || '#77e1e6'
  };
}

export function createMissionScene() {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x07101e, 0.035);
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0.2, 0.2, 7.5);

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.className = 'mission-canvas';
  renderer.domElement.setAttribute('aria-label', 'Interactive three dimensional Earth observation mission scene');
  renderer.domElement.style.touchAction = 'none';

  // Lighting
  const ambientLight = new THREE.AmbientLight(0x93b9d9, 1.8);
  scene.add(ambientLight);
  const sunLight = new THREE.DirectionalLight(0xf5fbff, 3.4);
  sunLight.position.set(-3, 4, 6);
  scene.add(sunLight);

  // Earth Group
  const earthGroup = new THREE.Group();
  earthGroup.position.set(0.55, -0.16, 0);
  scene.add(earthGroup);

  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(1.55, 64, 48),
    new THREE.MeshStandardMaterial({ color: 0x2774b8, roughness: 0.78, metalness: 0.04, emissive: 0x071629 })
  );
  earthGroup.add(earth);

  // Stylized Continental Landmasses
  const landMaterial = new THREE.MeshStandardMaterial({ color: 0x58b99f, roughness: 1, metalness: 0, emissive: 0x0b201e });
  const landShapes = [
    [-0.8, 0.35, 0.38, 0.18], [-0.45, 0.47, 0.26, 0.14], [-0.18, 0.22, 0.24, 0.12],
    [0.1, 0.38, 0.23, 0.14], [0.37, 0.19, 0.33, 0.16], [0.7, -0.05, 0.35, 0.17],
    [-0.55, -0.24, 0.25, 0.1], [-0.05, -0.39, 0.35, 0.12], [0.45, -0.36, 0.25, 0.1]
  ];
  for (const [x, y, sx, sy] of landShapes) {
    const shape = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), landMaterial);
    shape.scale.set(sx, sy, 0.025);
    shape.position.set(x, y, 1.43 + Math.cos(x * 6) * 0.035);
    earthGroup.add(shape);
  }

  // Target Location Indicator (Chesapeake Bay demonstration site: 38.9° N, -76.5° W)
  const targetBeaconGroup = new THREE.Group();
  const targetPin = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.003, 0.1, 8),
    new THREE.MeshBasicMaterial({ color: 0x00f0ff })
  );
  targetPin.position.set(-0.25, 0.85, 1.3);
  targetPin.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), targetPin.position.clone().normalize());
  targetBeaconGroup.add(targetPin);

  const targetRing = new THREE.Mesh(
    new THREE.RingGeometry(0.03, 0.05, 24),
    new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.7, side: THREE.DoubleSide })
  );
  targetRing.position.copy(targetPin.position);
  targetRing.quaternion.copy(targetPin.quaternion);
  targetBeaconGroup.add(targetRing);
  earthGroup.add(targetBeaconGroup);

  // Atmospheric Glow
  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(1.64, 48, 32),
    new THREE.MeshBasicMaterial({ color: 0x45c8f4, transparent: true, opacity: 0.14, side: THREE.BackSide })
  );
  earthGroup.add(atmosphere);

  // Orbit Trajectory Path
  const orbitMaterial = new THREE.MeshBasicMaterial({ color: 0x70d9ed, transparent: true, opacity: 0.65, side: THREE.DoubleSide });
  const orbit = new THREE.Mesh(new THREE.TorusGeometry(2.12, 0.008, 8, 180), orbitMaterial);
  orbit.rotation.set(0.95, 0.38, -0.3);
  scene.add(orbit);

  // Starfield
  const starPositions = new Float32Array(900);
  for (let i = 0; i < starPositions.length; i += 3) {
    starPositions[i] = (Math.random() - 0.5) * 22;
    starPositions[i + 1] = (Math.random() - 0.5) * 14;
    starPositions[i + 2] = -2 - Math.random() * 10;
  }
  const starsGeometry = new THREE.BufferGeometry();
  starsGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
  scene.add(new THREE.Points(starsGeometry, new THREE.PointsMaterial({ color: 0xa4dff4, size: 0.018, transparent: true, opacity: 0.72 })));

  // Spacecraft Assembly Group
  const spacecraft = new THREE.Group();
  scene.add(spacecraft);

  // Reusable Materials
  const busMaterial = new THREE.MeshStandardMaterial({ color: 0xdce8f2, metalness: 0.64, roughness: 0.28 });
  const goldFoilMaterial = new THREE.MeshStandardMaterial({ color: 0xf1b46c, metalness: 0.75, roughness: 0.22 });
  const darkMetalMaterial = new THREE.MeshStandardMaterial({ color: 0x232930, metalness: 0.8, roughness: 0.35 });
  const copperMaterial = new THREE.MeshStandardMaterial({ color: 0xc87d55, metalness: 0.85, roughness: 0.2 });
  const panelMaterial = new THREE.MeshStandardMaterial({ color: 0x245a8e, metalness: 0.5, roughness: 0.3, emissive: 0x07182a });
  const accentMaterial = new THREE.MeshStandardMaterial({ color: 0x77e1e6, metalness: 0.4, roughness: 0.3, emissive: 0x113344 });
  const laserMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.85 });
  const coneSensorMaterial = new THREE.MeshBasicMaterial({ color: 0x38e1ff, transparent: true, opacity: 0.15, side: THREE.DoubleSide });

  // Main Bus Mesh
  const busMesh = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.32, 0.22), busMaterial);
  spacecraft.add(busMesh);

  // Accent Stripe
  const accentStripe = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.04, 0.23), accentMaterial);
  spacecraft.add(accentStripe);

  // Beacon LED
  const beaconLight = new THREE.Mesh(new THREE.SphereGeometry(0.025, 12, 12), new THREE.MeshBasicMaterial({ color: 0x77e1e6 }));
  beaconLight.position.set(0, 0.17, 0.11);
  spacecraft.add(beaconLight);

  // Body-Mounted Solar Cells Group (for 1U body cells)
  const bodyPanelsGroup = new THREE.Group();
  const bodyPanelFront = new THREE.Mesh(new THREE.BoxGeometry(0.252, 0.26, 0.005), panelMaterial);
  bodyPanelFront.position.set(0, 0, 0.112);
  const bodyPanelBack = bodyPanelFront.clone();
  bodyPanelBack.position.set(0, 0, -0.112);
  bodyPanelsGroup.add(bodyPanelFront, bodyPanelBack);
  bodyPanelsGroup.visible = false;
  spacecraft.add(bodyPanelsGroup);

  // Deployable Solar Arrays
  const panelLeft = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.18, 0.025), panelMaterial);
  const panelRight = panelLeft.clone();
  panelLeft.position.x = -0.42;
  panelRight.position.x = 0.42;
  spacecraft.add(panelLeft, panelRight);

  // Instrument Group
  const instrumentGroup = new THREE.Group();
  spacecraft.add(instrumentGroup);

  // Communications Antenna Group
  const commsGroup = new THREE.Group();
  spacecraft.add(commsGroup);

  // ADCS Thruster / Wheels Group
  const adcsGroup = new THREE.Group();
  spacecraft.add(adcsGroup);

  // Observation Scan Cone (Visible in Observation phase)
  const observationCone = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.8, 24, 1, true), coneSensorMaterial);
  observationCone.rotation.x = Math.PI;
  observationCone.position.set(0, -0.9, 0);
  observationCone.visible = false;
  spacecraft.add(observationCone);

  // Downlink Data Beam (Visible in Downlink phase)
  const downlinkBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 2.2, 8), laserMaterial);
  downlinkBeam.position.set(0, -1.1, 0);
  downlinkBeam.visible = false;
  spacecraft.add(downlinkBeam);

  // Launch Rocket Mesh (Visible only in launch sim)
  const rocketGroup = new THREE.Group();
  const rocketBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.065, 0.065, 0.72, 16),
    new THREE.MeshStandardMaterial({ color: 0xf5f7fa, metalness: 0.4, roughness: 0.3 })
  );
  const rocketNose = new THREE.Mesh(
    new THREE.ConeGeometry(0.065, 0.22, 16),
    new THREE.MeshStandardMaterial({ color: 0xd9e2ec, metalness: 0.5, roughness: 0.25 })
  );
  rocketNose.position.y = 0.47;
  const rocketFins = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const fin = new THREE.Mesh(
      new THREE.BoxGeometry(0.01, 0.14, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x77e1e6, metalness: 0.5, roughness: 0.3 })
    );
    fin.position.y = -0.3;
    fin.rotation.y = (Math.PI / 2) * i;
    fin.position.x = Math.sin((Math.PI / 2) * i) * 0.07;
    fin.position.z = Math.cos((Math.PI / 2) * i) * 0.07;
    rocketFins.add(fin);
  }
  const rocketExhaust = new THREE.Mesh(
    new THREE.ConeGeometry(0.055, 0.42, 14),
    new THREE.MeshBasicMaterial({ color: 0xffaa33, transparent: true, opacity: 0.9 })
  );
  rocketExhaust.position.y = -0.57;
  rocketExhaust.rotation.x = Math.PI;
  rocketGroup.add(rocketBody, rocketNose, rocketFins, rocketExhaust);
  rocketGroup.visible = false;
  scene.add(rocketGroup);

  let currentHost: HTMLElement | null = null;
  let resizeObserver: ResizeObserver | null = null;
  const clock = new THREE.Clock();

  let config: SceneConfig = {
    objective: 'earth_observation',
    platform: '3U',
    instrument: 'inst_multispectral_imager',
    power: 'solar_deployable_3u',
    communications: 'comms_sband_patch',
    adcs: 'adcs_3axis_wheels',
    orbit: 'sso',
    suitColor: '#77e1e6'
  };

  let simState: SimVisualState = {
    mode: 'orbit',
    progress: 0
  };

  // Camera Orbit Control State
  let isDragging = false;
  let prevMouseX = 0;
  let prevMouseY = 0;
  let cameraTheta = 0;
  let cameraPhi = Math.PI * 0.46;
  let cameraDistance = 7.5;
  let autoRotate = true;
  let cameraSensitivity = 1.0;

  function updateSpacecraftComponents() {
    // 1. Bus Platform Sizing
    const p = config.platform;
    if (p === '1U' || p === 'struct_1u') {
      busMesh.scale.set(0.65, 0.65, 0.65);
      busMesh.material = busMaterial;
      accentStripe.scale.set(0.66, 0.04, 0.66);
      accentStripe.position.set(0, 0, 0);
      beaconLight.position.set(0, 0.12, 0.08);
      bodyPanelFront.scale.set(0.65, 0.65, 1);
      bodyPanelFront.position.set(0, 0, 0.085);
      bodyPanelBack.scale.set(0.65, 0.65, 1);
      bodyPanelBack.position.set(0, 0, -0.085);
    } else if (p === '1.5U') {
      busMesh.scale.set(0.7, 0.88, 0.7);
      busMesh.material = busMaterial;
      accentStripe.scale.set(0.71, 0.04, 0.71);
      accentStripe.position.set(0, 0, 0);
      beaconLight.position.set(0, 0.15, 0.09);
    } else if (p === '2U') {
      busMesh.scale.set(0.72, 1.05, 0.72);
      busMesh.material = busMaterial;
      accentStripe.scale.set(0.73, 0.04, 0.73);
      accentStripe.position.set(0, 0, 0);
      beaconLight.position.set(0, 0.17, 0.09);
    } else if (p === '6U' || p === 'cubesat6u') {
      busMesh.scale.set(1.25, 1.25, 0.85);
      busMesh.material = busMaterial;
      accentStripe.scale.set(1.26, 0.04, 0.86);
      accentStripe.position.set(0, 0, 0);
      beaconLight.position.set(0, 0.22, 0.11);
    } else if (p === 'smallsatBus') {
      busMesh.scale.set(1.4, 1.3, 1.2);
      busMesh.material = darkMetalMaterial;
      accentStripe.scale.set(1.41, 0.04, 1.21);
      accentStripe.position.set(0, 0, 0);
      beaconLight.position.set(0, 0.24, 0.14);
    } else {
      // 3U, 3U+, struct_3u, cubesat3u (default standard)
      busMesh.scale.set(0.75, 1.25, 0.75);
      busMesh.material = busMaterial;
      accentStripe.scale.set(0.76, 0.04, 0.76);
      accentStripe.position.set(0, 0, 0);
      beaconLight.position.set(0, 0.2, 0.1);
    }

    // 2. Suit Accent Color
    if (config.suitColor) {
      const color = new THREE.Color(config.suitColor);
      accentMaterial.color.copy(color);
      accentMaterial.emissive.copy(color).multiplyScalar(0.4);
      (beaconLight.material as THREE.MeshBasicMaterial).color.copy(color);
    }

    // 3. Power Subsystem
    const pw = config.power;
    const busWidth = 0.25 * busMesh.scale.x;
    if (pw === 'solar_body_1u' || pw === 'bodyPanels') {
      panelLeft.visible = false;
      panelRight.visible = false;
      bodyPanelsGroup.visible = true;
    } else if (pw === 'solar_gainp_high_eff' || pw === 'extendedArray') {
      bodyPanelsGroup.visible = false;
      panelLeft.visible = true;
      panelRight.visible = true;
      panelLeft.scale.set(1.7, 1.25, 1);
      panelRight.scale.set(1.7, 1.25, 1);
      const wingOffset = busWidth + 0.38;
      panelLeft.position.set(-wingOffset, 0, 0);
      panelRight.position.set(wingOffset, 0, 0);
    } else if (pw === 'solar_deployable_3u' || pw === 'standardArray') {
      bodyPanelsGroup.visible = false;
      panelLeft.visible = true;
      panelRight.visible = true;
      panelLeft.scale.set(1.0, 1.0, 1);
      panelRight.scale.set(1.0, 1.0, 1);
      const wingOffset = busWidth + 0.23;
      panelLeft.position.set(-wingOffset, 0, 0);
      panelRight.position.set(wingOffset, 0, 0);
    } else {
      // Default: no solar panels equipped
      panelLeft.visible = false;
      panelRight.visible = false;
      bodyPanelsGroup.visible = false;
    }

    // 4. Instrument Model
    instrumentGroup.clear();
    const inst = config.instrument;
    const busBottom = -0.16 * busMesh.scale.y;

    if (inst === 'inst_multispectral_imager') {
      // 4-band Earth Observation optical camera telescope
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.22, 24), darkMetalMaterial);
      barrel.position.set(0, busBottom - 0.1, 0.02);
      barrel.rotation.x = Math.PI;

      const goldCollar = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.08, 20), goldFoilMaterial);
      goldCollar.position.set(0, busBottom - 0.05, 0.02);

      const lensAperture = new THREE.Mesh(new THREE.CircleGeometry(0.068, 24), new THREE.MeshBasicMaterial({ color: 0x00f0ff }));
      lensAperture.position.set(0, busBottom - 0.211, 0.02);
      lensAperture.rotation.x = Math.PI * 0.5;

      instrumentGroup.add(barrel, goldCollar, lensAperture);
    } else if (inst === 'inst_plasma_probe') {
      // Ionospheric Plasma Langmuir electrostatic probe
      const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.42, 8), darkMetalMaterial);
      boom.position.set(0.04, busBottom - 0.15, 0.08);
      boom.rotation.x = Math.PI * 0.22;
      boom.rotation.z = -Math.PI * 0.12;

      const sphereTip = new THREE.Mesh(new THREE.SphereGeometry(0.024, 12, 12), goldFoilMaterial);
      sphereTip.position.set(0.08, busBottom - 0.32, 0.18);

      const sphereMid = new THREE.Mesh(new THREE.SphereGeometry(0.018, 12, 12), goldFoilMaterial);
      sphereMid.position.set(0.05, busBottom - 0.18, 0.1);

      instrumentGroup.add(boom, sphereTip, sphereMid);
    } else if (inst === 'inst_xray_photometer') {
      // Solar Flare X-Ray Photometer (sun-pointing cavity)
      const cavity = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.055, 0.16, 16), goldFoilMaterial);
      cavity.position.set(0, -busBottom + 0.06, 0.04);
      cavity.rotation.x = -Math.PI * 0.25;

      const detector = new THREE.Mesh(new THREE.CircleGeometry(0.045, 16), new THREE.MeshBasicMaterial({ color: 0xffd152 }));
      detector.position.set(0, -busBottom + 0.13, 0.11);
      detector.rotation.x = -Math.PI * 0.25;

      instrumentGroup.add(cavity, detector);
    } else if (inst === 'inst_polarimeter' || inst === 'polarimeter') {
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.22, 20), goldFoilMaterial);
      barrel.position.set(0, busBottom - 0.1, 0.04);
      barrel.rotation.x = Math.PI;
      const lens = new THREE.Mesh(new THREE.CircleGeometry(0.065, 16), new THREE.MeshBasicMaterial({ color: 0x112244 }));
      lens.position.set(0, busBottom - 0.211, 0.04);
      lens.rotation.x = Math.PI * 0.5;
      instrumentGroup.add(barrel, lens);
    } else if (inst === 'solarRadiometer') {
      const cavity = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.16, 16), goldFoilMaterial);
      cavity.position.set(0, 0.22, 0);
      cavity.rotation.z = Math.PI * 0.25;
      instrumentGroup.add(cavity);
    } else if (inst === 'hyperspectral') {
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.15), darkMetalMaterial);
      box.position.set(0, busBottom - 0.08, 0.03);
      const aperture = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.02, 0.05), new THREE.MeshBasicMaterial({ color: 0x00f0ff }));
      aperture.position.set(0, busBottom - 0.161, 0.03);
      instrumentGroup.add(box, aperture);
    } else if (inst) {
      const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.12, 16), darkMetalMaterial);
      lens.position.set(0, busBottom - 0.06, 0.05);
      lens.rotation.x = Math.PI;
      instrumentGroup.add(lens);
    }

    // 5. Communications Antenna Model
    commsGroup.clear();
    const comms = config.communications;
    const busTop = 0.16 * busMesh.scale.y;

    if (comms === 'comms_uhf_vhf' || comms === 'lowGain') {
      // Dual omnidirectional dipole whip antennas
      const whip1 = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.34, 6), darkMetalMaterial);
      whip1.position.set(0.08, busTop + 0.14, 0.05);
      whip1.rotation.z = -0.28;
      whip1.rotation.x = 0.15;

      const whip2 = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.34, 6), darkMetalMaterial);
      whip2.position.set(-0.08, busTop + 0.14, -0.05);
      whip2.rotation.z = 0.28;
      whip2.rotation.x = -0.15;

      commsGroup.add(whip1, whip2);
    } else if (comms === 'comms_sband_patch' || comms === 'sband') {
      // Directional S-band ceramic/gold square microstrip patch antenna
      const patch = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.13, 0.025), goldFoilMaterial);
      patch.position.set(0, busTop + 0.015, 0);
      patch.rotation.x = Math.PI * 0.5;

      const centerPin = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.035, 8), darkMetalMaterial);
      centerPin.position.set(0, busTop + 0.03, 0);

      commsGroup.add(patch, centerPin);
    } else if (comms === 'highGain') {
      const dish = new THREE.Mesh(new THREE.SphereGeometry(0.14, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), busMaterial);
      dish.position.set(0, busTop + 0.08, -0.06);
      dish.rotation.x = -Math.PI * 0.65;
      const feed = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.12, 8), darkMetalMaterial);
      feed.position.set(0, busTop + 0.14, -0.09);
      commsGroup.add(dish, feed);
    }

    // 6. ADCS Model
    adcsGroup.clear();
    const adcs = config.adcs;

    if (adcs === 'adcs_passive_magnetorquer' || adcs === 'passiveMagnetic') {
      // Copper magnetic torquer coils along chassis edges + sun sensor
      const coil1 = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.22, 10), copperMaterial);
      coil1.position.set(0.11 * busMesh.scale.x / 0.75, 0, 0.1 * busMesh.scale.z / 0.75);

      const coil2 = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.22, 10), copperMaterial);
      coil2.position.set(-0.11 * busMesh.scale.x / 0.75, 0, -0.1 * busMesh.scale.z / 0.75);

      const sunSensor = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.02, 0.04), goldFoilMaterial);
      sunSensor.position.set(0.06, busTop + 0.01, 0.06);

      adcsGroup.add(coil1, coil2, sunSensor);
    } else if (adcs === 'adcs_3axis_wheels' || adcs === 'reactionWheels') {
      // 3 orthogonal reaction wheel gyro housings + star tracker lens
      const wheelX = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.04, 16), darkMetalMaterial);
      wheelX.position.set(0.09 * busMesh.scale.x / 0.75, 0.04, 0);
      wheelX.rotation.z = Math.PI * 0.5;

      const wheelY = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.04, 16), darkMetalMaterial);
      wheelY.position.set(0, 0.04, 0.09 * busMesh.scale.z / 0.75);

      const wheelZ = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.04, 16), darkMetalMaterial);
      wheelZ.position.set(0, -0.05, -0.09 * busMesh.scale.z / 0.75);
      wheelZ.rotation.x = Math.PI * 0.5;

      const starTracker = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.06, 12), darkMetalMaterial);
      starTracker.position.set(-0.09 * busMesh.scale.x / 0.75, busTop + 0.02, 0);

      adcsGroup.add(wheelX, wheelY, wheelZ, starTracker);
    } else if (adcs === 'microThruster') {
      for (const [x, y, z] of [[-0.12, -0.15, -0.1], [0.12, -0.15, -0.1], [-0.12, -0.15, 0.1], [0.12, -0.15, 0.1]]) {
        const nozzle = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.05, 8), goldFoilMaterial);
        nozzle.position.set(x, y, z);
        nozzle.rotation.x = Math.PI;
        adcsGroup.add(nozzle);
      }
    }

    // 7. Orbit Orientation
    const orb = config.orbit;
    if (orb === 'polar') {
      orbit.rotation.set(0.95, 0.38, -0.3);
      orbit.scale.set(1.0, 1.0, 1.0);
    } else if (orb === 'sso') {
      orbit.rotation.set(1.2, 0.6, -0.1);
      orbit.scale.set(1.0, 1.0, 1.0);
    } else if (orb === 'leo') {
      orbit.rotation.set(0.35, 0.15, 0);
      orbit.scale.set(0.94, 0.94, 0.94);
    } else if (orb === 'geo') {
      orbit.rotation.set(0.05, 0.05, 0);
      orbit.scale.set(1.35, 1.35, 1.35);
    } else if (orb === 'high_energy') {
      orbit.rotation.set(0.65, 0.25, 0.4);
      orbit.scale.set(1.5, 1.15, 1.5);
    } else {
      orbit.rotation.set(0.95, 0.38, -0.3);
      orbit.scale.set(1.0, 1.0, 1.0);
    }
  }

  function resize() {
    if (!currentHost) return;
    const { width, height } = currentHost.getBoundingClientRect();
    if (width < 1 || height < 1) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }

  // Pointer Drag & Zoom Interaction
  function onPointerDown(e: PointerEvent) {
    isDragging = true;
    prevMouseX = e.clientX;
    prevMouseY = e.clientY;
  }
  function onPointerMove(e: PointerEvent) {
    if (!isDragging) return;
    const deltaX = (e.clientX - prevMouseX) * 0.007 * cameraSensitivity;
    const deltaY = (e.clientY - prevMouseY) * 0.007 * cameraSensitivity;
    cameraTheta -= deltaX;
    cameraPhi = Math.max(0.1, Math.min(Math.PI - 0.1, cameraPhi - deltaY));
    prevMouseX = e.clientX;
    prevMouseY = e.clientY;
  }
  function onPointerUp() {
    isDragging = false;
  }
  function onWheel(e: WheelEvent) {
    e.preventDefault();
    cameraDistance = Math.max(3.8, Math.min(12.0, cameraDistance + e.deltaY * 0.005));
  }

  renderer.domElement.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

  // Animation Loop
  function animate() {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();

    // Check reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Earth Rotation
    earth.rotation.y = time * 0.055;
    targetRing.scale.setScalar(prefersReducedMotion ? 1.0 : 1 + Math.sin(time * 4) * 0.2);

    if (simState.mode === 'launch') {
      // Launch Sequence: Rocket ascends from Earth surface
      rocketGroup.visible = true;
      spacecraft.visible = false;
      observationCone.visible = false;
      downlinkBeam.visible = false;

      const launchT = Math.min(1, Math.max(0, simState.progress));
      const startPos = new THREE.Vector3(-0.25, 0.85, 1.3);
      const targetPos = new THREE.Vector3(-1.25, 1.04, 0.24);

      // Smooth ascent curve
      rocketGroup.position.lerpVectors(startPos, targetPos, launchT);

      // Rocket flight direction alignment
      const flightDir = new THREE.Vector3().subVectors(targetPos, startPos).normalize();
      rocketGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), flightDir);

      if (!prefersReducedMotion) {
        rocketExhaust.scale.set(1, 1 + Math.sin(time * 30) * 0.35, 1);
      }

      rocketGroup.scale.setScalar(Math.max(0.3, 1.0 - launchT * 0.35));

      // Chase camera smoothly following the launch vehicle
      if (!prefersReducedMotion) {
        camera.position.set(
          rocketGroup.position.x + 0.65,
          rocketGroup.position.y + 0.32,
          rocketGroup.position.z + 1.75
        );
        camera.lookAt(rocketGroup.position);
      } else {
        camera.position.set(0, 0, 7.0);
        camera.lookAt(0, 0, 0);
      }
    } else {
      rocketGroup.visible = false;
      spacecraft.visible = true;

      // Normal Orbit Camera
      if (autoRotate && !isDragging && simState.mode === 'orbit' && !prefersReducedMotion) {
        cameraTheta += 0.0012;
      }

      const cx = cameraDistance * Math.sin(cameraPhi) * Math.sin(cameraTheta);
      const cy = cameraDistance * Math.cos(cameraPhi);
      const cz = cameraDistance * Math.sin(cameraPhi) * Math.cos(cameraTheta);
      camera.position.set(cx, cy, cz);
      camera.lookAt(0, 0, 0);

      // Spacecraft motion on orbit
      const orbitSpeed = config.orbit === 'polar' || config.orbit === 'sso' ? 0.22 : 0.16;
      const orbitAngle = prefersReducedMotion ? 0 : time * orbitSpeed;
      spacecraft.position.set(
        -1.25 + Math.cos(orbitAngle) * 0.12,
        1.04 + Math.sin(orbitAngle) * 0.08,
        0.24 + Math.sin(orbitAngle * 0.5) * 0.05
      );
      if (!prefersReducedMotion) {
        spacecraft.rotation.y = -time * 0.12;
      }

      const isHighEff = config.power === 'solar_gainp_high_eff' || config.power === 'extendedArray';
      const isDeployable = isHighEff || config.power === 'solar_deployable_3u' || config.power === 'standardArray';
      const targetWingScale = isHighEff ? 1.7 : 1.0;

      // Subsystem visual states according to simulation mode
      if (simState.mode === 'deploy') {
        const deployT = Math.min(1, Math.max(0, simState.progress));
        if (isDeployable) {
          panelLeft.visible = true;
          panelRight.visible = true;
          panelLeft.scale.x = targetWingScale * Math.max(0.02, deployT);
          panelRight.scale.x = targetWingScale * Math.max(0.02, deployT);
        } else {
          panelLeft.visible = false;
          panelRight.visible = false;
        }
        observationCone.visible = false;
        downlinkBeam.visible = false;
      } else if (simState.mode === 'observe') {
        if (isDeployable) {
          panelLeft.visible = true;
          panelRight.visible = true;
          panelLeft.scale.x = targetWingScale;
          panelRight.scale.x = targetWingScale;
        }
        observationCone.visible = true;
        downlinkBeam.visible = false;
        coneSensorMaterial.opacity = prefersReducedMotion ? 0.2 : 0.15 + Math.sin(time * 8) * 0.08;
      } else if (simState.mode === 'downlink') {
        if (isDeployable) {
          panelLeft.visible = true;
          panelRight.visible = true;
          panelLeft.scale.x = targetWingScale;
          panelRight.scale.x = targetWingScale;
        }
        observationCone.visible = false;
        downlinkBeam.visible = true;
        laserMaterial.opacity = prefersReducedMotion ? 0.7 : 0.5 + Math.sin(time * 16) * 0.4;
      } else {
        if (isDeployable) {
          panelLeft.visible = true;
          panelRight.visible = true;
          panelLeft.scale.x = targetWingScale;
          panelRight.scale.x = targetWingScale;
        }
        observationCone.visible = false;
        downlinkBeam.visible = false;
      }
    }

    renderer.render(scene, camera);
  }

  animate();
  window.addEventListener('resize', resize);
  updateSpacecraftComponents();

  return {
    canvas: renderer.domElement,
    mount(host: HTMLElement) {
      if (currentHost !== host) {
        resizeObserver?.disconnect();
        currentHost = host;
        if (renderer.domElement.parentElement !== host) host.replaceChildren(renderer.domElement);
        resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(host);
      }
      resize();
    },
    update(nextConfig: Partial<SceneConfig>) {
      config = { ...config, ...nextConfig };
      updateSpacecraftComponents();
    },
    setSimState(nextSimState: SimVisualState) {
      simState = { ...simState, ...nextSimState };
    },
    setCameraSensitivity(value: number) {
      cameraSensitivity = Math.max(0.2, Math.min(3.0, value));
    },
    setAutoRotate(value: boolean) {
      autoRotate = value;
    },
    setQuality(highDpi: boolean) {
      renderer.setPixelRatio(highDpi ? Math.min(window.devicePixelRatio || 1, 2.0) : 1.0);
    },
    resetCamera() {
      cameraTheta = 0;
      cameraPhi = Math.PI * 0.46;
      cameraDistance = 7.5;
    },
    dispose() {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', resize);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      renderer.dispose();
    }
  };
}
