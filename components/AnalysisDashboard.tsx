
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
  const { accuracy, typeAccuracy, tempoAnalysis, avgTimingError, patternAnalysis } = result;

  const getAccuracyFeedback = (acc: number) => {
    if (acc >= 90) return { emoji: '🏆', text: 'Mestre do Cajón!', color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/5' };
    if (acc >= 75) return { emoji: '⭐', text: 'Muito bem!', color: 'text-blue-400', border: 'border-blue-500/30', bg: 'bg-blue-500/5' };
    if (acc >= 60) return { emoji: '👍', text: 'No caminho certo!', color: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/5' };
    return { emoji: '💪', text: 'Vamos praticar mais!', color: 'text-rose-400', border: 'border-rose-500/30', bg: 'bg-rose-500/5' };
  };

  const feedback = getAccuracyFeedback(accuracy);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`p-8 rounded-3xl border text-center transition-all ${feedback.color} ${feedback.border} ${feedback.bg}`}>
          <p className="text-[10px] uppercase font-black tracking-widest mb-2 opacity-60">Tempo & Precisão</p>
          <div className="text-6xl font-black mb-1">{feedback.emoji} {accuracy}%</div>
          <p className="text-sm font-bold opacity-80 uppercase tracking-tighter">{feedback.text}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl text-center">
          <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest mb-2">Qualidade do Toque (B/T)</p>
          <div className="text-4xl font-bold text-orange-400">{typeAccuracy}%</div>
          <p className="text-[10px] text-slate-500 mt-2 uppercase">Fidelidade aos timbres</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl text-center flex flex-col justify-center items-center">
          <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest mb-2">Sincronização Cloud</p>
          {syncStatus === 'pending' ? (
            <div className="flex items-center gap-2 text-amber-500">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              <span className="text-xs font-black uppercase tracking-tighter">Enviando...</span>
            </div>
          ) : syncStatus === 'synced' ? (
            <div className="flex items-center gap-2 text-emerald-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              <span className="text-xs font-black uppercase tracking-tighter">Salvo na Nuvem</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-rose-500">
              <span className="text-xs font-black uppercase tracking-tighter">Erro ao salvar</span>
            </div>
          )}
        </div>
      </div>

      {/* Audio Playback Section */}
      {audioUrl && (
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-[32px] flex flex-col md:flex-row items-center gap-6">
          <div className="shrink-0 text-slate-500">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
          </div>
          <div className="flex-1 w-full">
            <audio controls className="w-full h-10 accent-orange-500">
              <source src={audioUrl} type="audio/webm" />
              Seu navegador não suporta o player de áudio.
            </audio>
          </div>
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Revisão da Sessão</p>
        </div>
      )}

      {/* Visual Pattern Breakdown */}
      <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-[40px]">
        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-8">Mapa da Execução</h4>
        <div className="grid grid-cols-8 gap-3">
          {patternAnalysis.map((step, i) => (
            <div key={i} className="flex flex-col items-center gap-3">
              <div className={`w-full h-16 rounded-xl border-2 flex items-center justify-center transition-all duration-500 ${
                step.status === 'correct' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' :
                step.status === 'wrong-type' ? 'bg-amber-500/10 border-amber-500 text-amber-400' :
                step.status === 'missed' ? 'bg-slate-800/20 border-slate-800 text-slate-700' :
                'bg-slate-900 border-slate-800'
              }`}>
                <span className="text-xs font-black">
                  {step.status === 'correct' ? '✓' : step.status === 'wrong-type' ? '!' : '×'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Coach Feedback */}
      {aiFeedback && (
        <div className="bg-orange-500 border border-orange-400 p-6 rounded-[32px] flex gap-5 items-start shadow-xl shadow-orange-950/20">
          <div className="w-12 h-12 bg-slate-950 rounded-2xl flex items-center justify-center shrink-0 shadow-lg">
             <svg className="w-7 h-7 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
               <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a.997.997 0 00-.12-.47 12.07 12.07 0 00-1.97-3.67A7.99 7.99 0 0012 10h-4a7.99 7.99 0 00-1.91.46 12.07 12.07 0 00-1.97 3.67A.997.997 0 004 15v3H16z"/>
             </svg>
          </div>
          <div>
            <h4 className="text-[10px] font-black text-slate-950 uppercase tracking-widest mb-1 opacity-60">Coach Insight</h4>
            <p className="text-slate-950 text-sm leading-relaxed font-bold italic">
              "{aiFeedback}"
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
