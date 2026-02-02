
import React, { useState, useRef, useEffect } from 'react';
import { supabaseService } from '../services/supabaseService';

interface RhythmPlayerProps {
  pattern: string[];
  activeBeatIndex: number | null;
  referenceAudioPath?: string;
  autoPlayReference?: boolean;
  onReferenceEnd?: () => void;
}

export const RhythmPlayer: React.FC<RhythmPlayerProps> = ({ 
  pattern, 
  activeBeatIndex, 
  referenceAudioPath,
  autoPlayReference,
  onReferenceEnd
}) => {
  const [isPlayingRef, setIsPlayingRef] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const referenceUrl = referenceAudioPath ? supabaseService.getReferenceAudioUrl(referenceAudioPath) : null;

  useEffect(() => {
    if (autoPlayReference && referenceUrl && audioRef.current) {
      audioRef.current.play().catch(e => console.log("Auto-play blocked", e));
      setIsPlayingRef(true);
    }
  }, [autoPlayReference, referenceUrl]);

  const toggleReference = () => {
    if (!audioRef.current) return;
    
    if (isPlayingRef) {
      audioRef.current.pause();
      setIsPlayingRef(false);
    } else {
      audioRef.current.play();
      setIsPlayingRef(true);
    }
  };

  const handleAudioEnded = () => {
    setIsPlayingRef(false);
    if (onReferenceEnd) onReferenceEnd();
  };

  // Calcula dinamicamente o número de colunas para o grid
  // Se for um padrão de 16 notas, ele tenta ajustar melhor o espaço
  const gridColsClass = pattern.length <= 8 
    ? "grid-cols-4 md:grid-cols-8" 
    : "grid-cols-4 sm:grid-cols-8 lg:grid-cols-12 xl:grid-cols-16";

  return (
    <div className="glass-panel rounded-[2.5rem] p-6 md:p-10 lg:p-12 relative overflow-hidden transition-all duration-700 group">
      {/* Dynamic Background Glow */}
      <div className={`absolute -top-20 -left-20 w-80 h-80 rounded-full blur-[120px] pointer-events-none transition-all duration-1000 ${activeBeatIndex !== null ? 'bg-orange-500/20' : 'bg-orange-500/5'}`} />
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 md:mb-10 relative z-10 gap-6">
        <div className="space-y-1">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-extrabold text-white tracking-tight">Timeline do Groove</h2>
          <p className="text-slate-500 text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase">Mapeamento Visual de Transientes</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {referenceUrl && (
            <div className={`flex-1 sm:flex-none flex items-center gap-3 bg-white/5 backdrop-blur-xl p-1.5 pr-4 rounded-2xl border transition-all duration-500 ${isPlayingRef ? 'border-orange-500/50' : 'border-white/5'} hover:border-orange-500/30`}>
              <button 
                onClick={toggleReference}
                className={`w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  isPlayingRef 
                    ? 'bg-orange-500 text-white shadow-[0_0_25px_rgba(249,115,22,0.5)] scale-95' 
                    : 'bg-slate-800/50 text-orange-400 hover:bg-slate-700/80'
                }`}
              >
                {isPlayingRef ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                ) : (
                  <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                )}
              </button>
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase text-orange-500 tracking-widest leading-none">Guia</span>
                <span className="text-[8px] text-slate-500 uppercase font-bold mt-1">Ref. Professor</span>
              </div>
              <audio 
                ref={audioRef} 
                src={referenceUrl} 
                onEnded={handleAudioEnded} 
                className="hidden" 
              />
            </div>
          )}

          {activeBeatIndex !== null && (
            <div className="flex items-center gap-2.5 px-4 py-2.5 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 backdrop-blur-md">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.8)]" />
              <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Tracking</span>
            </div>
          )}
        </div>
      </div>
      
      <div className={`grid ${gridColsClass} gap-2.5 md:gap-4 items-center justify-center relative z-10`}>
        {pattern.map((note, idx) => {
          const isActive = activeBeatIndex === idx;
          const isBass = note === 'B';
          const isSlap = note === 'S' || note === 'T';

          return (
            <div 
              key={idx} 
              className={`relative h-20 sm:h-24 md:h-32 rounded-[1.25rem] md:rounded-[1.75rem] border-2 flex flex-col items-center justify-center transition-all duration-200 group/pad ${
                isActive 
                  ? 'bg-white border-white scale-105 sm:scale-110 z-20 shadow-[0_0_50px_rgba(255,255,255,0.25)]' 
                  : isBass ? 'bg-emerald-500/5 border-emerald-500/10 hover:border-emerald-500/40' : 
                    isSlap ? 'bg-blue-500/5 border-blue-500/10 hover:border-blue-500/40' : 
                    'bg-slate-950/20 border-slate-800/40 opacity-30 hover:opacity-60'
              }`}
            >
              <span className={`text-[9px] sm:text-[10px] md:text-xs font-black tracking-tighter ${
                isActive ? 'text-slate-950' :
                isBass ? 'text-emerald-400' : 
                isSlap ? 'text-blue-400' : 
                'text-slate-700'
              }`}>
                {isBass ? 'BASS' : isSlap ? 'SLAP' : '•'}
              </span>
              <span className={`text-[8px] sm:text-[9px] font-mono mt-1.5 font-bold ${isActive ? 'text-slate-400' : 'text-slate-800'}`}>
                {(idx % 4) + 1}
              </span>
              
              {isActive && (
                <div className="absolute inset-0 rounded-[1.25rem] md:rounded-[1.75rem] shadow-[inset_0_0_15px_rgba(0,0,0,0.1)] pointer-events-none" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
