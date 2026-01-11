interface ExtendedSampleMetadata extends SampleMetadata {
  sampleId: string;
  audioUrl: string;
  audioHintUrl: string;
}

interface SampleMetadata {
  language: string;
  voice: string;
  text: string;
  englishTranslation: string;
  hint: string;
  hintEnglishTranslation?: string;
  createdAt: string;
}
