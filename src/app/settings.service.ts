import { Injectable, signal, computed } from '@angular/core';

export type DifficultyMode = 'normal' | 'hard' | 'extreme';

export interface Settings {
  difficulty: DifficultyMode;
}

const STORAGE_KEY = 'wherespoken-settings';

const DEFAULT_SETTINGS: Settings = {
  difficulty: 'normal',
};

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly settings = signal<Settings>(DEFAULT_SETTINGS);

  /** Current difficulty mode */
  readonly difficulty = computed(() => this.settings().difficulty);

  /** Whether hints (text, translation, hint audio/text) should be shown */
  readonly showHints = computed(() => this.settings().difficulty === 'normal');

  /** Whether ancestry/family comparison should be shown */
  readonly showAncestry = computed(() => this.settings().difficulty !== 'extreme');

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<Settings>;
        this.settings.set({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch {
      // Ignore storage errors
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings()));
    } catch {
      // Ignore storage errors
    }
  }

  setDifficulty(mode: DifficultyMode): void {
    this.settings.update((s) => ({ ...s, difficulty: mode }));
    this.saveToStorage();
  }

  /**
   * Cycle through difficulty modes: normal → hard → extreme → normal
   */
  cycleDifficulty(): void {
    const current = this.settings().difficulty;
    const next: DifficultyMode =
      current === 'normal' ? 'hard' : current === 'hard' ? 'extreme' : 'normal';
    this.setDifficulty(next);
  }
}
