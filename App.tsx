
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

const FALLBACK_PATTERNS = [
  { id: 'cajon-basic', name: 'Cajón Básico (4/4)', sequence: ['B', '·', 'S', '·', 'B', '·', 'S', '·'], bpm: 80 }
];

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.IDLE);
  const [patterns, setPatterns] = useState<any[]>([]);
  const [activePattern, setActivePattern] = useState(FALLBACK_PATTERNS[0]);
  const [bpm, setBpm] = useState(activePattern.bpm);
  const [results, setResults] = useState<ComparisonResult | null>(null);
  const [aiFeedback, setAiFeedback] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'draft' | 'pending' | 'synced' | 'failed'>('draft');
  const [activeBeatIndex, setActiveBeatIndex] = useState<number | null>(null);
  const [history, setHistory] = useState<PracticeHistoryItem[]>([]);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);

  const { isRecording, recordingTime, startRecording, stopRecording, audioBlob, resetRecording } = useAudioRecorder();
  const metronomeRef = useRef<Metronome | null>(null);

  useEffect(() => {
    const loadLibrary = async () => {
      const dbRhythms = await supabaseService.getRhythms();
      if (dbRhythms && dbRhythms.length > 0) {
        setPatterns(dbRhythms);
        setActivePattern(dbRhythms[0]);
        setBpm(dbRhythms[0].bpm);
      } else {
        setPatterns(FALLBACK_PATTERNS);
      }
    };
    setHistory(getPracticeHistory());
    metronomeRef.current = new Metronome(bpm, (idx) => setActiveBeatIndex(idx));
    loadLibrary();
    return () => metronomeRef.current?.dispose();
  }, []);

  useEffect(() => {
    if (metronomeRef.current && !isNaN(bpm) && bpm >= 20 && bpm <= 300) {
      metronomeRef.current.setBpm(bpm);
    }
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
      performLocalAnalysis(audioBlob);
    }
  }, [audioBlob, mode]);

  const performLocalAnalysis = async (blob: Blob) => {
    setIsAnalyzing(true);
    setSyncStatus('draft');
    const localUrl = URL.createObjectURL(blob);
    setCurrentAudioUrl(localUrl);

    try {
      const analysis = await analyzeRecording(blob, activePattern.sequence, bpm);
      setResults(analysis);
      setMode(AppMode.RESULTS);
      
      const feedback = await geminiService.getRhythmFeedback({
        pattern: activePattern.name, 
        accuracy: analysis.accuracy, 
        actualBPM: analysis.tempoAnalysis.actualBPM, 
        trend: analysis.tempoAnalysis.trend
      });
      setAiFeedback(feedback);
    } catch (err) {
      console.error("Erro na análise:", err);
      setMode(AppMode.IDLE);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDeleteRecording = () => {
    if (currentAudioUrl && currentAudioUrl.startsWith('blob:')) URL.revokeObjectURL(currentAudioUrl);
    resetRecording();
    setResults(null);
    setAiFeedback("");
    setCurrentAudioUrl(null);
    setMode(AppMode.IDLE);
    setSyncStatus('draft');
  };

  const handleUploadToCloud = async () => {
    if (!audioBlob || !results) return;
    setSyncStatus('pending');
    const res = await supabaseService.uploadSession(audioBlob, {
      rhythm_name: activePattern.name,
      accuracy: results.accuracy,
      type_accuracy: results.typeAccuracy,
      bpm: bpm,
      avg_offset_ms: parseInt(results.avgTimingError)
    });
    
    if (res.success) {
      setSyncStatus('synced');
      const newHistory = savePracticeResult(results, activePattern.name, bpm);
      setHistory(newHistory);
    } else {
      setSyncStatus('failed');
    }
  };

  const handleBpmInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (!isNaN(val)) {
      setBpm(Math.min(300, Math.max(1, val)));
    } else {
      setBpm(0);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto min-h-screen flex flex-col p-4 md:p-8 space-y-6">
      
      {/* HEADER */}
      <header className="flex justify-between items-center w-full mb-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg relative overflow-hidden group">
             <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-orange-700 opacity-50 group-hover:opacity-100 transition-opacity"></div>
             <svg viewBox="0 0 100 100" className="w-8 h-8 relative z-10"><g fill="none" stroke="black" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"><rect x="30" y="35" width="40" height="45" /><circle cx="50" cy="55" r="8" /></g></svg>
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black italic text-white leading-none uppercase tracking-tighter">
              RESGATE <span className="text-orange-500">DO CAJÓN</span>
            </h1>
            <p className="text-[7px] text-slate-500 font-black tracking-widest uppercase">PLATAFORMA V2.4</p>
          </div>
        </div>
        
        <div className="glass-panel px-6 py-4 rounded-2xl flex flex-col items-end border-white/5 shadow-2xl">
          <span className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mb-2">Metrônomo BPM</span>
          <div className="flex items-center gap-4">
             <input 
                type="range" 
                min="50" 
                max="180" 
                value={bpm || 0} 
                onChange={(e) => setBpm(parseInt(e.target.value))} 
                className="w-24 md:w-40 h-1.5 bg-slate-800 rounded-full appearance-none accent-orange-500 cursor-pointer" 
             />
             <input 
                type="number"
                value={bpm || ''}
                onChange={handleBpmInputChange}
                className="bg-transparent text-2xl font-black text-orange-500 w-16 text-right focus:outline-none focus:ring-0 border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
             />
          </div>
        </div>
      </header>

      <main className="space-y-8">
        {mode === AppMode.RESULTS && results ? (
          <div className="animate-in zoom-in-95 fade-in duration-500">
            <AnalysisDashboard 
              result={results} 
              aiFeedback={aiFeedback} 
              audioUrl={currentAudioUrl} 
              syncStatus={syncStatus} 
              onDelete={handleDeleteRecording}
              onUpload={handleUploadToCloud}
              bpm={bpm}
            />
          </div>
        ) : (
          <div className="animate-in slide-in-from-top-4 duration-500">
            <Recorder 
              isRecording={isRecording} 
              isAnalyzing={isAnalyzing} 
              recordingTime={recordingTime} 
              onRecordStart={handleStart} 
              onRecordStop={handleStop} 
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <RhythmPlayer 
              pattern={activePattern.sequence} 
              activeBeatIndex={activeBeatIndex} 
              referenceAudioPath={activePattern.reference_audio_path} 
            />
            
            <div className="glass-panel p-6 rounded-3xl border-white/5">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Módulos de Estudo</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                {patterns.map(p => (
                  <button 
                    key={p.id}
                    onClick={() => { setActivePattern(p); setBpm(p.bpm); setMode(AppMode.IDLE); }}
                    className={`p-5 rounded-2xl border text-left transition-all group ${
                      activePattern.id === p.id 
                        ? 'bg-orange-500/10 border-orange-500/40 shadow-xl' 
                        : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                    }`}
                  >
                    <p className={`font-black text-sm uppercase tracking-tight ${activePattern.id === p.id ? 'text-orange-500' : 'text-slate-200'}`}>{p.name}</p>
                    <p className="text-[9px] text-slate-600 font-bold mt-1 uppercase tracking-wider">{p.category || 'Básico'} • {p.bpm} BPM</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="glass-panel p-6 rounded-3xl border-white/5 sticky top-8">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Histórico Recente</h3>
              <StatsDashboard history={history} selectedRhythmName={activePattern.name} />
            </div>
          </div>
        </div>
      </main>

      <footer className="py-10 border-t border-white/5 text-[9px] font-black text-slate-700 uppercase tracking-[0.4em] text-center">
        &copy; 2026 Resgate do Cajón — Edilson Morais
      </footer>
    </div>
  );
};

export default App;
