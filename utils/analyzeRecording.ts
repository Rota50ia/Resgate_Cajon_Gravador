
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
function extractWaveform(buffer: AudioBuffer, samples: number = 80): number[] {
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
    // Aplica compressão logarítmica para visualização de transientes
    peaks.push(Math.pow(max, 0.6)); 
  }

  const maxPeak = Math.max(...peaks);
  return maxPeak > 0 ? peaks.map(p => p / maxPeak) : peaks;
}

export async function analyzeRecording(
  audioBlob: Blob, 
  rhythmPattern: string[], 
  bpm: number
): Promise<ComparisonResult> {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  try {
    const arrayBuffer = await audioBlob.arrayBuffer();
    if (arrayBuffer.byteLength === 0) throw new Error("Buffer de áudio vazio");

    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    // Extrai dados da waveform
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
    
    await new Promise<void>((resolve, reject) => {
      source.onended = () => resolve();
      // Timeout de segurança se o buffer for inconsistente
      setTimeout(() => resolve(), (audioBuffer.duration * 1000) + 500);
    });
    
    const detectedOnsets = detector.stop();
    const comparison = new RhythmComparison(rhythmPattern, bpm);
    const result = comparison.compareWithRecording(detectedOnsets);
    
    return {
      ...result,
      waveform
    };
  } catch (err) {
    throw err;
  } finally {
    await audioContext.close();
  }
}
