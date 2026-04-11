import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { LiquidGlass } from './CelestialUI';
import { Rocket, Globe } from 'lucide-react';

interface InitializingUniverseProps {
  onComplete: () => void;
}

export const InitializingUniverse: React.FC<InitializingUniverseProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 500);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 400);
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="relative z-10 w-full max-w-2xl px-6 flex flex-col items-center justify-center min-h-screen mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 text-center"
      >
        <span className="text-xs font-label tracking-[0.4em] text-cyan-300/60 uppercase mb-4 block">
          System Status: Calibration
        </span>
        <h1 className="text-5xl md:text-7xl font-headline font-extrabold tracking-tighter text-white drop-shadow-2xl">
          ARETE
        </h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="w-full relative"
      >
        <div className="absolute inset-0 bg-cyan-400/5 blur-3xl rounded-full opacity-30 -z-10 animate-pulse" />
        <LiquidGlass className="p-12 md:p-16 flex flex-col items-center">
          <div className="space-y-6 text-center mb-10">
            <p className="text-2xl md:text-3xl font-headline font-light tracking-tight text-white/90">
              Initializing Universe<span className="text-cyan-300 animate-pulse">...</span>
            </p>
            <p className="text-sm font-label text-zinc-400 max-w-xs mx-auto leading-relaxed tracking-wide opacity-80">
              Mapping neural pathways and celestial coordinates for your personal growth trajectory.
            </p>
          </div>

          <div className="w-full max-w-xs space-y-4">
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden relative border border-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-400/40 via-cyan-400 to-cyan-200 rounded-full shadow-[0_0_20px_rgba(129,236,255,0.3)]"
              />
            </div>
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] font-label text-cyan-300 tracking-widest uppercase">Syncing Core</span>
              <span className="text-[10px] font-label text-zinc-400 tracking-widest">{Math.round(progress)}%</span>
            </div>
          </div>
        </LiquidGlass>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-16 flex items-center gap-8 text-[10px] font-label tracking-[0.2em] text-zinc-500 uppercase"
      >
        <div className="flex items-center gap-2">
          <Rocket className="w-3 h-3" />
          <span>v4.0.2-Stable</span>
        </div>
        <div className="flex items-center gap-2">
          <Globe className="w-3 h-3" />
          <span>Galactic Node 01</span>
        </div>
      </motion.div>
    </div>
  );
};
