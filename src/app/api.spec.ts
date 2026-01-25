import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Api } from './api';
import { environment } from '../environments/environment';

describe('Api', () => {
  let service: Api;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [Api, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(Api);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('should add cache-busting parameter to schedule request', () => {
    const today = new Date();
    const expectedCacheBuster = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;

    service.loadSchedule();

    const req = httpMock.expectOne(
      (request) =>
        request.url.includes('schedule.json') && request.url.includes(`d=${expectedCacheBuster}`)
    );

    expect(req.request.method).toBe('GET');
    expect(req.request.url).toBe(
      `${environment.s3Endpoint}schedule.json?d=${expectedCacheBuster}`
    );

    req.flush({});
  });

  it('should not add cache-busting parameter to sample metadata requests', () => {
    const sampleId = 'test-sample-123';

    service.loadSample(sampleId);

    const req = httpMock.expectOne(`${environment.s3Endpoint}${sampleId}/metadata.json`);

    expect(req.request.method).toBe('GET');
    expect(req.request.url).not.toContain('?');

    req.flush({
      language: 'Test Language',
      dialect: 'Test Dialect',
      text: 'Test text',
      textHint: 'Test hint',
      translation: 'Test translation',
      translationHint: 'Test translation hint',
    });
  });
});
