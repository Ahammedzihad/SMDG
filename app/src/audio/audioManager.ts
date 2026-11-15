/**
 * ORBITONE Centralized Audio Manager (Phase P3 + Ambient Space Music)
 *
 * Implements a lightweight, native Web Audio API system providing:
 * 1. Interaction Sound Effects (child-friendly, low-latency procedural SFX).
 * 2. Original Ambient Space Music (continuous procedural synth pads & harmonics).
 *
 * Dual Independent Controls:
 * - Sound Effects: toggled independently, persisted in 'orbitone_audio_enabled' (default: MUTED).
 * - Ambient Space Music: toggled independently, persisted in 'orbitone_music_enabled' (default: MUTED).
 *
 * Requirements:
 * - Single master AudioContext shared between SFX and Ambient Music.
 * - Dedicated GainNodes: sfxGain and musicGain routed to destination.
 * - Initial state: BOTH MUTED by default until explicit user opt-in.
 * - 100% self-contained synthesis: zero external audio assets or network requests.
 * - Context-aware atmospheric moods ('menu', 'design', 'assembly', 'launch', 'debrief').
 * - Touch targets >= 44px for all controls.
 */

export type SoundEvent =
  | 'ui_click'
  | 'selection'
  | 'component_equip'
  | 'component_remove'
  | 'success'
  | 'warning'
  | 'stage_transition'
  | 'launch'
  | 'mission_complete';

export type MusicMood = 'menu' | 'design' | 'assembly' | 'launch' | 'debrief' | 'arcade';

interface MoodPreset {
  padFreqs: number[];       // 4 harmonic frequencies
  padTypes: OscillatorType[];
  filterCutoff: number;    // Base lowpass cutoff
  filterQ: number;
  lfoRate: number;         // Filter breathing speed (Hz)
  lfoDepth: number;        // Modulation depth (Hz)
  chimeNotes: number[];    // Starlight chime frequencies
  chimeInterval: number;   // Interval between chimes (ms)
}

const MOOD_PRESETS: Record<MusicMood, MoodPreset> = {
  // Main Menu: Calm, vast open cosmic expanse (Cadd9 / Cmaj9)
  menu: {
    padFreqs: [130.81, 196.00, 261.63, 293.66], // C3, G3, C4, D4
    padTypes: ['sine', 'triangle', 'sine', 'sine'],
    filterCutoff: 380,
    filterQ: 1.2,
    lfoRate: 0.07,
    lfoDepth: 70,
    chimeNotes: [523.25, 659.25, 783.99, 1046.50], // C5, E5, G5, C6
    chimeInterval: 5500
  },
  // Design Stages (1-3, 5): Analytical focus, open curiosity (Fmaj7 / Cadd4)
  design: {
    padFreqs: [174.61, 261.63, 329.63, 392.00], // F3, C4, E4, G4
    padTypes: ['sine', 'triangle', 'triangle', 'sine'],
    filterCutoff: 440,
    filterQ: 1.4,
    lfoRate: 0.08,
    lfoDepth: 80,
    chimeNotes: [587.33, 659.25, 783.99, 880.00], // D5, E5, G5, A5
    chimeInterval: 6000
  },
  // Spacecraft Assembly Cleanroom (Stage 4): Precise, high-tech, subtle rhythmic warmth (D major)
  assembly: {
    padFreqs: [146.83, 220.00, 293.66, 369.99], // D3, A3, D4, F#4
    padTypes: ['triangle', 'sine', 'triangle', 'sine'],
    filterCutoff: 520,
    filterQ: 1.6,
    lfoRate: 0.10,
    lfoDepth: 90,
    chimeNotes: [587.33, 739.99, 880.00, 1174.66], // D5, F#5, A5, D6
    chimeInterval: 4800
  },
  // Launch Countdown (Stage 6): Low rumble, anticipation, ascending energy (G minor)
  launch: {
    padFreqs: [98.00, 146.83, 196.00, 233.08], // G2, D3, G3, Bb3
    padTypes: ['sawtooth', 'sine', 'triangle', 'sine'],
    filterCutoff: 320,
    filterQ: 2.0,
    lfoRate: 0.12,
    lfoDepth: 60,
    chimeNotes: [392.00, 466.16, 587.33, 783.99], // G4, Bb4, D5, G5
    chimeInterval: 4000
  },
  // Mission Debrief (Stage 7): Warm reflection, peaceful achievement (Cmaj7)
  debrief: {
    padFreqs: [130.81, 164.81, 196.00, 246.94], // C3, E3, G3, B3
    padTypes: ['sine', 'triangle', 'sine', 'sine'],
    filterCutoff: 460,
    filterQ: 1.2,
    lfoRate: 0.06,
    lfoDepth: 60,
    chimeNotes: [523.25, 659.25, 987.77, 1046.50], // C5, E5, B5, C6
    chimeInterval: 5200
  },
  // Arcade / Asteroid Run Mini-Game: Upbeat, retro-futuristic, lively arpeggios (A minor / C major)
  arcade: {
    padFreqs: [220.00, 261.63, 329.63, 440.00], // A3, C4, E4, A4
    padTypes: ['triangle', 'triangle', 'sine', 'triangle'],
    filterCutoff: 650,
    filterQ: 1.8,
    lfoRate: 0.18,
    lfoDepth: 120,
    chimeNotes: [440.00, 523.25, 659.25, 783.99, 880.00], // A4, C5, E5, G5, A5
    chimeInterval: 2400
  }
};

const SFX_STORAGE_KEY = 'orbitone_audio_enabled';
const SFX_VOLUME_KEY = 'orbitone_audio_volume';
const MUSIC_STORAGE_KEY = 'orbitone_music_enabled';
const MUSIC_VOLUME_KEY = 'orbitone_music_volume';

class AudioManager {
  private ctx: AudioContext | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;

  // Sound Effects State (Default strictly MUTED until user opt-in)
  private sfxEnabled: boolean = false;
  private sfxVolume: number = 0.4;

  // Ambient Music State (Default strictly MUTED until user opt-in)
  private musicEnabled: boolean = false;
  private musicVolume: number = 0.3;
  private currentMood: MusicMood = 'menu';

  // Ambient Synthesizer Internal Nodes
  private padOscs: OscillatorNode[] = [];
  private filterNode: BiquadFilterNode | null = null;
  private lfoOsc: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  private chimeTimer: ReturnType<typeof setInterval> | null = null;

  // Debouncing for SFX
  private lastPlayTimes: Map<string, number> = new Map();
  private globalLastPlayTime: number = 0;

  constructor() {
    // Read persisted audio preferences
    try {
      this.sfxEnabled = localStorage.getItem(SFX_STORAGE_KEY) === 'true';
      const storedSfxVol = localStorage.getItem(SFX_VOLUME_KEY);
      if (storedSfxVol !== null) {
        const parsed = parseFloat(storedSfxVol);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) this.sfxVolume = parsed;
      }

      this.musicEnabled = localStorage.getItem(MUSIC_STORAGE_KEY) === 'true';
      const storedMusicVol = localStorage.getItem(MUSIC_VOLUME_KEY);
      if (storedMusicVol !== null) {
        const parsed = parseFloat(storedMusicVol);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) this.musicVolume = parsed;
      }
    } catch {
      this.sfxEnabled = false;
      this.musicEnabled = false;
    }
  }

  /**
   * Lazy initializes the shared Web Audio AudioContext and dedicated GainNodes.
   */
  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;

      try {
        this.ctx = new AudioCtx();

        // 1. Dedicated SFX channel
        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.setValueAtTime(this.sfxEnabled ? this.sfxVolume : 0, this.ctx.currentTime);
        this.sfxGain.connect(this.ctx.destination);

        // 2. Dedicated Ambient Music channel
        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.setValueAtTime(this.musicEnabled ? this.musicVolume : 0, this.ctx.currentTime);
        this.musicGain.connect(this.ctx.destination);
      } catch (err) {
        console.warn('[AudioManager] Failed to initialize AudioContext:', err);
        return null;
      }
    }

    // Handle browser autoplay policy
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  // ========================================================================
  // Sound Effects (SFX) Controls & Backwards Compatibility
  // ========================================================================

  public isEnabled(): boolean {
    return this.sfxEnabled;
  }

  public isSfxEnabled(): boolean {
    return this.sfxEnabled;
  }

  public getVolume(): number {
    return this.sfxVolume;
  }

  public getSfxVolume(): number {
    return this.sfxVolume;
  }

  public setVolume(vol: number): void {
    this.setSfxVolume(vol);
  }

  public setSfxVolume(vol: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
    try {
      localStorage.setItem(SFX_VOLUME_KEY, this.sfxVolume.toFixed(2));
    } catch {}

    const ctx = this.getContext();
    if (ctx && this.sfxGain && this.sfxEnabled) {
      this.sfxGain.gain.cancelScheduledValues(ctx.currentTime);
      this.sfxGain.gain.setValueAtTime(this.sfxVolume, ctx.currentTime);
    }
  }

  public toggleMute(): boolean {
    return this.toggleSfxMute();
  }

  public toggleSfxMute(): boolean {
    this.sfxEnabled = !this.sfxEnabled;
    try {
      localStorage.setItem(SFX_STORAGE_KEY, this.sfxEnabled ? 'true' : 'false');
    } catch {}

    const ctx = this.getContext();
    if (ctx && this.sfxGain) {
      if (this.sfxEnabled) {
        if (ctx.state === 'suspended') ctx.resume().catch(() => {});
        this.sfxGain.gain.cancelScheduledValues(ctx.currentTime);
        this.sfxGain.gain.setValueAtTime(this.sfxVolume, ctx.currentTime);
        this.play('ui_click');
      } else {
        this.sfxGain.gain.cancelScheduledValues(ctx.currentTime);
        this.sfxGain.gain.setValueAtTime(0, ctx.currentTime);
      }
    }

    this.dispatchStateChangeEvent();
    return this.sfxEnabled;
  }

  public setEnabled(enabled: boolean): void {
    if (this.sfxEnabled === enabled) return;
    this.sfxEnabled = enabled;
    try {
      localStorage.setItem(SFX_STORAGE_KEY, this.sfxEnabled ? 'true' : 'false');
    } catch {}

    const ctx = this.getContext();
    if (ctx && this.sfxGain) {
      this.sfxGain.gain.cancelScheduledValues(ctx.currentTime);
      this.sfxGain.gain.setValueAtTime(this.sfxEnabled ? this.sfxVolume : 0, ctx.currentTime);
    }

    this.dispatchStateChangeEvent();
  }

  // ========================================================================
  // Ambient Space Music Controls
  // ========================================================================

  public isMusicEnabled(): boolean {
    return this.musicEnabled;
  }

  public getMusicVolume(): number {
    return this.musicVolume;
  }

  public setMusicVolume(vol: number): void {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    try {
      localStorage.setItem(MUSIC_VOLUME_KEY, this.musicVolume.toFixed(2));
    } catch {}

    const ctx = this.getContext();
    if (ctx && this.musicGain && this.musicEnabled) {
      this.musicGain.gain.cancelScheduledValues(ctx.currentTime);
      this.musicGain.gain.setValueAtTime(this.musicVolume, ctx.currentTime);
    }
  }

  public toggleMusicMute(): boolean {
    this.musicEnabled = !this.musicEnabled;
    try {
      localStorage.setItem(MUSIC_STORAGE_KEY, this.musicEnabled ? 'true' : 'false');
    } catch {}

    const ctx = this.getContext();
    if (ctx) {
      if (this.musicEnabled) {
        if (ctx.state === 'suspended') ctx.resume().catch(() => {});
        this.startAmbientMusic();
      } else {
        this.stopAmbientMusic();
      }
    }

    this.dispatchStateChangeEvent();
    return this.musicEnabled;
  }

  public setMusicEnabled(enabled: boolean): void {
    if (this.musicEnabled === enabled) return;
    this.musicEnabled = enabled;
    try {
      localStorage.setItem(MUSIC_STORAGE_KEY, this.musicEnabled ? 'true' : 'false');
    } catch {}

    const ctx = this.getContext();
    if (ctx) {
      if (this.musicEnabled) {
        this.startAmbientMusic();
      } else {
        this.stopAmbientMusic();
      }
    }

    this.dispatchStateChangeEvent();
  }

  /**
   * Sets the context-aware atmospheric mood of the ambient soundtrack.
   * Smoothly cross-glides harmonic pad frequencies and filters over 1.8 seconds.
   */
  public setMusicMood(mood: MusicMood): void {
    if (this.currentMood === mood) return;
    this.currentMood = mood;

    if (!this.musicEnabled || !this.ctx || this.padOscs.length === 0) {
      return;
    }

    this.applyMoodTransition(mood);
  }

  public getMusicMood(): MusicMood {
    return this.currentMood;
  }

  private dispatchStateChangeEvent(): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('orbitone:audio-state-changed', {
          detail: {
            sfxEnabled: this.sfxEnabled,
            musicEnabled: this.musicEnabled,
            enabled: this.sfxEnabled // backwards compatibility
          }
        })
      );
    }
  }

  // ========================================================================
  // Native Web Audio Ambient Music Synthesizer Engine
  // ========================================================================

  private startAmbientMusic(): void {
    const ctx = this.getContext();
    if (!ctx || !this.musicGain) return;

    // Clean up any stale nodes first
    this.teardownAmbientNodes();

    const t = ctx.currentTime;
    const preset = MOOD_PRESETS[this.currentMood];

    // Master filter for the ambient music bus
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(preset.filterCutoff, t);
    filter.Q.setValueAtTime(preset.filterQ, t);

    // Filter breathing LFO
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(preset.lfoRate, t);
    lfoGain.gain.setValueAtTime(preset.lfoDepth, t);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start(t);

    filter.connect(this.musicGain);

    this.filterNode = filter;
    this.lfoOsc = lfo;
    this.lfoGain = lfoGain;

    // Create 4-tone harmonic pad with slight stereo detuning
    this.padOscs = preset.padFreqs.map((freq, idx) => {
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();

      osc.type = preset.padTypes[idx] || 'sine';
      // Subtle micro-detuning (-3 to +3 cents) for lush warm chorus effect
      const detuneCents = (idx - 1.5) * 2.8;
      osc.frequency.setValueAtTime(freq, t);
      osc.detune.setValueAtTime(detuneCents, t);

      // Distribute pad layer volumes
      const level = idx === 0 ? 0.22 : idx === 1 ? 0.16 : 0.12;
      oscGain.gain.setValueAtTime(level, t);

      osc.connect(oscGain);
      oscGain.connect(filter);
      osc.start(t);

      return osc;
    });

    // Fade in music channel smoothly over 800ms
    this.musicGain.gain.cancelScheduledValues(t);
    this.musicGain.gain.setValueAtTime(0.001, t);
    this.musicGain.gain.linearRampToValueAtTime(this.musicVolume, t + 0.8);

    // Schedule periodic soft starlight chimes
    this.startChimeLoop();
  }

  private stopAmbientMusic(): void {
    const ctx = this.ctx;
    if (!ctx || !this.musicGain) return;

    const t = ctx.currentTime;
    // Immediate cutoff on mute
    this.musicGain.gain.cancelScheduledValues(t);
    this.musicGain.gain.setValueAtTime(0, t);

    this.teardownAmbientNodes();
  }

  private teardownAmbientNodes(): void {
    if (this.chimeTimer) {
      clearInterval(this.chimeTimer);
      this.chimeTimer = null;
    }

    try {
      this.padOscs.forEach((osc) => {
        osc.stop();
        osc.disconnect();
      });
    } catch {}
    this.padOscs = [];

    if (this.lfoOsc) {
      try {
        this.lfoOsc.stop();
        this.lfoOsc.disconnect();
      } catch {}
      this.lfoOsc = null;
    }

    if (this.lfoGain) {
      try {
        this.lfoGain.disconnect();
      } catch {}
      this.lfoGain = null;
    }

    if (this.filterNode) {
      try {
        this.filterNode.disconnect();
      } catch {}
      this.filterNode = null;
    }
  }

  private applyMoodTransition(mood: MusicMood): void {
    const ctx = this.ctx;
    if (!ctx || !this.filterNode || this.padOscs.length === 0) return;

    const t = ctx.currentTime;
    const preset = MOOD_PRESETS[mood];
    const transitionTime = 1.8; // 1.8s smooth harmonic glide

    // Glide pad frequencies smoothly
    preset.padFreqs.forEach((freq, idx) => {
      const osc = this.padOscs[idx];
      if (osc) {
        osc.frequency.cancelScheduledValues(t);
        osc.frequency.setValueAtTime(osc.frequency.value, t);
        osc.frequency.linearRampToValueAtTime(freq, t + transitionTime);
      }
    });

    // Glide filter cutoff and resonance
    this.filterNode.frequency.cancelScheduledValues(t);
    this.filterNode.frequency.setValueAtTime(this.filterNode.frequency.value, t);
    this.filterNode.frequency.linearRampToValueAtTime(preset.filterCutoff, t + transitionTime);

    // Update LFO breathing parameters
    if (this.lfoOsc && this.lfoGain) {
      this.lfoOsc.frequency.setValueAtTime(preset.lfoRate, t);
      this.lfoGain.gain.setValueAtTime(preset.lfoDepth, t);
    }

    // Restart chime loop with new scale frequencies
    this.startChimeLoop();
  }

  private startChimeLoop(): void {
    if (this.chimeTimer) {
      clearInterval(this.chimeTimer);
      this.chimeTimer = null;
    }

    const preset = MOOD_PRESETS[this.currentMood];
    this.chimeTimer = setInterval(() => {
      if (!this.musicEnabled || !this.ctx || !this.musicGain) return;
      this.triggerStarlightChime();
    }, preset.chimeInterval);
  }

  /**
   * Procedurally generates a soft starlight harmonic bell ping
   */
  private triggerStarlightChime(): void {
    const ctx = this.ctx;
    if (!ctx || !this.musicGain) return;

    const t = ctx.currentTime;
    const preset = MOOD_PRESETS[this.currentMood];
    const notes = preset.chimeNotes;
    const freq = notes[Math.floor(Math.random() * notes.length)] || 523.25;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);

    // Gentle bell envelope
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.038, t + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(t);
    osc.stop(t + 2.5);
  }

  // ========================================================================
  // Sound Effects (SFX) Playback & Procedural Synthesizers
  // ========================================================================

  /**
   * Plays a synthesized sound effect if SFX is enabled.
   * Debounces rapid repeated calls to prevent clipping and spam.
   */
  public play(event: SoundEvent): void {
    if (!this.sfxEnabled) return;

    const now = performance.now();

    // Global debounce: minimum 30ms between any sounds
    if (now - this.globalLastPlayTime < 30) return;

    // Per-event debounce
    const lastEventTime = this.lastPlayTimes.get(event) || 0;
    const minInterval = event === 'ui_click' ? 40 : event === 'selection' ? 80 : 120;
    if (now - lastEventTime < minInterval) return;

    this.globalLastPlayTime = now;
    this.lastPlayTimes.set(event, now);

    const ctx = this.getContext();
    if (!ctx || !this.sfxGain) return;

    try {
      switch (event) {
        case 'ui_click':
          this.synthUiClick(ctx, this.sfxGain);
          break;
        case 'selection':
          this.synthSelection(ctx, this.sfxGain);
          break;
        case 'component_equip':
          this.synthEquip(ctx, this.sfxGain);
          break;
        case 'component_remove':
          this.synthRemove(ctx, this.sfxGain);
          break;
        case 'success':
          this.synthSuccess(ctx, this.sfxGain);
          break;
        case 'warning':
          this.synthWarning(ctx, this.sfxGain);
          break;
        case 'stage_transition':
          this.synthStageTransition(ctx, this.sfxGain);
          break;
        case 'launch':
          this.synthLaunch(ctx, this.sfxGain);
          break;
        case 'mission_complete':
          this.synthMissionComplete(ctx, this.sfxGain);
          break;
      }
    } catch (err) {
      console.warn('[AudioManager] Synthesis error:', err);
    }
  }

  /**
   * 1. ui_click: Soft, high-frequency subtle interface tap (40ms)
   */
  private synthUiClick(ctx: AudioContext, dest: AudioNode): void {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.exponentialRampToValueAtTime(440, t + 0.04);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.connect(gain);
    gain.connect(dest);

    osc.start(t);
    osc.stop(t + 0.045);
  }

  /**
   * 2. selection: Cheerful double-tone confirmation blip (120ms)
   */
  private synthSelection(ctx: AudioContext, dest: AudioNode): void {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, t); // D5
    osc.frequency.setValueAtTime(880, t + 0.06); // A5

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.25, t + 0.02);
    gain.gain.setValueAtTime(0.25, t + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc.connect(gain);
    gain.connect(dest);

    osc.start(t);
    osc.stop(t + 0.15);
  }

  /**
   * 3. component_equip: Satisfying mechanical docking latch (140ms)
   */
  private synthEquip(ctx: AudioContext, dest: AudioNode): void {
    const t = ctx.currentTime;

    // Tone layer
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, t);
    osc.frequency.exponentialRampToValueAtTime(420, t + 0.08);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, t);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc.start(t);
    osc.stop(t + 0.15);

    // Metallic click layer
    const clickOsc = ctx.createOscillator();
    const clickGain = ctx.createGain();
    clickOsc.type = 'sine';
    clickOsc.frequency.setValueAtTime(1200, t + 0.06);
    clickGain.gain.setValueAtTime(0.18, t + 0.06);
    clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.10);

    clickOsc.connect(clickGain);
    clickGain.connect(dest);

    clickOsc.start(t + 0.06);
    clickOsc.stop(t + 0.11);
  }

  /**
   * 4. component_remove: Soft mechanical release sound (100ms)
   */
  private synthRemove(ctx: AudioContext, dest: AudioNode): void {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(480, t);
    osc.frequency.exponentialRampToValueAtTime(220, t + 0.10);

    gain.gain.setValueAtTime(0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.10);

    osc.connect(gain);
    gain.connect(dest);

    osc.start(t);
    osc.stop(t + 0.11);
  }

  /**
   * 5. success: Positive confirmation chime - C major chord (280ms)
   */
  private synthSuccess(ctx: AudioContext, dest: AudioNode): void {
    const t = ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99]; // C5, E5, G5

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const noteTime = t + idx * 0.04;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.001, noteTime);
      gain.gain.linearRampToValueAtTime(0.2, noteTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.22);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(noteTime);
      osc.stop(noteTime + 0.24);
    });
  }

  /**
   * 6. warning: Gentle double advisory pulse (220ms)
   */
  private synthWarning(ctx: AudioContext, dest: AudioNode): void {
    const t = ctx.currentTime;
    const pulses = [330, 280];

    pulses.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const noteTime = t + idx * 0.09;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.001, noteTime);
      gain.gain.linearRampToValueAtTime(0.22, noteTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.08);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(noteTime);
      osc.stop(noteTime + 0.09);
    });
  }

  /**
   * 7. stage_transition: Soft cosmic riser / whoosh (250ms)
   */
  private synthStageTransition(ctx: AudioContext, dest: AudioNode): void {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(280, t);
    osc.frequency.exponentialRampToValueAtTime(620, t + 0.22);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(450, t);
    filter.Q.setValueAtTime(1.5, t);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.24, t + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc.start(t);
    osc.stop(t + 0.25);
  }

  /**
   * 8. launch: Controlled rocket booster ignition rumble (550ms)
   */
  private synthLaunch(ctx: AudioContext, dest: AudioNode): void {
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(65, t);
    osc.frequency.linearRampToValueAtTime(130, t + 0.45);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(250, t);
    filter.frequency.linearRampToValueAtTime(450, t + 0.45);

    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.3, t + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.52);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc.start(t);
    osc.stop(t + 0.55);
  }

  /**
   * 9. mission_complete: Uplifting celebratory fanfare (650ms)
   */
  private synthMissionComplete(ctx: AudioContext, dest: AudioNode): void {
    const t = ctx.currentTime;
    const chords = [
      { f: 523.25, time: 0 },    // C5
      { f: 659.25, time: 0.08 }, // E5
      { f: 783.99, time: 0.16 }, // G5
      { f: 1046.5, time: 0.24 }  // C6 (Triumph note)
    ];

    chords.forEach((note) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const noteTime = t + note.time;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.f, noteTime);

      gain.gain.setValueAtTime(0.001, noteTime);
      gain.gain.linearRampToValueAtTime(0.22, noteTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.38);

      osc.connect(gain);
      gain.connect(dest);

      osc.start(noteTime);
      osc.stop(noteTime + 0.40);
    });
  }
}

export const audioManager = new AudioManager();
