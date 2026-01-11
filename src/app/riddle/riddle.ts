import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ExtendedSampleMetadata } from '../types/sampleMetadata';
import { LOCALE_CODES } from '../types/languages';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { map, startWith } from 'rxjs';

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

  sample = input.required<ExtendedSampleMetadata>();

  // Game state
  guessControl = new FormControl('');
  private guessValue = toSignal(
    this.guessControl.valueChanges.pipe(
      startWith(''),
      map((v) => v || '')
    ),
    { initialValue: '' }
  );

  stage = signal(0); // 0: Audio, 1: Text, 2: Trans, 3: HintAudio, 4: HintText, 5: HintTrans
  gameStatus = signal<GameStatus>('PLAYING');
  showDropdown = signal(false);
  restrictToBase = signal<string | null>(null);
  guessedCodes = signal<string[]>([]);
  history = signal<GuessResult[]>([]);
  feedbackMessage = signal<{ type: 'error' | 'warning'; text: string } | null>(null);

  // Computeds
  historyEmojis = computed(() => {
    return this.history().map((h) => {
      switch (h) {
        case 'WRONG':
          return '⚫';
        case 'BASE_MATCH':
          return '🟠';
        case 'CORRECT':
          return '🟢🎉';
        case 'LOST':
          return '❌';
        default:
          return '';
      }
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
    // Highlight non-English alphabet characters
    // [a-zA-Z] + common punctuation + whitespace allowed, wrap others
    const content = text.replace(/[^a-zA-Z0-9\s.,!?'"():;\-\–]/g, (match) => {
      return `<span class="bg-blue-200 font-bold px-0.5 rounded">${match}</span>`;
    });
    return this.sanitizer.bypassSecurityTrustHtml(content);
  });

  submitGuess() {
    const guess = this.guessControl.value?.toLowerCase() || '';
    if (!guess) return;

    // Try to find matching option
    const matchedOption = this.localeOptions().find((o) => o.label.toLowerCase() === guess);

    if (!matchedOption) return;

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
      this.feedbackMessage.set(null);
      this.stage.set(5);
    } else if (isBaseMatch) {
      if (this.stage() === 5) {
        this.gameStatus.set('LOST');
        this.history.update((h) => [...h, 'LOST']);
        this.feedbackMessage.set(null);
      } else {
        // Wrong region, but correct base language.
        // Count as wrong, but restrict options.
        this.restrictToBase.set(sampleBase);
        this.guessedCodes.update((c) => [...c, guessedCode]);
        this.history.update((h) => [...h, 'BASE_MATCH']);
        this.feedbackMessage.set({
          type: 'warning',
          text: 'Close! Correct language, wrong region.',
        });
        this.guessControl.setValue('');
        this.nextHint();
      }
    } else {
      if (this.stage() === 5) {
        this.gameStatus.set('LOST');
        this.history.update((h) => [...h, 'LOST']);
        this.feedbackMessage.set(null);
      } else {
        this.guessedCodes.update((c) => [...c, guessedCode]);
        this.history.update((h) => [...h, 'WRONG']);
        this.feedbackMessage.set({ type: 'error', text: 'Incorrect guess.' });
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
}
