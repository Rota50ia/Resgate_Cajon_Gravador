
import React from 'react';
import { ComparisonResult } from '../utils/rhythmComparison';

interface AnalysisDashboardProps {
  result: ComparisonResult;
  aiFeedback?: string;
  audioUrl?: string | null;
  syncStatus?: 'pending' | 'synced' | 'failed';
}

export const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({ 
  result, 
  aiFeedback, 
  audioUrl,
  syncStatus = 'synced'
}) => {
  const { accuracy, typeAccuracy, patternAnalysis } = result;

  const getAccuracyFeedback = (acc: number) => {
    if (acc >= 90) return { emoji: '🏆', text: 'Nível Mestre', color: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/5' };
    if (acc >= 75) return { emoji: '⭐', text: 'Groove Sólido', color: 'text-blue-400', border: 'border-blue-500/20', bg: 'bg-blue-500/5' };
    if (acc >= 60) return { emoji: '👍', text: 'Boa Pegada', color: 'text-amber-400', border: 'border-amber-500/20', bg: 'bg-amber-500/5' };
    return { emoji: '💪', text: 'Foco no Pulso', color: 'text-rose-400', border: 'border-rose-500/20', bg: 'bg-rose-500/5' };
  };

  const feedback = getAccuracyFeedback(accuracy);

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
        <div className="glass-panel p-6 md:p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-8 group/player">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-white/5 rounded-2xl flex items-center justify-center text-orange-500 border border-white/5 group-hover/player:bg-orange-500/20 transition-all duration-500">
            <svg className="w-7 h-7 md:w-9 md:h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
          </div>
          <div className="flex-1 w-full">
            <audio controls className="w-full h-10 accent-orange-500 opacity-60 hover:opacity-100 transition-opacity">
              <source src={audioUrl} type="audio/webm" />
            </audio>
          </div>
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] hidden md:block">Master Track Review</p>
        </div>
      )}

      <div className="glass-panel p-8 md:p-12 rounded-[3.5rem] border-white/5">
        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] mb-12 text-center">Waveform Accuracy Mapping</h4>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-3 sm:gap-4 md:gap-6">
          {patternAnalysis.map((step, i) => (
            <div key={i} className="flex flex-col items-center gap-4 group/step">
              <div className={`w-full h-20 sm:h-24 rounded-[1.25rem] sm:rounded-[1.5rem] border flex items-center justify-center transition-all duration-500 group-hover/step:translate-y-[-4px] ${
                step.status === 'correct' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_10px_30px_rgba(16,185,129,0.1)]' :
                step.status === 'wrong-type' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-[0_10px_30px_rgba(245,158,11,0.1)]' :
                'bg-slate-900/60 border-slate-800/40 text-slate-800'
              }`}>
                <span className="text-2xl font-black">
                  {step.status === 'correct' ? '✓' : step.status === 'wrong-type' ? '!' : '•'}
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-600 font-bold opacity-40">{i + 1}</span>
            </div>
          ))}
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
