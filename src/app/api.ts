import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { environment } from '../environments/environment';
import { ExtendedSampleMetadata } from './types/sampleMetadata';
import { catchError, of} from 'rxjs';

const RIDDLE_CACHE_KEY = 'wherespoken-riddle-cache';

interface RiddleCache {
  [dateISO: string]: ExtendedSampleMetadata;
}

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

  private getCachedRiddle(dateISO: string): ExtendedSampleMetadata | null {
    try {
      const cached = localStorage.getItem(RIDDLE_CACHE_KEY);
      if (cached) {
        const cache: RiddleCache = JSON.parse(cached);
        return cache[dateISO] ?? null;
      }
    } catch {
      // Ignore cache errors
    }
    return null;
  }

  private setCachedRiddle(dateISO: string, riddle: ExtendedSampleMetadata): void {
    try {
      const cached = localStorage.getItem(RIDDLE_CACHE_KEY);
      const cache: RiddleCache = cached ? JSON.parse(cached) : {};
      cache[dateISO] = riddle;
      localStorage.setItem(RIDDLE_CACHE_KEY, JSON.stringify(cache));
    } catch {
      // Ignore cache errors
    }
  }

  loadSampleForDate(date: Date): void {
    this.sampleLoading.set(true);
    this.sampleError.set(null);
    this.sampleSignal.set(null);

    const dateISO = date.toISOString().split('T')[0];

    // Check cache first
    const cachedRiddle = this.getCachedRiddle(dateISO);
    if (cachedRiddle) {
      this.sampleSignal.set(cachedRiddle);
      this.sampleLoading.set(false);
      return;
    }

    // Fetch from API if not cached
    this.http.get<ExtendedSampleMetadata>(`${environment.middlewareUrl}/${dateISO}`)
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
          this.setCachedRiddle(dateISO, data);
        }
        this.sampleLoading.set(false);
      });
  }
}
