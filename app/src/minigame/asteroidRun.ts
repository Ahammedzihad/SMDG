/**
 * ORBITONE — Asteroid Run 2D Mini-Game
 *
 * Fast, child-friendly 2D Canvas space arcade mini-game.
 * Players pilot their CubeSat through an asteroid belt and alien UFO encounter,
 * dodging debris, collecting energy tokens/stars, and earning Orbit Credits.
 *
 * Placed directly between Stage 4 (Point Design) and Stage 5 (Pre-Launch Review).
 * Players can play multiple times or immediately click "Continue to Pre-Launch Review".
 */

import { audioManager } from '../audio/audioManager';
import { creditsManager } from '../credits/creditsManager';

export interface MinigameResult {
  score: number;
  creditsEarned: number;
  starsCollected: number;
  asteroidsDodged: number;
}

interface GameObject {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  markedForRemoval?: boolean;
}

interface Asteroid extends GameObject {
  rot: number;
  rotSpeed: number;
  points: number[];
}

interface StarToken extends GameObject {
  pulse: number;
}

interface AlienUfo extends GameObject {
  hp: number;
  shootCooldown: number;
}

interface Bullet extends GameObject {
  isPlayer: boolean;
}

export class AsteroidRunGame {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private container: HTMLElement;
  private animId: number | null = null;
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private isGameOver: boolean = false;

  // Game metrics
  private score: number = 0;
  private starsCollected: number = 0;
  private asteroidsDodged: number = 0;
  private playerHealth: number = 3;
  private maxHealth: number = 3;
  private invulnerableTimer: number = 0;

  // Player state
  private playerX: number = 100;
  private playerY: number = 200;
  private playerRadius: number = 16;
  private playerSpeed: number = 260; // px/sec

  // Entities
  private asteroids: Asteroid[] = [];
  private starTokens: StarToken[] = [];
  private alienUfos: AlienUfo[] = [];
  private bullets: Bullet[] = [];
  private particles: { x: number; y: number; vx: number; vy: number; color: string; life: number; maxLife: number }[] = [];

  // Spawners & timers
  private lastTime: number = 0;
  private asteroidTimer: number = 0;
  private starTimer: number = 0;
  private alienTimer: number = 0;
  private difficultyMultiplier: number = 1;

  // Input
  private keys: Record<string, boolean> = {};
  private touchMoveY: number | null = null;
  private touchMoveX: number | null = null;

  // Callback
  private onContinueCallback?: (result: MinigameResult) => void;

  constructor(container: HTMLElement) {
    this.container = container;
    this.container.innerHTML = this.renderTemplate();

    this.canvas = this.container.querySelector<HTMLCanvasElement>('#asteroid-canvas')!;
    this.ctx = this.canvas.getContext('2d')!;

    this.resizeCanvas();
    window.addEventListener('resize', this.handleResize);

    this.bindEvents();
  }

  private renderTemplate(): string {
    return `
      <div class="asteroid-run-wrapper">
        <header class="asteroid-run-header">
          <div class="asteroid-header-left">
            <span class="eyebrow"><span class="eyebrow-line"></span> ORBITONE ARCADE SIMULATION</span>
            <h2 class="text-xl font-bold text-on-surface">Asteroid Run: Debris Avoidance Trial</h2>
          </div>
          <div class="asteroid-header-controls">
            <div class="asteroid-stat-badge">
              <span class="material-symbols-outlined text-primary text-[18px]">favorite</span>
              <span id="ar-health-text" class="font-bold text-on-surface">3/3</span>
            </div>
            <div class="asteroid-stat-badge">
              <span class="material-symbols-outlined text-tertiary text-[18px]">stars</span>
              <span id="ar-score-text" class="font-bold text-on-surface">0</span>
            </div>
            <button id="ar-pause-btn" class="button button-quiet" style="min-height:36px; padding:0 12px; font-size:12px;">PAUSE</button>
            <button id="ar-skip-btn" class="button button-secondary" style="min-height:36px; padding:0 16px; font-size:12px;">SKIP TO REVIEW →</button>
          </div>
        </header>

        <div class="asteroid-canvas-container">
          <canvas id="asteroid-canvas"></canvas>

          <!-- On-screen touch D-Pad for Mobile -->
          <div class="asteroid-mobile-controls">
            <div class="dpad-group">
              <button id="dpad-up" class="dpad-btn" aria-label="Up">▲</button>
              <div class="dpad-middle">
                <button id="dpad-left" class="dpad-btn" aria-label="Left">◀</button>
                <button id="dpad-down" class="dpad-btn" aria-label="Down">▼</button>
                <button id="dpad-right" class="dpad-btn" aria-label="Right">▶</button>
              </div>
            </div>
            <button id="dpad-fire" class="fire-btn" aria-label="Pulse Shield">⚡ PULSE</button>
          </div>

          <!-- Game Over Overlay -->
          <div id="ar-game-over-modal" class="asteroid-overlay hidden">
            <div class="asteroid-result-card glass-card">
              <span class="material-symbols-outlined text-[48px] text-primary" id="ar-result-icon">rocket_launch</span>
              <h3 class="text-2xl font-bold text-on-surface" id="ar-result-title">Sector Cleared!</h3>
              <p class="text-on-surface-variant text-sm mt-1" id="ar-result-msg">Spacecraft telemetry synchronized with mission control.</p>

              <div class="asteroid-scores-grid">
                <div class="score-box">
                  <span class="score-label">FINAL SCORE</span>
                  <strong class="score-val text-primary" id="ar-final-score">0</strong>
                </div>
                <div class="score-box">
                  <span class="score-label">ORBIT CREDITS</span>
                  <strong class="score-val text-secondary" id="ar-final-credits">+0</strong>
                </div>
                <div class="score-box">
                  <span class="score-label">STARS COLLECTED</span>
                  <strong class="score-val text-tertiary" id="ar-final-stars">0</strong>
                </div>
                <div class="score-box">
                  <span class="score-label">DEBRIS EVADED</span>
                  <strong class="score-val text-on-surface" id="ar-final-dodged">0</strong>
                </div>
              </div>

              <div class="flex gap-space-sm mt-space-md w-full justify-center">
                <button id="ar-retry-btn" class="button button-quiet" style="min-height:44px; padding:0 20px;">Play Again</button>
                <button id="ar-continue-btn" class="button button-primary" style="min-height:44px; padding:0 24px;">Continue to Pre-Launch Review →</button>
              </div>
            </div>
          </div>
        </div>

        <footer class="asteroid-run-footer">
          <div class="flex items-center gap-space-sm text-body-xs text-on-surface-variant">
            <span class="material-symbols-outlined text-secondary text-[16px]">keyboard</span>
            <span>Controls: Arrow Keys or WASD to Navigate · Spacebar to Fire Pulse Beam · Avoid Asteroids & UFOs</span>
          </div>
        </footer>
      </div>
    `;
  }

  private handleResize = (): void => {
    this.resizeCanvas();
  };

  private resizeCanvas(): void {
    const rect = this.canvas.parentElement?.getBoundingClientRect();
    if (rect && rect.width > 0 && rect.height > 0) {
      this.canvas.width = rect.width;
      this.canvas.height = Math.max(340, Math.min(rect.height, 480));
    } else {
      this.canvas.width = 800;
      this.canvas.height = 420;
    }
  }

  private bindEvents(): void {
    // Keyboard
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);

    // Skip Button
    this.container.querySelector('#ar-skip-btn')?.addEventListener('click', () => {
      this.finishGame();
    });

    // Pause Button
    const pauseBtn = this.container.querySelector<HTMLButtonElement>('#ar-pause-btn');
    pauseBtn?.addEventListener('click', () => {
      this.isPaused = !this.isPaused;
      pauseBtn.textContent = this.isPaused ? 'RESUME' : 'PAUSE';
      if (!this.isPaused && this.isRunning) {
        this.lastTime = performance.now();
      }
    });

    // Continue / Retry
    this.container.querySelector('#ar-continue-btn')?.addEventListener('click', () => {
      this.finishGame();
    });
    this.container.querySelector('#ar-retry-btn')?.addEventListener('click', () => {
      this.restart();
    });

    // Mobile D-Pad Buttons
    const setupDpad = (id: string, key: string) => {
      const btn = this.container.querySelector(id);
      if (!btn) return;
      btn.addEventListener('touchstart', (e) => { e.preventDefault(); this.keys[key] = true; });
      btn.addEventListener('touchend', (e) => { e.preventDefault(); this.keys[key] = false; });
      btn.addEventListener('mousedown', () => { this.keys[key] = true; });
      btn.addEventListener('mouseup', () => { this.keys[key] = false; });
    };

    setupDpad('#dpad-up', 'ArrowUp');
    setupDpad('#dpad-down', 'ArrowDown');
    setupDpad('#dpad-left', 'ArrowLeft');
    setupDpad('#dpad-right', 'ArrowRight');

    const fireBtn = this.container.querySelector('#dpad-fire');
    if (fireBtn) {
      fireBtn.addEventListener('click', () => this.fireBullet());
    }

    // Touch dragging on canvas
    this.canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        const rect = this.canvas.getBoundingClientRect();
        this.playerX = Math.max(20, Math.min(this.canvas.width - 20, e.touches[0].clientX - rect.left));
        this.playerY = Math.max(20, Math.min(this.canvas.height - 20, e.touches[0].clientY - rect.top));
      }
    });
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    this.keys[e.key] = true;
    if (e.code === 'Space') {
      e.preventDefault();
      this.fireBullet();
    }
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    this.keys[e.key] = false;
  };

  public onContinue(callback: (result: MinigameResult) => void): void {
    this.onContinueCallback = callback;
  }

  public start(): void {
    this.isRunning = true;
    this.isPaused = false;
    this.isGameOver = false;
    this.score = 0;
    this.starsCollected = 0;
    this.asteroidsDodged = 0;
    this.playerHealth = 3;
    this.asteroids = [];
    this.starTokens = [];
    this.alienUfos = [];
    this.bullets = [];
    this.particles = [];
    this.difficultyMultiplier = 1;

    this.playerX = 80;
    this.playerY = this.canvas.height / 2;

    this.container.querySelector('#ar-game-over-modal')?.classList.add('hidden');
    this.updateHud();

    // Set audio mood
    audioManager.setMusicMood('assembly');

    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  public restart(): void {
    this.start();
  }

  private fireBullet(): void {
    if (!this.isRunning || this.isPaused || this.isGameOver) return;
    this.bullets.push({
      x: this.playerX + 20,
      y: this.playerY,
      radius: 4,
      vx: 550,
      vy: 0,
      isPlayer: true
    });
    audioManager.play('selection');
  }

  private loop = (time: number): void => {
    if (!this.isRunning) return;

    const dt = Math.min((time - this.lastTime) / 1000, 0.1);
    this.lastTime = time;

    if (!this.isPaused && !this.isGameOver) {
      this.update(dt);
    }
    this.render();

    this.animId = requestAnimationFrame(this.loop);
  };

  private update(dt: number): void {
    const width = this.canvas.width;
    const height = this.canvas.height;

    // Gradual difficulty increase
    this.difficultyMultiplier += dt * 0.04;

    // Movement
    if (this.keys['ArrowUp'] || this.keys['w'] || this.keys['W']) {
      this.playerY -= this.playerSpeed * dt;
    }
    if (this.keys['ArrowDown'] || this.keys['s'] || this.keys['S']) {
      this.playerY += this.playerSpeed * dt;
    }
    if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) {
      this.playerX -= this.playerSpeed * dt;
    }
    if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) {
      this.playerX += this.playerSpeed * dt;
    }

    // Clamp player
    this.playerX = Math.max(this.playerRadius + 10, Math.min(width - this.playerRadius - 10, this.playerX));
    this.playerY = Math.max(this.playerRadius + 10, Math.min(height - this.playerRadius - 10, this.playerY));

    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
    }

    // Passive score
    this.score += Math.round(dt * 15 * this.difficultyMultiplier);

    // Spawn Asteroids
    this.asteroidTimer += dt;
    const asteroidInterval = Math.max(0.6, 1.8 / this.difficultyMultiplier);
    if (this.asteroidTimer > asteroidInterval) {
      this.asteroidTimer = 0;
      this.spawnAsteroid();
    }

    // Spawn Star Tokens
    this.starTimer += dt;
    if (this.starTimer > 2.5) {
      this.starTimer = 0;
      this.spawnStarToken();
    }

    // Spawn Alien UFO
    this.alienTimer += dt;
    if (this.alienTimer > 8.0) {
      this.alienTimer = 0;
      this.spawnAlienUfo();
    }

    // Update Asteroids
    this.asteroids.forEach((ast) => {
      ast.x += ast.vx * dt;
      ast.y += ast.vy * dt;
      ast.rot += ast.rotSpeed * dt;

      // Check evasion
      if (ast.x + ast.radius < 0) {
        ast.markedForRemoval = true;
        this.asteroidsDodged++;
        this.score += 25;
      }

      // Check collision with player
      if (this.invulnerableTimer <= 0) {
        const dist = Math.hypot(ast.x - this.playerX, ast.y - this.playerY);
        if (dist < ast.radius + this.playerRadius) {
          this.hitPlayer();
          ast.markedForRemoval = true;
          this.spawnExplosion(ast.x, ast.y, '#ffb86c', 16);
        }
      }
    });

    // Update Star Tokens
    this.starTokens.forEach((star) => {
      star.x += star.vx * dt;
      star.pulse += dt * 4;

      if (star.x + star.radius < 0) {
        star.markedForRemoval = true;
      }

      const dist = Math.hypot(star.x - this.playerX, star.y - this.playerY);
      if (dist < star.radius + this.playerRadius + 8) {
        star.markedForRemoval = true;
        this.starsCollected++;
        this.score += 75;
        audioManager.play('success');
        this.spawnExplosion(star.x, star.y, '#ffd166', 10);
      }
    });

    // Update Alien UFOs
    this.alienUfos.forEach((ufo) => {
      ufo.x += ufo.vx * dt;
      ufo.y += Math.sin(timeToSeconds(ufo.x)) * 40 * dt;
      ufo.shootCooldown -= dt;

      if (ufo.shootCooldown <= 0) {
        ufo.shootCooldown = 2.2;
        // Shoot at player
        const angle = Math.atan2(this.playerY - ufo.y, this.playerX - ufo.x);
        this.bullets.push({
          x: ufo.x - 15,
          y: ufo.y,
          radius: 4,
          vx: Math.cos(angle) * 220,
          vy: Math.sin(angle) * 220,
          isPlayer: false
        });
      }

      if (ufo.x + ufo.radius < 0) {
        ufo.markedForRemoval = true;
      }
    });

    // Update Bullets
    this.bullets.forEach((b) => {
      b.x += b.vx * dt;
      b.y += b.vy * dt;

      if (b.x < 0 || b.x > width || b.y < 0 || b.y > height) {
        b.markedForRemoval = true;
      }

      if (b.isPlayer) {
        // Bullet hits asteroid
        for (const ast of this.asteroids) {
          if (Math.hypot(ast.x - b.x, ast.y - b.y) < ast.radius + b.radius) {
            b.markedForRemoval = true;
            ast.markedForRemoval = true;
            this.score += 50;
            this.spawnExplosion(ast.x, ast.y, '#ffb86c', 12);
            audioManager.play('component_remove');
            break;
          }
        }
        // Bullet hits UFO
        for (const ufo of this.alienUfos) {
          if (Math.hypot(ufo.x - b.x, ufo.y - b.y) < ufo.radius + b.radius) {
            b.markedForRemoval = true;
            ufo.hp -= 1;
            if (ufo.hp <= 0) {
              ufo.markedForRemoval = true;
              this.score += 150;
              this.spawnExplosion(ufo.x, ufo.y, '#ff5370', 20);
              audioManager.play('selection');
            }
            break;
          }
        }
      } else {
        // Enemy bullet hits player
        if (this.invulnerableTimer <= 0) {
          if (Math.hypot(b.x - this.playerX, b.y - this.playerY) < b.radius + this.playerRadius) {
            b.markedForRemoval = true;
            this.hitPlayer();
          }
        }
      }
    });

    // Particles
    this.particles.forEach((p) => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life += dt;
    });

    // Cleanup
    this.asteroids = this.asteroids.filter((a) => !a.markedForRemoval);
    this.starTokens = this.starTokens.filter((s) => !s.markedForRemoval);
    this.alienUfos = this.alienUfos.filter((u) => !u.markedForRemoval);
    this.bullets = this.bullets.filter((b) => !b.markedForRemoval);
    this.particles = this.particles.filter((p) => p.life < p.maxLife);

    this.updateHud();
  }

  private hitPlayer(): void {
    this.playerHealth--;
    this.invulnerableTimer = 1.6;
    audioManager.play('warning');
    this.spawnExplosion(this.playerX, this.playerY, '#ff5370', 16);

    if (this.playerHealth <= 0) {
      this.triggerGameOver();
    }
  }

  private spawnAsteroid(): void {
    const radius = 14 + Math.random() * 22;
    const pointsCount = 7 + Math.floor(Math.random() * 4);
    const points: number[] = [];
    for (let i = 0; i < pointsCount; i++) {
      points.push(0.75 + Math.random() * 0.5);
    }

    this.asteroids.push({
      x: this.canvas.width + radius + 10,
      y: radius + Math.random() * (this.canvas.height - radius * 2),
      radius,
      vx: -(140 + Math.random() * 120) * this.difficultyMultiplier,
      vy: (Math.random() - 0.5) * 40,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 2,
      points
    });
  }

  private spawnStarToken(): void {
    this.starTokens.push({
      x: this.canvas.width + 20,
      y: 30 + Math.random() * (this.canvas.height - 60),
      radius: 12,
      vx: -110,
      vy: (Math.random() - 0.5) * 20,
      pulse: 0
    });
  }

  private spawnAlienUfo(): void {
    this.alienUfos.push({
      x: this.canvas.width + 30,
      y: 40 + Math.random() * (this.canvas.height - 80),
      radius: 18,
      vx: -70,
      vy: 0,
      hp: 2,
      shootCooldown: 1.5
    });
  }

  private spawnExplosion(x: number, y: number, color: string, count: number): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 140;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        life: 0,
        maxLife: 0.35 + Math.random() * 0.3
      });
    }
  }

  private updateHud(): void {
    const scoreEl = this.container.querySelector('#ar-score-text');
    if (scoreEl) scoreEl.textContent = this.score.toString();

    const healthEl = this.container.querySelector('#ar-health-text');
    if (healthEl) healthEl.textContent = `${Math.max(0, this.playerHealth)}/${this.maxHealth}`;
  }

  private render(): void {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Background deep space gradient
    ctx.fillStyle = '#060d17';
    ctx.fillRect(0, 0, w, h);

    // Subtle background stars grid
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    for (let i = 0; i < 40; i++) {
      const sx = (i * 97 + (Date.now() * 0.02 * (i % 3 + 1))) % w;
      const sy = (i * 73) % h;
      ctx.fillRect(w - sx, sy, (i % 3) + 1, (i % 3) + 1);
    }

    // Render particles
    this.particles.forEach((p) => {
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, 1 - p.life / p.maxLife);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Render Asteroids
    this.asteroids.forEach((ast) => {
      ctx.save();
      ctx.translate(ast.x, ast.y);
      ctx.rotate(ast.rot);

      ctx.beginPath();
      const numPts = ast.points.length;
      for (let i = 0; i < numPts; i++) {
        const angle = (i / numPts) * Math.PI * 2;
        const r = ast.radius * ast.points[i];
        const px = Math.cos(angle) * r;
        const py = Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();

      ctx.fillStyle = '#59697f';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#859bb8';
      ctx.stroke();

      ctx.restore();
    });

    // Render Star Tokens
    this.starTokens.forEach((star) => {
      ctx.save();
      ctx.translate(star.x, star.y);
      const pulseScale = 1 + Math.sin(star.pulse) * 0.15;
      ctx.scale(pulseScale, pulseScale);

      // Glow
      ctx.shadowColor = '#ffd166';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#ffd166';

      // 5-point star
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        ctx.lineTo(Math.cos(((18 + i * 72) * Math.PI) / 180) * star.radius, -Math.sin(((18 + i * 72) * Math.PI) / 180) * star.radius);
        ctx.lineTo(Math.cos(((54 + i * 72) * Math.PI) / 180) * (star.radius * 0.5), -Math.sin(((54 + i * 72) * Math.PI) / 180) * (star.radius * 0.5));
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });

    // Render Alien UFOs
    this.alienUfos.forEach((ufo) => {
      ctx.save();
      ctx.translate(ufo.x, ufo.y);

      // Saucer dome
      ctx.beginPath();
      ctx.arc(0, -4, ufo.radius * 0.5, Math.PI, 0);
      ctx.fillStyle = 'rgba(100, 255, 218, 0.6)';
      ctx.fill();

      // Saucer body
      ctx.beginPath();
      ctx.ellipse(0, 2, ufo.radius, ufo.radius * 0.45, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#ff5370';
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#ff9aa2';
      ctx.stroke();

      ctx.restore();
    });

    // Render Bullets
    this.bullets.forEach((b) => {
      ctx.save();
      ctx.fillStyle = b.isPlayer ? '#77e1e6' : '#ff5370';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Render Player CubeSat
    ctx.save();
    ctx.translate(this.playerX, this.playerY);

    if (this.invulnerableTimer > 0 && Math.floor(Date.now() / 80) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    // Engine exhaust glow
    ctx.fillStyle = '#ffb86c';
    ctx.beginPath();
    ctx.moveTo(-16, -6);
    ctx.lineTo(-24 - Math.random() * 8, 0);
    ctx.lineTo(-16, 6);
    ctx.closePath();
    ctx.fill();

    // Satellite chassis (gold/foil CubeSat)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-14, -12, 28, 24);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#ffd166';
    ctx.strokeRect(-14, -12, 28, 24);

    // Blue solar panel wings
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(-10, -22, 20, 9);
    ctx.fillRect(-10, 13, 20, 9);
    ctx.strokeStyle = '#38bdf8';
    ctx.strokeRect(-10, -22, 20, 9);
    ctx.strokeRect(-10, 13, 20, 9);

    // Instrument lens
    ctx.fillStyle = '#77e1e6';
    ctx.beginPath();
    ctx.arc(14, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private triggerGameOver(): void {
    this.isGameOver = true;
    audioManager.play('warning');

    // Calculate credits reward
    const earnedCredits = Math.max(10, Math.floor(this.score / 15) + this.starsCollected * 10);
    creditsManager.addCredits(earnedCredits, 'Asteroid Run Reward');

    // Achievements
    if (this.score >= 150) creditsManager.unlockAchievement('asteroid_rookie');
    if (this.score >= 400) creditsManager.unlockAchievement('asteroid_ace');

    const modal = this.container.querySelector('#ar-game-over-modal');
    if (modal) {
      modal.classList.remove('hidden');

      const titleEl = modal.querySelector('#ar-result-title');
      const iconEl = modal.querySelector('#ar-result-icon');
      if (titleEl) titleEl.textContent = this.playerHealth > 0 ? 'Sector Navigated Successfully!' : 'Shield Depleted!';
      if (iconEl) iconEl.textContent = this.playerHealth > 0 ? 'stars' : 'warning';

      modal.querySelector('#ar-final-score')!.textContent = this.score.toString();
      modal.querySelector('#ar-final-credits')!.textContent = `+${earnedCredits}`;
      modal.querySelector('#ar-final-stars')!.textContent = this.starsCollected.toString();
      modal.querySelector('#ar-final-dodged')!.textContent = this.asteroidsDodged.toString();
    }
  }

  public finishGame(): void {
    this.destroy();
    if (this.onContinueCallback) {
      const earnedCredits = Math.max(10, Math.floor(this.score / 15) + this.starsCollected * 10);
      this.onContinueCallback({
        score: this.score,
        creditsEarned: earnedCredits,
        starsCollected: this.starsCollected,
        asteroidsDodged: this.asteroidsDodged
      });
    }
  }

  public destroy(): void {
    this.isRunning = false;
    if (this.animId !== null) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }
}

function timeToSeconds(val: number): number {
  return val * 0.05;
}
