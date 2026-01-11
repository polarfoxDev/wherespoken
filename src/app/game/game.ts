import { Component, effect, inject } from '@angular/core';
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

  constructor() {
    this.api.loadSchedule();
    effect(() => {
      const schedule = this.api.schedule();
      if (Object.keys(schedule).length === 0) {
        return;
      }
      const todayISODate = new Date().toISOString().split('T')[0];
      const sampleId = schedule[todayISODate];
      if (sampleId) {
        this.api.loadSample(sampleId);
      } else {
        console.error('No sample scheduled for today.');
      }
    });
  }
}
