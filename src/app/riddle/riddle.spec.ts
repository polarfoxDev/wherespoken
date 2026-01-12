import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Riddle } from './riddle';
import { ExtendedSampleMetadata } from '../types/sampleMetadata';
import { LanguageFamilyService } from '../language-family.service';
import { SettingsService } from '../settings.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Riddle', () => {
  let component: Riddle;
  let fixture: ComponentFixture<Riddle>;
  let mockSample: ExtendedSampleMetadata;

  beforeEach(async () => {
    // Mock localStorage
    const localStorageMock: { [key: string]: string } = {};

    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key: string) => {
      return localStorageMock[key] || null;
    });

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key: string, value: string) => {
      localStorageMock[key] = value;
    });

    await TestBed.configureTestingModule({
      imports: [Riddle],
    }).compileComponents();

    fixture = TestBed.createComponent(Riddle);
    component = fixture.componentInstance;

    // Set up mock sample
    mockSample = {
      sampleId: '1',
      language: 'en',
      voice: 'test-voice',
      text: 'Hello world',
      englishTranslation: 'Hello world',
      hint: 'A greeting',
      audioUrl: '/sample.mp3',
      audioHintUrl: '/hint.mp3',
      createdAt: '2024-01-01',
    };

    fixture.componentRef.setInput('sample', mockSample);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('difficulty mode', () => {
    it('should initialize with normal difficulty', () => {
      expect(component.difficulty()).toBe('normal');
    });

    it('should toggle difficulty before game starts', () => {
      const initialDifficulty = component.difficulty();
      component.toggleDifficulty();
      expect(component.difficulty()).not.toBe(initialDifficulty);
    });

    it('should not allow difficulty change after game starts', () => {
      // Simulate first guess
      component.history.set(['WRONG']);
      fixture.detectChanges();

      const lockedDifficulty = component.difficulty();
      component.toggleDifficulty();
      expect(component.difficulty()).toBe(lockedDifficulty);
    });

    it('should show hints in normal mode', () => {
      const settingsService = TestBed.inject(SettingsService);
      settingsService.setDifficulty('normal');
      fixture.detectChanges();
      expect(component.showHints()).toBe(true);
    });

    it('should hide hints in hard and extreme modes', () => {
      const settingsService = TestBed.inject(SettingsService);

      settingsService.setDifficulty('hard');
      fixture.detectChanges();
      expect(component.showHints()).toBe(false);

      settingsService.setDifficulty('extreme');
      fixture.detectChanges();
      expect(component.showHints()).toBe(false);
    });

    it('should show ancestry in normal and hard modes', () => {
      const settingsService = TestBed.inject(SettingsService);

      settingsService.setDifficulty('normal');
      fixture.detectChanges();
      expect(component.showAncestry()).toBe(true);

      settingsService.setDifficulty('hard');
      fixture.detectChanges();
      expect(component.showAncestry()).toBe(true);
    });

    it('should hide ancestry in extreme mode', () => {
      const settingsService = TestBed.inject(SettingsService);
      settingsService.setDifficulty('extreme');
      fixture.detectChanges();
      expect(component.showAncestry()).toBe(false);
    });
  });

  describe('scoreToEmojiRow', () => {
    it('should return full green squares for correct answer', () => {
      const result = (component as any).scoreToEmojiRow(100, 'CORRECT', false);
      expect(result).toBe('🟩🟩🟩🟩🟩');
    });

    it('should return yellow squares for base match', () => {
      const result = (component as any).scoreToEmojiRow(99, 'BASE_MATCH', false);
      expect(result).toBe('🟨🟨🟨🟨🟨');
    });

    it('should return empty squares for zero score', () => {
      const result = (component as any).scoreToEmojiRow(0, 'WRONG', false);
      expect(result).toBe('⬛⬛⬛⬛⬛');
    });

    it('should return mix of filled and empty based on score', () => {
      const result40 = (component as any).scoreToEmojiRow(40, 'WRONG', false);
      expect(result40).toBe('🟩🟩⬛⬛⬛');

      const result60 = (component as any).scoreToEmojiRow(60, 'WRONG', false);
      expect(result60).toBe('🟩🟩🟩⬛⬛');

      const result80 = (component as any).scoreToEmojiRow(80, 'WRONG', false);
      expect(result80).toBe('🟩🟩🟩🟩⬛');
    });

    it('should add party emoji for correct answer in share mode', () => {
      const result = (component as any).scoreToEmojiRow(100, 'CORRECT', true);
      expect(result).toBe('🟩🟩🟩🟩🟩🎉');
    });

    it('should add X emoji for lost guess in share mode', () => {
      const result = (component as any).scoreToEmojiRow(20, 'LOST', true);
      expect(result).toBe('🟩⬛⬛⬛⬛❌');
    });
  });

  describe('getEffectiveSimilarityScores', () => {
    it('should return stored scores when available', () => {
      component.similarityScores.set([40, 60, 80]);
      component.history.set(['WRONG', 'WRONG', 'WRONG']);

      const scores = (component as any).getEffectiveSimilarityScores();
      expect(scores).toEqual([40, 60, 80]);
    });

    it('should recalculate scores for backwards compatibility', () => {
      component.history.set(['CORRECT']);
      component.similarityScores.set([]);

      const scores = (component as any).getEffectiveSimilarityScores();
      expect(scores.length).toBe(1);
      expect(scores[0]).toBe(100);
    });

    it('should handle BASE_MATCH result', () => {
      component.history.set(['BASE_MATCH']);
      component.similarityScores.set([]);

      const scores = (component as any).getEffectiveSimilarityScores();
      expect(scores[0]).toBe(99);
    });
  });

  describe('difficulty label and description', () => {
    it('should show correct label for normal mode', () => {
      const settingsService = TestBed.inject(SettingsService);
      settingsService.setDifficulty('normal');
      fixture.detectChanges();
      expect(component.difficultyLabel()).toBe('🎯 Normal');
    });

    it('should show correct label for hard mode', () => {
      const settingsService = TestBed.inject(SettingsService);
      settingsService.setDifficulty('hard');
      fixture.detectChanges();
      expect(component.difficultyLabel()).toBe('🔥 Hard');
    });

    it('should show correct label for extreme mode', () => {
      const settingsService = TestBed.inject(SettingsService);
      settingsService.setDifficulty('extreme');
      fixture.detectChanges();
      expect(component.difficultyLabel()).toBe('💀 Extreme');
    });

    it('should show correct description for each difficulty', () => {
      const settingsService = TestBed.inject(SettingsService);

      settingsService.setDifficulty('normal');
      fixture.detectChanges();
      expect(component.difficultyDescription()).toBe('Hints & ancestry shown');

      settingsService.setDifficulty('hard');
      fixture.detectChanges();
      expect(component.difficultyDescription()).toBe('No hints, ancestry shown');

      settingsService.setDifficulty('extreme');
      fixture.detectChanges();
      expect(component.difficultyDescription()).toBe('No hints or ancestry');
    });
  });
});


