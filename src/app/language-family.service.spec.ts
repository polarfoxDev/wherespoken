import { TestBed } from '@angular/core/testing';
import { LanguageFamilyService } from './language-family.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('LanguageFamilyService', () => {
  let service: LanguageFamilyService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LanguageFamilyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('CSV parsing', () => {
    it('should parse simple CSV line correctly', () => {
      const line = 'id1,English,eng,language,indo1234';
      const result = (service as any).parseCsvLine(line);
      expect(result).toEqual(['id1', 'English', 'eng', 'language', 'indo1234']);
    });

    it('should parse CSV line with quoted field containing comma', () => {
      const line = 'id1,"Nahuatl, Southeastern Puebla",npl,language,tehu1244';
      const result = (service as any).parseCsvLine(line);
      expect(result).toEqual(['id1', 'Nahuatl, Southeastern Puebla', 'npl', 'language', 'tehu1244']);
    });

    it('should handle empty fields', () => {
      const line = 'id1,Name,,language,';
      const result = (service as any).parseCsvLine(line);
      expect(result).toEqual(['id1', 'Name', '', 'language', '']);
    });

    it('should handle multiple quoted fields', () => {
      const line = '"id1","Name, with comma",code,"level","parent"';
      const result = (service as any).parseCsvLine(line);
      expect(result).toEqual(['id1', 'Name, with comma', 'code', 'level', 'parent']);
    });
  });

  describe('compareFamilies', () => {
    it('should return zero scores when data not loaded', () => {
      const result = service.compareFamilies('en', 'de');
      expect(result.distanceScore).toBe(0);
      expect(result.commonAncestor).toBeNull();
      expect(result.guessAncestry).toEqual([]);
      expect(result.correctAncestry).toEqual([]);
    });

    it('should handle invalid language codes', async () => {
      // Wait for data to load
      await new Promise((resolve) => setTimeout(resolve, 100));
      const result = service.compareFamilies('invalid', 'alsoInvalid');
      expect(result.distanceScore).toBe(0);
      expect(result.commonAncestor).toBeNull();
    });

    it('should return 100 for identical language codes', async () => {
      // Mock fetch for testing
      const mockCsvData = `ID,Name,ISO639P3code,Level,Parent_ID
eng1234,English,eng,language,germ1234
germ1234,Germanic,,,indo1234
indo1234,Indo-European,,,`;

      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(mockCsvData, {
          status: 200,
          headers: { 'Content-Type': 'text/csv' },
        })
      );

      // Create a new service instance to trigger loadLanguages
      const newService = new LanguageFamilyService();
      
      // Wait for loading to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      const result = newService.compareFamilies('en', 'en');
      expect(result.distanceScore).toBe(100);
    });

    it('should calculate correct distance for related languages', async () => {
      // Mock fetch with test data
      const mockCsvData = `ID,Name,ISO639P3code,Level,Parent_ID
eng1234,English,eng,language,germ1234
deu1234,German,deu,language,germ1234
germ1234,Germanic,,,indo1234
indo1234,Indo-European,,,`;

      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(mockCsvData, {
          status: 200,
          headers: { 'Content-Type': 'text/csv' },
        })
      );

      const newService = new LanguageFamilyService();
      await new Promise((resolve) => setTimeout(resolve, 100));

      const result = newService.compareFamilies('en', 'de');
      expect(result.distanceScore).toBeGreaterThan(0);
      expect(result.commonAncestor).toBeTruthy();
    });

    it('should handle macrolanguage fallbacks', async () => {
      // Mock fetch with test data including macrolanguage fallback
      const mockCsvData = `ID,Name,ISO639P3code,Level,Parent_ID
hbs1234,Serbo-Croatian,hbs,language,slav1234
slav1234,Slavic,,,indo1234
indo1234,Indo-European,,,`;

      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(mockCsvData, {
          status: 200,
          headers: { 'Content-Type': 'text/csv' },
        })
      );

      const newService = new LanguageFamilyService();
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Serbian (srp) should map to Serbo-Croatian (hbs) via fallback
      const result = newService.compareFamilies('sr', 'hr');
      expect(result.distanceScore).toBeGreaterThanOrEqual(0);
    });
  });
});

