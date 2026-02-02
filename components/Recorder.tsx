
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
    <div className="flex flex-col items-center gap-8 p-10 bg-slate-900/40 border border-slate-800/50 rounded-[40px] shadow-2xl backdrop-blur-md">
      <div className="relative">
        {isRecording && (
          <div className="absolute inset-0 bg-rose-500/30 rounded-full animate-ping scale-110" />
        )}
        <button
          disabled={isAnalyzing}
          onClick={handleToggle}
          className={`relative w-28 h-28 rounded-full flex items-center justify-center transition-all duration-500 transform active:scale-90 border-[6px] ${
            isRecording 
              ? 'bg-rose-500 shadow-[0_0_60px_rgba(244,63,94,0.3)] border-rose-400/30' 
              : 'bg-slate-800 hover:bg-slate-700 hover:scale-105 border-slate-700/50'
          }`}
        >
          {isRecording ? (
            <div className="w-9 h-9 bg-white rounded-xl shadow-inner" />
          ) : (
            <div className="w-10 h-10 bg-rose-500 rounded-full shadow-lg" />
          )}
        </button>
      </div>

      <div className="text-center space-y-1">
        <p className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-300 ${isRecording ? 'text-rose-400' : 'text-slate-500'}`}>
          {isRecording ? 'Capturando Sessão' : isAnalyzing ? 'Processando Ondas' : 'Pronto para Monitorar'}
        </p>
        <div className="font-mono text-4xl font-black text-slate-100 tracking-tighter">
          {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
        </div>
      </div>

      {isAnalyzing && (
        <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden relative">
          <div className="bg-emerald-500 h-full w-1/3 absolute animate-progress" />
        </div>
      )}
    </div>
  );
};
