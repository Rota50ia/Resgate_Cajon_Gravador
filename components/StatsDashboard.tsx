
import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (activeTab === 'global') {
      fetchGlobal();
    }
  }, [activeTab]);

  const fetchGlobal = async () => {
    setIsLoadingGlobal(true);
    const data = await supabaseService.getGlobalHistory();
    setGlobalHistory(data);
    setIsLoadingGlobal(false);
  };

  const rhythmHistory = history.filter(h => h.rhythmName === selectedRhythmName);
  const avgAccuracy = rhythmHistory.length > 0 
    ? Math.round(rhythmHistory.reduce((acc, curr) => acc + curr.accuracy, 0) / rhythmHistory.length)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex p-1 bg-slate-950/50 rounded-2xl border border-slate-800/50 mb-4">
        <button 
          onClick={() => setActiveTab('local')}
          className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'local' ? 'bg-orange-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Seu Progresso
        </button>
        <button 
          onClick={() => setActiveTab('global')}
          className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'global' ? 'bg-orange-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Comunidade
        </button>
      </div>

      {activeTab === 'local' ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Média ({selectedRhythmName})</h4>
              <div className="flex items-end gap-3">
                <span className="text-5xl font-black text-emerald-400">{avgAccuracy}%</span>
              </div>
              <div className="mt-4 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${avgAccuracy}%` }} />
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Total Local</h4>
              <div className="text-5xl font-black text-blue-400">{history.length}</div>
              <p className="text-[8px] text-slate-600 mt-2 uppercase font-bold">Sessões neste dispositivo</p>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden">
            <div className="max-h-64 overflow-y-auto custom-scrollbar">
              {history.length === 0 ? (
                <div className="p-10 text-center text-slate-600 italic text-sm">Nenhuma prática local ainda.</div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="text-[9px] uppercase text-slate-600 bg-slate-900/80 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 font-black">Data</th>
                      <th className="px-6 py-3 font-black">Ritmo</th>
                      <th className="px-6 py-3 font-black">Prc.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {history.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/30">
                        <td className="px-6 py-4 text-slate-500 font-mono">{new Date(item.timestamp).toLocaleDateString()}</td>
                        <td className="px-6 py-4 font-bold text-slate-300">{item.rhythmName}</td>
                        <td className="px-6 py-4 font-black text-emerald-400">{item.accuracy}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden min-h-[300px]">
            {isLoadingGlobal ? (
              <div className="flex items-center justify-center p-20">
                <div className="w-8 h-8 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
              </div>
            ) : globalHistory.length === 0 ? (
              <div className="p-10 text-center text-slate-600 italic text-sm">Sem dados na nuvem.</div>
            ) : (
              <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                 <table className="w-full text-left text-xs">
                  <thead className="text-[9px] uppercase text-slate-600 bg-slate-900/80 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 font-black">Aluno</th>
                      <th className="px-6 py-3 font-black">Ritmo</th>
                      <th className="px-6 py-3 font-black">Acurácia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {globalHistory.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-slate-800/30">
                        <td className="px-6 py-4 text-slate-400 font-bold italic">Aluno #{idx + 1}</td>
                        <td className="px-6 py-4 text-slate-300 font-medium">{item.rhythm_name}</td>
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-2">
                             <span className="font-black text-orange-400">{item.accuracy}%</span>
                             {item.audio_url && <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" title="Áudio disponível" />}
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <p className="text-[9px] text-slate-600 text-center uppercase font-black tracking-widest">Sincronizado via Supabase Realtime</p>
        </div>
      )}
    </div>
  );
};
