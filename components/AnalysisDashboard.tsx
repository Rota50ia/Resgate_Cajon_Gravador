
import React, { useState, useRef, useEffect } from 'react';
import { ComparisonResult, TimingError } from '../utils/rhythmComparison';

interface AnalysisDashboardProps {
  result: ComparisonResult;
  aiFeedback?: string;
  audioUrl?: string | null;
  syncStatus: 'draft' | 'pending' | 'synced' | 'failed';
  onDelete?: () => void;
  onUpload?: () => void;
  onSave?: () => void;
}

export const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({ 
  result, 
  aiFeedback, 
  audioUrl,
  syncStatus = 'draft',
  onDelete,
  onUpload,
  onSave
}) => {
  const { accuracy, typeAccuracy, timingErrors } = result;
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const getAccuracyFeedback = (acc: number) => {
    if (acc >= 90) return { emoji: '🏆', text: 'Mestre', color: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/5' };
    if (acc >= 75) return { emoji: '⭐', text: 'Groove', color: 'text-blue-400', border: 'border-blue-500/20', bg: 'bg-blue-500/5' };
    return { emoji: '💪', text: 'Foco', color: 'text-rose-400', border: 'border-rose-500/20', bg: 'bg-rose-500/5' };
  };

  const feedback = getAccuracyFeedback(accuracy);

  const togglePlay = () => {
    if (!audioRef.current) return;
    isPlaying ? audioRef.current.pause() : audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100 || 0);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-700">
      {/* SCORES AREA */}
      <div className="grid grid-cols-3 gap-3 md:gap-5">
        <div className={`glass-panel p-4 rounded-2xl border text-center ${feedback.color} ${feedback.border} ${feedback.bg}`}>
          <p className="text-[7px] uppercase font-black tracking-widest opacity-40">Timing</p>
          <div className="text-2xl md:text-3xl font-black">{accuracy}%</div>
          <p className="text-[7px] font-black uppercase opacity-80">{feedback.text}</p>
        </div>
        <div className="glass-panel p-4 rounded-2xl border-white/5 text-center">
          <p className="text-slate-500 text-[7px] uppercase font-black tracking-widest">Tone</p>
          <div className="text-2xl md:text-3xl font-black text-orange-400">{typeAccuracy}%</div>
          <p className="text-[7px] text-slate-600 uppercase font-bold tracking-widest">Dinâmica</p>
        </div>
        <div className="glass-panel p-4 rounded-2xl border-white/5 flex flex-col justify-center items-center text-center">
          <p className="text-slate-500 text-[7px] uppercase font-black tracking-widest mb-1">Status</p>
          {syncStatus === 'synced' ? (
             <div className="flex flex-col items-center text-emerald-500">
               <span className="text-xs">✓</span>
               <span className="text-[6px] font-black uppercase tracking-widest">Nuvem</span>
             </div>
          ) : syncStatus === 'pending' ? (
             <div className="w-3 h-3 border-2 border-t-orange-500 rounded-full animate-spin" />
          ) : syncStatus === 'draft' ? (
            <div className="flex flex-col items-center text-orange-400/60">
               <span className="text-[10px]">●</span>
               <span className="text-[6px] font-black uppercase tracking-widest">Local</span>
             </div>
          ) : (
            <div className="flex flex-col items-center text-rose-500">
               <span className="text-[10px]">!</span>
               <span className="text-[6px] font-black uppercase tracking-widest">Erro</span>
             </div>
          )}
        </div>
      </div>

      {/* PLAYER & ACTIONS */}
      {audioUrl && (
        <div className="glass-panel p-4 rounded-[2rem] space-y-4 border-white/10">
          <div className="flex items-center gap-4 relative overflow-hidden">
            <button onClick={togglePlay} className="w-12 h-12 bg-orange-500 text-slate-950 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/20 active:scale-95 transition-all">
              {isPlaying ? <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg> : <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>}
            </button>
            <div className="flex-1 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Ouça sua performance</span>
                <span className="text-[8px] font-mono text-slate-600">Local Buffer</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden relative">
                <div className="absolute inset-y-0 left-0 bg-orange-500 transition-all duration-100" style={{ width: `${progress}%` }} />
              </div>
            </div>
            <audio ref={audioRef} src={audioUrl} onTimeUpdate={handleTimeUpdate} onEnded={() => setIsPlaying(false)} className="hidden" />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button 
              onClick={onSave}
              className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
              <span className="text-[10px] font-black uppercase tracking-widest">Salvar Local</span>
            </button>
            <button 
              onClick={onUpload}
              disabled={syncStatus === 'synced' || syncStatus === 'pending'}
              className={`flex-1 px-4 py-3 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 ${
                syncStatus === 'synced' 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-orange-500 text-slate-950 font-black'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              <span className="text-[10px] font-black uppercase tracking-widest">
                {syncStatus === 'synced' ? 'Enviado' : 'Enviar Nuvem'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* TIMELINE AREA */}
      <div className="glass-panel p-4 md:p-6 rounded-[1.5rem] border-white/5 relative overflow-hidden">
        <h4 className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-4">Mapeamento de Transientes</h4>
        <div className="relative h-32 md:h-40 w-full bg-slate-950/30 rounded-xl border border-white/5 p-2 flex flex-col">
          <div className="flex-1 relative flex items-end gap-1 px-2">
            <div className="absolute inset-0 flex justify-between px-4 opacity-10">
              {[0, 1, 2, 3, 4, 5, 6, 7].map(i => <div key={i} className="h-full border-l border-white"/>)}
            </div>
            <div className="absolute inset-0 flex items-center px-4">
              <div className="relative w-full h-full">
                {timingErrors.map((err, idx) => {
                  const positionPercent = (err.beat / 8) * 100;
                  return (
                    <div key={idx} className="absolute top-1/2 -translate-y-1/2" style={{ left: `${positionPercent}%` }}>
                      <div className={`w-4 h-12 -ml-2 rounded-full border flex flex-col items-center justify-center ${err.typeMatch && err.diff < 0.08 ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-amber-500/20 border-amber-500/40 text-amber-400'}`}>
                        <span className="text-[6px] font-black">{err.actualType}</span>
                      </div>
                      <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[5px] font-mono text-slate-500">{(err.diff * 1000).toFixed(0)}ms</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="h-4 border-t border-white/5 mt-2 flex justify-between px-4 items-center">
            {[1, 2, 3, 4, 1, 2, 3, 4].map((n, i) => <span key={i} className="text-[7px] font-black text-slate-700">{n}</span>)}
          </div>
        </div>
      </div>

      {aiFeedback && (
        <div className="bg-gradient-to-r from-orange-600 to-orange-500 p-4 rounded-[1.5rem] flex gap-4 items-center shadow-lg shadow-orange-950/40">
          <div className="w-10 h-10 bg-slate-950 rounded-xl flex items-center justify-center shrink-0 text-orange-500 shadow-inner border border-white/10">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" /></svg>
          </div>
          <div className="flex-1">
            <p className="text-slate-950 text-[10px] md:text-xs font-black leading-tight italic">"{aiFeedback}"</p>
          </div>
        </div>
      )}
    </div>
  );
};
