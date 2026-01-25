import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Schedule } from './types/schedule';
import { environment } from '../environments/environment';
import { ExtendedSampleMetadata, SampleMetadata } from './types/sampleMetadata';
import { catchError, of, switchMap, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Api {
  private http = inject(HttpClient);
  private activeEndpoint = signal(environment.s3Endpoint);

  private fetchWithFallback<T>(path: string, queryParams?: string) {
    const fullPath = queryParams ? `${path}?${queryParams}` : path;
    return this.http.get<T>(environment.s3Endpoint + fullPath).pipe(
      catchError(() => {
        console.warn(`Primary endpoint failed, trying fallback for: ${fullPath}`);
        this.activeEndpoint.set(environment.s3EndpointFallback);
        return this.http.get<T>(environment.s3EndpointFallback + fullPath);
      }),
    );
  }

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
    // Add cache-busting parameter based on current date (YYYYMMDD format)
    // This ensures the schedule is cached for at most one day
    const today = new Date();
    const cacheBuster = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    this.fetchWithFallback<Schedule>('schedule.json', `d=${cacheBuster}`)
      .pipe(
        catchError((err) => {
          this.scheduleError.set('Failed to load schedule. Please try again later.');
          console.error('Schedule load error:', err);
          return of({} as Schedule);
        }),
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
    this.fetchWithFallback<SampleMetadata>(`${sampleId}/metadata.json`)
      .pipe(
        catchError((err) => {
          this.sampleError.set('Failed to load puzzle. Please try again later.');
          this.sampleLoading.set(false);
          console.error('Sample load error:', err);
          return of(null);
        }),
      )
      .subscribe((data) => {
        if (data) {
          const endpoint = this.activeEndpoint();
          this.sampleSignal.set({
            ...data,
            sampleId,
            audioUrl: endpoint + `${sampleId}/sample.mp3`,
            audioHintUrl: endpoint + `${sampleId}/hint.mp3`,
          });
        }
        this.sampleLoading.set(false);
      });
  }

  setNoSampleError(): void {
    this.sampleError.set('No puzzle available for this date.');
  }
}
