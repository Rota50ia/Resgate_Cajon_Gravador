
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
  const [patterns, setPatterns] = useState<any[]>(FALLBACK_PATTERNS);
  const [activePattern, setActivePattern] = useState(FALLBACK_PATTERNS[0]);
  const [bpm, setBpm] = useState(activePattern.bpm);
  const [results, setResults] = useState<ComparisonResult | null>(null);
  const [aiFeedback, setAiFeedback] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'draft' | 'pending' | 'synced' | 'failed'>('draft');
  const [activeBeatIndex, setActiveBeatIndex] = useState<number | null>(null);
  const [history, setHistory] = useState<PracticeHistoryItem[]>([]);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const [isGuidedFlow, setIsGuidedFlow] = useState(false);

  const { isRecording, recordingTime, startRecording, stopRecording, audioBlob, resetRecording } = useAudioRecorder();
  const metronomeRef = useRef<Metronome | null>(null);

  useEffect(() => {
    const loadLibrary = async () => {
      const dbRhythms = await supabaseService.getRhythms();
      if (dbRhythms && dbRhythms.length > 0) {
        setPatterns(dbRhythms);
        setActivePattern(dbRhythms[0]);
        setBpm(dbRhythms[0].bpm);
      }
    };
    setHistory(getPracticeHistory());
    metronomeRef.current = new Metronome(bpm, (idx) => setActiveBeatIndex(idx));
    loadLibrary();
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

    if (isGuidedFlow) {
      setTimeout(() => {
        handleStop();
      }, (60 / bpm) * 8 * 1000 + 500);
    }
  };

  const handleStop = () => {
    metronomeRef.current?.stop();
    setActiveBeatIndex(null);
    stopRecording();
    setMode(AppMode.ANALYZING);
  };

  const handleDeleteRecording = () => {
    resetRecording();
    setResults(null);
    setAiFeedback("");
    setCurrentAudioUrl(null);
    setMode(AppMode.IDLE);
    setSyncStatus('draft');
    setIsGuidedFlow(false);
  };

  const handleSaveLocal = () => {
    if (!results) return;
    const newHistory = savePracticeResult(results, activePattern.name, bpm);
    setHistory(newHistory);
    alert("Prática salva no histórico local!");
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
      if (res.url) setCurrentAudioUrl(res.url);
      alert("Performance enviada para a nuvem com sucesso!");
    } else {
      setSyncStatus('failed');
      alert("Falha ao enviar performance.");
    }
  };

  const startGuidedPractice = async () => {
    setMode(AppMode.GUIDED_PRACTICE);
    setIsGuidedFlow(true);
    setResults(null);
  };

  useEffect(() => {
    if (audioBlob && mode === AppMode.ANALYZING) performLocalAnalysis(audioBlob);
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
      console.error(err);
      setMode(AppMode.IDLE);
      setIsGuidedFlow(false);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleBpmChange = (newVal: number) => {
    const clamped = Math.max(50, Math.min(180, newVal));
    setBpm(clamped);
  };

  return (
    <div className="max-w-[1400px] mx-auto min-h-screen flex flex-col p-4 md:p-8 selection:bg-orange-500/40">
      <header className="w-full flex flex-col md:flex-row justify-between items-center gap-6 mb-8 md:mb-12 relative z-20">
        <div className="flex items-center gap-4 md:gap-6 group cursor-default">
          <div className="shrink-0 relative">
            <div className="absolute inset-0 bg-black translate-x-1.5 translate-y-1.5 rounded-[0.75rem] opacity-90 blur-[1px]" />
            <div className="relative w-12 h-12 md:w-16 md:h-16 flex items-center justify-center overflow-visible group-hover:translate-y-[-2px] transition-transform duration-500 ease-out">
              <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)]">
                <path d="M15 20 C 10 30, 5 50, 10 75 C 15 90, 35 95, 55 92 C 80 88, 95 75, 92 45 C 90 20, 75 10, 45 8 C 25 7, 18 12, 15 20" fill="#f97316" />
                <g fill="none" stroke="black" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="32" y="38" width="28" height="36" />
                  <path d="M32 38 L46 28 H72 L58 38" />
                  <path d="M72 28 V64 L58 74" />
                  <circle cx="46" cy="56" r="7" />
                </g>
              </svg>
            </div>
          </div>

          <div className="flex flex-col">
            <h1 className="flex flex-col leading-[0.85] italic font-black tracking-tighter uppercase">
              <span className="text-[20px] md:text-[32px] text-white drop-shadow-sm">RESGATE</span>
              <div className="flex items-baseline gap-1 md:gap-2 -mt-0.5 md:-mt-1">
                <span className="text-[12px] md:text-[18px] text-white">DO</span>
                <span className="text-[20px] md:text-[32px] text-orange-500 drop-shadow-sm">CAJÓN</span>
              </div>
            </h1>
            <p className="text-[6px] md:text-[9px] text-slate-500 font-black tracking-[0.3em] uppercase mt-2 opacity-60">
              PROFESSIONAL RHYTHM ANALYSIS • V2.2
            </p>
          </div>
        </div>
        
        <div className="w-full md:w-auto glass-panel p-3 md:p-4 rounded-[1.25rem] flex items-center gap-4 border-white/5 shadow-xl">
          <div className="flex-1 md:flex-none flex flex-col items-start md:items-end">
            <span className="text-[8px] text-slate-500 font-black uppercase mb-2 tracking-[0.2em]">Metrônomo BPM</span>
            <div className="flex items-center gap-3 w-full">
              <input 
                type="range" min="50" max="180" value={bpm} 
                onChange={(e) => handleBpmChange(parseInt(e.target.value))}
                className="flex-1 md:w-32 h-1 bg-slate-800 rounded-full appearance-none cursor-pointer accent-orange-500"
              />
              <input
                type="number"
                min="50"
                max="180"
                value={bpm}
                onChange={(e) => handleBpmChange(parseInt(e.target.value) || 0)}
                className="bg-slate-950/40 px-2 py-1 rounded-lg border border-white/5 font-mono text-sm md:text-base font-black text-orange-400 min-w-[50px] text-center shadow-inner focus:outline-none focus:border-orange-500/50 appearance-none"
                style={{ MozAppearance: 'textfield' }}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="w-full grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-7 items-start">
        <div className="lg:col-span-8 space-y-6 order-2 lg:order-1 relative z-10">
          
          {(mode === AppMode.IDLE || mode === AppMode.RECORDING || mode === AppMode.GUIDED_PRACTICE) && (
            <div className="relative">
              <RhythmPlayer 
                pattern={activePattern.sequence} 
                activeBeatIndex={activeBeatIndex} 
                referenceAudioPath={activePattern.reference_audio_path} 
                autoPlayReference={mode === AppMode.GUIDED_PRACTICE}
                onReferenceEnd={() => {
                  if (mode === AppMode.GUIDED_PRACTICE) {
                    handleStart();
                  }
                }}
              />
            </div>
          )}
          
          {mode === AppMode.RESULTS && results && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-700">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-xl md:text-2xl font-black text-white tracking-tight italic uppercase">Revisão Técnica</h2>
                <div className="flex gap-2">
                  <button 
                    onClick={handleDeleteRecording}
                    className="text-[9px] font-black uppercase tracking-widest text-rose-500 bg-rose-500/5 border border-rose-500/20 px-4 py-2 rounded-xl"
                  >
                    Descartar
                  </button>
                  <button 
                    onClick={() => { setMode(AppMode.IDLE); setIsGuidedFlow(false); }}
                    className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-white/5 border border-white/10 px-4 py-2 rounded-xl"
                  >
                    Voltar
                  </button>
                </div>
              </div>
              <AnalysisDashboard 
                result={results} 
                aiFeedback={aiFeedback} 
                audioUrl={currentAudioUrl} 
                syncStatus={syncStatus} 
                onDelete={handleDeleteRecording}
                onUpload={handleUploadToCloud}
                onSave={handleSaveLocal}
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-7">
            <div className="glass-panel rounded-[1.5rem] p-4 md:p-6 relative overflow-hidden group/lib">
              <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 border-b border-white/5 pb-2">Biblioteca de Grooves</h3>
              <div className="grid grid-cols-1 gap-2 max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
                {patterns.map(p => (
                  <button 
                    key={p.id}
                    disabled={isRecording || isAnalyzing}
                    onClick={() => { setActivePattern(p); setBpm(p.bpm); setMode(AppMode.IDLE); setIsGuidedFlow(false); }}
                    className={`p-3 rounded-xl border transition-all duration-300 text-left relative overflow-hidden group/item ${
                      activePattern.id === p.id 
                        ? 'bg-orange-500/5 border-orange-500/40 shadow-lg' 
                        : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex justify-between items-center relative z-10">
                      <div>
                        <p className={`font-black text-xs uppercase tracking-tight ${activePattern.id === p.id ? 'text-orange-400' : 'text-slate-200'}`}>{p.name}</p>
                        <span className="text-[8px] font-mono opacity-40 uppercase font-bold">{p.category} • {p.bpm} BPM</span>
                      </div>
                      {activePattern.id === p.id && <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="glass-panel rounded-[1.5rem] p-4 md:p-6 border-white/5">
              <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 border-b border-white/5 pb-2">Performance HUD</h3>
              <StatsDashboard history={history} selectedRhythmName={activePattern.name} />
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-5 order-1 lg:order-2 lg:sticky top-8 z-20">
          <Recorder 
            isRecording={isRecording} 
            isAnalyzing={isAnalyzing || mode === AppMode.GUIDED_PRACTICE} 
            recordingTime={recordingTime} 
            onRecordStart={handleStart} 
            onRecordStop={handleStop} 
          />
          
          <div className="p-6 md:p-8 glass-panel rounded-[1.5rem] border-white/5 group/notes relative overflow-hidden">
            <h4 className="text-slate-600 font-black text-[9px] mb-4 uppercase tracking-[0.3em] flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
              Técnica Cajoneira
            </h4>
            <p className="text-sm md:text-base text-slate-200 leading-tight italic font-black tracking-tighter">
              {mode === AppMode.GUIDED_PRACTICE 
                ? "Prepare-se: O app vai tocar, e você responde logo em seguida."
                : "A gravação local permite que você ouça cada detalhe antes de salvar no seu progresso."
              }
            </p>
          </div>
        </div>
      </main>

      <footer className="w-full mt-12 py-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[9px] font-black text-slate-700 uppercase tracking-[0.4em] relative z-20">
        <span>&copy; 2026 Resgate do Cajón — Edilson Morais</span>
        <div className="flex gap-6 items-center">
            <a href="https://politica-de-privacidade.rota50ia.com/" target="_blank" className="hover:text-orange-500">Privacidade</a>
            <a href="mailto:edilsomdil@gmail.com" className="hover:text-orange-500">Suporte</a>
        </div>
      </footer>
    </div>
  );
};

export default App;
