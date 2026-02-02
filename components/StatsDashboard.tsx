
import React, { useState, useEffect, useRef } from 'react';
import { PracticeHistoryItem } from '../utils/analyzeRecording';
import { supabaseService } from '../services/supabaseService';

interface StatsDashboardProps {
  history: PracticeHistoryItem[];
  selectedRhythmName: string;
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({ history, selectedRhythmName }) => {
  const [activeTab, setActiveTab] = useState<'local' | 'global'>('local');
  const [globalHistory, setGlobalHistory] = useState<any[]>([]);
  const [isLoadingGlobal, setIsLoadingGlobal] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (activeTab === 'global') fetchGlobal();
  }, [activeTab]);

  const fetchGlobal = async () => {
    setIsLoadingGlobal(true);
    const data = await supabaseService.getGlobalHistory();
    setGlobalHistory(data);
    setIsLoadingGlobal(false);
  };

  const playRecording = (url: string, id: string) => {
    if (playingId === id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
        setPlayingId(id);
      }
    }
  };

  const rhythmHistory = history.filter(h => h.rhythmName === selectedRhythmName);
  const avgAccuracy = rhythmHistory.length > 0 ? Math.round(rhythmHistory.reduce((acc, curr) => acc + curr.accuracy, 0) / rhythmHistory.length) : 0;

  return (
    <div className="space-y-4">
      <audio ref={audioRef} onEnded={() => setPlayingId(null)} className="hidden" />
      
      <div className="flex p-0.5 bg-slate-950/50 rounded-xl border border-slate-800/50">
        <button onClick={() => setActiveTab('local')} className={`flex-1 py-1.5 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'local' ? 'bg-orange-500 text-slate-950' : 'text-slate-500 hover:text-slate-400'}`}>Privado</button>
        <button onClick={() => setActiveTab('global')} className={`flex-1 py-1.5 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'global' ? 'bg-orange-500 text-slate-950' : 'text-slate-500 hover:text-slate-400'}`}>Comunidade</button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-slate-900/60 p-3 rounded-xl border border-white/5 shadow-inner">
          <h4 className="text-[7px] font-black text-slate-600 uppercase mb-1 tracking-widest">Seu Top Score</h4>
          <div className="text-xl font-black text-emerald-400 tabular-nums">{avgAccuracy}%</div>
        </div>
        <div className="bg-slate-900/60 p-3 rounded-xl border border-white/5 shadow-inner">
          <h4 className="text-[7px] font-black text-slate-600 uppercase mb-1 tracking-widest">Sessões</h4>
          <div className="text-xl font-black text-blue-400 tabular-nums">{history.length}</div>
        </div>
      </div>

      <div className="max-h-40 overflow-y-auto custom-scrollbar pr-1">
        {activeTab === 'local' ? (
          <div className="space-y-1.5">
            {history.length > 0 ? history.map(h => (
              <div key={h.id} className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/5 group hover:border-white/10 transition-colors">
                <div>
                  <p className="text-[9px] font-black text-slate-200 uppercase leading-none">{h.rhythmName}</p>
                  <span className="text-[7px] text-slate-500 font-mono mt-1 block">{new Date(h.timestamp).toLocaleDateString()}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black text-emerald-400">{h.accuracy}%</span>
                </div>
              </div>
            )) : (
              <div className="text-center py-6 text-slate-700 text-[8px] font-black uppercase tracking-widest">Sem práticas salvas</div>
            )}
          </div>
        ) : (
          <div className="space-y-1.5">
            {isLoadingGlobal ? (
              <div className="flex justify-center py-8"><div className="w-4 h-4 border-2 border-t-orange-500 rounded-full animate-spin" /></div>
            ) : globalHistory.map(h => (
              <div key={h.id} className="flex items-center justify-between p-2 bg-orange-500/5 rounded-lg border border-orange-500/10">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => playRecording(h.audio_url, h.id)}
                    className="w-6 h-6 bg-orange-500 rounded flex items-center justify-center text-slate-950"
                  >
                    {playingId === h.id ? (
                      <div className="w-1.5 h-1.5 bg-slate-950 animate-pulse" />
                    ) : (
                      <svg className="w-3 h-3 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    )}
                  </button>
                  <div>
                    <p className="text-[8px] font-black text-slate-300 uppercase leading-none">{h.rhythm_name}</p>
                    <span className="text-[6px] text-slate-500 font-bold uppercase block mt-1">{h.bpm} BPM</span>
                  </div>
                </div>
                <div className="text-[10px] font-black text-orange-400">{h.accuracy}%</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
