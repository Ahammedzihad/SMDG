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

  // Solar Arrays
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
  const rocketBody = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.65, 16), new THREE.MeshStandardMaterial({ color: 0xf5f7fa, metalness: 0.4, roughness: 0.3 }));
  const rocketNose = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.18, 16), new THREE.MeshStandardMaterial({ color: 0xd9e2ec, metalness: 0.5, roughness: 0.25 }));
  rocketNose.position.y = 0.41;
  const rocketExhaust = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.35, 12), new THREE.MeshBasicMaterial({ color: 0xffaa33, transparent: true, opacity: 0.85 }));
  rocketExhaust.position.y = -0.48;
  rocketExhaust.rotation.x = Math.PI;
  rocketGroup.add(rocketBody, rocketNose, rocketExhaust);
  rocketGroup.visible = false;
  scene.add(rocketGroup);

  let currentHost: HTMLElement | null = null;
  let resizeObserver: ResizeObserver | null = null;
  const clock = new THREE.Clock();

  let config: SceneConfig = {
    objective: 'aerosol',
    platform: 'cubesat6u',
    instrument: 'compactCamera',
    power: 'standardArray',
    communications: 'lowGain',
    adcs: 'passiveMagnetic',
    orbit: 'polar',
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
    if (config.platform === 'cubesat3u') {
      busMesh.scale.set(0.75, 1.05, 0.75);
      busMesh.material = busMaterial;
    } else if (config.platform === 'smallsatBus') {
      busMesh.scale.set(1.4, 1.3, 1.2);
      busMesh.material = darkMetalMaterial;
    } else {
      busMesh.scale.set(1.0, 1.15, 0.95);
      busMesh.material = busMaterial;
    }

    // 2. Suit Accent Color
    if (config.suitColor) {
      const color = new THREE.Color(config.suitColor);
      accentMaterial.color.copy(color);
      accentMaterial.emissive.copy(color).multiplyScalar(0.4);
      (beaconLight.material as THREE.MeshBasicMaterial).color.copy(color);
    }

    // 3. Power Subsystem
    if (config.power === 'bodyPanels') {
      panelLeft.visible = false;
      panelRight.visible = false;
    } else if (config.power === 'extendedArray') {
      panelLeft.visible = true;
      panelRight.visible = true;
      panelLeft.scale.set(1.7, 1.25, 1);
      panelRight.scale.set(1.7, 1.25, 1);
      panelLeft.position.x = -0.58;
      panelRight.position.x = 0.58;
    } else {
      panelLeft.visible = true;
      panelRight.visible = true;
      panelLeft.scale.set(1.0, 1.0, 1);
      panelRight.scale.set(1.0, 1.0, 1);
      panelLeft.position.x = -0.42;
      panelRight.position.x = 0.42;
    }

    // 4. Instrument Model
    instrumentGroup.clear();
    if (config.instrument === 'polarimeter') {
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.22, 20), goldFoilMaterial);
      barrel.position.set(0, -0.22, 0.04);
      barrel.rotation.x = Math.PI;
      const lens = new THREE.Mesh(new THREE.CircleGeometry(0.065, 16), new THREE.MeshBasicMaterial({ color: 0x112244 }));
      lens.position.set(0, -0.331, 0.04);
      lens.rotation.x = Math.PI * 0.5;
      instrumentGroup.add(barrel, lens);
    } else if (config.instrument === 'solarRadiometer') {
      const cavity = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.16, 16), goldFoilMaterial);
      cavity.position.set(0, 0.22, 0);
      cavity.rotation.z = Math.PI * 0.25;
      instrumentGroup.add(cavity);
    } else if (config.instrument === 'hyperspectral') {
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.15), darkMetalMaterial);
      box.position.set(0, -0.22, 0.03);
      const aperture = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.02, 0.05), new THREE.MeshBasicMaterial({ color: 0x00f0ff }));
      aperture.position.set(0, -0.301, 0.03);
      instrumentGroup.add(box, aperture);
    } else {
      const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.12, 16), darkMetalMaterial);
      lens.position.set(0, -0.2, 0.05);
      lens.rotation.x = Math.PI;
      instrumentGroup.add(lens);
    }

    // 5. Communications Antenna Model
    commsGroup.clear();
    if (config.communications === 'highGain') {
      const dish = new THREE.Mesh(new THREE.SphereGeometry(0.14, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), busMaterial);
      dish.position.set(0, 0.22, -0.06);
      dish.rotation.x = -Math.PI * 0.65;
      const feed = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.12, 8), darkMetalMaterial);
      feed.position.set(0, 0.28, -0.09);
      commsGroup.add(dish, feed);
    } else if (config.communications === 'sband') {
      const patch = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.02), goldFoilMaterial);
      patch.position.set(0, 0.18, 0);
      patch.rotation.x = Math.PI * 0.5;
      commsGroup.add(patch);
    } else {
      const whip = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.32, 6), darkMetalMaterial);
      whip.position.set(0.08, 0.28, 0);
      whip.rotation.z = -0.2;
      commsGroup.add(whip);
    }

    // 6. ADCS Model
    adcsGroup.clear();
    if (config.adcs === 'microThruster') {
      for (const [x, y, z] of [[-0.12, -0.15, -0.1], [0.12, -0.15, -0.1], [-0.12, -0.15, 0.1], [0.12, -0.15, 0.1]]) {
        const nozzle = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.05, 8), goldFoilMaterial);
        nozzle.position.set(x, y, z);
        nozzle.rotation.x = Math.PI;
        adcsGroup.add(nozzle);
      }
    } else if (config.adcs === 'reactionWheels') {
      const housing = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.08, 12), darkMetalMaterial);
      housing.position.set(0, 0, -0.12);
      housing.rotation.x = Math.PI * 0.5;
      adcsGroup.add(housing);
    }

    // 7. Orbit Orientation
    if (config.orbit === 'polar') {
      orbit.rotation.set(0.95, 0.38, -0.3);
    } else if (config.orbit === 'sso') {
      orbit.rotation.set(1.2, 0.6, -0.1);
    } else {
      orbit.rotation.set(0.35, 0.15, 0);
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

    // Earth Rotation
    earth.rotation.y = time * 0.055;
    targetRing.scale.setScalar(1 + Math.sin(time * 4) * 0.2);

    // Camera Positioning
    if (autoRotate && !isDragging && simState.mode === 'orbit') {
      cameraTheta += 0.0012;
    }

    if (simState.mode === 'launch') {
      // Launch Sequence: Rocket ascends from Earth surface
      rocketGroup.visible = true;
      spacecraft.visible = false;
      observationCone.visible = false;
      downlinkBeam.visible = false;

      const launchT = Math.min(1, simState.progress);
      const startPos = new THREE.Vector3(-0.25, 0.85, 1.3);
      const targetPos = new THREE.Vector3(-1.25, 1.04, 0.24);
      rocketGroup.position.lerpVectors(startPos, targetPos, launchT);
      rocketGroup.rotation.y = time * 0.5;
      rocketGroup.scale.setScalar(Math.max(0.2, 1.0 - launchT * 0.4));

      camera.position.set(
        rocketGroup.position.x + 0.8,
        rocketGroup.position.y + 0.4,
        rocketGroup.position.z + 2.2
      );
      camera.lookAt(rocketGroup.position);
    } else {
      rocketGroup.visible = false;
      spacecraft.visible = true;

      // Normal Orbit Camera
      const cx = cameraDistance * Math.sin(cameraPhi) * Math.sin(cameraTheta);
      const cy = cameraDistance * Math.cos(cameraPhi);
      const cz = cameraDistance * Math.sin(cameraPhi) * Math.cos(cameraTheta);
      camera.position.set(cx, cy, cz);
      camera.lookAt(0, 0, 0);

      // Spacecraft motion on orbit
      const orbitSpeed = config.orbit === 'polar' ? 0.22 : 0.16;
      const orbitAngle = time * orbitSpeed;
      spacecraft.position.set(
        -1.25 + Math.cos(orbitAngle) * 0.12,
        1.04 + Math.sin(orbitAngle) * 0.08,
        0.24 + Math.sin(orbitAngle * 0.5) * 0.05
      );
      spacecraft.rotation.y = -time * 0.12;

      // Subsystem visual states according to simulation mode
      if (simState.mode === 'deploy') {
        const deployT = Math.min(1, simState.progress);
        panelLeft.scale.x = (config.power === 'extendedArray' ? 1.7 : 1.0) * deployT;
        panelRight.scale.x = (config.power === 'extendedArray' ? 1.7 : 1.0) * deployT;
        observationCone.visible = false;
        downlinkBeam.visible = false;
      } else if (simState.mode === 'observe') {
        observationCone.visible = true;
        downlinkBeam.visible = false;
        coneSensorMaterial.opacity = 0.15 + Math.sin(time * 8) * 0.08;
      } else if (simState.mode === 'downlink') {
        observationCone.visible = false;
        downlinkBeam.visible = true;
        laserMaterial.opacity = 0.5 + Math.sin(time * 16) * 0.4;
      } else {
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
