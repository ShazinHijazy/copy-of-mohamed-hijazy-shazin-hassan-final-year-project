import React, { useState, useRef, useEffect } from 'react';
import { SwarmState } from '../types.ts';
import { geminiService } from '../services/geminiService.ts';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface CopilotProps {
  swarmState: SwarmState;
  hysteresisBuffer: number;
}

const Copilot: React.FC<CopilotProps> = ({ swarmState, hysteresisBuffer }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Aegis Copilot online. How can I assist with swarm operations today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    // Initialize assistant message for streaming
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      const stream = geminiService.analyzeSwarmStream(swarmState, userMsg, hysteresisBuffer);
      let fullText = '';
      
      for await (const chunk of stream) {
        fullText += chunk;
        setMessages(prev => {
          const newMsgs = [...prev];
          newMsgs[newMsgs.length - 1].content = fullText;
          return newMsgs;
        });
      }
    } catch (error) {
      setMessages(prev => {
        const newMsgs = [...prev];
        newMsgs[newMsgs.length - 1].content = 'Error communicating with Aegis core systems.';
        return newMsgs;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-200px)] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl animate-fadeIn">
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="font-bold text-sm tracking-widest uppercase">Copilot Interface v2.5 (Streaming)</span>
        </div>
        <div className="text-[10px] text-slate-500 mono">MODEL: GEMINI_3_PRO</div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-5 py-3 text-sm leading-relaxed ${
              m.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none shadow-lg' 
                : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none'
            }`}>
              {m.content || (isLoading && i === messages.length - 1 ? '...' : '')}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-slate-950/50 border-t border-slate-800">
        <div className="flex gap-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about swarm state, logic parameters, or mission goals..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-slate-200"
          />
          <button
            onClick={handleSend}
            disabled={isLoading}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg"
          >
            {isLoading ? 'THINKING' : 'SEND'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Copilot;