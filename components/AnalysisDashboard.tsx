
import React, { useState, useRef, useEffect } from 'react';
import { ComparisonResult } from '../utils/rhythmComparison';

interface AnalysisDashboardProps {
  result: ComparisonResult;
  aiFeedback?: string;
  audioUrl?: string | null;
  syncStatus: 'draft' | 'pending' | 'synced' | 'failed';
  onDelete?: () => void;
  onUpload?: () => void;
  bpm: number; // Added to handle grid calculation
}

export const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({ 
  result, 
  aiFeedback, 
  audioUrl,
  syncStatus = 'draft',
  onDelete,
  onUpload,
  bpm
}) => {
  const { accuracy, typeAccuracy, waveform } = result;
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const requestRef = useRef<number | null>(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => console.error("Play failed", e));
    }
    setIsPlaying(!isPlaying);
  };

  const updateProgress = () => {
    if (audioRef.current) {
      const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setPlaybackProgress(progress);
    }
    requestRef.current = requestAnimationFrame(updateProgress);
  };

  useEffect(() => {
    if (isPlaying) {
      requestRef.current = requestAnimationFrame(updateProgress);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying]);

  // Calculate BPM grid lines
  // Assuming the sequence is 8 beats long (4/4 in eighth notes)
  // Each beat (quarter note) is 2 sequence slots.
  // 8 slots total.
  const gridLines = [0, 12.5, 25, 37.5, 50, 62.5, 75, 87.5];

  return (
    <div className="space-y-10">
      
      {/* PRIMEIRA DOBRA: REVIEW SECTION WITH REAL WAVEFORM */}
      <div className="w-full bg-[#02070a] border border-white/5 rounded-[2.5rem] p-10 md:p-14 shadow-2xl relative overflow-hidden flex flex-col items-center gap-12">
        
        {/* PLAYER & WAVEFORM ROW */}
        <div className="flex items-center justify-center gap-10 w-full max-w-4xl">
          {/* Play Button */}
          <button 
            onClick={togglePlay}
            className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-800 flex items-center justify-center shadow-[0_0_50px_rgba(79,70,229,0.5)] hover:scale-105 active:scale-95 transition-all shrink-0 border-4 border-white/10"
          >
            {isPlaying ? (
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            ) : (
              <svg className="w-12 h-12 text-white ml-2" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            )}
          </button>

          {/* Waveform Area with Grid Overlay */}
          <div className="flex-1 h-32 relative bg-slate-900/20 rounded-2xl overflow-hidden border border-white/5 group">
            {/* Grid Overlay */}
            <div className="absolute inset-0 pointer-events-none z-0">
              {gridLines.map((left, i) => (
                <div 
                  key={i} 
                  className={`absolute top-0 bottom-0 border-l ${i % 2 === 0 ? 'border-white/10' : 'border-white/5 border-dashed'}`}
                  style={{ left: `${left}%` }}
                >
                  <span className="absolute top-1 left-1 text-[6px] font-black text-slate-700 uppercase">{i + 1}</span>
                </div>
              ))}
            </div>

            {/* Actual Waveform Bars */}
            <div className="absolute inset-0 flex items-center justify-between px-2 gap-[2px] z-10">
              {(waveform || [...Array(60)]).map((val, i) => {
                const height = waveform ? val * 100 : 15 + Math.random() * 70;
                const isPassed = playbackProgress > (i / (waveform?.length || 60)) * 100;
                
                return (
                  <div 
                    key={i} 
                    className={`flex-1 rounded-full transition-all duration-300 ${isPassed ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]' : 'bg-slate-700 opacity-40'}`}
                    style={{ 
                      height: `${Math.max(4, height)}%`,
                    }}
                  />
                );
              })}
            </div>

            {/* Playback Cursor */}
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-orange-500 z-20 shadow-[0_0_10px_rgba(249,115,22,0.8)] transition-all duration-100 ease-linear"
              style={{ left: `${playbackProgress}%` }}
            />
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex flex-col sm:flex-row gap-8 w-full max-w-3xl">
          <button 
            onClick={onDelete}
            className="flex-1 bg-gradient-to-b from-red-500 to-red-900 hover:from-red-400 hover:to-red-700 text-white font-black italic uppercase tracking-[0.2em] py-6 rounded-3xl shadow-2xl border-b-[10px] border-red-950 active:border-b-2 active:translate-y-2 transition-all text-2xl md:text-3xl"
          >
            DELETAR
          </button>
          
          <button 
            onClick={onUpload}
            disabled={syncStatus === 'pending' || syncStatus === 'synced'}
            className={`flex-1 flex items-center justify-center gap-4 bg-gradient-to-b from-green-600 to-green-900 hover:from-green-500 hover:to-green-800 text-white font-black italic uppercase tracking-[0.2em] py-6 rounded-3xl shadow-2xl border-b-[10px] border-green-950 active:border-b-2 active:translate-y-2 transition-all text-2xl md:text-3xl ${
              (syncStatus === 'pending' || syncStatus === 'synced') ? 'opacity-60 cursor-not-allowed border-b-2 translate-y-2' : ''
            }`}
          >
            {syncStatus === 'pending' ? (
              <div className="w-8 h-8 border-4 border-t-white border-white/20 rounded-full animate-spin" />
            ) : syncStatus === 'synced' ? (
              "ENVIADO!"
            ) : (
              "ENVIAR"
            )}
          </button>
        </div>

        {audioUrl && (
          <audio 
            ref={audioRef} 
            src={audioUrl} 
            onEnded={() => {
              setIsPlaying(false);
              setPlaybackProgress(100);
            }} 
            className="hidden" 
          />
        )}
      </div>

      {/* FEEDBACK CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-panel p-10 rounded-[2rem] bg-slate-950/50 shadow-2xl border-white/5">
          <div className="flex justify-between items-baseline mb-3">
             <span className="text-[11px] font-black uppercase text-slate-500 tracking-[0.3em]">Precisão Rítmica</span>
             <span className="text-5xl font-black text-orange-500 italic tabular-nums">{accuracy}%</span>
          </div>
          <div className="h-4 bg-slate-900 rounded-full overflow-hidden shadow-inner">
             <div className="h-full bg-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.6)] transition-all duration-1000" style={{ width: `${accuracy}%` }} />
          </div>
        </div>

        <div className="glass-panel p-10 rounded-[2rem] bg-slate-950/50 shadow-2xl border-white/5">
          <div className="flex justify-between items-baseline mb-3">
             <span className="text-[11px] font-black uppercase text-slate-500 tracking-[0.3em]">Domínio de Timbre</span>
             <span className="text-5xl font-black text-cyan-400 italic tabular-nums">{typeAccuracy}%</span>
          </div>
          <div className="h-4 bg-slate-900 rounded-full overflow-hidden shadow-inner">
             <div className="h-full bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.6)] transition-all duration-1000" style={{ width: `${typeAccuracy}%` }} />
          </div>
        </div>
      </div>

      {aiFeedback && (
        <div className="bg-gradient-to-r from-orange-600 to-orange-400 p-10 rounded-[2.5rem] shadow-2xl text-slate-950 flex gap-8 items-center border border-white/20">
          <div className="bg-slate-950 p-5 rounded-2xl text-orange-500 shadow-xl shrink-0">
             <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1a1 1 0 112 0v1a1 1 0 11-2 0zM13.536 15.657a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM16.464 13.536a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707z" /></svg>
          </div>
          <div className="flex-1">
            <h4 className="text-[12px] font-black uppercase tracking-[0.3em] opacity-60 mb-1">Feedback do Instrutor Gemini</h4>
            <p className="font-black italic text-xl md:text-2xl leading-tight tracking-tight">"{aiFeedback}"</p>
          </div>
        </div>
      )}
    </div>
  );
};
