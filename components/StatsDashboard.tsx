
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
    if (activeTab === 'global') fetchGlobal();
  }, [activeTab]);

  const fetchGlobal = async () => {
    setIsLoadingGlobal(true);
    const data = await supabaseService.getGlobalHistory();
    setGlobalHistory(data);
    setIsLoadingGlobal(false);
  };

  const rhythmHistory = history.filter(h => h.rhythmName === selectedRhythmName);
  const avgAccuracy = rhythmHistory.length > 0 ? Math.round(rhythmHistory.reduce((acc, curr) => acc + curr.accuracy, 0) / rhythmHistory.length) : 0;

  return (
    <div className="space-y-4">
      <div className="flex p-0.5 bg-slate-950/50 rounded-xl border border-slate-800/50">
        <button onClick={() => setActiveTab('local')} className={`flex-1 py-1 text-[8px] font-black uppercase tracking-widest rounded-lg ${activeTab === 'local' ? 'bg-orange-500 text-white' : 'text-slate-500'}`}>Local</button>
        <button onClick={() => setActiveTab('global')} className={`flex-1 py-1 text-[8px] font-black uppercase tracking-widest rounded-lg ${activeTab === 'global' ? 'bg-orange-500 text-white' : 'text-slate-500'}`}>Global</button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-slate-900/60 p-3 rounded-xl border border-white/5">
          <h4 className="text-[7px] font-black text-slate-500 uppercase mb-1">Média</h4>
          <div className="text-xl font-black text-emerald-400">{avgAccuracy}%</div>
        </div>
        <div className="bg-slate-900/60 p-3 rounded-xl border border-white/5">
          <h4 className="text-[7px] font-black text-slate-500 uppercase mb-1">Sessões</h4>
          <div className="text-xl font-black text-blue-400">{history.length}</div>
        </div>
      </div>

      <div className="max-h-32 overflow-y-auto custom-scrollbar text-[8px]">
        {activeTab === 'local' ? (
          <table className="w-full text-left">
            <tbody className="divide-y divide-slate-800">
              {history.map(h => (
                <tr key={h.id} className="text-slate-400"><td className="py-2">{new Date(h.timestamp).toLocaleDateString()}</td><td className="font-bold text-slate-300">{h.rhythmName}</td><td className="font-black text-emerald-400">{h.accuracy}%</td></tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-4 text-slate-600">Carregando comunidade...</div>
        )}
      </div>
    </div>
  );
};
