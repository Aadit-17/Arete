import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LiquidGlass } from './CelestialUI';
import { cn } from '@/lib/utils';
import { 
  Sparkles, 
  Send, 
  User, 
  Bot, 
  Zap, 
  BrainCircuit,
  Mic,
  Paperclip
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const AgentScreen: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Greetings, Traveler. I am Arete, your celestial guide. I've analyzed your output for the past 72 hours. Your mental clarity is peaking, but your physical recovery is lagging. How shall we calibrate your trajectory today?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    // Mock response
    setTimeout(() => {
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Understood. I'm adjusting your focus parameters. Based on your recent coding sessions, I recommend a 20-minute cognitive reset before your next deep work block.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMsg]);
    }, 1000);
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      {/* Agent Header */}
      <header className="p-8 border-b border-white/5 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-cyan-400/20 flex items-center justify-center border border-cyan-400/30">
              <Sparkles className="w-6 h-6 text-cyan-400 animate-pulse" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#0e0e0e]" />
          </div>
          <div>
            <h2 className="text-xl font-headline font-bold text-white">Arete Intelligence</h2>
            <p className="text-[10px] font-label text-cyan-400 tracking-[0.2em] uppercase">Neural Engine Active</p>
          </div>
        </div>
        <div className="flex gap-4">
          <LiquidGlass className="px-4 py-2 flex items-center gap-2 border border-white/5">
            <BrainCircuit className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-label text-white/80">Thinking Level: High</span>
          </LiquidGlass>
        </div>
      </header>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex gap-4 max-w-3xl",
                msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-xl shrink-0 flex items-center justify-center border",
                msg.role === 'assistant' 
                  ? "bg-cyan-400/10 border-cyan-400/20 text-cyan-400" 
                  : "bg-white/5 border-white/10 text-zinc-400"
              )}>
                {msg.role === 'assistant' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
              </div>
              <div className="space-y-2">
                <LiquidGlass className={cn(
                  "p-5 border",
                  msg.role === 'assistant' 
                    ? "border-white/5 bg-white/5 rounded-tl-none" 
                    : "border-cyan-400/20 bg-cyan-400/5 rounded-tr-none"
                )}>
                  <p className="text-sm md:text-base font-headline leading-relaxed text-white/90">
                    {msg.content}
                  </p>
                </LiquidGlass>
                <p className={cn(
                  "text-[10px] font-label text-zinc-500 tracking-widest uppercase",
                  msg.role === 'user' && "text-right"
                )}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      <div className="p-8 pt-0">
        <LiquidGlass className="p-2 border border-white/10 bg-white/5">
          <div className="flex items-center gap-2 px-4">
            <button className="p-2 text-zinc-500 hover:text-cyan-400 transition-colors">
              <Paperclip className="w-5 h-5" />
            </button>
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask Arete about your progress..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-white font-headline py-4 outline-none"
            />
            <div className="flex items-center gap-1">
              <button className="p-2 text-zinc-500 hover:text-cyan-400 transition-colors">
                <Mic className="w-5 h-5" />
              </button>
              <button 
                onClick={handleSend}
                disabled={!input.trim()}
                className="p-3 bg-cyan-400 text-black rounded-xl hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </LiquidGlass>
        <div className="mt-4 flex justify-center gap-6">
          {['Analyze Sleep', 'Optimize Schedule', 'Macro Breakdown'].map(suggestion => (
            <button 
              key={suggestion}
              className="text-[10px] font-label text-zinc-500 tracking-[0.2em] uppercase hover:text-cyan-300 transition-colors flex items-center gap-2"
            >
              <Zap className="w-3 h-3 text-cyan-400" />
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
