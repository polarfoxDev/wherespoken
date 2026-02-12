import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Schedule } from './types/schedule';
import { environment } from '../environments/environment';
import { ExtendedSampleMetadata, SampleMetadata } from './types/sampleMetadata';
import { catchError, Observable, of, switchMap, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Api {
  private http = inject(HttpClient);

  // Sample
  private sampleSignal = signal<ExtendedSampleMetadata | null>(null);
  sample = this.sampleSignal.asReadonly();
  sampleLoading = signal(false);
  sampleError = signal<string | null>(null);

  loadSampleForDate(date: Date): void {
    this.sampleLoading.set(true);
    this.sampleError.set(null);
    this.sampleSignal.set(null);
    this.http.get<ExtendedSampleMetadata>(`${environment.middlewareUrl}/${date.toISOString().split('T')[0]}`)
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
          this.sampleSignal.set(data);
        }
        this.sampleLoading.set(false);
      });
  }
}
