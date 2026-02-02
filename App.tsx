
import React, { useState, useRef, useEffect } from 'react';
import * as Tone from 'tone';
import { RhythmPlayer } from './components/RhythmPlayer';
import { Recorder } from './components/Recorder';
import { AnalysisDashboard } from './components/AnalysisDashboard';
import { StatsDashboard } from './components/StatsDashboard';
import { Metronome } from './utils/metronome';
import { useAudioRecorder } from './hooks/useAudioRecorder';
import { analyzeRecording, savePracticeResult, getPracticeHistory, PracticeHistoryItem } from './utils/analyzeRecording';
import { geminiService } from './services/geminiService';
import { supabaseService } from './services/supabaseService';
import { ComparisonResult } from './utils/rhythmComparison';
import { AppMode } from './types';

const PATTERNS = [
  { id: 'cajon-basic', name: 'Cajón Básico (4/4)', sequence: ['B', '·', 'T', '·', 'B', '·', 'T', '·'], bpm: 80 },
  { id: 'cajon-rock', name: 'Cajón Rock Groove', sequence: ['B', '·', 'T', '·', 'B', 'B', 'T', '·'], bpm: 100 },
  { id: 'cajon-samba', name: 'Samba Kick (Cajón)', sequence: ['B', '·', '·', 'B', 'T', '·', '·', 'T'], bpm: 90 },
  { id: 'cajon-funk', name: 'Funk Pocket', sequence: ['B', 'B', '·', 'T', '·', 'B', 'T', '·'], bpm: 95 }
];

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.IDLE);
  const [activePattern, setActivePattern] = useState(PATTERNS[0]);
  const [bpm, setBpm] = useState(activePattern.bpm);
  const [results, setResults] = useState<ComparisonResult | null>(null);
  const [aiFeedback, setAiFeedback] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'pending' | 'synced' | 'failed'>('pending');
  const [activeBeatIndex, setActiveBeatIndex] = useState<number | null>(null);
  const [history, setHistory] = useState<PracticeHistoryItem[]>([]);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);

  const { isRecording, recordingTime, startRecording, stopRecording, audioBlob, resetRecording } = useAudioRecorder();
  const metronomeRef = useRef<Metronome | null>(null);

  useEffect(() => {
    setHistory(getPracticeHistory());
    metronomeRef.current = new Metronome(bpm, (idx) => {
      setActiveBeatIndex(idx);
    });
    return () => metronomeRef.current?.dispose();
  }, []);

  useEffect(() => {
    metronomeRef.current?.setBpm(bpm);
  }, [bpm]);

  const handleStart = async () => {
    await Tone.start();
    resetRecording();
    setResults(null);
    setAiFeedback("");
    setCurrentAudioUrl(null);
    setMode(AppMode.RECORDING);
    metronomeRef.current?.start();
    startRecording();
  };

  const handleStop = () => {
    metronomeRef.current?.stop();
    setActiveBeatIndex(null);
    stopRecording();
    setMode(AppMode.ANALYZING);
  };

  useEffect(() => {
    if (audioBlob && mode === AppMode.ANALYZING) {
      performFullAnalysis(audioBlob);
    }
  }, [audioBlob, mode]);

  const performFullAnalysis = async (blob: Blob) => {
    setIsAnalyzing(true);
    setSyncStatus('pending');
    
    // Criar URL local para player imediato
    const localUrl = URL.createObjectURL(blob);
    setCurrentAudioUrl(localUrl);

    try {
      // 1. Analisar rítmo localmente
      const analysis = await analyzeRecording(blob, activePattern.sequence, bpm);
      setResults(analysis);
      
      // 2. Salvar no histórico local
      const newHistory = savePracticeResult(analysis, activePattern.name, bpm);
      setHistory(newHistory);
      setMode(AppMode.RESULTS);

      // 3. Persistência Remota (Não bloqueia o UI)
      supabaseService.uploadSession(blob, {
        rhythm_name: activePattern.name,
        accuracy: analysis.accuracy,
        type_accuracy: analysis.typeAccuracy,
        bpm: bpm,
        avg_offset_ms: parseInt(analysis.avgTimingError)
      }).then(res => {
        setSyncStatus(res.success ? 'synced' : 'failed');
        if (res.url) setCurrentAudioUrl(res.url); // Atualiza para URL do Supabase
      });

      // 4. Feedback IA
      const feedback = await geminiService.getRhythmFeedback({
        pattern: activePattern.name,
        accuracy: analysis.accuracy,
        actualBPM: analysis.tempoAnalysis.actualBPM,
        trend: analysis.tempoAnalysis.trend
      });
      setAiFeedback(feedback);

    } catch (err) {
      console.error(err);
      setMode(AppMode.IDLE);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col p-4 md:p-10 font-sans selection:bg-orange-500/30">
      <header className="max-w-7xl mx-auto w-full flex flex-col md:flex-row justify-between items-center gap-8 mb-16">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-orange-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-orange-500/20 -rotate-2">
            <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v8M8 12h8M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight uppercase italic leading-none">Resgate do <span className="text-orange-500">Cajón</span></h1>
            <p className="text-[10px] text-slate-500 font-black tracking-[0.4em] uppercase mt-2">Prática • Evolução • Precisão</p>
          </div>
        </div>
        
        <div className="flex items-center gap-8 bg-slate-900/40 p-5 rounded-3xl border border-slate-800/50 backdrop-blur-sm">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-slate-500 font-black uppercase mb-3 tracking-widest">Ajuste de Tempo (Metrônomo)</span>
            <div className="flex items-center gap-4">
              <input 
                type="range" min="50" max="180" value={bpm} 
                onChange={(e) => setBpm(parseInt(e.target.value))}
                className="w-40 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
              <span className="text-lg font-mono font-black text-orange-400 w-20 text-right">{bpm} <span className="text-[10px] text-slate-600">BPM</span></span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-10">
          
          {mode === AppMode.IDLE || mode === AppMode.RECORDING ? (
            <RhythmPlayer pattern={activePattern.sequence} activeBeatIndex={activeBeatIndex} />
          ) : null}
          
          {mode === AppMode.RESULTS && results && (
            <div className="space-y-10">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Resultado da Sessão</h2>
                <button 
                  onClick={() => setMode(AppMode.IDLE)}
                  className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors border border-slate-800 px-4 py-2 rounded-xl"
                >
                  Nova Prática
                </button>
              </div>
              <AnalysisDashboard 
                result={results} 
                aiFeedback={aiFeedback} 
                audioUrl={currentAudioUrl}
                syncStatus={syncStatus}
              />
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
            <div className="bg-slate-900/30 border border-slate-800/50 rounded-[40px] p-10 backdrop-blur-md">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Bibliotecas de Ritmos</h3>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {PATTERNS.map(p => (
                  <button 
                    key={p.id}
                    disabled={isRecording || isAnalyzing}
                    onClick={() => { setActivePattern(p); setBpm(p.bpm); setMode(AppMode.IDLE); }}
                    className={`group p-6 rounded-3xl border-2 transition-all text-left relative overflow-hidden ${
                      activePattern.id === p.id 
                        ? 'bg-orange-500/10 border-orange-500 text-orange-400 shadow-[0_0_30px_rgba(249,115,22,0.1)]' 
                        : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <p className="font-black text-sm uppercase tracking-tight">{p.name}</p>
                      <span className="text-[10px] opacity-60 font-mono">{p.bpm} BPM Sugerido</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-900/30 border border-slate-800/50 rounded-[40px] p-10 backdrop-blur-md">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-8">Sua Evolução Local</h3>
              <StatsDashboard history={history} selectedRhythmName={activePattern.name} />
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <Recorder 
            isRecording={isRecording} 
            isAnalyzing={isAnalyzing}
            recordingTime={recordingTime}
            onRecordStart={handleStart} 
            onRecordStop={handleStop} 
          />
          
          <div className="p-6 md:p-10 bg-slate-900/80 rounded-[32px] md:rounded-[40px] border border-slate-800 shadow-2xl backdrop-blur-xl">
            <h4 className="text-slate-500 font-black text-xs md:text-sm mb-6 md:mb-8 uppercase tracking-[0.2em]">Dicas do Professor</h4>
            <div className="space-y-6">
              <p className="text-lg md:text-xl text-slate-300 leading-relaxed italic font-medium">
                "O segredo do Cajón está na intenção. Deixe o braço pesado para o bumbo e use os dedos rápidos para as notas fantasmas."
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto w-full mt-20 py-10 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">
        <span>&copy; 2026 Resgate do Cajón — Edilson Morais</span>
      </footer>
    </div>
  );
};

export default App;
