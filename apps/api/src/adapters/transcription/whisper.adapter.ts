// ===========================================
// OpenAI Whisper Transcription Adapter
// ===========================================

import OpenAI from 'openai';
import { config } from '../../config';
import { TranscriptionAdapter, TranscriptionResult } from './transcription.adapter';
import { Readable } from 'stream';
import { File } from 'buffer';

export class WhisperAdapter implements TranscriptionAdapter {
  name = 'openai-whisper';
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: config.OPENAI_API_KEY,
    });
  }

  async transcribe(audioBuffer: Buffer, mimeType: string): Promise<TranscriptionResult> {
    const startTime = Date.now();

    // Determine file extension from MIME type
    const extension = this.getExtension(mimeType);

    // Create a File object from the buffer
    const file = new File([audioBuffer], `audio.${extension}`, { type: mimeType });

    try {
      const response = await this.client.audio.transcriptions.create({
        model: 'whisper-1',
        file: file as any,
        response_format: 'verbose_json',
      });

      const duration = Date.now() - startTime;

      return {
        text: response.text,
        confidence: 0.95, // Whisper doesn't provide confidence scores
        duration,
        language: response.language,
      };
    } catch (error: any) {
      console.error('Whisper transcription error:', error);
      throw new Error(`Transcription failed: ${error.message}`);
    }
  }

  private getExtension(mimeType: string): string {
    const mimeMap: Record<string, string> = {
      'audio/webm': 'webm',
      'audio/mp3': 'mp3',
      'audio/mpeg': 'mp3',
      'audio/wav': 'wav',
      'audio/wave': 'wav',
      'audio/ogg': 'ogg',
      'audio/flac': 'flac',
      'audio/m4a': 'm4a',
      'audio/mp4': 'm4a',
    };

    return mimeMap[mimeType] || 'webm';
  }
}
