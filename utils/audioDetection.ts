
import Meyda from 'meyda';

export interface Onset {
  time: number;
  energy: number;
  spectralCentroid: number;
  type: 'B' | 'T' | '?';
}

export class AudioDetector {
  private audioContext: AudioContext;
  private sourceNode: AudioNode;
  private onsets: Onset[] = [];
  private isAnalyzing: boolean = false;
  private analyzer: any;
  private startTime: number = 0;

  constructor(audioContext: AudioContext, sourceNode: AudioNode) {
    this.audioContext = audioContext;
    this.sourceNode = sourceNode;
    
    // @ts-ignore
    this.analyzer = Meyda.createMeydaAnalyzer({
      audioContext: this.audioContext,
      source: this.sourceNode,
      bufferSize: 512,
      featureExtractors: ['rms', 'spectralCentroid'],
      callback: (features: any) => this.detectOnset(features)
    });
  }

  start() {
    this.startTime = this.audioContext.currentTime;
    this.isAnalyzing = true;
    this.onsets = [];
    this.analyzer.start();
  }

  stop() {
    this.isAnalyzing = false;
    this.analyzer.stop();
    return this.onsets;
  }

  private detectOnset(features: any) {
    if (!this.isAnalyzing) return;

    const currentTime = this.audioContext.currentTime - this.startTime;
    const rms = features.rms;
    const centroid = features.spectralCentroid;
    
    // Sensibilidade ajustada para Cajón
    const threshold = 0.12;
    
    if (rms > threshold) {
      const lastOnset = this.onsets[this.onsets.length - 1];
      
      // Debouncing rítmico (80ms para permitir semicolcheias rápidas)
      if (!lastOnset || currentTime - lastOnset.time > 0.08) {
        // Classificação baseada no centroide espectral
        // Bass (B): Frequências baixas (< 1800Hz)
        // Tone (T): Frequências altas (> 1800Hz)
        const type: 'B' | 'T' = centroid < 1800 ? 'B' : 'T';

        this.onsets.push({
          time: currentTime,
          energy: rms,
          spectralCentroid: centroid,
          type: type
        });
      }
    }
  }
}
