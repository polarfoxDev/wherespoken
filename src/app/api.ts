import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Schedule } from './types/schedule';
import { environment } from '../environments/environment';
import { ExtendedSampleMetadata, SampleMetadata } from './types/sampleMetadata';
import { catchError, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Api {
  http = inject(HttpClient);

  // Schedule
  private scheduleSignal = signal<Schedule>({});
  schedule = this.scheduleSignal.asReadonly();
  scheduleLoading = signal(false);
  scheduleError = signal<string | null>(null);

  // Sample
  private sampleSignal = signal<ExtendedSampleMetadata | null>(null);
  sample = this.sampleSignal.asReadonly();
  sampleLoading = signal(false);
  sampleError = signal<string | null>(null);

  loadSchedule(): void {
    this.scheduleLoading.set(true);
    this.scheduleError.set(null);
    this.http
      .get<Schedule>(environment.s3Endpoint + 'schedule.json')
      .pipe(
        catchError((err) => {
          this.scheduleError.set('Failed to load schedule. Please try again later.');
          console.error('Schedule load error:', err);
          return of({} as Schedule);
        })
      )
      .subscribe((data) => {
        this.scheduleSignal.set(data);
        this.scheduleLoading.set(false);
      });
  }

  loadSample(sampleId: string): void {
    console.log(`Loading sample ${sampleId}...`);
    this.sampleLoading.set(true);
    this.sampleError.set(null);
    this.sampleSignal.set(null);
    this.http
      .get<SampleMetadata>(environment.s3Endpoint + `${sampleId}/metadata.json`)
      .pipe(
        catchError((err) => {
          this.sampleError.set('Failed to load puzzle. Please try again later.');
          this.sampleLoading.set(false);
          console.error('Sample load error:', err);
          return of(null);
        })
      )
      .subscribe((data) => {
        if (data) {
          this.sampleSignal.set({
            ...data,
            sampleId,
            audioUrl: environment.s3Endpoint + `${sampleId}/sample.mp3`,
            audioHintUrl: environment.s3Endpoint + `${sampleId}/hint.mp3`,
          });
        }
        this.sampleLoading.set(false);
      });
  }

  setNoSampleError(): void {
    this.sampleError.set('No puzzle available for this date.');
  }
}
