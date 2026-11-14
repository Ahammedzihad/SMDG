/**
 * ORBITONE Multiplayer Team Lobby View
 *
 * Implements the complete multiplayer lobby user interface:
 * - Entry screen (Create / Join room, callsign, preferred role)
 * - Room lobby screen (Crew roster, roles, shared decision voting, readiness checklist)
 * - Clear DEVELOPMENT MOCK badging
 * - Transport-independent interface powered by MultiplayerTransport
 */

import './lobby.css';
import {
  TEAM_ROLES,
  TEAM_ROLE_INFO,
  type TeamRole,
  type StateUpdatePayload,
  type DecisionResolvedPayload,
  type SimResultPayload
} from '@shared';
import type { MultiplayerTransport } from '../../multiplayer/transport';
import { MockTransport } from '../../multiplayer/mockTransport';
import { primaryButton, secondaryButton } from '../components';
import { renderIcon } from '../icons';

function escapeHtml(str: string): string {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export class LobbyView {
  private container: HTMLElement;
  private transport: MultiplayerTransport;
  private onExitCallback: () => void = () => {};

  private mode: 'entry' | 'room' = 'entry';
  private callsign: string;
  private roomCodeInput = '';
  private preferredRole: TeamRole = 'mission_planner';
  private notice = '';
  private noticeType: 'info' | 'success' | 'warn' | 'error' = 'info';

  private roomState: StateUpdatePayload | null = null;
  private localPlayerId = '';
  private localPlayerToken = '';
  private isHost = false;

  private simResult: SimResultPayload | null = null;

  constructor(container: HTMLElement, transport?: MultiplayerTransport) {
    this.container = container;
    this.transport = transport || new MockTransport();

    this.callsign =
      localStorage.getItem('mission-player-callsign') ||
      sessionStorage.getItem('mission-player-name') ||
      'Flight Director';

    this.initTransportListeners();
  }

  public setExitHandler(cb: () => void): void {
    this.onExitCallback = cb;
  }

  private initTransportListeners(): void {
    this.transport.on('room_created', (data) => {
      this.localPlayerId = data.playerId;
      this.localPlayerToken = data.playerToken;
      this.isHost = true;
      this.roomState = {
        roomCode: data.roomCode,
        players: data.players,
        design: data.design,
        meters: data.meters,
        validation: data.validation,
        activeDecision: null,
        simStatus: 'idle',
        version: 1
      };
      this.mode = 'room';
      this.notice = `Room "${data.roomCode}" created. Crew link online.`;
      this.noticeType = 'success';
      this.render();
    });

    this.transport.on('room_joined', (data) => {
      this.localPlayerId = data.playerId;
      this.localPlayerToken = data.playerToken;
      this.isHost = false;
      this.roomState = {
        roomCode: data.roomCode,
        players: data.players,
        design: data.design,
        meters: data.meters,
        validation: data.validation,
        activeDecision: null,
        simStatus: 'idle',
        version: 1
      };
      this.mode = 'room';
      this.notice = `Joined room "${data.roomCode}". Team synchronized.`;
      this.noticeType = 'success';
      this.render();
    });

    this.transport.on('state_update', (data) => {
      this.roomState = data;
      this.render();
    });

    this.transport.on('action_rejected', (data) => {
      this.notice = `Action rejected: ${data.reason}`;
      this.noticeType = 'error';
      this.render();
    });

    this.transport.on('decision_resolved', (data: DecisionResolvedPayload) => {
      if (data.result.passed && data.result.winner) {
        this.notice = `Voting outcome: Decision "${data.decision}" passed! Selected "${data.result.winner}".`;
        this.noticeType = 'success';
      } else {
        this.notice = `Voting outcome: Decision "${data.decision}" could not pass (${data.result.status}: ${data.result.reason}).`;
        this.noticeType = 'warn';
      }
      this.render();
    });

    this.transport.on('sim_result', (data: SimResultPayload) => {
      this.simResult = data;
      this.notice = `Mission simulation finished! Final score: ${data.score.total} pts (${data.score.rank}).`;
      this.noticeType = 'success';
      this.render();
    });

    this.transport.on('error', (data) => {
      this.notice = `Transport Error: ${data.message}`;
      this.noticeType = 'error';
      this.render();
    });

    this.transport.onConnectionChange((connected) => {
      if (!connected) {
        this.notice = 'Network connection offline. Reconnecting…';
        this.noticeType = 'warn';
      } else {
        this.notice = 'Transport connected.';
        this.noticeType = 'info';
      }
      this.render();
    });
  }

  public async start(): Promise<void> {
    if (!this.transport.isConnected) {
      await this.transport.connect();
    }
    this.render();
  }

  public destroy(): void {
    this.transport.disconnect();
    this.container.innerHTML = '';
  }

  // ==========================================================================
  // Render Methods
  // ==========================================================================

  public render(): void {
    if (this.mode === 'entry') {
      this.renderEntry();
    } else {
      this.renderRoom();
    }
  }

  private renderMockBanner(): string {
    return `
      <aside class="mock-banner" role="status" aria-label="Development Transport Notice">
        <span class="mock-badge">${escapeHtml(this.transport.transportLabel)}</span>
        <div class="mock-banner-text">
          <strong>Offline Simulation Mode:</strong> Protocol validation running locally via pure shared engine.
          Person A is implementing the live Socket.IO server on the engine branch.
        </div>
      </aside>
    `;
  }

  private renderNoticeBar(): string {
    if (!this.notice) return '';
    const alertColors: Record<string, string> = {
      info: 'var(--brand-cyan)',
      success: 'var(--brand-green)',
      warn: 'var(--brand-yellow)',
      error: 'var(--brand-coral)'
    };
    const color = alertColors[this.noticeType] || alertColors.info;
    return `
      <div class="notice-bar" role="alert" style="border-left:4px solid ${color};">
        <span>${escapeHtml(this.notice)}</span>
        <button type="button" data-lobby-action="dismiss-notice" aria-label="Dismiss">×</button>
      </div>
    `;
  }

  // --------------------------------------------------------------------------
  // Screen A: Multiplayer Entry
  // --------------------------------------------------------------------------

  private renderEntry(): void {
    const roleOptions = TEAM_ROLES.map((role) => {
      const info = TEAM_ROLE_INFO[role];
      const selected = role === this.preferredRole ? 'selected' : '';
      return `<option value="${escapeHtml(role)}" ${selected}>${escapeHtml(info.name)}</option>`;
    }).join('');

    const html = `
      <div class="lobby-container">
        ${this.renderMockBanner()}
        ${this.renderNoticeBar()}

        <header class="page-heading">
          <div>
            <div class="eyebrow"><span class="eyebrow-line"></span> MULTIPLAYER TEAM DISPATCH</div>
            <h1>Assemble your <em>space crew.</em></h1>
            <p>Collaborate in real-time with up to 4 crew members across specialized engineering disciplines.</p>
          </div>
          <div>
            ${secondaryButton('Back to Main Menu', 'lobby-exit', 'back')}
          </div>
        </header>

        <main class="lobby-entry-layout">
          <!-- Create Room Form -->
          <section class="entry-card glass-card">
            <span class="panel-index">OPTION 01 / HOST PRIVATE ROOM</span>
            <h2>Create Team Room</h2>
            <p>Generate a unique 4-letter mission code. You will lead the crew as flight host.</p>

            <div class="field-group">
              <label for="create-callsign">Your Callsign</label>
              <input id="create-callsign" type="text" maxlength="30" value="${escapeHtml(this.callsign)}" placeholder="e.g. Commander Sarah" autocomplete="nickname" />
            </div>

            <div class="field-group">
              <label for="create-role">Preferred Role</label>
              <select id="create-role">
                ${roleOptions}
              </select>
            </div>

            <div style="margin-top:12px">
              ${primaryButton('CREATE PRIVATE ROOM', 'lobby-create', 'rocket')}
            </div>
          </section>

          <!-- Join Room Form -->
          <section class="entry-card glass-card">
            <span class="panel-index">OPTION 02 / JOIN CREW</span>
            <h2>Join Existing Room</h2>
            <p>Enter the 4-letter mission code shared by your flight host.</p>

            <div class="field-group">
              <label for="join-callsign">Your Callsign</label>
              <input id="join-callsign" type="text" maxlength="30" value="${escapeHtml(this.callsign)}" placeholder="e.g. Specialist Alex" autocomplete="nickname" />
            </div>

            <div class="field-group">
              <label for="join-code">4-Letter Room Code</label>
              <input id="join-code" class="room-code-input" type="text" maxlength="4" value="${escapeHtml(this.roomCodeInput)}" placeholder="ORBT" autocomplete="off" />
            </div>

            <div class="field-group">
              <label for="join-role">Preferred Role</label>
              <select id="join-role">
                ${roleOptions}
              </select>
            </div>

            <div style="margin-top:12px">
              ${secondaryButton('JOIN TEAM ROOM', 'lobby-join', 'planet')}
            </div>
          </section>
        </main>
      </div>
    `;

    this.container.innerHTML = html;
    this.bindEntryEvents();
  }

  // --------------------------------------------------------------------------
  // Screen B: Room Lobby
  // --------------------------------------------------------------------------

  private renderRoom(): void {
    if (!this.roomState) return;

    const currentPlayers = this.roomState.players;
    const localPlayer = currentPlayers.find((p) => p.id === this.localPlayerId);
    const takenRoles = new Set(currentPlayers.map((p) => p.role));

    // 1. Crew Roster HTML
    const crewHtml = currentPlayers
      .map((player, idx) => {
        const isSelf = player.id === this.localPlayerId;
        const info = TEAM_ROLE_INFO[player.role];
        const initial = (player.name || 'C').slice(0, 1).toUpperCase();
        const roleCategories = info.categories.length > 0
          ? info.categories.map((c) => `<span class="cat-pill">${escapeHtml(c)}</span>`).join('')
          : '<span class="cat-pill">Mission Strategy & Sign-Off</span>';

        return `
          <div class="crew-card ${isSelf ? 'is-self' : ''}">
            <div class="crew-avatar-circle" style="border-color:${idx === 0 ? 'var(--brand-yellow)' : 'var(--brand-cyan)'}">
              ${escapeHtml(initial)}
            </div>
            <div class="crew-info">
              <div class="crew-name-row">
                <strong>${escapeHtml(player.name || player.id)}</strong>
                ${idx === 0 ? '<span class="tag-host">HOST</span>' : ''}
                ${isSelf ? '<span class="tag-self">YOU</span>' : ''}
              </div>
              <div class="crew-role-label">${escapeHtml(info.name)}</div>
              <div class="crew-categories">${roleCategories}</div>
            </div>
            <div class="crew-status-online">
              <i class="status-light is-online"></i>
              <span>ONLINE</span>
            </div>
          </div>
        `;
      })
      .join('');

    // 2. Role Selector Cards
    const roleSelectorHtml = TEAM_ROLES.map((role) => {
      const info = TEAM_ROLE_INFO[role];
      const isCurrent = localPlayer?.role === role;
      const claimedBy = currentPlayers.find((p) => p.role === role);
      const isClaimedByOther = claimedBy && claimedBy.id !== this.localPlayerId;

      return `
        <button
          type="button"
          class="role-card-btn ${isCurrent ? 'is-active' : ''}"
          data-lobby-action="switch-role"
          data-role="${escapeHtml(role)}"
          ${isClaimedByOther ? 'disabled' : ''}
        >
          <div class="role-header">
            <span class="role-title">${escapeHtml(info.name)}</span>
            ${isCurrent ? '<span class="tag-self">ASSIGNED</span>' : ''}
            ${isClaimedByOther ? `<span class="cat-pill" style="color:var(--brand-coral)">CLAIMED</span>` : ''}
          </div>
          <div class="role-desc">${escapeHtml(info.description)}</div>
          <div class="role-conflict">Conflict: ${escapeHtml(info.typicalConflict)}</div>
        </button>
      `;
    }).join('');

    // 3. Shared Voting HTML
    let votingHtml = '';
    const active = this.roomState.activeDecision;

    if (active) {
      const myVote = active.votes[this.localPlayerId];
      const optionsHtml = active.options
        .map((opt) => {
          const isVoted = myVote === opt;
          return `
            <button
              type="button"
              class="vote-opt-btn ${isVoted ? 'is-voted' : ''}"
              data-lobby-action="cast-vote"
              data-decision="${escapeHtml(active.decision)}"
              data-choice="${escapeHtml(opt)}"
            >
              <span>${escapeHtml(opt.replace(/_/g, ' ').toUpperCase())}</span>
              ${isVoted ? '<small>✓ Your Vote</small>' : '<small>Click to vote</small>'}
            </button>
          `;
        })
        .join('');

      votingHtml = `
        <div class="vote-active-box">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <span class="panel-index" style="color:var(--brand-cyan)">TEAM VOTING IN PROGRESS</span>
              <h3 style="margin:4px 0 0 0;color:#fff;font-size:16px;">Decision: ${escapeHtml(active.decision.replace(/_/g, ' ').toUpperCase())}</h3>
            </div>
            <span class="tag-self">${active.votedPlayerIds.length} / ${currentPlayers.length} CAST</span>
          </div>

          <p style="margin:0;font-size:12px;color:var(--text-muted)">
            ${escapeHtml(active.description || 'All crew members must vote to reach team consensus according to shared rules.')}
          </p>

          <div class="vote-options-grid">${optionsHtml}</div>

          <div class="vote-tally-bar">
            <span>Majority threshold required: <strong>${active.majorityThreshold}</strong> votes</span>
            <span>Awaiting: <strong>${active.missingPlayerIds.length}</strong> voter(s)</span>
          </div>

          <div style="display:flex;gap:10px;margin-top:4px;">
            <button type="button" class="button button-quiet" style="font-size:11px;padding:6px 12px" data-lobby-action="simulate-peer-vote">
              ⚡ Dev: Simulate Peer Vote
            </button>
          </div>
        </div>
      `;
    } else {
      votingHtml = `
        <div style="display:flex;flex-direction:column;gap:12px;">
          <p style="margin:0;font-size:12px;color:var(--text-muted)">
            Major mission trade-offs require collective crew consensus. Any crew member can propose a shared decision for a team vote.
          </p>
          <div style="display:flex;flex-wrap:wrap;gap:8px;">
            <button type="button" class="button button-quiet" data-lobby-action="propose-orbit">
              Propose Target Orbit
            </button>
            <button type="button" class="button button-quiet" data-lobby-action="propose-objective">
              Propose Science Objective
            </button>
            <button type="button" class="button button-quiet" data-lobby-action="propose-vehicle">
              Propose Launch Vehicle
            </button>
          </div>
        </div>
      `;
    }

    // 4. Pre-Launch Readiness Gates
    const hasMinPlayers = currentPlayers.length >= 2;
    const hasDistinctRoles = new Set(currentPlayers.map((p) => p.role)).size === currentPlayers.length;
    const checksPassed = this.roomState.validation.passed;
    const isReadyToStart = hasMinPlayers && hasDistinctRoles && checksPassed;

    const html = `
      <div class="lobby-container">
        ${this.renderMockBanner()}
        ${this.renderNoticeBar()}

        <header class="room-header">
          <div>
            <div class="eyebrow"><span class="eyebrow-line"></span> MISSION LOBBY</div>
            <h1>Mission Control <em>Room</em></h1>
          </div>

          <div class="room-meta-group">
            <div class="room-code-badge">
              <span class="label">ROOM CODE</span>
              <span class="code">${escapeHtml(this.roomState.roomCode)}</span>
              <button type="button" data-lobby-action="copy-code">COPY</button>
            </div>
            ${secondaryButton('LEAVE ROOM', 'lobby-leave', 'back')}
          </div>
        </header>

        <main class="room-layout">
          <!-- Left Column: Manifest, Roles, Voting -->
          <section style="display:flex;flex-direction:column;gap:20px;">
            <!-- Manifest -->
            <div class="panel glass-card">
              <div class="panel-heading">
                <div>
                  <span class="panel-index">01 / CREW MANIFEST</span>
                  <h2>Active Flight Roster</h2>
                </div>
                <span class="crew-count">${currentPlayers.length} / 4 CREW CONNECTED</span>
              </div>
              <div class="crew-roster">${crewHtml}</div>
            </div>

            <!-- Role Selector -->
            <div class="panel glass-card">
              <div class="panel-heading">
                <div>
                  <span class="panel-index">02 / TEAM ROLES</span>
                  <h2>Select Your Flight Discipline</h2>
                </div>
                <span class="panel-index">4 AUTHENTIC ROLES</span>
              </div>
              <div class="role-grid">${roleSelectorHtml}</div>
            </div>

            <!-- Shared Voting -->
            <div class="panel glass-card">
              <div class="panel-heading">
                <div>
                  <span class="panel-index">03 / SHARED DECISIONS & VOTING</span>
                  <h2>Consensus Decisions</h2>
                </div>
                <span class="panel-index">${active ? 'VOTING ACTIVE' : 'SYNCHRONIZED'}</span>
              </div>
              <div class="voting-panel">${votingHtml}</div>
            </div>

            <!-- Readiness & Launch -->
            <div class="readiness-card glass-card">
              <div class="panel-heading">
                <div>
                  <span class="panel-index">04 / PRE-LAUNCH FLIGHT GATE</span>
                  <h2>Mission Readiness Verification</h2>
                </div>
                <span class="panel-index">${isReadyToStart ? 'READY' : 'STANDBY'}</span>
              </div>

              <div class="gate-items">
                <div class="gate-item ${hasMinPlayers ? 'is-pass' : ''}">
                  <span class="gate-icon ${hasMinPlayers ? 'is-pass' : 'is-fail'}">${hasMinPlayers ? '✓' : '!'}</span>
                  <span>Minimum 2 crew members assembled: ${hasMinPlayers ? 'Verified' : 'Waiting for 2nd player'}</span>
                </div>
                <div class="gate-item ${hasDistinctRoles ? 'is-pass' : ''}">
                  <span class="gate-icon ${hasDistinctRoles ? 'is-pass' : 'is-fail'}">${hasDistinctRoles ? '✓' : '!'}</span>
                  <span>Distinct engineering roles assigned: ${hasDistinctRoles ? 'Verified' : 'Role conflict present'}</span>
                </div>
                <div class="gate-item ${checksPassed ? 'is-pass' : ''}">
                  <span class="gate-icon ${checksPassed ? 'is-pass' : 'is-fail'}">${checksPassed ? '✓' : '!'}</span>
                  <span>Engineering pre-flight checks: ${checksPassed ? 'All hard constraints passed' : 'Checks failing'}</span>
                </div>
              </div>

              <div style="margin-top:14px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
                ${
                  this.isHost
                    ? primaryButton(
                        'START MISSION SIMULATION',
                        'lobby-start-sim',
                        'rocket'
                      )
                    : '<span style="font-size:12px;color:var(--text-muted)">Waiting for flight director (host) to initiate simulation…</span>'
                }
              </div>
            </div>
          </section>

          <!-- Right Column: Dev Controls & Live Telemetry -->
          <aside style="display:flex;flex-direction:column;gap:20px;">
            <!-- Developer Controls -->
            <div class="dev-tools-card">
              <h4>Developer Simulation Tools</h4>
              <p style="margin:0;font-size:11px;color:var(--text-muted);line-height:1.4">
                Test multiplayer scenarios and edge cases locally while Person A finishes the live Socket.IO backend:
              </p>
              <div class="dev-actions-grid">
                ${
                  currentPlayers.length < 4
                    ? '<button type="button" class="dev-btn" data-lobby-action="sim-join-peer">+ Simulate Peer Join (Cadet Alex)</button>'
                    : ''
                }
                ${
                  currentPlayers.length > 1
                    ? '<button type="button" class="dev-btn" data-lobby-action="sim-leave-peer">- Simulate Peer Disconnect</button>'
                    : ''
                }
                <button type="button" class="dev-btn" data-lobby-action="sim-error">⚠ Simulate Network Error</button>
                <button type="button" class="dev-btn" data-lobby-action="sim-reconnect">↻ Simulate Reconnection Cycle</button>
              </div>
            </div>

            <!-- Compact Subsystem Meters -->
            <div class="panel glass-card">
              <span class="panel-index">LIVE ENGINEERING MARGINS</span>
              <h3 style="margin:6px 0 12px 0;font-size:15px;color:#fff;">Resource Subsystems</h3>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px;">
                <div style="background:rgba(0,0,0,0.25);padding:8px;border-radius:6px;">
                  <span style="color:var(--text-muted);font-size:10px;display:block">MASS</span>
                  <strong>${this.roomState.meters.mass.value.toFixed(1)} / ${this.roomState.meters.mass.limit} kg</strong>
                </div>
                <div style="background:rgba(0,0,0,0.25);padding:8px;border-radius:6px;">
                  <span style="color:var(--text-muted);font-size:10px;display:block">POWER</span>
                  <strong>${this.roomState.meters.power.value.toFixed(1)} / ${this.roomState.meters.power.limit} W</strong>
                </div>
                <div style="background:rgba(0,0,0,0.25);padding:8px;border-radius:6px;">
                  <span style="color:var(--text-muted);font-size:10px;display:block">BUDGET</span>
                  <strong>$${this.roomState.meters.budget.value.toFixed(1)}M / $${this.roomState.meters.budget.limit}M</strong>
                </div>
                <div style="background:rgba(0,0,0,0.25);padding:8px;border-radius:6px;">
                  <span style="color:var(--text-muted);font-size:10px;display:block">COMMS</span>
                  <strong>${this.roomState.meters.communications.value.toFixed(2)} GB/day</strong>
                </div>
              </div>
            </div>

            <!-- Role Reference Summary -->
            <div class="panel glass-card">
              <span class="panel-index">DISCIPLINE REFERENCE GUIDE</span>
              <h4 style="margin:6px 0 10px 0;font-size:13px;color:var(--brand-cyan)">Responsibilities & Trade-offs</h4>
              <div style="display:flex;flex-direction:column;gap:8px;font-size:11px;color:var(--text-muted);line-height:1.4">
                <div><strong>Mission Planner:</strong> Owns objective, target orbit, mission lifetime, and final stage sign-offs.</div>
                <div><strong>Spacecraft Engineer:</strong> Owns structure, solar panels, batteries, computer, and attitude control.</div>
                <div><strong>Science Lead:</strong> Owns payload instruments, sensors, science return, and data generation rate.</div>
                <div><strong>Comms & Budget:</strong> Owns antenna, downlink passes, cost allocation, and launch vehicle selection.</div>
              </div>
            </div>
          </aside>
        </main>
      </div>
    `;

    this.container.innerHTML = html;
    this.bindRoomEvents();
  }

  // ==========================================================================
  // Event Bindings
  // ==========================================================================

  private bindEntryEvents(): void {
    const createBtn = this.container.querySelector('[data-action="lobby-create"]');
    createBtn?.addEventListener('click', () => {
      const callsignInput = this.container.querySelector<HTMLInputElement>('#create-callsign');
      const roleSelect = this.container.querySelector<HTMLSelectElement>('#create-role');

      this.callsign = callsignInput?.value.trim() || 'Flight Director';
      this.preferredRole = (roleSelect?.value as TeamRole) || 'mission_planner';

      localStorage.setItem('mission-player-callsign', this.callsign);
      sessionStorage.setItem('mission-player-name', this.callsign);

      void this.transport.send('create_room', {
        playerName: this.callsign,
        preferredRole: this.preferredRole
      });
    });

    const joinBtn = this.container.querySelector('[data-action="lobby-join"]');
    joinBtn?.addEventListener('click', () => {
      const callsignInput = this.container.querySelector<HTMLInputElement>('#join-callsign');
      const codeInput = this.container.querySelector<HTMLInputElement>('#join-code');
      const roleSelect = this.container.querySelector<HTMLSelectElement>('#join-role');

      this.callsign = callsignInput?.value.trim() || 'Crew Member';
      const code = (codeInput?.value || '').trim().toUpperCase();
      this.preferredRole = (roleSelect?.value as TeamRole) || 'spacecraft_engineer';

      if (code.length !== 4) {
        this.notice = 'Please enter a valid 4-letter room code (e.g. "ORBT").';
        this.noticeType = 'warn';
        this.render();
        return;
      }

      localStorage.setItem('mission-player-callsign', this.callsign);
      sessionStorage.setItem('mission-player-name', this.callsign);

      void this.transport.send('join_room', {
        roomCode: code,
        playerName: this.callsign,
        preferredRole: this.preferredRole
      });
    });

    const exitBtn = this.container.querySelector('[data-action="lobby-exit"]');
    exitBtn?.addEventListener('click', () => {
      this.onExitCallback();
    });

    this.bindCommonDismissNotice();
  }

  private bindRoomEvents(): void {
    const copyBtn = this.container.querySelector('[data-lobby-action="copy-code"]');
    copyBtn?.addEventListener('click', () => {
      if (this.roomState?.roomCode) {
        void navigator.clipboard?.writeText(this.roomState.roomCode).then(() => {
          this.notice = `Room code "${this.roomState?.roomCode}" copied to clipboard!`;
          this.noticeType = 'info';
          this.render();
        });
      }
    });

    const leaveBtn = this.container.querySelector('[data-action="lobby-leave"]');
    leaveBtn?.addEventListener('click', () => {
      this.mode = 'entry';
      this.roomState = null;
      this.localPlayerId = '';
      this.localPlayerToken = '';
      this.isHost = false;
      this.notice = 'You departed the room lobby.';
      this.noticeType = 'info';
      this.render();
    });

    // Role switching
    this.container.querySelectorAll('[data-lobby-action="switch-role"]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const target = (e.currentTarget as HTMLElement).dataset.role as TeamRole;
        if (target && this.roomState) {
          void this.transport.send('set_role', {
            roomCode: this.roomState.roomCode,
            playerId: this.localPlayerId,
            role: target
          });
        }
      });
    });

    // Propose Decision buttons
    const proposeOrbitBtn = this.container.querySelector('[data-lobby-action="propose-orbit"]');
    proposeOrbitBtn?.addEventListener('click', () => {
      if (this.roomState) {
        void this.transport.send('propose_decision', {
          roomCode: this.roomState.roomCode,
          playerId: this.localPlayerId,
          decision: 'orbit',
          options: ['leo', 'sso', 'geo'],
          initialChoice: 'leo',
          description: 'Select mission orbit: Low Earth Orbit (400 km), Sun-Synchronous (600 km), or Geostationary (35,786 km).'
        });
      }
    });

    const proposeObjBtn = this.container.querySelector('[data-lobby-action="propose-objective"]');
    proposeObjBtn?.addEventListener('click', () => {
      if (this.roomState) {
        void this.transport.send('propose_decision', {
          roomCode: this.roomState.roomCode,
          playerId: this.localPlayerId,
          decision: 'objective',
          options: ['earth_observation', 'space_weather', 'deep_space_tech_demo'],
          initialChoice: 'earth_observation',
          description: 'Select core scientific mission objective for the CubeSat platform.'
        });
      }
    });

    const proposeVehBtn = this.container.querySelector('[data-lobby-action="propose-vehicle"]');
    proposeVehBtn?.addEventListener('click', () => {
      if (this.roomState) {
        void this.transport.send('propose_decision', {
          roomCode: this.roomState.roomCode,
          playerId: this.localPlayerId,
          decision: 'launch_vehicle',
          options: ['rideshare_dispenser', 'dedicated_light', 'heavy_booster'],
          initialChoice: 'rideshare_dispenser',
          description: 'Select launch vehicle: Rideshare dispenser, Dedicated Light rocket, or Heavy booster.'
        });
      }
    });

    // Casting Votes
    this.container.querySelectorAll('[data-lobby-action="cast-vote"]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const el = e.currentTarget as HTMLElement;
        const decision = el.dataset.decision;
        const choice = el.dataset.choice;
        if (decision && choice && this.roomState) {
          void this.transport.send('vote', {
            roomCode: this.roomState.roomCode,
            playerId: this.localPlayerId,
            decision,
            choice
          });
        }
      });
    });

    // Start Simulation (Host)
    const startSimBtn = this.container.querySelector('[data-action="lobby-start-sim"]');
    startSimBtn?.addEventListener('click', () => {
      if (this.roomState && this.isHost) {
        void this.transport.send('start_sim', {
          roomCode: this.roomState.roomCode,
          playerId: this.localPlayerId,
          seed: 42,
          level: 1
        });
      }
    });

    // Developer Mock Controls
    const mock = this.transport instanceof MockTransport ? (this.transport as MockTransport) : null;

    this.container.querySelector('[data-lobby-action="simulate-peer-vote"]')?.addEventListener('click', () => {
      if (mock) {
        const success = mock.simulatePeerVote();
        if (!success) {
          this.notice = 'No eligible simulated peer found to cast a vote.';
          this.noticeType = 'warn';
          this.render();
        }
      }
    });

    this.container.querySelector('[data-lobby-action="sim-join-peer"]')?.addEventListener('click', () => {
      if (mock) {
        const peer = mock.simulatePeerJoin('Cadet Alex', 'spacecraft_engineer');
        if (peer) {
          this.notice = `Simulated peer "${peer.name}" joined as ${TEAM_ROLE_INFO[peer.role].name}.`;
          this.noticeType = 'info';
          this.render();
        }
      }
    });

    this.container.querySelector('[data-lobby-action="sim-leave-peer"]')?.addEventListener('click', () => {
      if (mock) {
        const left = mock.simulatePeerLeave();
        if (left) {
          this.notice = 'Simulated peer left the room.';
          this.noticeType = 'info';
          this.render();
        }
      }
    });

    this.container.querySelector('[data-lobby-action="sim-error"]')?.addEventListener('click', () => {
      if (mock) {
        mock.simulateNetworkError('Simulated transport disconnection timeout.');
      }
    });

    this.container.querySelector('[data-lobby-action="sim-reconnect"]')?.addEventListener('click', () => {
      if (mock) {
        this.notice = 'Cycling connection…';
        this.noticeType = 'warn';
        this.render();
        mock.simulateDisconnectAndReconnect(500);
      }
    });

    this.bindCommonDismissNotice();
  }

  private bindCommonDismissNotice(): void {
    const dismissBtn = this.container.querySelector('[data-lobby-action="dismiss-notice"]');
    dismissBtn?.addEventListener('click', () => {
      this.notice = '';
      this.render();
    });
  }
}

