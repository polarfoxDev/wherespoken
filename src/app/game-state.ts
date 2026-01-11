import { Injectable, signal } from '@angular/core';
import { GameStatus as RiddleGameStatus, GuessResult } from './riddle/riddle';

export interface SavedGameState {
  stage: number;
  gameStatus: RiddleGameStatus;
  guessedCodes: string[];
  history: GuessResult[];
  restrictToBase: string | null;
}

export interface DateGameState {
  started: boolean;
  finished: boolean;
}

const STORAGE_KEY = 'wherespoken-game-states';

@Injectable({ providedIn: 'root' })
export class GameState {
  private readonly states = signal<Record<string, SavedGameState>>({});

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.states.set(JSON.parse(stored));
      }
    } catch {
      // Ignore storage errors
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.states()));
    } catch {
      // Ignore storage errors
    }
  }

  getState(dateISO: string): SavedGameState | null {
    return this.states()[dateISO] ?? null;
  }

  saveState(dateISO: string, state: SavedGameState): void {
    this.states.update((s) => ({ ...s, [dateISO]: state }));
    this.saveToStorage();
  }

  getAllDateStates(): Record<string, DateGameState> {
    console.log('Getting all date states...');
    const result: Record<string, DateGameState> = {};
    const allStates = this.states();

    for (const [date, state] of Object.entries(allStates)) {
      result[date] = {
        started: state.history.length > 0 || state.stage > 0,
        finished: state.gameStatus === 'WON' || state.gameStatus === 'LOST',
      };
    }

    return result;
  }
}
