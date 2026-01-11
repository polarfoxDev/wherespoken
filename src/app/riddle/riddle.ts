import { Component, computed, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ExtendedSampleMetadata } from '../types/sampleMetadata';
import { LOCALE_CODES } from '../types/languages';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { map, startWith } from 'rxjs';

@Component({
  selector: 'app-riddle',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './riddle.html',
  styleUrl: './riddle.css',
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
  isCorrect = signal(false);
  isPerfectMatch = signal(false);
  showDropdown = signal(false);

  // Mapped options
  localeOptions = computed(() => {
    const dn = new Intl.DisplayNames(['en'], { type: 'language' });
    return LOCALE_CODES.map((code) => {
      let label = code;
      try {
        label = dn.of(code) || code;
      } catch (e) {
        // Fallback if code is invalid
      }
      return { code, label };
    }).sort((a, b) => a.label.localeCompare(b.label));
  });

  filteredLanguages = computed(() => {
    const guess = this.guessValue().toLowerCase();
    const options = this.localeOptions();
    if (!guess) return options;
    return options.filter((o) => o.label.toLowerCase().includes(guess));
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
    const content = text.replace(/[^a-zA-Z0-9\s.,!?'"():;\-]/g, (match) => {
      return `<span class="bg-red-200 text-red-800 font-bold px-0.5 rounded">${match}</span>`;
    });
    return this.sanitizer.bypassSecurityTrustHtml(content);
  });

  submitGuess() {
    const guess = this.guessControl.value?.toLowerCase() || '';
    if (!guess) return;

    // Try to find matching option
    const matchedOption = this.localeOptions().find(o => o.label.toLowerCase() === guess);

    if (!matchedOption) return;

    const sampleCode = this.sample().language;
    let sampleBase = sampleCode;
    try {
        sampleBase = new Intl.Locale(sampleCode).language;
    } catch (e) { }

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

    if (isExactMatch) {
      this.isPerfectMatch.set(true);
      this.isCorrect.set(true);
      this.stage.set(5);
    } else if (isBaseMatch) {
      this.isPerfectMatch.set(false);
      this.isCorrect.set(true);
      this.stage.set(5);
    } else {
      this.guessControl.setValue('');
      this.nextHint();
    }
    this.showDropdown.set(false);
  }

  nextHint() {
    this.stage.update((s) => Math.min(s + 1, 5));
  }

  selectLanguage(option: { code: string, label: string }) {
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
