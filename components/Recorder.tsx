
import React from 'react';

interface RecorderProps {
  onRecordStart: () => void;
  onRecordStop: () => void;
  isRecording: boolean;
  isAnalyzing: boolean;
  recordingTime: number;
}

export const Recorder: React.FC<RecorderProps> = ({ 
  onRecordStart, 
  onRecordStop, 
  isRecording,
  isAnalyzing,
  recordingTime 
}) => {

  const handleToggle = () => {
    if (isRecording) {
      onRecordStop();
    } else {
      onRecordStart();
    }
  };

  return (
    <div className="w-full bg-[#050c0f] border border-white/5 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center space-y-6">
      <div className={`absolute inset-0 transition-opacity duration-1000 ${isRecording ? 'opacity-30' : 'opacity-0'} pointer-events-none bg-rose-500/10 blur-[80px]`} />

      <div className="relative z-10 flex flex-col items-center">
        <button
          disabled={isAnalyzing}
          onClick={handleToggle}
          className={`relative w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center transition-all transform active:scale-90 border-4 ${
            isRecording 
              ? 'bg-rose-600 border-white/20 shadow-[0_0_40px_rgba(225,29,72,0.4)]' 
              : 'bg-slate-900 border-slate-800 hover:border-slate-700 shadow-xl'
          }`}
        >
          {isRecording ? (
            <div className="w-8 h-8 bg-white rounded-md shadow-inner" />
          ) : (
            <div className="w-10 h-10 bg-rose-600 rounded-full flex items-center justify-center relative shadow-inner">
                <div className="w-4 h-4 bg-white/30 rounded-full animate-ping" />
            </div>
          )}
        </button>
      </div>

      <div className="text-center space-y-2 relative z-10">
        <p className={`text-[10px] md:text-xs font-black uppercase tracking-[0.4em] ${isRecording ? 'text-rose-500 animate-pulse' : 'text-slate-500'}`}>
          {isRecording ? 'GRAVANDO...' : isAnalyzing ? 'ANALISANDO...' : 'GRAVAR'}
        </p>
        <div className="font-mono text-5xl md:text-7xl font-black text-white tabular-nums tracking-tighter">
          {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
        </div>
      </div>

      {isAnalyzing && (
        <div className="w-48 bg-white/5 h-1.5 rounded-full overflow-hidden relative z-10 mt-4">
          <div className="bg-emerald-500 h-full w-full absolute animate-progress shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
        </div>
      )}
    </div>
  );
};
