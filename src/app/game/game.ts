import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  untracked,
} from '@angular/core';
import { Api } from '../api';
import { Riddle } from '../riddle/riddle';
import { SpinnerComponent } from '../spinner/spinner';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-game',
  imports: [Riddle, SpinnerComponent],
  templateUrl: './game.html',
  styleUrl: './game.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Game {
  api = inject(Api);
  date = input<string>();

  dateISO = computed(() => {
    const dateISO = this.date() ?? new Date().toISOString().split('T')[0];

    // In production, prevent loading future dates
    if (environment.production) {
      const today = new Date().toISOString().split('T')[0];
      if (dateISO > today) {
        return null;
      }
    }

    return dateISO ?? null;
  });

  constructor() {
    effect(() => {
      const dateISO = this.dateISO();
      if (dateISO) {
        untracked(() => this.api.loadSampleForDate(new Date(dateISO)));
      }
    });
  }
}
