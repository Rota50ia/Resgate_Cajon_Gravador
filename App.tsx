
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
  const [syncStatus, setSyncStatus] = useState<'pending' | 'synced' | 'failed'>('pending');
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
    setIsGuidedFlow(false);
  };

  const startGuidedPractice = async () => {
    setMode(AppMode.GUIDED_PRACTICE);
    setIsGuidedFlow(true);
    setResults(null);
  };

  useEffect(() => {
    if (audioBlob && mode === AppMode.ANALYZING) performFullAnalysis(audioBlob);
  }, [audioBlob, mode]);

  const performFullAnalysis = async (blob: Blob) => {
    setIsAnalyzing(true);
    setSyncStatus('pending');
    const localUrl = URL.createObjectURL(blob);
    setCurrentAudioUrl(localUrl);
    try {
      const analysis = await analyzeRecording(blob, activePattern.sequence, bpm);
      setResults(analysis);
      const newHistory = savePracticeResult(analysis, activePattern.name, bpm);
      setHistory(newHistory);
      setMode(AppMode.RESULTS);
      supabaseService.uploadSession(blob, {
        rhythm_name: activePattern.name,
        accuracy: analysis.accuracy,
        type_accuracy: analysis.typeAccuracy,
        bpm: bpm,
        avg_offset_ms: parseInt(analysis.avgTimingError)
      }).then(res => {
        setSyncStatus(res.success ? 'synced' : 'failed');
        if (res.url) setCurrentAudioUrl(res.url);
      });
      const feedback = await geminiService.getRhythmFeedback({
        pattern: activePattern.name, accuracy: analysis.accuracy, actualBPM: analysis.tempoAnalysis.actualBPM, trend: analysis.tempoAnalysis.trend
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
    <div className="max-w-[1600px] mx-auto min-h-screen flex flex-col p-4 sm:p-6 md:p-12 lg:p-16 selection:bg-orange-500/40">
      <header className="w-full flex flex-col md:flex-row justify-between items-center gap-10 mb-16 md:mb-24 relative z-20">
        <div className="flex items-center gap-6 md:gap-10 group cursor-default">
          <div className="shrink-0 relative">
            <div className="absolute inset-0 bg-black translate-x-3 translate-y-3 rounded-[1.5rem] opacity-90 blur-[2px]" />
            <div className="relative w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 flex items-center justify-center overflow-visible group-hover:translate-y-[-4px] transition-transform duration-500 ease-out">
              <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]">
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
              <span className="text-[32px] md:text-[52px] lg:text-[58px] text-white drop-shadow-sm">RESGATE</span>
              <div className="flex items-baseline gap-2 md:gap-3 -mt-1 md:-mt-2">
                <span className="text-[18px] md:text-[30px] lg:text-[34px] text-white">DO</span>
                <span className="text-[32px] md:text-[52px] lg:text-[58px] text-orange-500 drop-shadow-sm">CAJÓN</span>
              </div>
            </h1>
            <p className="text-[8px] md:text-[12px] lg:text-[13px] text-slate-500 font-black tracking-[0.4em] md:tracking-[0.6em] uppercase mt-4 opacity-60">
              PROFESSIONAL RHYTHM ANALYSIS • STUDIO V2
            </p>
          </div>
        </div>
        
        <div className="w-full md:w-auto glass-panel p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] flex items-center gap-6 md:gap-10 border-white/5 shadow-2xl">
          <div className="flex-1 md:flex-none flex flex-col items-start md:items-end">
            <span className="text-[10px] md:text-[11px] text-slate-500 font-black uppercase mb-3 md:mb-4 tracking-[0.3em]">Metrônomo BPM</span>
            <div className="flex items-center gap-4 md:gap-6 w-full">
              <input 
                type="range" min="50" max="180" value={bpm} 
                onChange={(e) => handleBpmChange(parseInt(e.target.value))}
                className="flex-1 md:w-56 h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-orange-500"
              />
              <input
                type="number"
                min="50"
                max="180"
                value={bpm}
                onChange={(e) => handleBpmChange(parseInt(e.target.value) || 0)}
                className="bg-slate-950/40 px-4 md:px-5 py-2 rounded-2xl border border-white/5 font-mono text-xl md:text-2xl font-black text-orange-400 min-w-[70px] md:min-w-[90px] text-center shadow-inner focus:outline-none focus:border-orange-500/50 transition-colors appearance-none"
                style={{ MozAppearance: 'textfield' }}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="w-full grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-14 items-start">
        <div className="lg:col-span-8 space-y-12 order-2 lg:order-1 relative z-10">
          
          {(mode === AppMode.IDLE || mode === AppMode.RECORDING || mode === AppMode.GUIDED_PRACTICE) && (
            <div className="relative">
              {mode === AppMode.GUIDED_PRACTICE && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-orange-500 text-slate-950 px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest z-30 animate-bounce">
                  Fase 1: Ouça o Professor
                </div>
              )}
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
            <div className="space-y-12 animate-in fade-in slide-in-from-bottom-10 duration-1000">
              <div className="flex items-center justify-between px-4">
                <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight italic uppercase">Resultado Analítico</h2>
                <div className="flex gap-4">
                  {isGuidedFlow && (
                     <button 
                      onClick={startGuidedPractice}
                      className="text-[11px] font-black uppercase tracking-[0.3em] text-white transition-all bg-emerald-600 hover:bg-emerald-500 px-8 py-3.5 rounded-2xl shadow-lg"
                    >
                      Repetir Exercício
                    </button>
                  )}
                  <button 
                    onClick={() => { setMode(AppMode.IDLE); setIsGuidedFlow(false); }}
                    className="text-[11px] font-black uppercase tracking-[0.3em] text-orange-500 hover:text-white transition-all bg-orange-500/5 hover:bg-orange-500 p-4 md:px-8 md:py-3.5 rounded-2xl border border-orange-500/20 shadow-lg"
                  >
                    Menu Principal
                  </button>
                </div>
              </div>
              <AnalysisDashboard 
                result={results} 
                aiFeedback={aiFeedback} 
                audioUrl={currentAudioUrl} 
                syncStatus={syncStatus} 
                onDelete={handleDeleteRecording}
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-12">
            <div className="glass-panel rounded-[3rem] p-8 md:p-12 relative overflow-hidden group/lib">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-[50px] group-hover/lib:bg-orange-500/10 transition-all duration-700" />
              <div className="flex justify-between items-center mb-10 border-b border-white/5 pb-5">
                <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.5em]">Biblioteca</h3>
                <button 
                  onClick={startGuidedPractice}
                  disabled={isRecording || isAnalyzing}
                  className="bg-orange-500/20 text-orange-400 border border-orange-500/30 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all"
                >
                  Modo Guiado ✨
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-4">
                {patterns.map(p => (
                  <button 
                    key={p.id}
                    disabled={isRecording || isAnalyzing}
                    onClick={() => { setActivePattern(p); setBpm(p.bpm); setMode(AppMode.IDLE); setIsGuidedFlow(false); }}
                    className={`p-6 rounded-[2rem] border-2 transition-all duration-500 text-left relative overflow-hidden group/item ${
                      activePattern.id === p.id 
                        ? 'bg-orange-500/5 border-orange-500/40 shadow-2xl' 
                        : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:border-white/10'
                    }`}
                  >
                    <div className="flex justify-between items-center relative z-10">
                      <div>
                        <p className={`font-black text-sm md:text-base uppercase tracking-tight mb-1 ${activePattern.id === p.id ? 'text-orange-400' : 'text-slate-200'}`}>{p.name}</p>
                        <span className="text-[10px] font-mono opacity-40 uppercase font-bold">{p.category} • {p.bpm} BPM</span>
                      </div>
                      <div className="flex items-center gap-4">
                        {p.reference_audio_path && <div className="w-2.5 h-2.5 bg-orange-500 rounded-full shadow-[0_0_15px_rgba(249,115,22,0.8)]" />}
                        <svg className={`w-5 h-5 transition-transform duration-500 ${activePattern.id === p.id ? 'rotate-90 text-orange-500' : 'text-slate-800'}`} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="glass-panel rounded-[3rem] p-8 md:p-12 border-white/5">
              <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.5em] mb-10 border-b border-white/5 pb-5">Progress HUD</h3>
              <StatsDashboard history={history} selectedRhythmName={activePattern.name} />
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-10 order-1 lg:order-2 lg:sticky top-12 z-20">
          <Recorder 
            isRecording={isRecording} 
            isAnalyzing={isAnalyzing || mode === AppMode.GUIDED_PRACTICE} 
            recordingTime={recordingTime} 
            onRecordStart={handleStart} 
            onRecordStop={handleStop} 
          />
          
          <div className="p-10 lg:p-14 glass-panel rounded-[3rem] border-white/5 group/notes relative overflow-hidden">
             <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-orange-500/5 rounded-full blur-[60px]" />
            <h4 className="text-slate-600 font-black text-[11px] mb-10 uppercase tracking-[0.4em] flex items-center gap-3">
              <span className="w-2 h-2 bg-orange-500 rounded-full" />
              Notas de Técnica
            </h4>
            <div className="space-y-8">
              <p className="text-2xl md:text-3xl text-slate-200 leading-[1.1] italic font-black tracking-tighter">
                {mode === AppMode.GUIDED_PRACTICE 
                  ? "Modo Prática Guiada: O app irá tocar o exemplo, esperar sua resposta e analisar automaticamente."
                  : "O pulso é a alma do ritmo. Mantenha os ombros relaxados e deixe a vibração do Cajón guiar seu corpo."
                }
              </p>
              <div className="pt-6 border-t border-white/5">
                 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">— Prof. Edilson Morais</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full mt-24 py-16 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 text-[11px] font-black text-slate-700 uppercase tracking-[0.8em] relative z-20">
        <span>&copy; 2026 Resgate do Cajón — Edilson Morais</span>
        <div className="flex gap-12 items-center">
            <a 
              href="https://politica-de-privacidade.rota50ia.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-orange-500 transition-all cursor-pointer"
            >
              Termos de Uso
            </a>
            <a 
              href="mailto:edilsomdil@gmail.com"
              className="hover:text-orange-500 transition-all cursor-pointer"
            >
              Suporte
            </a>
        </div>
      </footer>
    </div>
  );
};

export default App;
