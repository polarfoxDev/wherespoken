import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Schedule } from './types/schedule';
import { environment } from '../environments/environment';
import { ExtendedSampleMetadata, SampleMetadata } from './types/sampleMetadata';

@Injectable({
  providedIn: 'root',
})
export class Api {
  http = inject(HttpClient);
  private scheduleSignal = signal<Schedule>({});
  schedule = this.scheduleSignal.asReadonly();
  private sampleSignal = signal<ExtendedSampleMetadata | null>(null);
  sample = this.sampleSignal.asReadonly();

  loadSchedule(): void {
    this.http.get<Schedule>(environment.s3Endpoint + 'schedule.json').subscribe((data) => {
      this.scheduleSignal.set(data);
    });
  }

  loadSample(sampleId: string): void {
    console.log(`Loading sample ${sampleId}...`);
    this.http
      .get<SampleMetadata>(environment.s3Endpoint + `${sampleId}/metadata.json`)
      .subscribe((data) => {
        this.sampleSignal.set({
          ...data,
          sampleId,
          audioUrl: environment.s3Endpoint + `${sampleId}/sample.mp3`,
          audioHintUrl: environment.s3Endpoint + `${sampleId}/hint.mp3`,
        });
      });
  }
}
