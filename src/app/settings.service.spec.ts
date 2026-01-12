import { TestBed } from '@angular/core/testing';
import { SettingsService, DifficultyMode } from './settings.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('SettingsService', () => {
  let service: SettingsService;
  let localStorageMock: { [key: string]: string };

  beforeEach(() => {
    // Mock localStorage
    localStorageMock = {};

    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key: string) => {
      return localStorageMock[key] || null;
    });

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key: string, value: string) => {
      localStorageMock[key] = value;
    });

    TestBed.configureTestingModule({});
    service = TestBed.inject(SettingsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with default difficulty mode', () => {
    expect(service.difficulty()).toBe('normal');
  });

  it('should initialize showHints as true for normal difficulty', () => {
    expect(service.showHints()).toBe(true);
  });

  it('should initialize showAncestry as true for normal difficulty', () => {
    expect(service.showAncestry()).toBe(true);
  });

  it('should load difficulty from localStorage if available', () => {
    localStorageMock['wherespoken-settings'] = JSON.stringify({ difficulty: 'hard' });
    const newService = new SettingsService();
    expect(newService.difficulty()).toBe('hard');
  });

  it('should cycle difficulty from normal to hard', () => {
    expect(service.difficulty()).toBe('normal');
    service.cycleDifficulty();
    expect(service.difficulty()).toBe('hard');
  });

  it('should cycle difficulty from hard to extreme', () => {
    service.setDifficulty('hard');
    service.cycleDifficulty();
    expect(service.difficulty()).toBe('extreme');
  });

  it('should cycle difficulty from extreme to normal', () => {
    service.setDifficulty('extreme');
    service.cycleDifficulty();
    expect(service.difficulty()).toBe('normal');
  });

  it('should show hints only in normal mode', () => {
    service.setDifficulty('normal');
    expect(service.showHints()).toBe(true);

    service.setDifficulty('hard');
    expect(service.showHints()).toBe(false);

    service.setDifficulty('extreme');
    expect(service.showHints()).toBe(false);
  });

  it('should show ancestry in normal and hard modes but not extreme', () => {
    service.setDifficulty('normal');
    expect(service.showAncestry()).toBe(true);

    service.setDifficulty('hard');
    expect(service.showAncestry()).toBe(true);

    service.setDifficulty('extreme');
    expect(service.showAncestry()).toBe(false);
  });

  it('should persist difficulty to localStorage when changed', () => {
    service.setDifficulty('hard');
    expect(Storage.prototype.setItem).toHaveBeenCalledWith(
      'wherespoken-settings',
      JSON.stringify({ difficulty: 'hard' })
    );
  });

  it('should handle invalid localStorage data gracefully', () => {
    localStorageMock['wherespoken-settings'] = 'invalid json';
    const newService = new SettingsService();
    expect(newService.difficulty()).toBe('normal');
  });
});

