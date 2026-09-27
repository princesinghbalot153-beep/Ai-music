export type LyriaModel = 'lyria-3-clip-preview' | 'lyria-3-pro-preview';

export interface MusicTrack {
  id: string;
  title: string;
  prompt: string;
  model: LyriaModel;
  audioUrl: string;
  mimeType: string;
  duration: number; // in seconds
  createdAt: string;
  isSynthesized?: boolean;
  metadata?: {
    genre?: string;
    mood?: string;
    tempo?: number;
    keyScale?: string;
    instruments?: string[];
  };
}

export type VisualizerMode = 'bars' | 'wave' | 'circle';

export interface GenerationParams {
  prompt: string;
  model: LyriaModel;
  genre: string;
  mood: string;
  tempo: number;
  keyScale: string;
  duration: number;
  instruments: string[];
}
