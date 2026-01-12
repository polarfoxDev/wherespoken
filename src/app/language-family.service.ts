import { Injectable, signal } from '@angular/core';
import langs from 'langs';

interface LanguageEntry {
  id: string;
  name: string;
  iso639P3code: string;
  level: 'language' | 'family';
  parentId: string;
}

export interface FamilyComparisonResult {
  commonAncestor: string | null;
  distanceScore: number; // 0-100, where 100 = same language, 0 = totally unrelated
  guessAncestry: string[];
  correctAncestry: string[];
}

@Injectable({ providedIn: 'root' })
export class LanguageFamilyService {
  private languageMap = signal<Map<string, LanguageEntry>>(new Map());
  private iso639ToIdMap = signal<Map<string, string>>(new Map());
  private loaded = signal(false);

  constructor() {
    this.loadLanguages();
  }

  private async loadLanguages(): Promise<void> {
    try {
      const response = await fetch('/languages.csv');
      const text = await response.text();
      const lines = text.trim().split('\n');

      const langMap = new Map<string, LanguageEntry>();
      const isoMap = new Map<string, string>();

      // Skip header
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const [id, name, iso639P3code, level, parentId] = line.split(',');

        const entry: LanguageEntry = {
          id: id?.trim() || '',
          name: name?.trim() || '',
          iso639P3code: iso639P3code?.trim() || '',
          level: (level?.trim() || 'family') as 'language' | 'family',
          parentId: parentId?.trim() || '',
        };

        langMap.set(entry.id, entry);

        if (entry.iso639P3code) {
          isoMap.set(entry.iso639P3code, entry.id);
        }
      }

      this.languageMap.set(langMap);
      this.iso639ToIdMap.set(isoMap);
      this.loaded.set(true);
    } catch (error) {
      console.error('Failed to load languages.csv:', error);
    }
  }

  /**
   * Get ancestry chain from a language ID up to the root
   * Returns array of names from language up to top-level family
   */
  private getAncestry(langId: string): string[] {
    const ancestry: string[] = [];
    const langMap = this.languageMap();

    let current = langMap.get(langId);
    while (current) {
      ancestry.push(current.name);
      if (!current.parentId) break;
      current = langMap.get(current.parentId);
    }

    return ancestry;
  }

  /**
   * Convert BCP-47 locale code to ISO 639-3 code
   */
  private localeToIso639_3(locale: string): string | null {
    // Extract language part from locale (e.g., "de" from "de-DE")
    let langCode = locale;
    try {
      langCode = new Intl.Locale(locale).language;
    } catch {
      // Use as-is if parsing fails
    }

    // Use langs library to convert ISO 639-1 to ISO 639-3
    const langInfo = langs.where('1', langCode);
    return langInfo?.['3'] || null;
  }

  /**
   * Compare two languages and find their common ancestry
   */
  compareFamilies(guessLocale: string, correctLocale: string): FamilyComparisonResult {
    if (!this.loaded()) {
      return {
        commonAncestor: null,
        distanceScore: 0,
        guessAncestry: [],
        correctAncestry: [],
      };
    }

    // Convert locales to ISO 639-3
    const guessIso = this.localeToIso639_3(guessLocale);
    const correctIso = this.localeToIso639_3(correctLocale);

    if (!guessIso || !correctIso) {
      return {
        commonAncestor: null,
        distanceScore: 0,
        guessAncestry: [],
        correctAncestry: [],
      };
    }

    // Get language IDs from ISO codes
    const isoMap = this.iso639ToIdMap();
    const guessId = isoMap.get(guessIso);
    const correctId = isoMap.get(correctIso);

    if (!guessId || !correctId) {
      return {
        commonAncestor: null,
        distanceScore: 0,
        guessAncestry: [],
        correctAncestry: [],
      };
    }

    // Get ancestry chains
    const guessAncestry = this.getAncestry(guessId);
    const correctAncestry = this.getAncestry(correctId);

    // Find common ancestor
    const guessAncestrySet = new Set(guessAncestry);
    let commonAncestor: string | null = null;
    let commonDepthInCorrect = -1;

    for (let i = 0; i < correctAncestry.length; i++) {
      if (guessAncestrySet.has(correctAncestry[i])) {
        commonAncestor = correctAncestry[i];
        commonDepthInCorrect = i;
        break;
      }
    }

    // Calculate distance score
    // Score is based on how close the common ancestor is to both languages
    // 100% = same language, 0% = no common ancestor
    let distanceScore = 0;

    if (commonAncestor) {
      const guessDepth = guessAncestry.indexOf(commonAncestor);
      const correctDepth = commonDepthInCorrect;

      // Total steps = distance from guess to common + distance from correct to common
      const totalSteps = guessDepth + correctDepth;

      // Max possible steps would be if they share only the root
      const maxSteps = guessAncestry.length + correctAncestry.length - 2;

      if (maxSteps > 0) {
        // Higher score when fewer steps (closer relationship)
        distanceScore = Math.round(((maxSteps - totalSteps) / maxSteps) * 100);
      } else {
        distanceScore = 100; // Same language
      }
    }

    return {
      commonAncestor,
      distanceScore: Math.max(0, Math.min(100, distanceScore)),
      guessAncestry,
      correctAncestry,
    };
  }
}
