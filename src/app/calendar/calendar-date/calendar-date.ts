import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CalendarDate, GameStatus } from '../calendar.models';

@Component({
  selector: 'app-calendar-date',
  imports: [DatePipe],
  template: `
    <div class="w-full h-full overflow-hidden flex justify-center items-center">
      <button
        [disabled]="date().gameStatus === GameStatus.NotAvailable"
        (click)="selectDate()"
        class="w-9 h-9 flex justify-center items-center rounded-full border-none cursor-pointer outline-none text-lg font-sans transition-transform hover:enabled:scale-110"
        [class]="buttonClasses()"
      >
        {{ date().date | date : 'd' }}
      </button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarDateComponent {
  protected readonly GameStatus = GameStatus;

  date = input.required<CalendarDate>();
  dateSelected = output<Date>();

  buttonClasses = computed(() => {
    const status = this.date().gameStatus;
    const isToday = this.date().isToday;

    let classes = '';

    switch (status) {
      case GameStatus.Finished:
        classes = 'bg-accent text-text-inverse';
        break;
      case GameStatus.InProgress:
        classes = 'bg-solution text-text-inverse';
        break;
      case GameStatus.NotStarted:
        classes = 'bg-guess text-text-inverse';
        break;
      case GameStatus.NotAvailable:
        classes =
          'bg-surface dark:bg-surface-dark text-guess-brightest dark:text-guess-dark cursor-not-allowed';
        break;
    }

    if (isToday) {
      classes += ' ring-2 ring-solution';
    }

    return classes;
  });

  selectDate(): void {
    if (this.date().gameStatus !== GameStatus.NotAvailable) {
      this.dateSelected.emit(this.date().date);
    }
  }
}
