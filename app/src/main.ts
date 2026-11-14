import './theme.css';
import './style.css';
import './game.css';
import { io, type Socket } from 'socket.io-client';
import {
  GAME_OPTIONS,
  INITIAL_CONFIG,
  NASA_SAMPLE,
  evaluateMission
} from './engine/engineAdapter';
import { createMissionScene } from './scene';
import { MissionWizard } from './ui/wizard';
import { LobbyView } from './ui/lobby/lobbyView';
import { primaryButton, secondaryButton } from './ui/components';
import { renderIcon } from './ui/icons';
import { renderHowToPlayModal } from './ui/howToPlay';

type MissionConfig = typeof INITIAL_CONFIG;
type Player = { id: string; name: string; role: string; connected: boolean; suit: string };
type MissionResult = ReturnType<typeof evaluateMission>;
type RoomState = {
  code: string;
  phase: 'lobby' | 'design' | 'simulating' | 'complete';
  hostPlayerId: string;
  players: Player[];
  config: MissionConfig;
  revision: number;
  result: MissionResult | null;
};
type MissionAction =
  | { type: 'set-role'; value: string }
  | { type: 'set-config'; key: string; value: string }
  | { type: 'set-observation-date'; value: string }
  | { type: 'start-design' }
  | { type: 'simulate' }
  | { type: 'finish-sim' }
  | { type: 'redesign' };

const app = document.querySelector<HTMLDivElement>('#app')!;
const socket: Socket = io({ autoConnect: false, reconnection: true, reconnectionAttempts: 10, reconnectionDelay: 700 });
const scene = createMissionScene();

const roles = ['Mission Commander', 'Spacecraft Engineer', 'Power & Propulsion', 'Science & Comms'];

const categories = [
  { id: 'objectives', label: 'Objective' },
  { id: 'platforms', label: 'Architecture' },
  { id: 'instruments', label: 'Payload' },
  { id: 'power', label: 'Power' },
  { id: 'communications', label: 'Comms' },
  { id: 'adcs', label: 'Pointing' },
  { id: 'orbits', label: 'Orbit' },
  { id: 'launch', label: 'Launch' }
] as const;

const suitChoices = [
  { id: 'cyan', label: 'Arctic Cyan', color: '#77e1e6' },
  { id: 'amber', label: 'Solar Amber', color: '#ffb86c' },
  { id: 'violet', label: 'Cosmic Violet', color: '#bba0ff' },
  { id: 'green', label: 'Terra Green', color: '#7de0ae' },
  { id: 'coral', label: 'Mars Coral', color: '#ff6e6e' },
  { id: 'gold', label: 'Deep Space Gold', color: '#ffd152' }
];

// Persistent state from localStorage
let name = localStorage.getItem('mission-player-callsign') || sessionStorage.getItem('mission-player-name') || '';
let suit = localStorage.getItem('mission-player-suit') || 'cyan';
let cameraSensitivity = parseFloat(localStorage.getItem('mission-cam-sens') || '1.0');
let autoRotateSetting = localStorage.getItem('mission-auto-rotate') !== 'false';
let highQualitySetting = localStorage.getItem('mission-high-quality') !== 'false';

// Runtime state
let room: RoomState | null = null;
let mode: 'menu' | 'online' | 'offline' | 'wizard' | 'lobby' = 'menu';
let wizard: MissionWizard | null = null;
let lobbyView: LobbyView | null = null;
let playerId = '';
let reconnectToken = '';
let reconnectOnNextConnect = false;
let serverConnected = false;
let activeCategory: string = 'objectives';
let notice = '';
let customName = name;
let menuPage: 'main' | 'play' | 'customize' | 'settings' = 'main';
let showProvenanceModal = false;
let isHowToPlayOpen = false;

// Simulation State
let simStageIndex = 0;
let simTimerInterval: number | null = null;
let simLogs: Array<{ text: string; warn?: boolean }> = [];

const SIM_STAGES = [
  { id: 'prep', title: 'T-00:10 // LAUNCH PAD PREPARATION', detail: 'Systems pre-flight health checkout. Range safety verified. Flight computer armed.', mode: 'launch' as const, durationSec: 2, met: '-00:10', alt: '0 km', vel: '0.0 km/s' },
  { id: 'ignition', title: 'T+00:02 // ROCKET IGNITION & ASCENT', detail: 'Main stage engine ignition. Transonic atmospheric acceleration through Max-Q.', mode: 'launch' as const, durationSec: 3, met: '+00:02', alt: '45 km', vel: '1.4 km/s' },
  { id: 'ejection', title: 'T+00:45 // FAIRING JETTISON & SEPARATION', detail: 'Fairing separation confirmed. Spacecraft dispenser deployment spring releases payload.', mode: 'deploy' as const, durationSec: 3, met: '+00:45', alt: '210 km', vel: '5.8 km/s' },
  { id: 'deploy', title: 'T+01:15 // SOLAR ARRAY DEPLOYMENT', detail: 'Primary solar arrays unfold. Power generation bus telemetry online. Battery charging initiated.', mode: 'deploy' as const, durationSec: 3, met: '+01:15', alt: '480 km', vel: '7.5 km/s' },
  { id: 'insertion', title: 'T+02:00 // ORBIT INSERTION & STABILIZATION', detail: 'Target orbital altitude established. ADCS actuators active; spacecraft stabilizes to nadir vector.', mode: 'orbit' as const, durationSec: 3, met: '+02:00', alt: '550 km', vel: '7.6 km/s' },
  { id: 'observe', title: 'T+03:30 // TARGET SCIENCE OBSERVATION', detail: 'Spacecraft enters observation window over Chesapeake Bay coordinates (38.9° N, -76.5° W). Scientific payload active.', mode: 'observe' as const, durationSec: 4, met: '+03:30', alt: '550 km', vel: '7.6 km/s' },
  { id: 'downlink', title: 'T+05:00 // GROUND STATION DOWNLINK CONTACT', detail: 'Ground station acquisition of signal (AOS). Radio downlink transmits acquired science packets.', mode: 'downlink' as const, durationSec: 4, met: '+05:00', alt: '550 km', vel: '7.6 km/s' },
  { id: 'complete', title: 'T+06:00 // MISSION OPERATIONS COMPLETED', detail: 'Full orbital pass completed. Science telemetry archived in mission ground control database.', mode: 'orbit' as const, durationSec: 2, met: '+06:00', alt: '550 km', vel: '7.6 km/s' }
];

const html = (value: unknown) =>
  String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] || char));

const isHost = () => Boolean(room && room.hostPlayerId === playerId);

// Initialize scene settings
scene.setCameraSensitivity(cameraSensitivity);
scene.setAutoRotate(autoRotateSetting);
scene.setQuality(highQualitySetting);
scene.update({ suitColor: suitChoices.find((s) => s.id === suit)?.color || '#77e1e6' });

// Socket.IO Handlers
socket.on('connect', () => {
  serverConnected = true;
  if (reconnectOnNextConnect && room && mode === 'online') {
    reconnectOnNextConnect = false;
    socket.emit('room:join', { code: room.code, name, suit, reconnectToken }, (response: any) => {
      if (response?.ok) {
        playerId = response.playerId;
        reconnectToken = response.reconnectToken;
        setRoom(response.state);
        notice = 'Connection restored. Team mission synchronized.';
      } else {
        notice = response?.error || 'Room expired. Start local solo mode or create a new room.';
      }
      render();
    });
  } else {
    render();
  }
});

socket.on('disconnect', () => {
  serverConnected = false;
  reconnectOnNextConnect = mode === 'online' && Boolean(room?.code);
  if (room && mode === 'online') notice = 'Network disconnected. Reconnecting to mission server…';
  render();
});

socket.on('room:state', (nextRoom: RoomState) => {
  if (mode !== 'online' || (room && room.code !== nextRoom.code)) return;
  const previousPhase = room?.phase;
  setRoom(nextRoom);
  if (nextRoom.phase === 'simulating' && previousPhase !== 'simulating') {
    startSimulationSequence();
  }
  render();
});

socket.on('room:error', (response: { error?: string; state?: RoomState }) => {
  notice = response.error || 'Server reported an error.';
  if (response.state) setRoom(response.state);
  render();
});

function setRoom(nextRoom: RoomState) {
  room = nextRoom;
  if (room.config) {
    const activeSuit = suitChoices.find((s) => s.id === suit)?.color || '#77e1e6';
    scene.update({ ...room.config, suitColor: activeSuit });
  }
}

function savedName(fieldSelector = '#player-name') {
  const field = document.querySelector<HTMLInputElement>(fieldSelector);
  if (field) name = field.value.trim().slice(0, 18);
  if (!name) name = 'Flight Director';
  localStorage.setItem('mission-player-callsign', name);
  sessionStorage.setItem('mission-player-name', name);
  return name;
}

function ensureConnection(): Promise<boolean> {
  if (socket.connected) return Promise.resolve(true);
  socket.connect();
  return new Promise<boolean>((resolve) => {
    const timeout = window.setTimeout(() => resolve(false), 5000);
    socket.once('connect', () => {
      window.clearTimeout(timeout);
      resolve(true);
    });
    socket.once('connect_error', () => {
      window.clearTimeout(timeout);
      resolve(false);
    });
  });
}

async function createRoom() {
  savedName();
  notice = 'Connecting to mission server…';
  render();
  const connected = await ensureConnection();
  if (!connected) {
    notice = 'Multiplayer server is offline. Starting in Local Solo Mode.';
    startOffline();
    return;
  }
  socket.emit('room:create', { name, suit }, (response: any) => {
    if (!response?.ok) {
      notice = response?.error || 'Could not create a room.';
      render();
      return;
    }
    mode = 'online';
    playerId = response.playerId;
    reconnectToken = response.reconnectToken;
    sessionStorage.setItem('mission-room-code', response.state.code);
    sessionStorage.setItem('mission-reconnect-token', reconnectToken);
    setRoom(response.state);
    notice = '';
    render();
  });
}

async function joinRoom() {
  savedName('#join-name');
  const input = document.querySelector<HTMLInputElement>('#room-code');
  const code = (input?.value || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
  if (code.length !== 5) {
    notice = 'Please enter a valid 5-character room code.';
    render();
    return;
  }
  notice = 'Connecting to mission server…';
  render();
  const connected = await ensureConnection();
  if (!connected) {
    notice = 'Multiplayer server is unreachable. You can still play in Local Solo Mode.';
    render();
    return;
  }
  socket.emit('room:join', { code, name, suit }, (response: any) => {
    if (!response?.ok) {
      notice = response?.error || 'Could not join that room.';
      render();
      return;
    }
    mode = 'online';
    playerId = response.playerId;
    reconnectToken = response.reconnectToken;
    sessionStorage.setItem('mission-room-code', response.state.code);
    sessionStorage.setItem('mission-reconnect-token', reconnectToken);
    setRoom(response.state);
    notice = '';
    render();
  });
}

function startOffline() {
  savedName();
  mode = 'offline';
  playerId = 'offline-host';
  reconnectToken = '';
  activeCategory = 'objectives';
  notice = 'Local Solo Mode: all simulation physics and data run locally on your device.';
  setRoom({
    code: 'SOLO',
    phase: 'design',
    hostPlayerId: playerId,
    players: [{ id: playerId, name, role: roles[0], connected: true, suit }],
    config: { ...INITIAL_CONFIG },
    revision: 1,
    result: null
  });
  render();
}

function sendAction(action: MissionAction) {
  if (!room) return;
  if (mode === 'offline') {
    if (action.type === 'set-role') {
      room = { ...room, players: room.players.map((p) => (p.id === playerId ? { ...p, role: action.value } : p)), revision: room.revision + 1 };
    } else if (action.type === 'set-config') {
      room = { ...room, config: { ...room.config, [action.key]: action.value }, revision: room.revision + 1 };
      scene.update(room.config);
    } else if (action.type === 'set-observation-date') {
      room = { ...room, config: { ...room.config, observationDate: action.value }, revision: room.revision + 1 };
    } else if (action.type === 'simulate') {
      room = { ...room, phase: 'simulating', result: evaluateMission(room.config), revision: room.revision + 1 };
      startSimulationSequence();
    } else if (action.type === 'finish-sim') {
      room = { ...room, phase: 'complete', revision: room.revision + 1 };
    } else if (action.type === 'redesign') {
      room = { ...room, phase: 'design', result: null, revision: room.revision + 1 };
    }
    render();
    return;
  }
  if (!socket.connected) {
    notice = 'You are currently disconnected. Changes cannot be synchronized until reconnected.';
    render();
    return;
  }
  socket.emit('room:action', { action, revision: room.revision }, (response: any) => {
    if (!response?.ok) {
      notice = response?.error || 'Action rejected by server.';
      if (response?.state) setRoom(response.state);
      render();
      return;
    }
    if (response.state) {
      const prevPhase = room?.phase;
      setRoom(response.state);
      if (response.state.phase === 'simulating' && prevPhase !== 'simulating') {
        startSimulationSequence();
      }
    }
    notice = '';
    render();
  });
}

function startSimulationSequence() {
  if (simTimerInterval) clearInterval(simTimerInterval);
  simStageIndex = 0;
  simLogs = [
    { text: 'Countdown initiated: T-00:10. Flight systems ready.' }
  ];

  const updateSim = () => {
    if (!room || room.phase !== 'simulating') {
      if (simTimerInterval) clearInterval(simTimerInterval);
      return;
    }
    const current = SIM_STAGES[simStageIndex];
    if (!current) {
      finishSimulation();
      return;
    }

    const progress = (simStageIndex + 1) / SIM_STAGES.length;
    scene.setSimState({
      mode: current.mode,
      progress,
      stageText: current.title
    });

    render();

    // Advance to next stage after duration
    simStageIndex++;
    if (simStageIndex < SIM_STAGES.length) {
      const nextStage = SIM_STAGES[simStageIndex];
      simLogs.unshift({ text: `${nextStage.title}: ${nextStage.detail}` });
      if (nextStage.id === 'observe' && room.result && !room.result.constraints.find((c) => c.id === 'power')?.pass) {
        simLogs.unshift({ text: 'ANOMALY: Spacecraft power margin negative! Subsystem brownout risk during observation!', warn: true });
      }
      setTimeout(updateSim, nextStage.durationSec * 1000);
    } else {
      setTimeout(finishSimulation, 2000);
    }
  };

  updateSim();
}

function finishSimulation() {
  if (simTimerInterval) clearInterval(simTimerInterval);
  scene.setSimState({ mode: 'orbit', progress: 1.0 });
  sendAction({ type: 'finish-sim' });
}

function sceneCard(label = 'ORBITAL VIEW') {
  return `<div class="scene-card">
    <div class="scene-caption"><span class="live-dot"></span>${label}</div>
    <div class="scene-host" data-scene></div>
    <div class="scene-scale">INTERACTIVE 3D · DRAG TO ORBIT · SCROLL TO ZOOM</div>
  </div>`;
}

function shell(content: string) {
  const userInitial = html((name || 'F').slice(0, 1).toUpperCase());
  return `<div class="app-shell">
    <header class="topbar">
      <a class="brand-mark" href="#/home" data-action="home" style="display:flex; align-items:baseline; gap:6px; text-decoration:none;">
        <span style="font-family:'Space Grotesk',sans-serif; font-weight:700; color:#ffc174; font-size:18px;">ORBIT</span>
        <span style="font-family:'Space Grotesk',sans-serif; font-weight:600; color:#7bd0ff; font-size:11px; letter-spacing:0.12em; text-transform:uppercase;">MISSION ACADEMY</span>
      </a>
      <div class="topbar-middle">
        <span class="topbar-kicker">NASA SPACE MISSION DESIGN GAME</span>
        <span class="topbar-separator">/</span>
        <span class="topbar-status"><i class="status-light ${serverConnected ? 'is-online' : ''}"></i>${serverConnected ? 'SERVER READY' : 'LOCAL MODE AVAILABLE'}</span>
      </div>
      <div class="topbar-right" style="display:flex; align-items:center; gap:8px;">
        <button class="button button-quiet" data-action="open-how-to-play" style="padding:6px 12px; font-size:11px; display:inline-flex; align-items:center; gap:4px; border-radius:9999px;">
          <span class="material-symbols-outlined text-[15px] text-secondary">help</span>
          <span>HOW TO PLAY</span>
        </button>
        <button class="button button-quiet" data-action="toggle-provenance" style="padding:6px 10px; font-size:9px;">NASA DATA INFO</button>
        <span class="avatar-chip" style="border-color:${suitChoices.find((s) => s.id === suit)?.color || '#77e1e6'}">${userInitial}</span>
      </div>
    </header>
    ${notice ? `<div class="notice-bar" role="status">${html(notice)}<button data-action="dismiss-notice" aria-label="Dismiss">×</button></div>` : ''}
    ${content}
    <footer class="app-footer">
      <span>NASA SPACE APPS CHALLENGE · EDUCATIONAL MISSION DESIGN MVP</span>
      <span>NASA POWER AOD_55 AUTHENTIC DATASET · GAME BALANCE ASSUMPTIONS CLEARLY LABELLED</span>
    </footer>
    ${showProvenanceModal ? renderProvenanceModal() : ''}
    ${isHowToPlayOpen ? renderHowToPlayModal() : ''}
  </div>`;
}

function renderProvenanceModal() {
  return `<div class="provenance-modal" role="dialog" aria-modal="true">
    <div class="provenance-card">
      <div class="provenance-header">
        <div>
          <span class="panel-index">AUTHENTIC SCIENTIFIC INTEGRATION</span>
          <h2>NASA Data Provenance & Methodological Disclosures</h2>
        </div>
        <button class="provenance-close" data-action="toggle-provenance">×</button>
      </div>
      <div class="provenance-body">
        <p>This project uses real atmospheric observation data bundled directly from the NASA Langley Research Center POWER Project.</p>
        <table class="provenance-table">
          <tr><th>Parameter</th><td><code>${html(NASA_SAMPLE.parameter)}</code> (Aerosol Optical Depth at 0.55 µm)</td></tr>
          <tr><th>Provider</th><td>${html(NASA_SAMPLE.provider)}</td></tr>
          <tr><th>Source Product</th><td>${html(NASA_SAMPLE.sourceProduct)}</td></tr>
          <tr><th>Units</th><td>${html(NASA_SAMPLE.units)}</td></tr>
          <tr><th>Target Coordinates</th><td>${NASA_SAMPLE.latitude}° N, ${Math.abs(NASA_SAMPLE.longitude)}° W (Chesapeake Bay Region)</td></tr>
          <tr><th>Temporal Range</th><td>${html(NASA_SAMPLE.samplePeriod.start)} to ${html(NASA_SAMPLE.samplePeriod.end)} (7 consecutive days)</td></tr>
          <tr><th>Raw API Query</th><td><code>${html(NASA_SAMPLE.apiRequest)}</code></td></tr>
        </table>
        <div class="provenance-disclaimer">
          <strong>CRITICAL DISTINCTIONS FOR SCIENTIFIC CREDIBILITY:</strong><br>
          1. <strong>Actual NASA Observations:</strong> The daily AOD_55 values are authentic historical measurements from satellite CERES SYN1deg.<br>
          2. <strong>Educational Scenario Parameters:</strong> Subsystem masses, power draws, data rates, and Mission Credits (MC) are simplified educational models designed to teach real aerospace engineering trade-offs.<br>
          3. <strong>Precedent Missions:</strong> References to NASA missions (such as HARP, MinXSS, and BisonSat) represent historical aerospace heritage and are not flight data from this simulation.
        </div>
      </div>
    </div>
  </div>`;
}

function renderHome() {
  if (menuPage === 'play') return renderPlayMenu();
  if (menuPage === 'customize') return renderCustomizeMenu();
  if (menuPage === 'settings') return renderSettingsMenu();
  return renderMainMenu();
}

function renderMainMenu() {
  const content = `<main class="home-grid">
    <section class="home-copy">
      <div class="eyebrow"><span class="eyebrow-line"></span> NASA SPACE MISSION DESIGN GAME</div>
      <h1>Every choice<br>changes the <em>mission.</em></h1>
      <p class="home-description">
        Experience conceptual space mission design. Select scientific objectives, architect spacecraft subsystems, manage competing engineering constraints, and simulate your flight with real NASA Earth observation data.
      </p>
      <div class="home-tags">
        <span><b>01</b> SCIENCE OBJECTIVES</span>
        <span><b>02</b> SUBSYSTEM TRADEOFFS</span>
        <span><b>03</b> SIMULATION & TELEMETRY</span>
      </div>
      <div class="main-menu-actions">
        ${primaryButton('Enter the Universe', 'start-wizard', 'rocket')}
        ${secondaryButton('MULTIPLAYER LOBBY', 'menu-play', 'planet')}
        <button class="button button-quiet menu-action" data-action="menu-customize">CUSTOMIZE CHARACTER</button>
        <button class="button button-quiet menu-action" data-action="menu-settings">SETTINGS</button>
      </div>
    </section>
    <section class="home-visual" aria-label="Earth and spacecraft orbital view">
      ${sceneCard('EARTH OBSERVATION ORBIT (LEO)')}
      <div class="floating-readout">
        <span class="readout-label">FEATURED DATASET</span>
        <strong>NASA POWER AOD_55</strong>
        <small>CERES SYN1deg · 0.55 µm</small>
      </div>
      <div class="orbit-readout">
        <span>3D</span>
        <div>
          <strong>INTERACTIVE VIEWPORT</strong>
          <small>Click & drag to rotate view</small>
        </div>
      </div>
    </section>
  </main>`;
  app.innerHTML = shell(content);
  mountScene();
}

function renderPlayMenu() {
  const content = `<main class="menu-subpage">
    <div style="margin-bottom:16px">${secondaryButton('Back to Main Menu', 'menu-home', 'back')}</div>
    <div class="menu-subheading">
      <div class="eyebrow"><span class="eyebrow-line"></span> MISSION DISPATCH</div>
      <h1>Launch your mission.</h1>
      <p>Fly solo in an offline engineering session or create a private room to design cooperatively with up to 4 crew members.</p>
    </div>
    <div class="play-choice-grid">
      <section class="play-choice panel glass-card">
        <span class="panel-index">OPTION 01 / CREATE PRIVATE ROOM</span>
        <h2>Host a private room</h2>
        <p>Generate a unique 5-character mission code. Begin alone or invite your crew to join before starting.</p>
        <label class="field-label" for="player-name">YOUR CALLSIGN</label>
        <input id="player-name" maxlength="18" placeholder="Flight Director" value="${html(name)}" autocomplete="nickname" />
        <div style="margin-top:12px">${primaryButton('CREATE PRIVATE ROOM', 'create-room', 'rocket')}</div>
      </section>
      <section class="play-choice panel glass-card">
        <span class="panel-index">OPTION 02 / JOIN PRIVATE ROOM</span>
        <h2>Enter existing room</h2>
        <p>Join a session hosted by another crew member using their private 5-character room code.</p>
        <label class="field-label" for="join-name">YOUR CALLSIGN</label>
        <input id="join-name" maxlength="18" placeholder="Crew Member" value="${html(name)}" autocomplete="nickname" />
        <label class="field-label" for="room-code">ROOM CODE</label>
        <input id="room-code" maxlength="5" placeholder="ABCDE" autocomplete="off" />
        <div style="margin-top:12px">${secondaryButton('JOIN PRIVATE ROOM', 'join-room', 'planet')}</div>
      </section>
      <div class="play-offline-card glass-card">
        <div>
          <strong>SOLO MISSION DESIGN WIZARD</strong>
          <p>Full 7-stage conceptual mission design workflow (CML 1–7) with authentic NASA constraints, live trade-offs, and mission debrief.</p>
        </div>
        ${primaryButton('Enter the Universe', 'start-wizard', 'rocket')}
      </div>
    </div>
    <p class="private-room-note">
      ℹ Note: Remote cooperative play requires an active connection to the mission room server. Private rooms restrict who can join with a code and do not broadcast publicly.
    </p>
  </main>`;
  app.innerHTML = shell(content);
}

function renderCustomizeMenu() {
  const swatches = suitChoices
    .map(
      (choice) =>
        `<button class="suit-choice ${suit === choice.id ? 'is-selected' : ''}" data-suit="${choice.id}" aria-pressed="${suit === choice.id}">
          <i style="--suit:${choice.color}"></i>
          <span>${choice.label}</span>
        </button>`
    )
    .join('');
  const activeColor = suitChoices.find((c) => c.id === suit)?.color || '#77e1e6';

  const content = `<main class="menu-subpage">
    <div style="margin-bottom:16px">${secondaryButton('Back to Main Menu', 'menu-home', 'back')}</div>
    <div class="menu-subheading">
      <div class="eyebrow"><span class="eyebrow-line"></span> CREW REGISTRATION</div>
      <h1>Customize character.</h1>
      <p>Configure your astronaut callsign and flight suit accent color. Preferences are stored persistently on this device.</p>
    </div>
    <section class="customize-panel panel glass-card">
      <div class="character-preview">
        <div class="character-helmet" style="--suit:${activeColor}">
          <span>${html((customName || name || 'A').slice(0, 1).toUpperCase())}</span>
        </div>
        <span class="panel-index">CREW CALLSIGN · ${html(customName || name || 'FLIGHT DIRECTOR')}</span>
      </div>
      <div class="customize-options">
        <label class="field-label" for="custom-name">CALLSIGN</label>
        <input id="custom-name" maxlength="18" placeholder="Enter your callsign" value="${html(customName || name)}" autocomplete="nickname" />
        <span class="field-label">SUIT ACCENT COLOR</span>
        <div class="suit-choices">${swatches}</div>
        <div style="margin-top:14px">${primaryButton('SAVE PREFERENCES', 'save-customize', 'check')}</div>
      </div>
    </section>
  </main>`;
  app.innerHTML = shell(content);
}

function renderSettingsMenu() {
  const content = `<main class="menu-subpage">
    <div style="margin-bottom:16px">${secondaryButton('Back to Main Menu', 'menu-home', 'back')}</div>
    <div class="menu-subheading">
      <div class="eyebrow"><span class="eyebrow-line"></span> APPLICATION PREFERENCES</div>
      <h1>Settings & controls.</h1>
      <p>Adjust 3D graphics fidelity, camera controls, and display preferences. All settings are active and functional.</p>
    </div>
    <section class="panel settings-panel glass-card">
      <div class="settings-group">
        <div>
          <strong>Orbit Camera Sensitivity</strong>
          <p>Controls rotational speed when clicking and dragging the 3D space scene.</p>
        </div>
        <div class="settings-controls">
          <input type="range" class="settings-slider" id="cam-sens" min="0.2" max="2.5" step="0.1" value="${cameraSensitivity}" />
          <span class="settings-value" id="sens-val">${cameraSensitivity.toFixed(1)}x</span>
        </div>
      </div>
      <div class="settings-group">
        <div>
          <strong>Auto-Rotate 3D Scene</strong>
          <p>Enables smooth cinematic orbital revolution of Earth and satellite when idle.</p>
        </div>
        <div class="settings-controls">
          <button class="button ${autoRotateSetting ? 'button-primary' : 'button-quiet'}" data-action="toggle-autorotate">
            ${autoRotateSetting ? 'ENABLED' : 'PAUSED'}
          </button>
        </div>
      </div>
      <div class="settings-group">
        <div>
          <strong>Display & Rendering Quality</strong>
          <p>High quality enables device pixel-ratio scaling and MSAA anti-aliasing.</p>
        </div>
        <div class="settings-controls">
          <button class="button ${highQualitySetting ? 'button-primary' : 'button-quiet'}" data-action="toggle-quality">
            ${highQualitySetting ? 'HIGH FIDELITY' : 'PERFORMANCE'}
          </button>
        </div>
      </div>
      <div class="settings-group">
        <div>
          <strong>Display Mode</strong>
          <p>Toggle full screen view for distraction-free mission control.</p>
        </div>
        <div class="settings-controls">
          <button class="button button-quiet" data-action="toggle-fullscreen">
            ${document.fullscreenElement ? 'EXIT FULLSCREEN' : 'ENTER FULLSCREEN'}
          </button>
        </div>
      </div>
      <div class="settings-group">
        <div>
          <strong>Camera Viewport</strong>
          <p>Reset camera position to default orbital perspective.</p>
        </div>
        <div class="settings-controls">
          <button class="button button-quiet" data-action="reset-camera">RESET VIEW</button>
        </div>
      </div>
      <div style="grid-column:1/-1;margin-top:16px">
        <span class="panel-index">INPUT CONTROLS CHEATSHEET</span>
        <table class="controls-guide-table">
          <tr><td><kbd>Left Click + Drag</kbd></td><td>Orbit camera around Earth and satellite</td></tr>
          <tr><td><kbd>Mouse Wheel / Pinch</kbd></td><td>Zoom camera closer / farther</td></tr>
          <tr><td><kbd>Tab Navigation</kbd></td><td>Browse through mission architecture subsystems</td></tr>
        </table>
      </div>
      <div style="margin-top:20px">${secondaryButton('BACK TO MAIN MENU', 'menu-home', 'back')}</div>
    </section>
  </main>`;
  app.innerHTML = shell(content);
}

function renderLobby() {
  if (!room) return renderHome();
  const roster = room.players
    .map(
      (player, index) =>
        `<div class="crew-row">
          <div class="crew-avatar crew-${index + 1}" style="--suit:${suitChoices.find((c) => c.id === player.suit)?.color || suitChoices[0].color}">
            ${html(player.name.slice(0, 1).toUpperCase())}
          </div>
          <div class="crew-identity">
            <strong>${html(player.name)}${player.id === playerId ? ' <small>(YOU)</small>' : ''}</strong>
            <span><i class="status-light ${player.connected ? 'is-online' : ''}"></i>${player.connected ? 'CONNECTED' : 'RECONNECTING'}</span>
          </div>
          <label class="role-select-wrap">
            <span>ROLE</span>
            <select data-role-player="${html(player.id)}" ${player.id !== playerId ? 'disabled' : ''}>
              ${roles.map((role) => `<option value="${html(role)}" ${player.role === role ? 'selected' : ''}>${html(role)}</option>`).join('')}
            </select>
          </label>
          ${player.id === room!.hostPlayerId ? '<span class="host-pill">HOST</span>' : ''}
        </div>`
    )
    .join('');

  const content = `<main class="lobby-page">
    <div class="page-heading">
      <div>
        <div class="eyebrow"><span class="eyebrow-line"></span> MISSION LOBBY</div>
        <h1>Assemble your <em>crew.</em></h1>
        <p>Coordinate roles with your team. Only the room host can initiate the design sequence.</p>
      </div>
      <div class="room-code-card">
        <span>ROOM CODE</span>
        <strong>${html(room.code)}</strong>
        <button data-action="copy-code">COPY CODE</button>
      </div>
    </div>
    <div class="lobby-layout">
      <section class="lobby-main panel">
        <div class="panel-heading">
          <div>
            <span class="panel-index">01 / CREW MANIFEST</span>
            <h2>Flight roster</h2>
          </div>
          <span class="crew-count">${room.players.filter((p) => p.connected).length} <i>/</i> 4 CREW CONNECTED</span>
        </div>
        <div class="crew-list">${roster}</div>
        ${
          room.players.filter((p) => p.connected).length < 2
            ? '<div class="waiting-callout"><span class="pulse-dot"></span><div><strong>Waiting for crew members</strong><small>Share room code with teammates. Host can also begin solo at any time.</small></div></div>'
            : '<div class="ready-callout"><span>✓</span><div><strong>Crew link synchronized</strong><small>Subsystem design choices are shared across all linked screens.</small></div></div>'
        }
        <div class="lobby-actions">
          ${secondaryButton('LEAVE LOBBY', 'leave-room', 'back')}
          ${
            isHost()
              ? primaryButton('BEGIN MISSION DESIGN', 'start-design', 'rocket')
              : '<span class="host-wait">Waiting for mission host to begin design…</span>'
          }
        </div>
      </section>
      <aside class="lobby-aside">
        ${sceneCard('SPACECRAFT SCHEMATIC')}
        <div class="briefing-card">
          <span class="panel-index">02 / MISSION OBJECTIVE</span>
          <h3>Earth Atmosphere & Aerosol Science</h3>
          <p>Architect a small satellite to measure optical depth at 0.55 µm using NASA POWER CERES observation datasets.</p>
          <div class="briefing-meta">
            <span>DISCIPLINE <b>EARTH SCIENCE</b></span>
            <span>BUDGET <b>85 MISSION CREDITS</b></span>
          </div>
        </div>
      </aside>
    </div>
  </main>`;
  app.innerHTML = shell(content);
  mountScene();
}

function cardMarkup(categoryKey: string, option: any, currentId: string) {
  const selected = option.id === currentId;
  const stats: string[] = [];
  if ('massKg' in option) stats.push(`${option.massKg} kg`);
  if ('generationW' in option) stats.push(`+${option.generationW} W`);
  if ('powerW' in option) stats.push(`${option.powerW} W load`);
  if ('loadW' in option) stats.push(`${option.loadW} W load`);
  if ('rateMbps' in option) stats.push(`${option.rateMbps} Mbps downlink`);
  if ('massLimitKg' in option) stats.push(`≤ ${option.massLimitKg} kg limit`);
  if ('science' in option) stats.push(`${option.science} science pts`);
  if ('credits' in option) stats.push(`${option.credits} MC`);

  return `<button class="choice-card ${selected ? 'is-selected' : ''}" data-choice-category="${categoryKey}" data-choice-id="${option.id}" aria-pressed="${selected}">
    <span class="choice-check">${selected ? '✓' : '+'}</span>
    <strong>${html(option.name)}</strong>
    <span class="choice-stats">${stats.map((stat) => `<span>${html(stat)}</span>`).join('')}</span>
    <span class="choice-description">${html(option.description)}</span>
  </button>`;
}

function renderDesign() {
  if (!room) return renderHome();
  const summary = evaluateMission(room.config);

  const category = categories.find((item) => item.id === activeCategory) ?? categories[0];
  const currentChoiceId = (room.config as any)[category.id];
  const options = Object.values((GAME_OPTIONS as any)[category.id] ?? {});

  const tabs = categories
    .map(
      (item, index) =>
        `<button class="design-tab ${item.id === category.id ? 'active' : ''}" data-category="${item.id}">
          <span>0${index + 1}</span> ${item.label}
        </button>`
    )
    .join('');

  const choicesHtml = options.map((opt) => cardMarkup(category.id, opt, currentChoiceId)).join('');

  // Daily AOD bars from NASA POWER
  const maxAod = Math.max(...NASA_SAMPLE.values.map((s) => s.aod55));
  const dataBars = NASA_SAMPLE.values
    .map((entry) => {
      const height = Math.max(10, (entry.aod55 / maxAod) * 56);
      const isSelected = entry.date === room!.config.observationDate;
      return `<button class="aod-bar ${isSelected ? 'selected' : ''}" data-aod-date="${entry.date}" title="${entry.date}: AOD ${entry.aod55}">
        <i style="height:${height}px"></i>
        <small>${entry.date.slice(-2)}</small>
      </button>`;
    })
    .join('');

  // Constraint check rows
  const validationRows = summary.constraints
    .map(
      (c) =>
        `<div class="validation-row ${c.status.toLowerCase()}">
          <span class="tag-${c.status.toLowerCase()}">${c.status}</span>
          <div style="flex:1">
            <strong>${html(c.label)}</strong>
            <small style="display:block;margin-top:2px;color:#89a2b5">${html(c.detail)}</small>
          </div>
        </div>`
    )
    .join('');

  const content = `<main class="design-page">
    <div class="design-heading">
      <div>
        <div class="eyebrow"><span class="eyebrow-line"></span> PHASE 2–5 // SYSTEM ENGINEERING · ${mode === 'offline' ? 'OFFLINE SOLO' : `ROOM ${html(room.code)}`}</div>
        <h1>Architect the <em>spacecraft.</em></h1>
        <p>Every engineering choice involves trade-offs across mass, power, communications, and budget.</p>
      </div>
      <div class="crew-mini">
        ${room.players.filter((p) => p.connected).map((p) => `<span title="${html(p.name)} · ${html(p.role)}">${html(p.name.slice(0, 1).toUpperCase())}</span>`).join('')}
        <small>SYNCED REV ${room.revision}</small>
      </div>
    </div>
    <div class="design-layout">
      <section class="design-main">
        ${sceneCard('3D SATELLITE CONFIGURATION')}
        <div class="observation-card panel">
          <div class="observation-copy">
            <span class="panel-index">AUTHENTIC NASA POWER CERES AOD_55 SAMPLE</span>
            <strong>Select Observation Window Date</strong>
            <small>Daily Aerosol Optical Depth at 0.55 µm · Target: 38.9° N, -76.5° W</small>
          </div>
          <div class="aod-chart">${dataBars}</div>
          <div class="observation-selected">
            <span>SELECTED DATE: <strong>${html(summary.observation.date)}</strong></span>
            <b>${summary.observation.aod55.toFixed(2)}</b>
            <small>AOD_55 (Dimensionless)</small>
          </div>
        </div>
      </section>
      <section class="design-controls panel">
        <div class="panel-heading">
          <div>
            <span class="panel-index">SUBSYSTEM CONFIGURATION</span>
            <h2>${category.label} Options</h2>
          </div>
          <span class="panel-index">${options.length} CHOICES</span>
        </div>
        <div class="design-tabs" role="tablist">${tabs}</div>
        <div class="choice-grid">${choicesHtml}</div>
        <div class="design-bottom">
          <button class="button button-quiet" data-action="back-lobby">← CREW ROOM</button>
          ${
            isHost()
              ? `<button class="button button-primary" data-action="simulate" ${summary.failCount > 0 ? 'title="Review failed constraints"' : ''}>
                  VALIDATE & LAUNCH SIMULATION <span>→</span>
                </button>`
              : '<span class="host-wait">Waiting for room host to initiate simulation…</span>'
          }
        </div>
      </section>
      <aside class="design-summary">
        <div class="panel summary-panel">
          <div class="panel-heading">
            <div>
              <span class="panel-index">PHASE 4 // LIVE ENGINEERING MARGINS</span>
              <h2>Subsystem Budget</h2>
            </div>
            <span class="summary-live"><i class="status-light is-online"></i>LIVE</span>
          </div>
          <div class="metrics-grid">
            <div class="metric-card ${summary.totalMassKg <= summary.massLimitKg ? 'metric-good' : 'metric-bad'}">
              <div class="metric-top"><span>TOTAL MASS</span><i></i></div>
              <div class="metric-value">${summary.totalMassKg.toFixed(1)}<small>kg</small></div>
              <div class="metric-sub">${summary.massMarginKg >= 0 ? `+${summary.massMarginKg} kg margin` : `${summary.massMarginKg} kg over limit`}</div>
            </div>
            <div class="metric-card ${summary.powerMarginW >= 0 ? 'metric-good' : 'metric-bad'}">
              <div class="metric-top"><span>POWER MARGIN</span><i></i></div>
              <div class="metric-value">${summary.powerMarginW > 0 ? '+' : ''}${summary.powerMarginW.toFixed(1)}<small>W</small></div>
              <div class="metric-sub">${summary.totalLoadW} W load / ${summary.effectiveGenerationW} W solar</div>
            </div>
            <div class="metric-card ${summary.creditsRemaining >= 0 ? 'metric-good' : 'metric-bad'}">
              <div class="metric-top"><span>BUDGET REMAINING</span><i></i></div>
              <div class="metric-value">${summary.creditsRemaining}<small>MC</small></div>
              <div class="metric-sub">${summary.budgetReservePercent}% reserve (${summary.totalCredits} MC used)</div>
            </div>
            <div class="metric-card ${summary.dataFraction >= 0.5 ? 'metric-good' : 'metric-bad'}">
              <div class="metric-top"><span>DATA DOWNLINK</span><i></i></div>
              <div class="metric-value">${summary.dataReturnedMB.toFixed(1)}<small>MB</small></div>
              <div class="metric-sub">${(summary.dataFraction * 100).toFixed(0)}% of ${summary.generatedMB} MB sample</div>
            </div>
          </div>
          <div class="validation-list">
            <div class="section-label">
              <span>PHASE 5 // READINESS CHECKS</span>
              <span>${summary.passedCount} PASS · ${summary.warnCount} WARN · ${summary.failCount} FAIL</span>
            </div>
            ${validationRows}
          </div>
          <div class="mission-credit-note">
            Units: Mass (kg) · Power (W) · Data (MB) · Cost in Mission Credits (MC). Engineering calculations represent educational models.
          </div>
        </div>
      </aside>
    </div>
  </main>`;
  app.innerHTML = shell(content);
  mountScene();
}

function renderSimulating() {
  if (!room) return renderHome();
  const summary = room.result || evaluateMission(room.config);
  const currentStage = SIM_STAGES[Math.min(simStageIndex, SIM_STAGES.length - 1)];
  const progressPercent = Math.min(100, Math.round(((simStageIndex + 1) / SIM_STAGES.length) * 100));

  const content = `<main class="sim-page">
    <div class="design-heading">
      <div>
        <div class="eyebrow"><span class="eyebrow-line"></span> PHASE 6 // MISSION SIMULATION · ACTIVE FLIGHT TELEMETRY</div>
        <h1>${html(currentStage.title)}</h1>
        <p>Live simulation sequence running across 8 orbital stages. Reflects player spacecraft configuration.</p>
      </div>
      <div>
        <button class="button button-quiet" data-action="skip-sim">SKIP TO DEBRIEF <span>→</span></button>
      </div>
    </div>
    <div class="sim-layout">
      <section class="sim-viewport-card">
        <div class="scene-host" data-scene></div>
        <div class="sim-overlay-hud">
          <div class="sim-hud-top">
            <div class="sim-timer">MET ${currentStage.met}</div>
            <div class="sim-target-indicator">
              TARGET SITE: <strong>CHESAPEAKE BAY [38.9°N, 76.5°W]</strong>
            </div>
          </div>
          <div class="sim-hud-bottom">
            <div class="sim-stage-banner">
              <strong>${html(currentStage.title)}</strong>
              <p>${html(currentStage.detail)}</p>
            </div>
            <div class="sim-target-indicator">
              ALTITUDE <strong>${currentStage.alt}</strong> · VELOCITY <strong>${currentStage.vel}</strong>
            </div>
          </div>
        </div>
        <div class="sim-progress-track">
          <div class="sim-progress-fill" style="width:${progressPercent}%"></div>
        </div>
      </section>
      <aside class="sim-sidebar">
        <div class="sim-telemetry-panel">
          <span class="panel-index">LIVE SUBSYSTEM TELEMETRY</span>
          <div class="sim-telemetry-grid">
            <div class="sim-metric">
              <span>SOLAR GENERATION</span>
              <strong>${summary.effectiveGenerationW.toFixed(1)} <small>W</small></strong>
            </div>
            <div class="sim-metric">
              <span>BUS LOAD DEMAND</span>
              <strong>${summary.totalLoadW.toFixed(1)} <small>W</small></strong>
            </div>
            <div class="sim-metric">
              <span>BUFFERED DATA</span>
              <strong>${summary.generatedMB.toFixed(1)} <small>MB</small></strong>
            </div>
            <div class="sim-metric">
              <span>DOWNLINKED DATA</span>
              <strong>${summary.dataReturnedMB.toFixed(1)} <small>MB</small></strong>
            </div>
          </div>
          <div style="margin-top:14px">
            <span class="panel-index" style="margin-bottom:6px;display:block">MISSION EVENT LOG</span>
            <div class="sim-log-panel">
              ${simLogs.map((log) => `<div class="sim-log-entry ${log.warn ? 'warn' : ''}">${html(log.text)}</div>`).join('')}
            </div>
          </div>
          <div class="sim-actions">
            <small style="color:#7893a7;font:9px var(--mono)">STAGE ${simStageIndex + 1} OF ${SIM_STAGES.length}</small>
            <button class="button button-primary" data-action="skip-sim">VIEW DEBRIEF REPORT</button>
          </div>
        </div>
      </aside>
    </div>
  </main>`;
  app.innerHTML = shell(content);
  mountScene();
}

function renderResult() {
  if (!room?.result) return renderHome();
  const result = room.result;

  const checkRows = result.constraints
    .map(
      (c) =>
        `<div class="debrief-check is-${c.status.toLowerCase()}">
          <span class="tag-${c.status.toLowerCase()}">${c.status}</span>
          <div style="flex:1">
            <strong>${html(c.label)}</strong>
            <small>${html(c.detail)}</small>
          </div>
        </div>`
    )
    .join('');

  const outcomeTitle =
    result.outcomeLevel === 'BASELINE_MET'
      ? 'Baseline Science Objective Achieved'
      : result.outcomeLevel === 'THRESHOLD_MET'
      ? 'Threshold Science Objective Met (Partial Success)'
      : 'Mission Infeasible: Redesign Required';

  const content = `<main class="result-page">
    <div class="result-heading">
      <div>
        <div class="eyebrow"><span class="eyebrow-line"></span> PHASE 7 // POST-FLIGHT DEBRIEF · ${mode === 'offline' ? 'LOCAL RUN' : `ROOM ${html(room.code)}`}</div>
        <h1>${html(outcomeTitle)}</h1>
        <p>Comprehensive engineering analysis evaluated against real NASA observation datasets and mission constraints.</p>
      </div>
      <div class="result-stamp ${result.objectiveComplete ? 'stamp-success' : 'stamp-review'}">
        <span>SCORE</span>
        <strong>${result.scienceScore}</strong>
        <small>${result.passedCount} PASS · ${result.warnCount} WARN · ${result.failCount} FAIL</small>
      </div>
    </div>
    <div class="debrief-layout">
      <section class="debrief-main panel">
        <div class="panel-heading">
          <div>
            <span class="panel-index">01 / CONSTRAINT READINESS EVALUATION</span>
            <h2>Flight Performance Audit</h2>
          </div>
          <span class="mission-id">OUTCOME: ${result.outcomeLevel}</span>
        </div>
        <div class="debrief-checks">${checkRows}</div>
        <div class="explanation-block">
          <span class="panel-index">02 / WHY THIS HAPPENED (ENGINEERING TRADE-OFF ANALYSIS)</span>
          ${result.explanations.map((line) => `<p>${html(line)}</p>`).join('')}
        </div>
        <div class="explanation-block">
          <span class="panel-index">03 / RECOMMENDATIONS FOR NEXT FLIGHT ITERATION</span>
          ${result.recommendations.map((rec) => `<p style="color:#77e1e6">→ ${html(rec)}</p>`).join('')}
        </div>
        <div class="dataset-result">
          <div>
            <span class="panel-index">NASA SCIENTIFIC INTEGRATION</span>
            <strong>Observation Date: ${html(result.observation.date)}</strong>
            <small>Historical NASA POWER AOD_55: ${result.aerosolOpportunity.toFixed(2)} (dimensionless)</small>
          </div>
          <div class="target-return">
            <span>RELATIVE SCIENCE YIELD*</span>
            <b>${result.targetSignalReturned.toFixed(3)}</b>
          </div>
          <small class="dataset-caveat">
            * Relative science yield = Measured NASA AOD_55 × Data return fraction. Educational simulation index; not flight-calibrated NASA data product.
          </small>
        </div>
        <div style="margin-top:16px;padding:14px;background:#08131e;border:1px solid #1a3246">
          <span class="panel-index">SIMILAR REAL NASA MISSION</span>
          <strong style="display:block;font-size:12px;color:var(--cyan);margin:6px 0 3px">${html(result.nasaPrecedent.name)}</strong>
          <small style="color:#7e98ac;display:block;margin-bottom:6px">${html(result.nasaPrecedent.agency)}</small>
          <p style="font-size:11px;color:#a3bacd;line-height:1.6;margin:0 0 8px">${html(result.nasaPrecedent.summary)}</p>
          <a href="${result.nasaPrecedent.url}" target="_blank" rel="noreferrer" style="font:9px var(--mono);color:var(--cyan);text-decoration:none">
            Official NASA Mission Overview ↗
          </a>
        </div>
      </section>
      <aside class="debrief-aside">
        ${sceneCard('POST-MISSION ORBIT VIEW')}
        <div class="result-metrics panel">
          <span class="panel-index">FINAL TELEMETRY AUDIT</span>
          <div>
            <strong>${result.dataReturnedMB.toFixed(1)} <small>MB</small></strong>
            <span>DATA RETURNED</span>
          </div>
          <div>
            <strong>${result.totalMassKg.toFixed(1)} <small>kg</small></strong>
            <span>SPACECRAFT MASS</span>
          </div>
          <div>
            <strong>${result.powerMarginW.toFixed(1)} <small>W</small></strong>
            <span>POWER MARGIN</span>
          </div>
          <div>
            <strong>${result.creditsRemaining} <small>MC</small></strong>
            <span>BUDGET REMAINING</span>
          </div>
        </div>
      </aside>
    </div>
    <div class="result-actions">
      ${secondaryButton('EXIT TO MAIN MENU', 'home', 'home')}
      ${
        isHost()
          ? primaryButton('RE-ENTER DESIGN LAB', 'redesign', 'rocket')
          : '<span class="host-wait">Waiting for mission host to reopen design lab…</span>'
      }
    </div>
    <p class="assumption-note">${html(result.assumptions)}</p>
  </main>`;
  app.innerHTML = shell(content);
  mountScene();
}

function mountScene() {
  const host = app.querySelector<HTMLElement>('[data-scene]');
  if (host) scene.mount(host);
}

function render() {
  if (mode === 'wizard') {
    if (lobbyView) {
      lobbyView.destroy();
      lobbyView = null;
    }
    if (!wizard) {
      wizard = new MissionWizard(app, scene);
      wizard.onExit(() => {
        mode = 'menu';
        if (wizard) {
          wizard.destroy();
          wizard = null;
        }
        window.location.hash = '#/home';
        render();
      });
    }
    wizard.render();
    return;
  }
  if (wizard) {
    wizard.destroy();
    wizard = null;
  }
  if (mode === 'lobby') {
    if (!lobbyView) {
      lobbyView = new LobbyView(app);
      lobbyView.setExitHandler(() => {
        mode = 'menu';
        if (lobbyView) {
          lobbyView.destroy();
          lobbyView = null;
        }
        window.location.hash = '#/home';
        render();
      });
      void lobbyView.start();
    } else {
      lobbyView.render();
    }
    return;
  }
  if (lobbyView) {
    lobbyView.destroy();
    lobbyView = null;
  }
  if (mode === 'menu' || !room) renderHome();
  else if (room.phase === 'lobby') renderLobby();
  else if (room.phase === 'design') renderDesign();
  else if (room.phase === 'simulating') renderSimulating();
  else renderResult();
}

// Global Click Dispatcher
app.addEventListener('click', (event) => {
  if (mode === 'wizard' || mode === 'lobby') return;

  const target = (event.target as HTMLElement).closest<HTMLElement>(
    '[data-action], [data-category], [data-choice-id], [data-aod-date], [data-suit]'
  );
  if (!target) return;

  // Suit Selection
  if (target.dataset.suit) {
    suit = suitChoices.some((c) => c.id === target.dataset.suit) ? target.dataset.suit! : 'cyan';
    localStorage.setItem('mission-player-suit', suit);
    const chosenColor = suitChoices.find((c) => c.id === suit)?.color || '#77e1e6';
    scene.update({ suitColor: chosenColor });
    render();
    return;
  }

  // Design Tab Selection
  if (target.dataset.category) {
    activeCategory = target.dataset.category;
    render();
    return;
  }

  // Subsystem Component Choice
  if (target.dataset.choiceId && target.dataset.choiceCategory) {
    sendAction({ type: 'set-config', key: target.dataset.choiceCategory, value: target.dataset.choiceId });
    return;
  }

  // Observation Date Selection
  if (target.dataset.aodDate) {
    sendAction({ type: 'set-observation-date', value: target.dataset.aodDate });
    return;
  }

  // Navigation & Actions
  switch (target.dataset.action) {
    case 'open-how-to-play':
      isHowToPlayOpen = true;
      render();
      break;
    case 'close-how-to-play':
      isHowToPlayOpen = false;
      render();
      break;
    case 'menu-play':
      window.location.hash = '#/lobby';
      mode = 'lobby';
      notice = '';
      render();
      break;
    case 'start-lobby':
      window.location.hash = '#/lobby';
      mode = 'lobby';
      notice = '';
      render();
      break;
    case 'menu-customize':
      customName = name;
      menuPage = 'customize';
      notice = '';
      render();
      break;
    case 'menu-settings':
      menuPage = 'settings';
      notice = '';
      render();
      break;
    case 'menu-home':
      menuPage = 'main';
      notice = '';
      window.location.hash = '#/home';
      render();
      break;
    case 'save-customize':
      name = document.querySelector<HTMLInputElement>('#custom-name')?.value.trim().slice(0, 18) || customName || 'Flight Director';
      customName = name;
      localStorage.setItem('mission-player-callsign', name);
      sessionStorage.setItem('mission-player-name', name);
      menuPage = 'main';
      notice = 'Character preferences saved.';
      render();
      break;
    case 'toggle-autorotate':
      autoRotateSetting = !autoRotateSetting;
      localStorage.setItem('mission-auto-rotate', String(autoRotateSetting));
      scene.setAutoRotate(autoRotateSetting);
      render();
      break;
    case 'toggle-quality':
      highQualitySetting = !highQualitySetting;
      localStorage.setItem('mission-high-quality', String(highQualitySetting));
      scene.setQuality(highQualitySetting);
      render();
      break;
    case 'toggle-fullscreen':
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
      setTimeout(render, 100);
      break;
    case 'reset-camera':
      scene.resetCamera();
      break;
    case 'toggle-provenance':
      showProvenanceModal = !showProvenanceModal;
      render();
      break;
    case 'create-room':
      void createRoom();
      break;
    case 'join-room':
      void joinRoom();
      break;
    case 'start-wizard':
    case 'enter-universe':
      window.location.hash = '#/wizard';
      mode = 'wizard';
      render();
      break;
    case 'start-offline':
      window.location.hash = '#/wizard';
      mode = 'wizard';
      render();
      break;
    case 'start-design':
      sendAction({ type: 'start-design' });
      break;
    case 'simulate':
      sendAction({ type: 'simulate' });
      break;
    case 'skip-sim':
      finishSimulation();
      break;
    case 'redesign':
      sendAction({ type: 'redesign' });
      break;
    case 'dismiss-notice':
      notice = '';
      render();
      break;
    case 'home':
      event.preventDefault();
      if (mode === 'online') socket.disconnect();
      window.location.hash = '#/home';
      mode = 'menu';
      menuPage = 'main';
      if (wizard) {
        wizard.destroy();
        wizard = null;
      }
      if (lobbyView) {
        lobbyView.destroy();
        lobbyView = null;
      }
      room = null;
      playerId = '';
      reconnectToken = '';
      notice = '';
      menuPage = 'main';
      activeCategory = 'objectives';
      sessionStorage.removeItem('mission-room-code');
      sessionStorage.removeItem('mission-reconnect-token');
      render();
      break;
    case 'leave-room':
      mode = 'menu';
      room = null;
      playerId = '';
      reconnectToken = '';
      notice = 'You departed the mission room.';
      menuPage = 'main';
      socket.disconnect();
      render();
      break;
    case 'back-lobby':
      if (mode === 'offline') {
        notice = 'Offline mission remains loaded.';
        render();
      } else if (room) {
        room = { ...room, phase: 'lobby' };
        render();
      }
      break;
    case 'copy-code':
      if (room) {
        void navigator.clipboard?.writeText(room.code).then(() => {
          notice = `Room code ${room?.code} copied to clipboard.`;
          render();
        });
      }
      break;
  }
});

// Role select handler
app.addEventListener('change', (event) => {
  const target = event.target as HTMLElement;
  if (target.matches('[data-role-player]') && (target as HTMLSelectElement).dataset.rolePlayer === playerId) {
    sendAction({ type: 'set-role', value: (target as HTMLSelectElement).value });
  }
});

// Camera sensitivity slider input
app.addEventListener('input', (event) => {
  const target = event.target as HTMLElement;
  if (target.matches('#cam-sens')) {
    cameraSensitivity = parseFloat((target as HTMLInputElement).value);
    localStorage.setItem('mission-cam-sens', String(cameraSensitivity));
    scene.setCameraSensitivity(cameraSensitivity);
    const label = document.querySelector('#sens-val');
    if (label) label.textContent = `${cameraSensitivity.toFixed(1)}x`;
  }
});

// Keyboard Enter shortcuts
app.addEventListener('keydown', (event) => {
  if ((event.target as HTMLElement).matches('#room-code') && event.key === 'Enter') void joinRoom();
  if ((event.target as HTMLElement).matches('#player-name') && event.key === 'Enter') void createRoom();
});

window.addEventListener('beforeunload', () => scene.dispose());

function getRouteFromHash(): 'wizard' | 'lobby' | 'menu' {
  const hash = window.location.hash.toLowerCase();
  const clean = hash.replace(/^#\/?/, '').replace(/\/$/, '');
  if (clean === 'wizard' || clean === 'game' || clean === 'solo') {
    return 'wizard';
  }
  if (clean === 'lobby' || clean === 'team') {
    return 'lobby';
  }
  return 'menu';
}

function handleHashChange() {
  const targetRoute = getRouteFromHash();
  if (targetRoute === 'wizard') {
    if (mode !== 'wizard') {
      if (lobbyView) {
        lobbyView.destroy();
        lobbyView = null;
      }
      mode = 'wizard';
      render();
    }
  } else if (targetRoute === 'lobby') {
    if (mode !== 'lobby') {
      if (wizard) {
        wizard.destroy();
        wizard = null;
      }
      mode = 'lobby';
      render();
    }
  } else {
    if (mode !== 'menu' || menuPage !== 'main') {
      if (wizard) {
        wizard.destroy();
        wizard = null;
      }
      if (lobbyView) {
        lobbyView.destroy();
        lobbyView = null;
      }
      mode = 'menu';
      menuPage = 'main';
      render();
    }
  }
}

window.addEventListener('hashchange', handleHashChange);

const initialRoute = getRouteFromHash();
if (initialRoute === 'wizard') {
  mode = 'wizard';
} else if (initialRoute === 'lobby') {
  mode = 'lobby';
} else {
  mode = 'menu';
}

render();
