
import React, { useRef, useEffect } from 'react';

interface LogsProps {
  logs: string[];
  onExport: () => void;
  recordCount: number;
}

const Logs: React.FC<LogsProps> = ({ logs, onExport, recordCount }) => {
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = 0;
    }
  }, [logs]);

  return (
    <div className="h-full flex flex-col p-8 space-y-4 animate-fadeIn max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-3">
          <div className="h-1 w-8 bg-blue-500"></div>
          <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Unified Telemetry Stream</h2>
        </div>
        <div className="flex gap-4">
           <button 
             onClick={onExport}
             className="text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/10 px-4 py-1.5 rounded hover:bg-white/10 transition-colors flex items-center gap-2"
           >
             <span>Export .CSV</span>
             <span className="text-blue-400">({recordCount})</span>
           </button>
           <div className="flex items-center gap-2 px-3 py-1 bg-blue-600/10 border border-blue-500/30 rounded text-[10px] font-black uppercase text-blue-400">
             <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></div>
             LIVE STREAMING
           </div>
        </div>
      </div>
      
      <div className="bg-[#0d1117] rounded-xl border border-white/5 overflow-hidden flex flex-col flex-1 shadow-2xl">
        <div className="p-4 bg-slate-900/50 border-b border-white/5 flex justify-between items-center">
           <div className="flex gap-6">
              <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Type</span>
              <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Message Payload</span>
           </div>
           <span className="text-[10px] text-emerald-500 font-mono font-bold">STDOUT // TTY_01</span>
        </div>
        
        <div ref={logContainerRef} className="p-6 overflow-y-auto font-mono text-[11px] space-y-1.5 flex-1 custom-scrollbar">
          {logs.length === 0 ? (
            <div className="text-slate-700 italic">No telemetry data in buffer...</div>
          ) : (
            logs.map((log, i) => {
              const isAlert = log.includes('ALERT') || log.includes('LEADER LOST');
              const isConsensus = log.includes('CONSENSUS');
              const isLog = log.includes('[LOG]');
              const isSystem = log.includes('[SYSTEM]');
              const isData = log.includes('[DATA]');
              
              let typeLabel = "INFO";
              let textColor = "text-slate-400";
              let typeColor = "bg-slate-800 text-slate-400";

              if (isAlert) { typeLabel = "WARN"; textColor = "text-red-400"; typeColor = "bg-red-500/20 text-red-400"; }
              else if (isConsensus) { typeLabel = "ELEC"; textColor = "text-blue-400 font-bold"; typeColor = "bg-blue-500/20 text-blue-400"; }
              else if (isLog) { typeLabel = "SENS"; textColor = "text-emerald-500/80"; typeColor = "bg-emerald-500/10 text-emerald-500"; }
              else if (isSystem) { typeLabel = "SYS"; textColor = "text-slate-200"; typeColor = "bg-white/5 text-slate-400"; }
              else if (isData) { typeLabel = "DATA"; textColor = "text-orange-400"; typeColor = "bg-orange-500/20 text-orange-400"; }

              return (
                <div key={i} className="flex gap-6 py-0.5 border-b border-white/5 last:border-none group">
                  <span className={`w-10 shrink-0 text-center rounded-[2px] h-fit py-0.5 ${typeColor} text-[8px] font-black`}>
                    {typeLabel}
                  </span>
                  <span className={`${textColor} break-all transition-colors group-hover:text-white`}>
                    {log}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-6 pt-4">
        <div className="p-4 bg-white/5 border border-white/5 rounded-lg flex flex-col">
          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Total Samples</span>
          <span className="text-lg font-black text-white">{recordCount.toLocaleString()}</span>
        </div>
        <div className="p-4 bg-white/5 border border-white/5 rounded-lg flex flex-col">
          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Logging Rate</span>
          <span className="text-lg font-black text-emerald-500">{recordCount > 0 ? (recordCount / (logs.length || 1)).toFixed(1) : 0} Hz avg</span>
        </div>
        <div className="p-4 bg-white/5 border border-white/5 rounded-lg flex flex-col">
          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Format</span>
          <span className="text-lg font-black text-blue-500">IEEE 754 CSV</span>
        </div>
      </div>
    </div>
  );
};

export default Logs;
