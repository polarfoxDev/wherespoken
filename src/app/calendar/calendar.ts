import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { CalendarDateComponent } from './calendar-date/calendar-date';
import { CalendarDate, CalendarMonth, GameStatus } from './calendar.models';
import { FIRST_RIDDLE_DATE_ISO } from '../consts';

@Component({
  selector: 'app-calendar',
  providers: [DatePipe],
  imports: [CalendarDateComponent, DatePipe],
  template: `
    <div
      class="grid grid-cols-7 gap-0.5"
      style="grid-template-columns: repeat(7, 44px); grid-auto-rows: 44px;"
    >
      <div class="col-span-7 flex justify-between items-center px-2 mb-2">
        <button
          class="info-button"
          [disabled]="!activeMonth().previousAvailable"
          (click)="previousMonth()"
        >
          ‹
        </button>
        <h2 class="m-0 text-base font-semibold">
          {{ activeMonth().dates[0].date | date : 'MMMM yyyy' }}
        </h2>
        <button class="info-button" [disabled]="!activeMonth().nextAvailable" (click)="nextMonth()">
          ›
        </button>
      </div>

      @for (day of weekdays; track day) {
      <div
        class="flex justify-center items-center text-xs font-semibold uppercase text-guess dark:text-guess-bright"
      >
        {{ day }}
      </div>
      } @if (activeMonth().gridOffset > 0) {
      <div [style.grid-column]="'1 / span ' + activeMonth().gridOffset"></div>
      } @for (date of activeMonth().dates; track $index) {
      <app-calendar-date [date]="date" (dateSelected)="onDateSelected($event)"></app-calendar-date>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarComponent {
  private datePipe = inject(DatePipe);

  availableDates = input<Record<string, { started: boolean; finished: boolean }>>({});
  dateSelected = output<string>();

  readonly weekdays: string[] = (() => {
    // Start from a known Monday (1970-01-05) and build Monday..Sunday
    const monday = new Date(1970, 0, 5);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return this.datePipe.transform(d, 'EEEEEE') ?? '';
    });
  })();

  activeMonth = signal<CalendarMonth>(this.createMonth(new Date()));

  private createMonth(date: Date): CalendarMonth {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const gridOffset = (start.getDay() - 1 + 7) % 7; // adjust for Monday as the first day of the week
    const dates = this.createDates(start);
    const previousAvailable = this.isSelectable(new Date(start.getFullYear(), start.getMonth(), 0));
    const nextAvailable = this.isSelectable(new Date(start.getFullYear(), start.getMonth() + 1, 1));
    return { gridOffset, dates, previousAvailable, nextAvailable };
  }

  private createDates(start: Date): CalendarDate[] {
    const dates: CalendarDate[] = [];
    const today = new Date().toDateString();
    const year = start.getFullYear();
    const month = start.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const available = this.availableDates();

    for (let i = 0; i < daysInMonth; i++) {
      const day = i + 1;
      const date = new Date(Date.UTC(year, month, day));
      const isToday = date.toDateString() === today;
      const dateISO = date.toISOString().slice(0, 10);
      const gameMetadata = available[dateISO];
      const gameStatus = this.isSelectable(date)
        ? gameMetadata
          ? gameMetadata.finished
            ? GameStatus.Finished
            : gameMetadata.started
            ? GameStatus.InProgress
            : GameStatus.NotStarted
          : GameStatus.NotStarted
        : GameStatus.NotAvailable;
      dates.push({ date, isToday, gameStatus });
    }
    return dates;
  }

  private isSelectable(date: Date): boolean {
    const firstAvailableDate = new Date(FIRST_RIDDLE_DATE_ISO);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return date >= firstAvailableDate && date <= today;
  }

  previousMonth(): void {
    const current = this.activeMonth().dates[0].date;
    this.activeMonth.set(
      this.createMonth(new Date(current.getFullYear(), current.getMonth() - 1, 1))
    );
  }

  nextMonth(): void {
    const current = this.activeMonth().dates[0].date;
    this.activeMonth.set(
      this.createMonth(new Date(current.getFullYear(), current.getMonth() + 1, 1))
    );
  }

  onDateSelected(date: Date): void {
    this.dateSelected.emit(date.toISOString().slice(0, 10));
  }

  refresh(): void {
    const current = this.activeMonth().dates[0].date;
    this.activeMonth.set(this.createMonth(current));
  }
}
