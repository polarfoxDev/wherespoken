import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { CalendarDate, GameStatus } from '../calendar.models';

@Component({
  selector: 'app-calendar-date',
  imports: [DatePipe],
  template: `
    <div
      class="date"
      [class.today]="date().isToday"
      [class.disabled]="date().gameStatus === GameStatus.NotAvailable"
      [class.finished]="date().gameStatus === GameStatus.Finished"
      [class.active]="date().gameStatus === GameStatus.InProgress"
      [class.available]="date().gameStatus === GameStatus.NotStarted"
    >
      <button
        [disabled]="date().gameStatus === GameStatus.NotAvailable"
        (click)="selectDate()"
        class="date-content"
      >
        {{ date().date | date : 'd' }}
      </button>
    </div>
  `,
  styles: `
    .date {
      width: 100%;
      height: 100%;
      overflow: hidden;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .date .date-content {
      font-size: 18px;
      color: light-dark(var(--dark-text), var(--light-text));
      width: 36px;
      height: 36px;
      display: flex;
      justify-content: center;
      align-items: center;
      border-radius: 100%;
      background-color: light-dark(var(--light-bg), var(--dark-bg));
      z-index: 2;
      border: none;
      cursor: pointer;
      outline: none;
      font-family: 'Poppins', sans-serif;
      transition: all 0.2s ease;
    }
    .date .date-content:hover:not(:disabled) {
      transform: scale(1.1);
    }
    .date.finished .date-content {
      color: var(--light-text);
      background-color: var(--super-solution);
    }
    .date.disabled .date-content {
      color: light-dark(var(--guess-brightest), var(--guess-darkest));
      cursor: not-allowed;
    }
    .date.active .date-content {
      color: var(--light-text);
      background-color: var(--solution);
    }
    .date.available .date-content {
      color: var(--light-text);
      background-color: var(--guess);
    }
    .date.today .date-content {
      box-shadow: 0 0 0 2px var(--solution);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarDateComponent {
  protected readonly GameStatus = GameStatus;

  date = input.required<CalendarDate>();
  dateSelected = output<Date>();

  selectDate(): void {
    if (this.date().gameStatus !== GameStatus.NotAvailable) {
      this.dateSelected.emit(this.date().date);
    }
  }
}
