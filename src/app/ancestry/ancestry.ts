import { Component, computed, effect, input, signal } from '@angular/core';
import { FamilyComparisonResult } from '../language-family.service';

@Component({
  selector: 'app-ancestry',
  imports: [],
  templateUrl: './ancestry.html',
  styleUrl: './ancestry.css',
})
export class Ancestry {
  familyComparisonResult = input<FamilyComparisonResult>();
  difficulty = input<string>();
  guessLabel = input<string>();
  /** Number of guesses made so far (history length) */
  guessNumber = input<number>(0);

  expanded = signal(false);

  constructor() {
    effect(() => {
      this.familyComparisonResult();
      this.expanded.set(false);
      return;
    });
  }

  /** Shared ancestry path from root to common ancestor (reversed, root first) */
  sharedPath = computed(() => {
    const result = this.familyComparisonResult();
    if (!result) return [];

    const guessReversed = [...result.guessAncestry].reverse();
    const correctReversed = [...result.correctAncestry].reverse();

    const shared: string[] = [];
    for (let i = 0; i < Math.min(guessReversed.length, correctReversed.length); i++) {
      if (guessReversed[i] === correctReversed[i]) {
        shared.push(guessReversed[i]);
      } else {
        break;
      }
    }
    return shared;
  });

  /** Guess-only path after divergence (from after common ancestor to guessed language) */
  guessOnlyPath = computed(() => {
    const result = this.familyComparisonResult();
    if (!result) return [];

    const guessReversed = [...result.guessAncestry].reverse();
    const sharedLength = this.sharedPath().length;
    return guessReversed.slice(sharedLength);
  });

  /** Correct-only path after divergence (from after common ancestor to correct language) */
  correctOnlyPath = computed(() => {
    const result = this.familyComparisonResult();
    if (!result) return [];

    const correctReversed = [...result.correctAncestry].reverse();
    const sharedLength = this.sharedPath().length;
    return correctReversed.slice(sharedLength);
  });

  /** Array of steps for iterating over both branches */
  branchSteps = computed(() => {
    const maxLength = Math.max(this.guessOnlyPath().length, this.correctOnlyPath().length);
    return Array.from({ length: maxLength }, (_, i) => i);
  });

  /** True when languages are siblings (same ancestry but different languages) */
  areSiblings = computed(() => {
    const result = this.familyComparisonResult();
    if (!result) return false;
    // Siblings have identical ancestry but are not the same language (score < 100)
    return (
      this.guessOnlyPath().length === 0 &&
      this.correctOnlyPath().length === 0 &&
      result.distanceScore < 100
    );
  });

  /**
   * Whether to show the correct language family root.
   * In normal difficulty, only show after the 2nd guess (i.e., from 3rd guess onwards)
   */
  shouldShowCorrectRoot = computed(() => {
    const difficulty = this.difficulty();
    const guessNumber = this.guessNumber();
    
    // In normal difficulty, show correct root from 3rd guess onwards
    if (difficulty === 'normal') {
      return guessNumber >= 3;
    }
    
    // For other difficulties, follow existing behavior (never show in hard/extreme)
    return false;
  });

  toggleExpanded(): void {
    this.expanded.update((v) => !v);
  }
}
