import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ExtendedSampleMetadata } from '../types/sampleMetadata';
import { LOCALE_CODES } from '../types/languages';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { map, startWith } from 'rxjs';
import { getRiddleIndex } from '../consts';
import { environment } from '../../environments/environment';
import { GameState } from '../game-state';
import { FamilyComparisonResult, LanguageFamilyService } from '../language-family.service';
import { DifficultyMode, SettingsService } from '../settings.service';

export type GameStatus = 'PLAYING' | 'WON' | 'LOST';
export type GuessResult = 'WRONG' | 'BASE_MATCH' | 'CORRECT' | 'LOST';

@Component({
  selector: 'app-riddle',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './riddle.html',
  styleUrl: './riddle.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Riddle {
  private sanitizer = inject(DomSanitizer);
  private gameStateService = inject(GameState);
  private languageFamilyService = inject(LanguageFamilyService);
  private settingsService = inject(SettingsService);

  // Game state signals (declared early so they can be used in computed)
  stage = signal(0); // 0: Audio, 1: Trans, 2: Text, 3: HintAudio, 4: HintText, 5: HintTrans
  gameStatus = signal<GameStatus>('PLAYING');
  showDropdown = signal(false);
  restrictToBase = signal<string | null>(null);
  guessedCodes = signal<string[]>([]);
  history = signal<GuessResult[]>([]);
  similarityScores = signal<number[]>([]);
  /** Difficulty at time game was started (locked after first guess) */
  gameDifficulty = signal<DifficultyMode>('normal');
  feedbackMessage = signal<{
    type: 'error' | 'warning';
    text: string;
    familyComparison?: FamilyComparisonResult;
  } | null>(null);

  /** Whether the game has started (first guess made) - locks difficulty */
  gameStarted = computed(() => this.history().length > 0);

  /**
   * Effective difficulty: use gameDifficulty when game started, otherwise global setting
   */
  difficulty = computed(() =>
    this.gameStarted() ? this.gameDifficulty() : this.settingsService.difficulty()
  );

  /** Whether hints should be shown based on effective difficulty */
  showHints = computed(() => this.difficulty() !== 'extreme');

  /** Whether broad country hints should be shown (only in normal mode) */
  showCountryHints = computed(() => this.difficulty() === 'normal');

  // Hint specific visibility signals
  showTranscriptTranslation = computed(() => {
    if (this.difficulty() === 'normal') return this.stage() >= 1;
    if (this.difficulty() === 'hard') return this.stage() >= 3;
    return false;
  });

  showTranscript = computed(() => {
    if (this.difficulty() === 'normal') return this.stage() >= 2;
    if (this.difficulty() === 'hard') return this.stage() >= 5;
    return false;
  });

  showHintAudio = computed(() => this.showCountryHints() && this.stage() >= 3);
  showHintText = computed(() => this.showCountryHints() && this.stage() >= 4);
  showHintTranslation = computed(() => this.showCountryHints() && this.stage() >= 5);

  visibleHintsCount = computed(() => {
    let count = 0;
    if (this.showTranscriptTranslation()) count++;
    if (this.showTranscript()) count++;
    if (this.showHintAudio()) count++;
    if (this.showHintText()) count++;
    if (this.showHintTranslation()) count++;
    return count;
  });

  totalAvailableHints = computed(() => {
    if (this.difficulty() === 'normal') return 5;
    if (this.difficulty() === 'hard') return 2;
    return 0;
  });

  /** Whether ancestry should be shown based on effective difficulty */
  showAncestry = computed(() => this.difficulty() !== 'extreme');

  difficultyLabel = computed(() => {
    const d = this.difficulty();
    return d === 'normal' ? '🎯 Normal' : d === 'hard' ? '🔥 Hard' : '💀 Extreme';
  });

  difficultyDescription = computed(() => {
    const d = this.difficulty();
    return d === 'normal'
      ? 'Hints & ancestry shown'
      : d === 'hard'
      ? 'Delayed transcript/translation, no country hints'
      : 'No hints or ancestry';
  });

  toggleDifficulty(): void {
    // Only allow changing difficulty before game starts
    if (!this.gameStarted()) {
      this.settingsService.cycleDifficulty();
    }
  }

  sample = input.required<ExtendedSampleMetadata>();
  date = input<string>();

  // Form control for guessing
  guessControl = new FormControl('');
  private guessValue = toSignal(
    this.guessControl.valueChanges.pipe(
      startWith(''),
      map((v) => v || '')
    ),
    { initialValue: '' }
  );

  constructor() {
    // Load saved state when date changes
    effect(() => {
      const dateISO = this.date() ?? new Date().toISOString().slice(0, 10);
      const savedState = untracked(() => this.gameStateService.getState(dateISO));
      if (savedState) {
        this.stage.set(savedState.stage);
        this.gameStatus.set(savedState.gameStatus);
        this.guessedCodes.set(savedState.guessedCodes);
        this.history.set(savedState.history);
        this.restrictToBase.set(savedState.restrictToBase);
        this.similarityScores.set(savedState.similarityScores ?? []);
        this.gameDifficulty.set(savedState.difficulty ?? 'normal');
      } else {
        // Reset state for new game
        this.stage.set(0);
        this.gameStatus.set('PLAYING');
        this.guessedCodes.set([]);
        this.history.set([]);
        this.restrictToBase.set(null);
        this.similarityScores.set([]);
        this.gameDifficulty.set(this.difficulty());
      }
      this.feedbackMessage.set(null);
      this.guessControl.setValue('');
    });

    // Save state whenever it changes
    effect(() => {
      const stage = this.stage();
      const gameStatus = this.gameStatus();
      const guessedCodes = this.guessedCodes();
      const history = this.history();
      const restrictToBase = this.restrictToBase();
      const similarityScores = this.similarityScores();
      const difficulty = this.gameDifficulty();
      const dateISO = untracked(() => this.date()) ?? new Date().toISOString().slice(0, 10);

      // Only save if game has started (has history or advanced stage)
      if (history.length > 0 || stage > 0) {
        this.gameStateService.saveState(dateISO, {
          stage,
          gameStatus,
          guessedCodes,
          history,
          restrictToBase,
          similarityScores,
          difficulty,
        });
      }
    });
  }

  // Computed signals - each entry is now a row of 5 emoji squares
  historyEmojis = computed(() => {
    const history = this.history();
    const scores = this.getEffectiveSimilarityScores();
    return history.map((result, index) => {
      const score = scores[index] ?? 0;
      return this.scoreToEmojiRow(score, result);
    });
  });

  // Mapped options
  localeOptions = computed(() => {
    const dn = new Intl.DisplayNames(['en'], { type: 'language' });
    const restriction = this.restrictToBase();
    const guesses = this.guessedCodes();

    return LOCALE_CODES.filter((code) => {
      if (guesses.includes(code)) return false;
      if (!restriction) return true;
      try {
        return new Intl.Locale(code).language === restriction;
      } catch {
        return false;
      }
    })
      .map((code) => {
        let label = code;
        try {
          label = dn.of(code) || code;
        } catch (e) {
          // Fallback if code is invalid
        }
        return { code, label };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  });

  filteredLanguages = computed(() => {
    const guess = this.guessValue().toLowerCase();
    const options = this.localeOptions();
    if (!guess) return options;
    return options.filter(
      (o) => o.label.toLowerCase().includes(guess) || o.code.toLowerCase().includes(guess)
    );
  });

  displayLanguage = computed(() => {
    try {
      const code = this.sample().language;
      const name = new Intl.DisplayNames(['en'], { type: 'language' }).of(code);
      return name || code;
    } catch {
      return this.sample().language;
    }
  });

  highlightedText = computed((): SafeHtml => {
    const text = this.sample().text;

    // Check if text contains Latin letters - if not, it's a completely different script
    const hasLatinLetters = /[a-zA-Z]/.test(text);
    if (!hasLatinLetters) {
      // Don't highlight for non-Latin scripts (Arabic, Chinese, etc.)
      return this.sanitizer.bypassSecurityTrustHtml(text);
    }

    // Highlight non-English alphabet characters for Latin-based scripts with special chars
    // [a-zA-Z] + common punctuation + whitespace allowed, wrap others
    const content = text.replace(/[^a-zA-Z0-9\s.,!?'"():;\-\–]/g, (match) => {
      return `<span class="bg-solution-brightest dark:bg-solution px-0.5 rounded">${match}</span>`;
    });
    return this.sanitizer.bypassSecurityTrustHtml(content);
  });

  submitGuess() {
    const guess = this.guessControl.value?.toLowerCase() || '';
    if (!guess) return;

    // Try to find matching option
    const matchedOption = this.localeOptions().find((o) => o.label.toLowerCase() === guess);

    if (!matchedOption) return;

    // Lock difficulty on first guess
    if (this.history().length === 0) {
      this.gameDifficulty.set(this.difficulty());
    }

    const sampleCode = this.sample().language;
    let sampleBase = sampleCode;
    try {
      sampleBase = new Intl.Locale(sampleCode).language;
    } catch (e) {}

    let isBaseMatch = false;
    let isExactMatch = false;

    // User selected a specific locale
    const guessedCode = matchedOption.code;
    let guessedBase = guessedCode;
    try {
      guessedBase = new Intl.Locale(guessedCode).language;
    } catch (e) {}

    if (guessedCode === sampleCode) {
      isExactMatch = true;
      isBaseMatch = true; // Implicitly
    } else if (guessedBase === sampleBase) {
      isBaseMatch = true;
    }

    // Check for Game Over condition BEFORE processing current guess logic
    // Actually, we process current guess. If wrong and stage is 5, then LOST.

    if (isExactMatch) {
      this.gameStatus.set('WON');
      this.history.update((h) => [...h, 'CORRECT']);
      this.similarityScores.update((s) => [...s, 100]);
      this.feedbackMessage.set(null);
      this.stage.set(5);
    } else if (isBaseMatch) {
      if (this.stage() === 5) {
        this.gameStatus.set('LOST');
        this.history.update((h) => [...h, 'LOST']);
        this.similarityScores.update((s) => [...s, 99]); // Very close - right language, wrong region
        this.feedbackMessage.set(null);
      } else {
        // Wrong region, but correct base language.
        // Count as wrong, but restrict options.
        this.restrictToBase.set(sampleBase);
        this.guessedCodes.update((c) => [...c, guessedCode]);
        this.history.update((h) => [...h, 'BASE_MATCH']);
        this.similarityScores.update((s) => [...s, 99]); // Very close - right language, wrong region
        this.feedbackMessage.set({
          type: 'warning',
          text: 'Close! Correct language, wrong region.',
        });
        this.guessControl.setValue('');
        this.nextHint();
      }
    } else {
      // Calculate family comparison for wrong guesses
      const familyComparison = this.languageFamilyService.compareFamilies(guessedCode, sampleCode);
      const score = familyComparison.distanceScore;

      if (this.stage() === 5) {
        this.gameStatus.set('LOST');
        this.history.update((h) => [...h, 'LOST']);
        this.similarityScores.update((s) => [...s, score]);
        this.feedbackMessage.set(null);
      } else {
        this.guessedCodes.update((c) => [...c, guessedCode]);
        this.history.update((h) => [...h, 'WRONG']);
        this.similarityScores.update((s) => [...s, score]);
        this.feedbackMessage.set({
          type: 'error',
          text: 'Incorrect guess.',
          familyComparison,
        });
        this.guessControl.setValue('');
        this.nextHint();
      }
    }
    this.showDropdown.set(false);
  }

  nextHint() {
    this.stage.update((s) => Math.min(s + 1, 5));
  }

  selectLanguage(option: { code: string; label: string }) {
    this.guessControl.setValue(option.label);
    this.showDropdown.set(false);
    this.submitGuess();
  }

  showDropdownHandler() {
    this.showDropdown.set(true);
  }

  hideDropdownHandler() {
    // Delay to allow click on dropdown items
    setTimeout(() => this.showDropdown.set(false), 200);
  }

  // Share functionality
  canShare = typeof navigator !== 'undefined' && navigator.share !== undefined;
  copyConfirmation = signal(false);

  /**
   * Convert a similarity score (0-100) to a row of 5 emoji squares
   * 100% = 🟩🟩🟩🟩🟩, 99% (base match) = 🟨🟨🟨🟨🟨, 0% = ⬛⬛⬛⬛⬛
   */
  private scoreToEmojiRow(score: number, result: GuessResult, forShare = false): string {
    // Special case: correct answer
    if (result === 'CORRECT') {
      return forShare ? '🟩🟩🟩🟩🟩🎉' : '🟩🟩🟩🟩🟩';
    }

    // Special case: base match (correct language, wrong region) - use yellow
    if (result === 'BASE_MATCH') {
      return '🟨🟨🟨🟨🟨';
    }

    // For wrong guesses, show similarity as filled green squares
    // Each square represents 20%
    const filledCount = Math.round(score / 20);
    const filled = '🟩'.repeat(filledCount);
    const empty = '⬛'.repeat(5 - filledCount);

    // Add ❌ for LOST on last guess (only in share text)
    if (result === 'LOST' && forShare) {
      return filled + empty + '❌';
    }

    return filled + empty;
  }

  /**
   * Get similarity scores, recalculating if not stored (backwards compatibility)
   */
  private getEffectiveSimilarityScores(): number[] {
    const stored = this.similarityScores();
    const history = this.history();

    // If we have stored scores matching history length, use them
    if (stored.length === history.length && stored.length > 0) {
      return stored;
    }

    // Recalculate for backwards compatibility
    const guessedCodes = this.guessedCodes();
    const sampleCode = this.sample().language;

    return history.map((result, index) => {
      if (result === 'CORRECT') return 100;
      if (result === 'BASE_MATCH') return 99;
      if (result === 'LOST') {
        // For LOST, check if it was a base match or wrong
        const guessCode = guessedCodes[index];
        if (guessCode) {
          const comparison = this.languageFamilyService.compareFamilies(guessCode, sampleCode);
          return comparison.distanceScore;
        }
        return 0;
      }
      // WRONG
      const guessCode = guessedCodes[index];
      if (guessCode) {
        const comparison = this.languageFamilyService.compareFamilies(guessCode, sampleCode);
        return comparison.distanceScore;
      }
      return 0;
    });
  }

  private getShareText(): string {
    const dateISO = this.date() ?? new Date().toISOString().slice(0, 10);
    const riddleIndex = getRiddleIndex(dateISO);
    const history = this.history();
    const scores = this.getEffectiveSimilarityScores();
    const difficulty = this.gameDifficulty();

    const guessCount = history.length;
    const won = this.gameStatus() === 'WON';
    const resultText = won ? `${guessCount}/6` : 'X/6';

    // Add difficulty indicator for hard modes
    const difficultyEmoji = difficulty === 'extreme' ? ' 💀' : difficulty === 'hard' ? ' 🔥' : '';

    const title = `🗣️ WhereSpoken #${riddleIndex} ${resultText}${difficultyEmoji}`;

    // Generate rows for each guess
    const rows = history.map((result, index) => {
      const score = scores[index] ?? 0;
      return this.scoreToEmojiRow(score, result, true);
    });

    return `${title}\n${rows.join('\n')}\n\n${environment.gameUrl}`;
  }

  share(): void {
    if (this.canShare) {
      navigator.share({ title: 'WhereSpoken', text: this.getShareText() });
    }
  }

  copy(): void {
    navigator.clipboard.writeText(this.getShareText());
    this.copyConfirmation.set(true);
    setTimeout(() => this.copyConfirmation.set(false), 3000);
  }
}
