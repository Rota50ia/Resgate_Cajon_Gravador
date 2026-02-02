
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
    <div className="glass-panel flex flex-col items-center gap-8 p-10 lg:p-14 rounded-[3rem] relative overflow-hidden group">
      {/* Background Pulsing Glow */}
      <div className={`absolute inset-0 transition-opacity duration-1000 ${isRecording ? 'opacity-30' : 'opacity-0'} pointer-events-none`}>
        <div className="absolute inset-0 bg-rose-500/20 blur-[100px]" />
      </div>

      <div className="relative z-10">
        <button
          disabled={isAnalyzing}
          onClick={handleToggle}
          className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-full flex items-center justify-center transition-all duration-500 transform active:scale-90 border-[6px] md:border-[10px] ${
            isRecording 
              ? 'bg-rose-600 border-white/10 shadow-[0_0_60px_rgba(225,29,72,0.5),inset_0_4px_10px_rgba(255,255,255,0.2)]' 
              : 'bg-slate-900 border-slate-800/80 hover:border-slate-700 shadow-xl'
          }`}
        >
          {isRecording ? (
            <div className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-lg shadow-inner animate-pulse" />
          ) : (
            <div className="relative w-10 h-10 md:w-12 md:h-12 bg-rose-600 rounded-full flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-black/40 to-white/20 opacity-40 rounded-full" />
                <div className="w-3 h-3 bg-white/20 rounded-full animate-ping" />
            </div>
          )}
        </button>
      </div>

      <div className="text-center space-y-3 relative z-10">
        <p className={`text-[10px] font-black uppercase tracking-[0.4em] transition-colors duration-500 ${isRecording ? 'text-rose-400' : 'text-slate-500'}`}>
          {isRecording ? 'Recording Session' : isAnalyzing ? 'Analyzing Groove' : 'Grave Seu Groove'}
        </p>
        <div className="font-mono text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tighter tabular-nums drop-shadow-2xl">
          {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
        </div>
      </div>

      {isAnalyzing && (
        <div className="w-full max-w-[200px] bg-white/5 h-1.5 rounded-full overflow-hidden relative z-10 mt-2 border border-white/5">
          <div className="bg-emerald-500 h-full w-1/3 absolute animate-progress shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
        </div>
      )}
    </div>
  );
};
