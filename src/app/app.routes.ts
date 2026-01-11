import { Routes } from '@angular/router';
import { Game } from './game/game';
import { HistoryComponent } from './history/history';

export const routes: Routes = [
  {
    path: '',
    component: Game,
  },
  {
    path: 'history',
    component: HistoryComponent,
  },
  {
    path: 'history/:date',
    component: Game,
  },
];
