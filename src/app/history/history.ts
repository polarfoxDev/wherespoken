import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CalendarComponent } from '../calendar/calendar';
import { FIRST_RIDDLE_DATE_ISO } from '../consts';
import { GameState } from '../game-state';

@Component({
  selector: 'app-history',
  providers: [DatePipe],
  imports: [RouterModule, CalendarComponent],
  template: `
    <div class="flex flex-col justify-center items-center gap-5 p-5 text-center">
      <div class="flex justify-center items-center gap-2.5">
        <h1 class="m-0 text-2xl font-semibold">History</h1>
        <a class="info-button text-xl" routerLink="/">×</a>
      </div>

      <p class="max-w-87.5 m-0 text-guess dark:text-guess-bright">
        Select a date to play a past puzzle.<br />
        {{ minDateString }} – {{ todayDateString }}
      </p>

      <app-calendar
        [availableDates]="gameStateService.getAllDateStates()"
        (dateSelected)="onDateSelected($event)"
      ></app-calendar>

      <div class="flex justify-center items-center flex-col gap-2.5">
        <div class="flex justify-center items-center gap-2 text-sm">
          <div class="w-3 h-3 rounded-full bg-guess"></div>
          Available
        </div>
        <div class="flex justify-center items-center gap-2 text-sm">
          <div class="w-3 h-3 rounded-full bg-solution"></div>
          In Progress
        </div>
        <div class="flex justify-center items-center gap-2 text-sm">
          <div class="w-3 h-3 rounded-full bg-accent"></div>
          Completed
        </div>
      </div>

      <a
        class="flex h-12 w-48 rounded-lg bg-guess text-text-inverse text-base font-medium justify-center items-center no-underline transition-transform hover:scale-102"
        routerLink="/"
        >Today's Puzzle</a
      >
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoryComponent {
  private datePipe = inject(DatePipe);
  private router = inject(Router);
  readonly gameStateService = inject(GameState);

  readonly minDateString = this.datePipe.transform(new Date(FIRST_RIDDLE_DATE_ISO), 'mediumDate');
  readonly todayDateString = this.datePipe.transform(new Date(), 'mediumDate');

  onDateSelected(dateISO: string): void {
    this.router.navigate(['/history', dateISO]);
  }
}
