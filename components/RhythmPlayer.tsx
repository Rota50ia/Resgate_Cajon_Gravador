
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

  const gridColsClass = pattern.length <= 8 
    ? "grid-cols-4 md:grid-cols-8" 
    : "grid-cols-4 sm:grid-cols-8 lg:grid-cols-12 xl:grid-cols-16";

  return (
    <div className="glass-panel rounded-[1.25rem] p-4 md:p-6 relative overflow-hidden transition-all duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 relative z-10 gap-4">
        <div className="space-y-0.5">
          <h2 className="text-lg md:text-xl font-extrabold text-white tracking-tight">Groove Timeline</h2>
          <p className="text-slate-500 text-[8px] font-bold tracking-[0.15em] uppercase">Visual Transients</p>
        </div>
        
        <div className="flex items-center gap-2">
          {referenceUrl && (
            <button 
              onClick={toggleReference}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
                isPlayingRef ? 'bg-orange-500 text-white border-orange-500' : 'bg-white/5 text-orange-400 border-white/5'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                {isPlayingRef ? <path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" /> : <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />}
              </svg>
              <span className="text-[9px] font-black uppercase tracking-widest">Guia</span>
              <audio ref={audioRef} src={referenceUrl} onEnded={handleAudioEnded} className="hidden" />
            </button>
          )}

          {activeBeatIndex !== null && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Live</span>
            </div>
          )}
        </div>
      </div>
      
      <div className={`grid ${gridColsClass} gap-1.5 md:gap-2 relative z-10`}>
        {pattern.map((note, idx) => {
          const isActive = activeBeatIndex === idx;
          const isBass = note === 'B';
          const isSlap = note === 'S' || note === 'T';

          return (
            <div 
              key={idx} 
              className={`relative h-10 sm:h-12 md:h-16 rounded-lg border flex flex-col items-center justify-center transition-all ${
                isActive 
                  ? 'bg-white border-white scale-105 z-20 shadow-lg' 
                  : isBass ? 'bg-emerald-500/5 border-emerald-500/10' : 
                    isSlap ? 'bg-blue-500/5 border-blue-500/10' : 
                    'bg-slate-950/20 border-slate-800/40 opacity-30'
              }`}
            >
              <span className={`text-[8px] font-black ${isActive ? 'text-slate-950' : isBass ? 'text-emerald-400' : isSlap ? 'text-blue-400' : 'text-slate-700'}`}>
                {isBass ? 'B' : isSlap ? 'S' : '•'}
              </span>
              <span className={`text-[7px] font-mono mt-0.5 ${isActive ? 'text-slate-400' : 'text-slate-800'}`}>
                {(idx % 4) + 1}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
