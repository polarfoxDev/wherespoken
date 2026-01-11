export enum GameStatus {
  NotAvailable = 'not-available',
  NotStarted = 'not-started',
  InProgress = 'in-progress',
  Finished = 'finished',
}

export interface CalendarDate {
  date: Date;
  isToday: boolean;
  gameStatus: GameStatus;
}

export interface CalendarMonth {
  previousAvailable: boolean;
  nextAvailable: boolean;
  gridOffset: number;
  dates: CalendarDate[];
}
