/**
 * ORBITONE — Orbit Credits & Cosmetic Rewards System
 *
 * Educational game currency earned purely through knowledge milestones,
 * Asteroid Run arcade skills, and mission design achievements.
 *
 * CRITICAL RULE:
 * This system manages COSMETIC rewards, badges, and astronaut gear only.
 * It NEVER modifies or interacts with mission engineering mass/cost/power formulas.
 */

export interface CosmeticItem {
  id: string;
  name: string;
  type: 'suit' | 'helmet' | 'accessory' | 'badge';
  cost: number;
  description: string;
  accentColor?: string;
  icon: string;
  unlockedByDefault?: boolean;
}

export interface PlayerCustomization {
  callsign: string;
  suitId: string;
  helmetId: string;
  accessoryId: string;
  badgeId: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  rewardCredits: number;
  icon: string;
}

const CREDITS_STORAGE_KEY = 'orbitone_credits';
const ACHIEVEMENTS_STORAGE_KEY = 'orbitone_achievements';
const UNLOCKED_COSMETICS_KEY = 'orbitone_unlocked_cosmetics';
const CUSTOMIZATION_STORAGE_KEY = 'orbitone_customization';

export const COSMETIC_CATALOG: CosmeticItem[] = [
  // Suits
  { id: 'cyan', name: 'Arctic Cyan', type: 'suit', cost: 0, description: 'Standard Academy deep-space flight pressure suit.', accentColor: '#77e1e6', icon: 'checkroom', unlockedByDefault: true },
  { id: 'amber', name: 'Solar Amber', type: 'suit', cost: 0, description: 'Optimized for high-radiation solar observation passes.', accentColor: '#ffb86c', icon: 'checkroom', unlockedByDefault: true },
  { id: 'violet', name: 'Cosmic Violet', type: 'suit', cost: 0, description: 'Infused with ultraviolet reflective polymer weaves.', accentColor: '#bba0ff', icon: 'checkroom', unlockedByDefault: true },
  { id: 'green', name: 'Aurora Green', type: 'suit', cost: 150, description: 'Ionospheric night-side aurora research suit.', accentColor: '#51e77b', icon: 'checkroom' },
  { id: 'gold', name: 'Helios Gold', type: 'suit', cost: 300, description: 'Multi-layer gold mylar radiation shielding fabric.', accentColor: '#ffd166', icon: 'checkroom' },
  { id: 'crimson', name: 'Mars Crimson', type: 'suit', cost: 500, description: 'Tested for dusty planetary surface conditions.', accentColor: '#ff5370', icon: 'checkroom' },

  // Helmets
  { id: 'helmet-standard', name: 'Standard Visor', type: 'helmet', cost: 0, description: 'Crystal-clear polycarbonate pressurized dome.', icon: 'sports_motorsports', unlockedByDefault: true },
  { id: 'helmet-gold', name: 'Gold Reflective Visor', type: 'helmet', cost: 200, description: 'Thin-film vapor-deposited 24-karat gold coating.', icon: 'sports_motorsports' },
  { id: 'helmet-hud', name: 'HUD Telemetry Visor', type: 'helmet', cost: 350, description: 'Integrated micro-OLED tactical heads-up display.', icon: 'sports_motorsports' },

  // Accessories
  { id: 'acc-none', name: 'No Accessory', type: 'accessory', cost: 0, description: 'Streamlined clean flight configuration.', icon: 'remove', unlockedByDefault: true },
  { id: 'acc-comm-mic', name: 'AeroComm Headset', type: 'accessory', cost: 100, description: 'Noise-cancelling dual boom microphone.', icon: 'headset_mic' },
  { id: 'acc-shoulder-patch', name: 'NASA Patch', type: 'accessory', cost: 250, description: 'Official flight crew mission embroidered insignia.', icon: 'military_tech' },
  { id: 'acc-jetpack', name: 'Cold-Gas MMU', type: 'accessory', cost: 450, description: 'Manned maneuvering unit for spacewalk mobility.', icon: 'backpack' },

  // Badges
  { id: 'badge-cadet', name: 'Space Cadet', type: 'badge', cost: 0, description: 'Enrolled in the NASA CubeSat Mission Academy.', icon: 'school', unlockedByDefault: true },
  { id: 'badge-pilot', name: 'Orbital Pilot', type: 'badge', cost: 120, description: 'Successfully navigated an asteroid avoidance sector.', icon: 'flight', unlockedByDefault: false },
  { id: 'badge-engineer', name: 'Flight Engineer', type: 'badge', cost: 250, description: 'Assembled a fully compliant 6U CubeSat chassis.', icon: 'construction', unlockedByDefault: false },
  { id: 'badge-director', name: 'Mission Director', type: 'badge', cost: 500, description: 'Commanded a 100% successful Earth observation mission.', icon: 'stars', unlockedByDefault: false }
];

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_login', title: 'Welcome Cadet', description: 'Enter the Orbitone Space Academy.', rewardCredits: 50, icon: 'badge' },
  { id: 'science_curious', title: 'Science Explorer', description: 'Inspect the Scientific Instrument Inventory.', rewardCredits: 50, icon: 'menu_book' },
  { id: 'asteroid_rookie', title: 'Asteroid Dodger', description: 'Score at least 150 points in Asteroid Run.', rewardCredits: 100, icon: 'sports_esports' },
  { id: 'asteroid_ace', title: 'Cosmic Ace', description: 'Score at least 400 points in Asteroid Run.', rewardCredits: 200, icon: 'military_tech' },
  { id: 'first_assembly', title: 'Subsystem Architect', description: 'Complete a valid CubeSat configuration in Stage 4.', rewardCredits: 150, icon: 'build_circle' },
  { id: 'flight_complete', title: 'Mission Complete', description: 'Complete orbital flight simulation and debrief.', rewardCredits: 250, icon: 'rocket_launch' }
];

class CreditsManager {
  private credits: number = 0;
  private unlockedCosmetics: Set<string> = new Set();
  private unlockedAchievements: Set<string> = new Set();
  private customization: PlayerCustomization = {
    callsign: 'Flight Director',
    suitId: 'cyan',
    helmetId: 'helmet-standard',
    accessoryId: 'acc-none',
    badgeId: 'badge-cadet'
  };

  constructor() {
    this.loadState();
  }

  private loadState(): void {
    try {
      // Default initial balance: 100 Orbit Credits to get started
      const rawCredits = localStorage.getItem(CREDITS_STORAGE_KEY);
      this.credits = rawCredits !== null ? parseInt(rawCredits, 10) : 100;
      if (isNaN(this.credits) || this.credits < 0) this.credits = 100;

      // Default unlocked cosmetics
      const rawCosmetics = localStorage.getItem(UNLOCKED_COSMETICS_KEY);
      if (rawCosmetics) {
        const parsed = JSON.parse(rawCosmetics) as string[];
        this.unlockedCosmetics = new Set(parsed);
      }
      // Ensure defaults are always unlocked
      COSMETIC_CATALOG.forEach((item) => {
        if (item.unlockedByDefault) this.unlockedCosmetics.add(item.id);
      });

      // Achievements
      const rawAch = localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY);
      if (rawAch) {
        const parsed = JSON.parse(rawAch) as string[];
        this.unlockedAchievements = new Set(parsed);
      }

      // Customization
      const rawCust = localStorage.getItem(CUSTOMIZATION_STORAGE_KEY);
      if (rawCust) {
        this.customization = { ...this.customization, ...JSON.parse(rawCust) };
      }

      // Check legacy callsign and suit
      const legacyCallsign = localStorage.getItem('mission-player-callsign');
      if (legacyCallsign) this.customization.callsign = legacyCallsign;
      const legacySuit = localStorage.getItem('mission-player-suit');
      if (legacySuit && this.unlockedCosmetics.has(legacySuit)) {
        this.customization.suitId = legacySuit;
      }
    } catch {
      this.credits = 100;
    }
  }

  public getCredits(): number {
    return this.credits;
  }

  public addCredits(amount: number, reason?: string): number {
    if (amount <= 0) return this.credits;
    this.credits += amount;
    this.saveState();
    this.dispatchChangeEvent(reason);
    return this.credits;
  }

  public canAfford(itemId: string): boolean {
    const item = COSMETIC_CATALOG.find((c) => c.id === itemId);
    if (!item) return false;
    return this.credits >= item.cost;
  }

  public isUnlocked(itemId: string): boolean {
    return this.unlockedCosmetics.has(itemId);
  }

  public buyItem(itemId: string): boolean {
    if (this.isUnlocked(itemId)) return true;
    const item = COSMETIC_CATALOG.find((c) => c.id === itemId);
    if (!item) return false;
    if (this.credits < item.cost) return false;

    this.credits -= item.cost;
    this.unlockedCosmetics.add(itemId);
    this.saveState();
    this.dispatchChangeEvent(`Unlocked ${item.name}`);
    return true;
  }

  public getCustomization(): PlayerCustomization {
    return { ...this.customization };
  }

  public setCustomization(update: Partial<PlayerCustomization>): void {
    this.customization = { ...this.customization, ...update };
    if (update.suitId) {
      localStorage.setItem('mission-player-suit', update.suitId);
    }
    if (update.callsign) {
      localStorage.setItem('mission-player-callsign', update.callsign);
      sessionStorage.setItem('mission-player-name', update.callsign);
    }
    this.saveState();
    this.dispatchChangeEvent('Customization updated');
  }

  public unlockAchievement(achievementId: string): boolean {
    if (this.unlockedAchievements.has(achievementId)) return false;
    const ach = ACHIEVEMENTS.find((a) => a.id === achievementId);
    if (!ach) return false;

    this.unlockedAchievements.add(achievementId);
    this.credits += ach.rewardCredits;
    this.saveState();
    this.dispatchChangeEvent(`Achievement: ${ach.title} (+${ach.rewardCredits} Credits)`);
    return true;
  }

  public isAchievementUnlocked(achievementId: string): boolean {
    return this.unlockedAchievements.has(achievementId);
  }

  private saveState(): void {
    try {
      localStorage.setItem(CREDITS_STORAGE_KEY, this.credits.toString());
      localStorage.setItem(UNLOCKED_COSMETICS_KEY, JSON.stringify(Array.from(this.unlockedCosmetics)));
      localStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(Array.from(this.unlockedAchievements)));
      localStorage.setItem(CUSTOMIZATION_STORAGE_KEY, JSON.stringify(this.customization));
    } catch {}
  }

  private dispatchChangeEvent(reason?: string): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('orbitone:credits-updated', {
          detail: {
            credits: this.credits,
            customization: this.customization,
            reason
          }
        })
      );
    }
  }
}

export const creditsManager = new CreditsManager();
