import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-spinner',
  template: `<div class="spinner"></div>`,
  styles: `
    .spinner {
      display: inline-block;
      width: 50px;
      height: 50px;
      border: 3px solid var(--color-guess);
      border-radius: 50%;
      border-top-color: var(--color-accent);
      animation: spin 1s ease-in-out infinite;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpinnerComponent {}
