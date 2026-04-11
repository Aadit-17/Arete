import React from 'react';
import { cn } from '@/lib/utils';

export const GalaxyBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <img
        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBzfF_sw3sptpSFkEDdIAUxFC5hjyJLkAUdRk3d2u8vDvoXBFmVhOyHNZMv-mx2tLvRgtFDF0-k20F6bnVWY6uKJFQvyWhqVSseU5voE8JHLlUcG-V8ig8cDi1p0cHBjcs-Vo_tfR1nSO5l5EwybyQylgMsNaODjG8nV4MpYHnkRzAZugUUfPyjzSVHNu7aIbvezgbMGofhy5sydIwXovonBEzBT1XwxAZiVhbnh3xlZgXBaLEApvB4YSCa_yDz1u9f1e07xWw_b-o"
        alt="Galaxy Background"
        className="w-full h-full object-cover opacity-60"
        referrerPolicy="no-referrer"
      />
      <div className="absolute inset-0 grain-overlay" />
      <div className="absolute inset-0 nebula-gradient" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] via-transparent to-[#0e0e0e] opacity-80" />
    </div>
  );
};

interface LiquidGlassProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const LiquidGlass: React.FC<LiquidGlassProps> = ({ children, className, ...props }) => {
  return (
    <div
      className={cn(
        "liquid-glass rounded-3xl overflow-hidden relative",
        className
      )}
      {...props}
    >
      {/* Glass Catch Light */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      {children}
    </div>
  );
};
