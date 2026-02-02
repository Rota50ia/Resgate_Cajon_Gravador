
export interface CodeSnippet {
  id: string;
  title: string;
  content: string;
  timestamp: number;
}

export interface Beat {
  time: number;
  intensity: number;
}

export interface RhythmPattern {
  id: string;
  name: string;
  bpm: number;
  signature: string;
  expectedBeats: number[]; // relative timestamps in ms
}

export interface AnalysisScore {
  accuracy: number;
  averageLatency: number;
  missedBeats: number;
  feedback: string;
}

export enum AppMode {
  IDLE = 'IDLE',
  RECORDING = 'RECORDING',
  ANALYZING = 'ANALYZING',
  RESULTS = 'RESULTS'
}
