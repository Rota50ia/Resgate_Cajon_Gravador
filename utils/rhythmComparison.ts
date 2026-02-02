
export interface TimingError {
  expected: number;
  actual: number;
  diff: number;
  beat: number;
  expectedType: string;
  actualType: string;
  typeMatch: boolean;
}

export interface TempoAnalysis {
  actualBPM: number;
  expectedBPM: number;
  bpmDiff: number;
  trend: 'consistent' | 'accelerating' | 'slowing';
  consistent: boolean;
}

export interface ComparisonResult {
  accuracy: number;
  typeAccuracy: number;
  correctHits: number;
  totalExpected: number;
  timingErrors: TimingError[];
  tempoAnalysis: TempoAnalysis;
  avgTimingError: string;
  patternAnalysis: { index: number, status: 'correct' | 'wrong-type' | 'missed' | 'extra' }[];
}

export class RhythmComparison {
  private expectedRhythm: string[];
  private bpm: number;
  private beatDuration: number;

  constructor(expectedRhythm: string[], bpm: number) {
    this.expectedRhythm = expectedRhythm;
    this.bpm = bpm;
    this.beatDuration = 60 / bpm;
  }

  getExpectedTimestamps() {
    const timestamps: { time: number; type: string; index: number }[] = [];
    this.expectedRhythm.forEach((note, index) => {
      if (note !== '·') {
        // Cada slot no array é uma colcheia (1/2 tempo)
        timestamps.push({
          time: index * (this.beatDuration / 2),
          type: note,
          index: index
        });
      }
    });
    return timestamps;
  }

  compareWithRecording(detectedOnsets: any[]): ComparisonResult {
    const expected = this.getExpectedTimestamps();
    const tolerance = 0.12; // 120ms de tolerância máxima
    
    let correctHits = 0;
    let correctTypes = 0;
    let timingErrors: TimingError[] = [];
    const patternAnalysis: ComparisonResult['patternAnalysis'] = this.expectedRhythm.map((_, i) => ({ index: i, status: 'missed' }));

    expected.forEach((expectedHit) => {
      const closest = this.findClosestOnset(expectedHit.time, detectedOnsets);
      
      if (closest) {
        const timeDiff = Math.abs(closest.time - expectedHit.time);
        const typeMatch = closest.type === expectedHit.type;
        
        if (timeDiff <= tolerance) {
          correctHits++;
          if (typeMatch) {
            correctTypes++;
            patternAnalysis[expectedHit.index].status = 'correct';
          } else {
            patternAnalysis[expectedHit.index].status = 'wrong-type';
          }
        }
        
        timingErrors.push({
          expected: expectedHit.time,
          actual: closest.time,
          diff: timeDiff,
          beat: expectedHit.index,
          expectedType: expectedHit.type,
          actualType: closest.type,
          typeMatch
        });
      }
    });

    const accuracy = expected.length > 0 ? (correctHits / expected.length) * 100 : 0;
    const typeAccuracy = correctHits > 0 ? (correctTypes / correctHits) * 100 : 0;
    const tempo = this.analyzeTempoConsistency(detectedOnsets);

    return {
      accuracy: Math.round(accuracy),
      typeAccuracy: Math.round(typeAccuracy),
      correctHits,
      totalExpected: expected.length,
      timingErrors,
      tempoAnalysis: tempo,
      avgTimingError: this.calculateAvgError(timingErrors),
      patternAnalysis
    };
  }

  private findClosestOnset(targetTime: number, onsets: any[]) {
    let closest = null;
    let minDiff = Infinity;
    onsets.forEach(onset => {
      const diff = Math.abs(onset.time - targetTime);
      if (diff < minDiff) {
        minDiff = diff;
        closest = onset;
      }
    });
    return closest;
  }

  private analyzeTempoConsistency(onsets: any[]): TempoAnalysis {
    if (onsets.length < 2) return { actualBPM: 0, expectedBPM: this.bpm, bpmDiff: 0, trend: 'consistent', consistent: true };
    const intervals = [];
    for (let i = 1; i < onsets.length; i++) {
      intervals.push(onsets[i].time - onsets[i - 1].time);
    }
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const actualBPM = 60 / (avgInterval * 2); // Multiplicado por 2 pois o grid é de colcheias
    const bpmDiff = actualBPM - this.bpm;
    return { actualBPM: Math.round(actualBPM), expectedBPM: this.bpm, bpmDiff: Math.round(bpmDiff), trend: 'consistent', consistent: Math.abs(bpmDiff) < 8 };
  }

  private calculateAvgError(errors: TimingError[]) {
    if (errors.length === 0) return "0";
    const sum = errors.reduce((acc, err) => acc + err.diff, 0);
    return (sum / errors.length * 1000).toFixed(0);
  }
}
