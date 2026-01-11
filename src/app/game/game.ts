import { Component, computed, effect, inject, input, untracked } from '@angular/core';
import { Api } from '../api';
import { Riddle } from '../riddle/riddle';

@Component({
  selector: 'app-game',
  imports: [Riddle],
  templateUrl: './game.html',
  styleUrl: './game.css',
})
export class Game {
  api = inject(Api);
  date = input<string>();

  private sampleId = computed(() => {
    const schedule = this.api.schedule();
    if (Object.keys(schedule).length === 0) return null;
    const todayISODate = this.date() ?? new Date().toISOString().split('T')[0];
    return schedule[todayISODate] ?? null;
  });

  constructor() {
    this.api.loadSchedule();
    effect(() => {
      const id = this.sampleId();
      if (id) {
        untracked(() => this.api.loadSample(id));
      } else if (Object.keys(this.api.schedule()).length > 0) {
        console.error('No sample scheduled for today.');
      }
    });
  }
}
