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

/**
 * Fallback mappings for ISO 639-3 codes that differ between the langs library
 * and Glottolog. The `langs` library returns macrolanguage codes while
 * Glottolog uses individual language codes.
 */
const ISO639_3_FALLBACKS: Record<string, string> = {
  // Serbian/Croatian/Bosnian -> Serbo-Croatian macrolanguage
  hrv: 'hbs', // Croatian
  srp: 'hbs', // Serbian
  bos: 'hbs', // Bosnian
  // Arabic varieties -> Standard Arabic
  ara: 'arb', // Standard Arabic
  // Chinese -> Mandarin Chinese
  zho: 'cmn', // Chinese -> Mandarin
  // Azerbaijani -> North Azerbaijani (most common)
  aze: 'azj', // Azerbaijani -> North Azerbaijani
  // Estonian macrolanguage -> Estonian
  est: 'ekk', // Estonian
  // Malagasy macrolanguage -> Plateau Malagasy (standard)
  mlg: 'plt', // Malagasy -> Plateau Malagasy
  // Malay macrolanguage -> Standard Malay
  msa: 'zsm', // Malay -> Standard Malay
  // Oriya macrolanguage -> Odia
  ori: 'ory', // Oriya -> Odia
  // Persian macrolanguage -> Western Farsi
  fas: 'pes', // Persian/Farsi -> Western Farsi
  // Swahili macrolanguage -> Swahili
  swa: 'swh', // Swahili
};

@Injectable({ providedIn: 'root' })
export class LanguageFamilyService {
  private languageMap = signal<Map<string, LanguageEntry>>(new Map());
  private iso639ToIdMap = signal<Map<string, string>>(new Map());
  private loaded = signal(false);
  isLoaded = this.loaded.asReadonly();

  constructor() {
    // Call loadLanguages immediately to start loading data
    void this.loadLanguages();
  }

  /**
   * Parse a CSV line handling quoted fields that may contain commas
   */
  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    // Push the last field
    result.push(current);

    return result;
  }

  private async loadLanguages(): Promise<void> {
    try {
      const responseMain = await fetch('/languages.csv');
      const text = await responseMain.text();

      const responseConlang = await fetch('/conlangs.csv');
      const conlangText = await responseConlang.text();

      const combinedText = text + '\n' + conlangText;

      const lines = combinedText.trim().split('\n');

      const langMap = new Map<string, LanguageEntry>();
      const isoMap = new Map<string, string>();

      // Skip header
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const fields = this.parseCsvLine(line);
        const [id, name, iso639P3code, level, parentId] = fields;

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
   * Gets language entry by ID
   */
  getLanguage(iso639: string): LanguageEntry | null {
    return this.iso639ToIdMap().has(iso639)
      ? this.languageMap().get(this.iso639ToIdMap().get(iso639)!) || null
      : null;
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
    } catch {}

    // Use langs library to convert ISO 639-1 to ISO 639-3
    const langInfo = langs.where('1', langCode);
    const iso639_3 = langInfo?.['3'] || null;

    if (!iso639_3 && langCode.length === 3) {
      return langCode;
    }
    return iso639_3;
  }

  /**
   * Compare two languages and find their common ancestry
   */
  compareFamilies(guessLocale: string, correctLocale: string): FamilyComparisonResult | null {
    if (!this.loaded()) {
      return null;
    }

    // Convert locales to ISO 639-3
    const guessIso = this.localeToIso639_3(guessLocale);
    const correctIso = this.localeToIso639_3(correctLocale);

    if (!guessIso || !correctIso) {
      return null;
    }

    // Get language IDs from ISO codes, with fallback for macrolanguages
    const isoMap = this.iso639ToIdMap();
    let guessId = isoMap.get(guessIso);
    let correctId = isoMap.get(correctIso);

    // Try fallback codes if not found
    if (!guessId && ISO639_3_FALLBACKS[guessIso]) {
      guessId = isoMap.get(ISO639_3_FALLBACKS[guessIso]);
    }
    if (!correctId && ISO639_3_FALLBACKS[correctIso]) {
      correctId = isoMap.get(ISO639_3_FALLBACKS[correctIso]);
    }

    if (!guessId || !correctId) {
      return null;
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

    if (guessLocale === correctLocale) {
      distanceScore = 100; // Same language
    } else if (guessId === correctId) {
      distanceScore = 99; // Other region/variant of same language
    } else if (commonAncestor) {
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
        distanceScore = 0;
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
