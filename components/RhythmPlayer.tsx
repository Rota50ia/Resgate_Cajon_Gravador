
import React from 'react';

interface RhythmPlayerProps {
  pattern: string[];
  activeBeatIndex: number | null;
}

export const RhythmPlayer: React.FC<RhythmPlayerProps> = ({ pattern, activeBeatIndex }) => {
  return (
    <div className="bg-slate-900 rounded-3xl p-10 border border-slate-800 shadow-2xl relative overflow-hidden transition-all duration-500">
      <div className="absolute top-0 right-0 p-8 opacity-5">
        <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
        </svg>
      </div>

      <div className="flex justify-between items-end mb-10 relative z-10">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Guia Rítmico Visual</h2>
          <p className="text-slate-500 text-sm font-medium">Internalize o padrão e toque no tempo correto</p>
        </div>
        {activeBeatIndex !== null && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Live Engine</span>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-4 md:grid-cols-8 gap-3 h-32 items-center justify-center relative z-10">
        {pattern.map((note, idx) => {
          const isActive = activeBeatIndex === idx;
          return (
            <div 
              key={idx} 
              className={`flex-1 h-24 rounded-2xl border flex flex-col items-center justify-center transition-all duration-150 ${
                isActive 
                  ? 'bg-white border-white scale-110 z-20 shadow-[0_0_30px_rgba(255,255,255,0.2)]' 
                  : note === 'B' ? 'bg-emerald-500/10 border-emerald-500/50' : 
                    note === 'T' ? 'bg-blue-500/10 border-blue-500/50' : 
                    'bg-slate-950 border-slate-800 opacity-40'
              }`}
            >
              <span className={`text-xl font-black ${
                isActive ? 'text-slate-950' :
                note === 'B' ? 'text-emerald-400' : 
                note === 'T' ? 'text-blue-400' : 
                'text-slate-700'
              }`}>
                {note === 'B' ? 'BASS' : note === 'T' ? 'HIT' : '·'}
              </span>
              <span className={`text-[10px] font-mono mt-1 ${isActive ? 'text-slate-600' : 'text-slate-600'}`}>
                {(idx % 4) + 1}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
