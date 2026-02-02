
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
    <div className="glass-panel flex flex-col items-center gap-4 p-5 md:p-7 rounded-[1.5rem] relative overflow-hidden group">
      <div className={`absolute inset-0 transition-opacity duration-1000 ${isRecording ? 'opacity-20' : 'opacity-0'} pointer-events-none bg-rose-500/10 blur-[50px]`} />

      <div className="relative z-10">
        <button
          disabled={isAnalyzing}
          onClick={handleToggle}
          className={`relative w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all transform active:scale-95 border-4 ${
            isRecording 
              ? 'bg-rose-600 border-white/10 shadow-lg' 
              : 'bg-slate-900 border-slate-800 hover:border-slate-700 shadow-md'
          }`}
        >
          {isRecording ? (
            <div className="w-5 h-5 bg-white rounded shadow-inner" />
          ) : (
            <div className="w-6 h-6 bg-rose-600 rounded-full flex items-center justify-center relative">
                <div className="w-2 h-2 bg-white/20 rounded-full animate-ping" />
            </div>
          )}
        </button>
      </div>

      <div className="text-center space-y-1 relative z-10">
        <p className={`text-[8px] font-black uppercase tracking-[0.2em] ${isRecording ? 'text-rose-400' : 'text-slate-500'}`}>
          {isRecording ? 'RECORDING' : isAnalyzing ? 'ANALYZING' : 'GRAVAR'}
        </p>
        <div className="font-mono text-2xl md:text-3xl font-black text-white tabular-nums">
          {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
        </div>
      </div>

      {isAnalyzing && (
        <div className="w-20 bg-white/5 h-1 rounded-full overflow-hidden relative z-10">
          <div className="bg-emerald-500 h-full w-full absolute animate-progress" />
        </div>
      )}
    </div>
  );
};
