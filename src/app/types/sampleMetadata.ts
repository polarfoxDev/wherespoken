export interface ExtendedSampleMetadata extends SampleMetadata {
  sampleId: string;
  audioUrl: string;
  audioHintUrl: string;
}

interface SampleMetadata {
  language: string; // e.g. "en-US"
  voice: string;
  text: string;
  englishTranslation: string;
  hint: string;
  hintEnglishTranslation?: string;
  createdAt: string;
}
