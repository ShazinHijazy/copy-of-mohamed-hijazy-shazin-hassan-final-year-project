import React from 'react';
import { AppTab } from '../types.ts';

interface SidebarProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const navItems = [
    { id: AppTab.FLIGHT, label: 'Fly View', icon: '✈️' },
    { id: AppTab.PILOT, label: 'Mission Pilot', icon: '🎮' },
    { id: AppTab.MAP, label: 'Tactical Map', icon: '🗺️' },
    { id: AppTab.PLAN, label: 'Architecture', icon: '🏛️' },
    { id: AppTab.SETUP, label: 'Telemetry', icon: '📜' },
    { id: AppTab.ANALYZE, label: 'Copilot', icon: '🤖' }
  ];

  return (
    <aside className="w-16 hover:w-56 transition-all duration-300 border-r border-white/5 bg-[#0d1117] flex flex-col z-50 group">
      <div className="p-4 border-b border-white/5 flex justify-center group-hover:justify-start items-center gap-4">
        <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center font-black text-white shrink-0">A</div>
        <span className="font-bold text-[10px] tracking-tighter text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap uppercase">AEGIS COMMAND</span>
      </div>
      
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center gap-4 p-3 rounded transition-all ${
              activeTab === item.id 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'text-slate-500 hover:bg-white/5 hover:text-slate-200'
            }`}
          >
            <span className="text-lg leading-none">{item.icon}</span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-white/5 space-y-4 overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></div>
          <span className="text-[9px] font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap uppercase tracking-widest">Datalink: Locked</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;