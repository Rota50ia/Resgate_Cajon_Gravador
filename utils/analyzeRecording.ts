
import { AudioDetector } from './audioDetection';
import { RhythmComparison, ComparisonResult } from './rhythmComparison';

const HISTORY_KEY = 'cajon_practice_history';

export interface PracticeHistoryItem extends ComparisonResult {
  id: string;
  rhythmName: string;
  timestamp: number;
  bpm: number;
}

/**
 * Salva um resultado de prática no histórico local.
 */
export function savePracticeResult(result: ComparisonResult, rhythmName: string, bpm: number) {
  const history = getPracticeHistory();
  const newItem: PracticeHistoryItem = {
    ...result,
    id: crypto.randomUUID(),
    rhythmName,
    timestamp: Date.now(),
    bpm
  };
  
  const updatedHistory = [newItem, ...history].slice(0, 50); // Mantém os últimos 50
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
  return updatedHistory;
}

/**
 * Recupera o histórico de práticas.
 */
export function getPracticeHistory(): PracticeHistoryItem[] {
  const data = localStorage.getItem(HISTORY_KEY);
  return data ? JSON.parse(data) : [];
}

/**
 * Analisa uma gravação de áudio comparando-a com um ritmo esperado.
 */
export async function analyzeRecording(
  audioBlob: Blob, 
  rhythmPattern: string[], 
  bpm: number
): Promise<ComparisonResult> {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const arrayBuffer = await audioBlob.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  
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
  return result;
}
