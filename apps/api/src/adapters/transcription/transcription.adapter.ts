// ===========================================
// Transcription Adapter Interface
// Pluggable adapter for speech-to-text
// ===========================================

export interface TranscriptionResult {
  text: string;
  confidence: number;
  duration: number;
  language?: string;
}

export interface TranscriptionAdapter {
  name: string;
  transcribe(audioBuffer: Buffer, mimeType: string): Promise<TranscriptionResult>;
}
