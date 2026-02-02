
import { AudioDetector } from './audioDetection';
import { RhythmComparison, ComparisonResult } from './rhythmComparison';

const HISTORY_KEY = 'cajon_practice_history';

export interface PracticeHistoryItem extends ComparisonResult {
  id: string;
  rhythmName: string;
  timestamp: number;
  bpm: number;
}

export function savePracticeResult(result: ComparisonResult, rhythmName: string, bpm: number) {
  const history = getPracticeHistory();
  const newItem: PracticeHistoryItem = {
    ...result,
    id: crypto.randomUUID(),
    rhythmName,
    timestamp: Date.now(),
    bpm
  };
  
  const updatedHistory = [newItem, ...history].slice(0, 50);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
  return updatedHistory;
}

export function getPracticeHistory(): PracticeHistoryItem[] {
  const data = localStorage.getItem(HISTORY_KEY);
  return data ? JSON.parse(data) : [];
}

/**
 * Extracts a simplified waveform (array of peaks) from an AudioBuffer.
 */
function extractWaveform(buffer: AudioBuffer, samples: number = 100): number[] {
  const data = buffer.getChannelData(0);
  const blockSize = Math.floor(data.length / samples);
  const peaks = [];

  for (let i = 0; i < samples; i++) {
    const start = i * blockSize;
    let max = 0;
    for (let j = 0; j < blockSize; j++) {
      const val = Math.abs(data[start + j]);
      if (val > max) max = val;
    }
    // Normalize and apply slight log scaling for better visual transients
    peaks.push(Math.pow(max, 0.7)); 
  }

  // Final normalization to ensure max peak is around 1.0 if not empty
  const maxPeak = Math.max(...peaks);
  return maxPeak > 0 ? peaks.map(p => p / maxPeak) : peaks;
}

export async function analyzeRecording(
  audioBlob: Blob, 
  rhythmPattern: string[], 
  bpm: number
): Promise<ComparisonResult> {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const arrayBuffer = await audioBlob.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  
  // Extract waveform data for visual analysis
  const waveform = extractWaveform(audioBuffer, 80);
  
  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  
  const detector = new AudioDetector(audioContext, source);
  const gainNode = audioContext.createGain();
  gainNode.gain.value = 0; 
  source.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  detector.start();
  source.start();
  
  await new Promise<void>(resolve => {
    source.onended = () => resolve();
  });
  
  const detectedOnsets = detector.stop();
  const comparison = new RhythmComparison(rhythmPattern, bpm);
  const result = comparison.compareWithRecording(detectedOnsets);
  
  await audioContext.close();
  return {
    ...result,
    waveform
  };
}
