import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CalendarComponent } from '../calendar/calendar';

// First riddle date for wherespoken
const FIRST_RIDDLE_DATE_ISO = '2026-01-01';

@Component({
  selector: 'app-history',
  providers: [DatePipe],
  imports: [RouterModule, CalendarComponent],
  template: `
    <div class="history">
      <div class="header">
        <h1>History</h1>
        <a class="info-button close-button" routerLink="/">×</a>
      </div>

      <p class="calendar-width">
        Select a date to play a past puzzle.<br />
        {{ minDateString }} – {{ todayDateString }}
      </p>

      <app-calendar (dateSelected)="onDateSelected($event)"></app-calendar>

      <div class="key">
        <div class="key-item">
          <div class="date available"></div>
          Available
        </div>
        <div class="key-item">
          <div class="date active"></div>
          In Progress
        </div>
        <div class="key-item">
          <div class="date finished"></div>
          Completed
        </div>
      </div>

      <a class="today-button" routerLink="/">Today's Puzzle</a>
    </div>
  `,
  styles: `
    .history {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 20px;
      padding: 20px;
    }
    .history * {
      text-align: center;
    }
    .header {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 10px;
    }
    h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .close-button {
      font-size: 20px;
    }
    .calendar-width {
      max-width: 350px;
      margin: 0;
      color: light-dark(var(--guess), var(--guess-brighter));
    }
    .key {
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
      gap: 10px;
    }
    .key-item {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
      font-size: 14px;
    }
    .date {
      width: 12px;
      height: 12px;
      border-radius: 100%;
      background: var(--guess);
    }
    .date.active {
      background: var(--solution);
    }
    .date.finished {
      background: var(--super-solution);
    }
    .today-button {
      display: flex;
      height: 50px;
      width: 200px;
      border-radius: 10px;
      background: var(--solution);
      color: var(--light-text);
      font-size: 16px;
      font-weight: 500;
      justify-content: center;
      align-items: center;
      text-decoration: none;
      transition: all 0.2s ease;
    }
    .today-button:hover {
      transform: scale(1.02);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoryComponent {
  private datePipe = inject(DatePipe);
  private router = inject(Router);

  readonly minDateString = this.datePipe.transform(new Date(FIRST_RIDDLE_DATE_ISO), 'mediumDate');
  readonly todayDateString = this.datePipe.transform(new Date(), 'mediumDate');

  onDateSelected(dateISO: string): void {
    this.router.navigate(['/history', dateISO]);
  }
}
