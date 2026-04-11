import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LiquidGlass } from './CelestialUI';
import { cn } from '@/lib/utils';
import { X, Calendar, Zap, Droplets, Moon, BookOpen, Code2, TrendingUp } from 'lucide-react';

interface LogPopupProps {
  isOpen: boolean;
  onClose: () => void;
  log: {
    date: string;
    title: string;
    type: string;
    score: number;
    details: string;
  } | null;
}

export const RecentLogsPopup: React.FC<LogPopupProps> = ({ isOpen, onClose, log }) => {
  if (!log) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl"
          >
            <LiquidGlass className="p-8 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 p-2 rounded-full bg-white/5 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-cyan-400/10 flex items-center justify-center text-cyan-400 border border-cyan-400/20">
                  <Calendar className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-headline font-bold text-white">{log.title}</h3>
                  <p className="text-xs font-label text-cyan-400 tracking-[0.2em] uppercase mt-1">{log.date} • {log.type}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                  <p className="text-2xl font-headline font-bold text-white">{log.score}</p>
                  <p className="text-[10px] font-label text-zinc-500 tracking-widest uppercase">Daily Score</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                  <p className="text-2xl font-headline font-bold text-cyan-400">High</p>
                  <p className="text-[10px] font-label text-zinc-500 tracking-widest uppercase">Energy</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                  <p className="text-2xl font-headline font-bold text-indigo-400">8.2h</p>
                  <p className="text-[10px] font-label text-zinc-500 tracking-widest uppercase">Sleep</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-label text-zinc-400 tracking-widest uppercase mb-3">Transcription Summary</h4>
                  <p className="text-lg font-headline text-white/90 leading-relaxed italic">
                    "{log.details}"
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-label text-zinc-500 tracking-widest uppercase">Metrics</h4>
                    <div className="space-y-2">
                      {[
                        { icon: Droplets, label: 'Hydration', value: '2.8L', color: 'text-cyan-400' },
                        { icon: Zap, label: 'Workout', value: '45min', color: 'text-yellow-400' },
                      ].map((m, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                          <div className="flex items-center gap-2">
                            <m.icon className={cn("w-4 h-4", m.color)} />
                            <span className="text-xs font-headline text-white/70">{m.label}</span>
                          </div>
                          <span className="text-xs font-headline font-bold text-white">{m.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-label text-zinc-500 tracking-widest uppercase">Focus</h4>
                    <div className="space-y-2">
                      {[
                        { icon: Code2, label: 'Coding', value: '3.5h', color: 'text-indigo-400' },
                        { icon: BookOpen, label: 'Reading', value: '12pg', color: 'text-emerald-400' },
                      ].map((m, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                          <div className="flex items-center gap-2">
                            <m.icon className={cn("w-4 h-4", m.color)} />
                            <span className="text-xs font-headline text-white/70">{m.label}</span>
                          </div>
                          <span className="text-xs font-headline font-bold text-white">{m.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-10 pt-8 border-t border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-label text-zinc-400">Trajectory: Ascending</span>
                </div>
                <button className="text-xs font-label text-cyan-400 tracking-widest uppercase hover:text-cyan-300 transition-colors">
                  Edit Transcription
                </button>
              </div>
            </LiquidGlass>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
