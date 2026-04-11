import React from 'react';
import { cn } from '@/lib/utils';
import { 
  LayoutGrid, 
  BarChart3, 
  Activity, 
  Sparkles, 
  Settings, 
  HelpCircle, 
  Fingerprint,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen, setIsOpen }) => {
  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutGrid },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'log', label: 'Log', icon: Sparkles },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <motion.aside
      initial={false}
      animate={{ width: isOpen ? 256 : 80 }}
      className="fixed left-0 top-0 h-full py-6 liquid-glass z-50 rounded-r-3xl my-4 ml-4 h-[calc(100vh-2rem)] border-white/10 flex flex-col transition-all duration-300"
    >
      <div className="px-6 mb-12 flex items-center justify-between">
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="logo-open"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <h1 className="text-2xl font-bold text-cyan-300 tracking-[0.1em]">ARETE</h1>
              <p className="text-[10px] tracking-[0.2em] text-zinc-400 uppercase mt-1">Celestial Tracker</p>
            </motion.div>
          ) : (
            <motion.div
              key="logo-closed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full flex justify-center"
            >
              <h1 className="text-2xl font-bold text-cyan-300">A</h1>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <nav className="flex-1 px-3 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 transition-all rounded-xl group relative",
              activeTab === item.id 
                ? "bg-white/10 text-cyan-300 shadow-[0_0_20px_rgba(129,236,255,0.1)]" 
                : "text-zinc-400 hover:bg-white/5 hover:text-cyan-100"
            )}
          >
            <item.icon className={cn("w-5 h-5 shrink-0", activeTab === item.id && "fill-cyan-300/20")} />
            {isOpen && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="tracking-wide text-sm whitespace-nowrap"
              >
                {item.label}
              </motion.span>
            )}
          </button>
        ))}
      </nav>

      <div className="px-3 mt-auto space-y-4">
        <button className={cn(
          "w-full py-3 px-4 rounded-xl bg-cyan-400/20 text-cyan-300 font-bold text-sm tracking-tight flex items-center justify-center gap-2 border border-cyan-400/30 backdrop-blur-md hover:bg-cyan-400/30 transition-all",
          !isOpen && "px-0"
        )}>
          <Sparkles className="w-4 h-4 shrink-0" />
          {isOpen && <span>Ask Arete</span>}
        </button>

        <div className="pt-6 border-t border-white/5 space-y-1">
          <button className="w-full flex items-center gap-3 text-zinc-500 px-4 py-2 text-xs hover:text-zinc-300 transition-colors group">
            <HelpCircle className="w-4 h-4 shrink-0" />
            {isOpen && <span>Help</span>}
          </button>
          <button className="w-full flex items-center gap-3 text-zinc-500 px-4 py-2 text-xs hover:text-zinc-300 transition-colors group">
            <Fingerprint className="w-4 h-4 shrink-0" />
            {isOpen && <span>Privacy</span>}
          </button>
        </div>
      </div>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-cyan-400 text-black flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-50"
      >
        {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>
    </motion.aside>
  );
};
