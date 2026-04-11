'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Calendar, Clock, PenTool, ChevronDown } from 'lucide-react';
import { api } from '@/lib/api-client';
import { GlassCard, GlassInput, GlassBadge } from '@/components/ui/glass';

export default function LogPage() {
    const [dateKey, setDateKey] = useState(new Date().toISOString().split('T')[0]);
    const [rawMessage, setRawMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [structured, setStructured] = useState<any>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [hasExisting, setHasExisting] = useState(false);
    const [showEnergyRationale, setShowEnergyRationale] = useState(false);
    const router = useRouter();

    const fetchExisting = useCallback(async (date: string) => {
        try {
            const res = await api.fetch(`/api/daily-entries?dateKey=${date}`);
            const data = await res.json();
            if (data.entry) {
                setHasExisting(true);
                if (isEditMode) {
                    setRawMessage(data.entry.rawMessage || '');
                }
            } else {
                setHasExisting(false);
                if (isEditMode) setRawMessage('');
            }
        } catch (e) {
            console.error('Failed to fetch existing entry', e);
        }
    }, [isEditMode]);

    useEffect(() => {
        fetchExisting(dateKey);
    }, [dateKey, isEditMode, fetchExisting]);

    const handleLog = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const timezoneAtEntry = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const res = await api.fetch('/api/ingest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dateKey, rawMessage, timezoneAtEntry }),
            });

            const data = await res.json();
            if (!res.ok) {
                const errorMsg = data.error || 'Ingestion failed. Please try again.';
                throw new Error(errorMsg);
            }

            setSuccess(true);
            setStructured(data.entry);
            setRawMessage('');
            setTimeout(() => router.push('/dashboard'), 5000);
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    const timezone = typeof window !== 'undefined' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC';

    return (
        <div className="max-w-4xl mx-auto px-6 py-8 animate-fade-in relative z-10">

            <header className="mb-8 text-center space-y-3">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="inline-flex items-center gap-2"
                >
                    <GlassBadge>Daily Log</GlassBadge>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        delay: 0.08,
                        duration: 0.55,
                        ease: [0.22, 1, 0.36, 1],
                    }}
                    className="text-4xl font-bold tracking-tight"
                >
                    Log <span className="text-zinc-500 font-mono tracking-tighter">{dateKey}</span>
                </motion.h1>
            </header>

            <AnimatePresence mode="wait">
                {!success ? (
                    <motion.div
                        key="form"
                        initial={{ opacity: 0, scale: 0.985 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.975 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <form onSubmit={handleLog}>
                            <GlassCard className="p-12 space-y-6">

                                <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-6 border-b border-white/[0.05]">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2 glass-panel-sm px-4 py-2">
                                            <Calendar size={14} className="text-aura-secondary" />
                                            <input
                                                type="date"
                                                value={dateKey}
                                                onChange={(e) => setDateKey(e.target.value)}
                                                className="bg-transparent text-xs font-bold text-zinc-300 outline-none cursor-pointer uppercase tracking-widest"
                                            />
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => setIsEditMode(!isEditMode)}
                                            className={`p-1.5 rounded-lg border transition-all ${isEditMode
                                                ? 'bg-aura-accent/20 border-aura-accent/40 text-aura-accent'
                                                : 'bg-white/[0.03] border-white/[0.08] text-zinc-600'
                                                }`}
                                        >
                                            <PenTool size={13} />
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-2 text-zinc-600 text-[12px] font-bold uppercase tracking-widest">
                                        <Clock size={13} />
                                        <span>{timezone}</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[12px] font-bold text-aura-secondary uppercase tracking-[0.2em] block mb-3">Describe your day</label>
                                    <textarea
                                        required
                                        rows={6}
                                        placeholder={isEditMode ? (hasExisting ? "Loading existing data..." : "No existing entry — write a fresh log") : "Meals, water, workouts, or highlights..."}
                                        className="input-aura text-lg font-light resize-none"
                                        value={rawMessage}
                                        onChange={(e) => setRawMessage(e.target.value)}
                                    />
                                </div>

                                <AnimatePresence>
                                    {hasExisting && !isEditMode && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -4 }}
                                            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                                            className="glass-panel-sm bg-orange-500/10 border-orange-500/20 text-orange-200 text-[12px] font-bold uppercase tracking-[0.2em] p-4 flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                                                <span>Entry exists for this date. Update will overwrite.</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setIsEditMode(true)}
                                                className="text-aura-accent hover:underline text-[11px]"
                                            >
                                                Load
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <AnimatePresence>
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -4 }}
                                            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                                            className="glass-panel-sm bg-red-500/10 border-red-500/20 text-red-200 text-[12px] font-bold uppercase tracking-[0.2em] p-4 text-center"
                                        >
                                            Error: {error}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="flex items-center justify-between border-t border-white/[0.05] pt-6">
                                    <div className="text-[11px] text-zinc-600 uppercase tracking-widest">Processing</div>
                                    <button disabled={loading} className="aura-btn-primary flex items-center gap-2 px-8 text-xs">
                                        {loading ? (
                                            <div className="w-3 h-3 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <span>{isEditMode ? 'Update' : 'Commit'}</span>
                                                <Send size={12} className="group-hover:translate-x-0.5 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </GlassCard>
                        </form>
                    </motion.div>
                ) : (
                    <motion.div
                        key="success"
                        initial={{ opacity: 0, y: 28 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                        className="text-center space-y-10 py-12"
                    >
                        <div className="relative inline-flex items-center justify-center w-32 h-32 rounded-full border border-aura-accent/20 bg-aura-accent/5 backdrop-blur-3xl mb-4 group">
                            <div className="absolute inset-0 bg-aura-accent/10 blur-2xl rounded-full scale-125 animate-pulse" />
                            <Sparkles className="h-12 w-12 text-aura-accent relative z-10" />
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-5xl font-bold tracking-tight">Captured</h2>
                            <p className="text-aura-secondary text-lg font-light leading-relaxed max-w-sm mx-auto">
                                Your day has been processed. Arete is ready to reflect with you.
                            </p>
                        </div>

                        {structured && (
                            <div className="max-w-md mx-auto space-y-3">
                                <GlassCard accent="cyan" className="text-left">
                                    <span className="text-[12px] font-bold text-aura-accent uppercase tracking-widest block mb-2">Daily Summary</span>
                                    <p className="text-sm font-light text-zinc-300 leading-relaxed italic">
                                        &quot;{structured.dailySummary}&quot;
                                    </p>
                                </GlassCard>

                                {structured.energyEstimate && (
                                    <GlassCard accent="cyan" className="text-left space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[12px] font-bold text-green-300 uppercase tracking-widest">Energy Estimate</span>
                                            <GlassBadge color={
                                                structured.energyEstimate.confidence === 'high' ? 'success' :
                                                structured.energyEstimate.confidence === 'medium' ? 'warning' :
                                                'error'
                                            }>
                                                {structured.energyEstimate.confidence}
                                            </GlassBadge>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div className="glass-panel-sm p-3">
                                                <span className="text-[11px] text-zinc-500 block">Consumed</span>
                                                <span className="text-base font-bold text-green-300">
                                                    {structured.energyEstimate.caloriesInEstimate ? `~${structured.energyEstimate.caloriesInEstimate}` : '—'}
                                                </span>
                                                <span className="text-[11px] text-zinc-600">kcal</span>
                                            </div>
                                            <div className="glass-panel-sm p-3">
                                                <span className="text-[11px] text-zinc-500 block">Burned</span>
                                                <span className="text-base font-bold text-orange-300">
                                                    {structured.energyEstimate.caloriesOutWorkoutEstimate ? `~${structured.energyEstimate.caloriesOutWorkoutEstimate}` : '—'}
                                                </span>
                                                <span className="text-[11px] text-zinc-600">kcal</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setShowEnergyRationale(!showEnergyRationale)}
                                            className="w-full text-left text-[11px] font-bold text-zinc-500 hover:text-aura-accent transition-colors flex items-center justify-between pt-2 border-t border-white/[0.05]"
                                        >
                                            <span>Rationale</span>
                                            <ChevronDown size={12} className={`transition-transform ${showEnergyRationale ? 'rotate-180' : ''}`} />
                                        </button>

                                        <AnimatePresence>
                                            {showEnergyRationale && (
                                                <motion.p
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="text-[11px] text-zinc-400 leading-relaxed italic overflow-hidden"
                                                >
                                                    {structured.energyEstimate.rationale}
                                                </motion.p>
                                            )}
                                        </AnimatePresence>

                                        <p className="text-[11px] text-zinc-600 italic pt-2 border-t border-white/[0.05]">
                                            Estimates only — not medical advice.
                                        </p>
                                    </GlassCard>
                                )}
                            </div>
                        )}

                        <div className="flex items-center justify-center gap-3 text-[12px] font-bold text-zinc-600 uppercase tracking-[0.4em] pt-10">
                            <div className="w-1 h-1 rounded-full bg-aura-accent/40 animate-pulse" />
                            Syncing Dashboard...
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
