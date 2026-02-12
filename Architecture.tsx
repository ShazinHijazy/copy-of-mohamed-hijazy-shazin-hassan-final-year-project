
import React from 'react';

const Architecture: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-fadeIn py-12 px-6 overflow-y-auto h-full pb-20 custom-scrollbar">
      <header className="space-y-4 border-b border-slate-800 pb-8">
        <div className="flex items-center gap-4">
          <div className="h-1 w-12 bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]"></div>
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">Aegis Consensus Specs</h2>
        </div>
        <p className="text-slate-400 font-medium max-w-2xl leading-relaxed">
          Technical specifications for the Multi-Objective Threshold-Based Consensus Model and the Hot-Swap Leadership failure protocols.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-[#0d1117] border border-slate-800 p-8 rounded-2xl space-y-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-orange-500/10 transition-colors"></div>
          <h3 className="text-xs font-black text-orange-500 tracking-widest uppercase flex items-center gap-2">
             <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
             Phase 1: Scoring Function (f_s)
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Every 4 seconds, each node performs a periodical computation to calculate its mission fitness based on weighted variables.
          </p>
          <div className="bg-black/40 p-6 rounded-xl border border-slate-900 font-mono text-xs text-emerald-500 space-y-2 relative">
            <div className="text-slate-500 italic mb-2">// Objective: Maximize Swarm Integrity</div>
            <div>Score = (Batt * 0.5) + (Sig * 0.3) + (Stab * 0.2)</div>
            <div className="mt-4 text-slate-500 italic">// Logic Constraints:</div>
            <div className="text-slate-300">IF (Score == Max) -> ELECT_LEADER</div>
            <div className="text-slate-300">ELSE IF (Score <= 0.42) -> REDIRECT_RTL</div>
          </div>
        </div>

        <div className="bg-[#0d1117] border border-slate-800 p-8 rounded-2xl space-y-6 shadow-xl">
          <h3 className="text-xs font-black text-blue-500 tracking-widest uppercase flex items-center gap-2">
             <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
             Phase 2: Hot-Swap Failover
          </h3>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-lg bg-slate-800/50 flex items-center justify-center text-xs font-bold text-blue-400 shrink-0 border border-blue-500/20">01</div>
              <p className="text-[11px] text-slate-500 leading-relaxed"><span className="text-white font-bold block mb-1">Health Check</span> Continuous polling of leader heartbeat. Trigger election if latency > 200ms.</p>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-lg bg-slate-800/50 flex items-center justify-center text-xs font-bold text-blue-400 shrink-0 border border-blue-500/20">02</div>
              <p className="text-[11px] text-slate-500 leading-relaxed"><span className="text-white font-bold block mb-1">Promotion</span> The node with the 2nd highest score from current epoch is immediately promoted.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="text-center py-10 opacity-30">
        <div className="text-[10px] font-black text-slate-500 tracking-[0.5em] uppercase">
          AEGIS CONTROL // PROTOCOL: THRESHOLD_CONSENSUS
        </div>
      </footer>
    </div>
  );
};

export default Architecture;
