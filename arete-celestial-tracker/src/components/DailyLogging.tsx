import React, { useState } from 'react';
import { motion } from 'motion/react';
import { LiquidGlass } from './CelestialUI';
import { cn } from '@/lib/utils';
import { 
  Sparkles, 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  Utensils,
  Droplets,
  Dumbbell,
  Moon,
  BookOpen,
  Code2,
  Save
} from 'lucide-react';

export const DailyLogging: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const categories = [
    { id: 'food', label: 'Nourishment', icon: Utensils, color: 'text-orange-400' },
    { id: 'water', label: 'Hydration', icon: Droplets, color: 'text-cyan-400' },
    { id: 'workout', label: 'Physical Output', icon: Dumbbell, color: 'text-emerald-400' },
    { id: 'sleep', label: 'Restoration', icon: Moon, color: 'text-indigo-400' },
    { id: 'reading', label: 'Mental Expansion', icon: BookOpen, color: 'text-purple-400' },
    { id: 'coding', label: 'Creation', icon: Code2, color: 'text-blue-400' },
  ];

  return (
    <div className="flex-1 p-8 space-y-8 overflow-y-auto h-screen custom-scrollbar">
      <header className="flex justify-between items-end mb-12">
        <div>
          <motion.h2 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl font-headline font-bold text-white tracking-tight"
          >
            Daily Transcription
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-zinc-400 text-sm font-label tracking-widest uppercase mt-2 opacity-60"
          >
            Log your celestial progress for today
          </motion.p>
        </div>

        <LiquidGlass className="flex items-center gap-4 p-2 border border-white/5">
          <button className="p-2 hover:bg-white/5 rounded-lg transition-colors text-zinc-400">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 px-4">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-headline font-bold text-white">
              {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
          <button className="p-2 hover:bg-white/5 rounded-lg transition-colors text-zinc-400">
            <ChevronRight className="w-4 h-4" />
          </button>
        </LiquidGlass>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Log Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2"
        >
          <LiquidGlass className="p-8 border border-cyan-400/20 bg-cyan-400/5">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-6 h-6 text-cyan-400 animate-pulse" />
              <h3 className="text-xl font-headline font-bold text-white">Universal Input</h3>
            </div>
            <textarea 
              placeholder="Describe your day in natural language... 'I ran 5km, ate clean, and coded for 4 hours.'"
              className="w-full h-32 bg-transparent border-none focus:ring-0 text-lg font-headline text-white placeholder:text-zinc-600 resize-none custom-scrollbar"
            />
            <div className="flex justify-end mt-4">
              <button className="px-6 py-2 bg-cyan-400 text-black font-bold rounded-xl flex items-center gap-2 hover:scale-105 transition-transform">
                <Save className="w-4 h-4" />
                Process Log
              </button>
            </div>
          </LiquidGlass>
        </motion.div>

        {/* Structured Categories */}
        {categories.map((cat, i) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <LiquidGlass className="p-6 border border-white/5 group hover:border-white/10 transition-all">
              <div className="flex items-center gap-4 mb-6">
                <div className={cn("p-3 rounded-2xl bg-white/5", cat.color)}>
                  <cat.icon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-headline font-bold text-white">{cat.label}</h4>
                  <p className="text-[10px] font-label text-zinc-500 tracking-widest uppercase">Manual Calibration</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder={`Enter ${cat.label.toLowerCase()} details...`}
                    className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm font-headline text-white placeholder:text-zinc-600 focus:border-cyan-400/30 transition-colors outline-none"
                  />
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(v => (
                    <button key={v} className="flex-1 py-2 rounded-lg bg-white/5 text-[10px] font-label text-zinc-500 hover:bg-cyan-400/20 hover:text-cyan-300 transition-all border border-transparent hover:border-cyan-400/30">
                      LVL {v}
                    </button>
                  ))}
                </div>
              </div>
            </LiquidGlass>
          </motion.div>
        ))}
      </div>

      <div className="pb-12 flex justify-center">
        <button className="px-12 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-headline font-bold tracking-widest uppercase hover:bg-white/10 transition-all flex items-center gap-3">
          <Save className="w-5 h-5 text-cyan-400" />
          Finalize Daily Record
        </button>
      </div>
    </div>
  );
};
