
import React, { useState, useRef, useEffect } from 'react';
import { ComparisonResult, TimingError } from '../utils/rhythmComparison';

interface AnalysisDashboardProps {
  result: ComparisonResult;
  aiFeedback?: string;
  audioUrl?: string | null;
  syncStatus?: 'pending' | 'synced' | 'failed';
  onDelete?: () => void;
}

export const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({ 
  result, 
  aiFeedback, 
  audioUrl,
  syncStatus = 'synced',
  onDelete
}) => {
  const { accuracy, typeAccuracy, timingErrors, patternAnalysis } = result;
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const getAccuracyFeedback = (acc: number) => {
    if (acc >= 90) return { emoji: '🏆', text: 'Nível Mestre', color: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/5' };
    if (acc >= 75) return { emoji: '⭐', text: 'Groove Sólido', color: 'text-blue-400', border: 'border-blue-500/20', bg: 'bg-blue-500/5' };
    if (acc >= 60) return { emoji: '👍', text: 'Boa Pegada', color: 'text-amber-400', border: 'border-amber-500/20', bg: 'bg-amber-500/5' };
    return { emoji: '💪', text: 'Foco no Pulso', color: 'text-rose-400', border: 'border-rose-500/20', bg: 'bg-rose-500/5' };
  };

  const feedback = getAccuracyFeedback(accuracy);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const p = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(p || 0);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-12 duration-1000">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className={`glass-panel p-8 md:p-10 rounded-[3rem] border-2 text-center transition-all ${feedback.color} ${feedback.border} ${feedback.bg}`}>
          <p className="text-[10px] uppercase font-black tracking-[0.4em] mb-4 opacity-40">Timing Precision</p>
          <div className="text-6xl md:text-7xl font-black mb-3 flex items-center justify-center gap-4">
            <span className="text-3xl opacity-60 grayscale">{feedback.emoji}</span>
            {accuracy}%
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">{feedback.text}</p>
        </div>

        <div className="glass-panel p-8 md:p-10 rounded-[3rem] text-center border-white/5">
          <p className="text-slate-500 text-[10px] uppercase font-black tracking-[0.4em] mb-4">Tone Quality</p>
          <div className="text-5xl md:text-6xl font-black text-orange-400">{typeAccuracy}%</div>
          <p className="text-[9px] text-slate-600 mt-4 uppercase font-bold tracking-[0.2em]">Dinâmica Grave/Agudo</p>
        </div>

        <div className="glass-panel p-8 md:p-10 rounded-[3rem] text-center border-white/5 flex flex-col justify-center items-center sm:col-span-2 lg:col-span-1">
          <p className="text-slate-500 text-[10px] uppercase font-black tracking-[0.4em] mb-4">Cloud Status</p>
          {syncStatus === 'pending' ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-[3px] border-orange-500/20 border-t-orange-500 rounded-full animate-spin shadow-[0_0_15px_rgba(249,115,22,0.3)]" />
              <span className="text-[10px] font-black uppercase text-orange-500 tracking-widest">Sincronizando...</span>
            </div>
          ) : syncStatus === 'synced' ? (
            <div className="flex flex-col items-center gap-4 text-emerald-500">
              <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">Registrado</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 text-rose-500">
              <div className="w-14 h-14 bg-rose-500/10 rounded-2xl flex items-center justify-center border border-rose-500/20">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">Offline</span>
            </div>
          )}
        </div>
      </div>

      {audioUrl && (
        <div className="glass-panel p-6 md:p-8 rounded-[3rem] flex flex-col md:flex-row items-center gap-6 md:gap-8 group/player relative overflow-hidden">
          <div className="absolute inset-0 bg-orange-500/5 opacity-0 group-hover/player:opacity-100 transition-opacity pointer-events-none" />
          
          <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto shrink-0">
            <button 
              onClick={togglePlay}
              className="w-16 h-16 bg-orange-500 text-slate-950 rounded-[1.75rem] flex items-center justify-center shadow-[0_15px_35px_-5px_rgba(249,115,22,0.4)] hover:scale-105 active:scale-95 transition-all relative z-10"
            >
              {isPlaying ? (
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              ) : (
                <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              )}
            </button>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1">Preview</span>
              <span className="text-slate-300 font-bold text-sm italic uppercase tracking-tighter">Sua Performance</span>
            </div>
          </div>

          <div className="flex-1 w-full bg-slate-950/40 h-16 rounded-[1.75rem] border border-white/5 flex items-center px-6 gap-6 relative z-10">
            <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden relative">
              <div 
                className="absolute inset-y-0 left-0 bg-orange-500 transition-all duration-100 ease-linear shadow-[0_0_15px_rgba(249,115,22,0.8)]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <audio 
              ref={audioRef} 
              src={audioUrl} 
              onTimeUpdate={handleTimeUpdate} 
              onEnded={handleEnded} 
              className="hidden" 
            />
          </div>

          <button 
            onClick={onDelete}
            className="w-14 h-14 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white border border-rose-500/20 rounded-2xl flex items-center justify-center transition-all relative z-10 group/del"
            title="Deletar gravação"
          >
            <svg className="w-6 h-6 group-hover/del:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      )}

      {/* TIMELINE DE PRECISÃO TRANSIENTE (Waveform Visual) */}
      <div className="glass-panel p-8 md:p-14 rounded-[3.5rem] border-white/5 relative overflow-hidden">
        <div className="flex justify-between items-center mb-12">
          <div className="space-y-1">
            <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.5em]">Groove Precision Timeline</h4>
            <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">Mapeamento de Transientes na Grade do BPM</p>
          </div>
          <div className="flex gap-4">
             <div className="flex items-center gap-2">
               <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
               <span className="text-[9px] font-black text-slate-500 uppercase">On Time</span>
             </div>
             <div className="flex items-center gap-2">
               <div className="w-2.5 h-2.5 bg-amber-500 rounded-full" />
               <span className="text-[9px] font-black text-slate-500 uppercase">Offset</span>
             </div>
          </div>
        </div>

        <div className="relative h-64 md:h-72 w-full bg-slate-950/30 rounded-[2.5rem] border border-white/5 p-4 md:p-8 flex flex-col">
          {/* Grade de tempo (Régua) */}
          <div className="flex-1 relative flex items-end gap-1 px-4">
            {/* Linhas de Grade verticais (Metrônomo) */}
            <div className="absolute inset-0 flex justify-between px-10 pointer-events-none opacity-20">
              {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
                <div key={i} className={`h-full border-l ${i % 2 === 0 ? 'border-orange-500 border-dashed w-0' : 'border-white/20'}`} />
              ))}
            </div>

            {/* Mapeamento dos Transientes detectados */}
            <div className="absolute inset-0 flex items-center px-10">
              <div className="relative w-full h-full">
                {timingErrors.map((err, idx) => {
                  // Mapeia a posição do transiente no tempo (máximo de 8 notas visuais)
                  const positionPercent = (err.beat / 8) * 100;
                  const isEarly = err.actual < err.expected;
                  const offsetPercent = (Math.abs(err.diff) / 0.15) * 20; // Escala de desvio visual
                  
                  return (
                    <div 
                      key={idx}
                      className="absolute top-1/2 -translate-y-1/2 transition-all duration-700"
                      style={{ left: `${positionPercent}%` }}
                    >
                      {/* Desvio visual (barra horizontal de erro) */}
                      <div className={`absolute h-1.5 rounded-full blur-[2px] opacity-40 ${isEarly ? 'right-0 -translate-x-3 bg-rose-500' : 'left-0 translate-x-3 bg-amber-500'}`} 
                           style={{ width: `${offsetPercent}px` }} />
                      
                      {/* Célula de Transiente (Ondas) */}
                      <div className={`w-12 h-32 -ml-6 rounded-3xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${
                        err.typeMatch && err.diff < 0.08 
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' 
                          : 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                      }`}>
                        <div className="flex gap-0.5 items-end h-10">
                           <div className="w-1 bg-current rounded-full" style={{ height: '40%' }} />
                           <div className="w-1 bg-current rounded-full" style={{ height: '100%' }} />
                           <div className="w-1 bg-current rounded-full" style={{ height: '60%' }} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-tighter">{err.actualType}</span>
                      </div>

                      {/* Label de Offset em ms */}
                      <span className={`absolute -top-8 left-1/2 -translate-x-1/2 text-[9px] font-mono font-black ${isEarly ? 'text-rose-400' : 'text-amber-400'}`}>
                        {isEarly ? '-' : '+'}{(err.diff * 1000).toFixed(0)}ms
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* Números da Regra */}
          <div className="h-10 border-t border-white/5 mt-4 flex justify-between px-10 items-center">
            {[1, 2, 3, 4, 1, 2, 3, 4].map((n, i) => (
              <span key={i} className={`text-[10px] font-black font-mono ${i % 2 === 0 ? 'text-orange-500' : 'text-slate-700'}`}>{n}</span>
            ))}
          </div>
        </div>
      </div>

      {aiFeedback && (
        <div className="bg-gradient-to-br from-orange-600 to-orange-500 p-8 md:p-12 rounded-[3.5rem] flex flex-col md:flex-row gap-8 items-start md:items-center shadow-3xl shadow-orange-950/20 relative overflow-hidden group/feedback">
          <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 group-hover/feedback:rotate-45 transition-transform duration-[2000ms]">
             <svg className="w-48 h-48 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/></svg>
          </div>
          <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-950 rounded-[2rem] flex items-center justify-center shrink-0 shadow-2xl relative z-10 border border-white/10">
             <svg className="w-8 h-8 md:w-10 md:h-10 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
               <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
             </svg>
          </div>
          <div className="relative z-10 space-y-2">
            <h4 className="text-[10px] font-black text-slate-950 uppercase tracking-[0.4em] mb-3 opacity-50">Master Insight</h4>
            <p className="text-slate-950 text-lg md:text-xl lg:text-2xl leading-tight font-extrabold italic tracking-tight">
              "{aiFeedback}"
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
