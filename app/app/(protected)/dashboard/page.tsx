'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
    TrendingUp,
    Sparkles,
    Zap,
    Loader2,
    Dumbbell,
    Utensils,
    Droplets,
    Smartphone,
    Moon,
    Plus,
    RefreshCw,
    X,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { api } from '@/lib/api-client';
import { useProtectedUser } from '@/contexts/ProtectedUserContext';
import { GlassCard, StatCard, GlassBadge } from '@/components/ui/glass';
import { WorkoutHeatmap } from '@/components/ui/WorkoutHeatmap';
import { AnimatedHero } from '@/components/ui/AnimatedHero';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const COLORS = ['#00f5ff', '#6366f1', '#a855f7', '#ec4899', '#f59e0b', '#10b981'];

const EntryCard = ({ entry, isLatest = false, isToday = false, onClick }: any) => {
    const dateDisplay = isToday ? 'Today' : new Date(entry.dateKey + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
    const didWorkout = entry.structured?.workout?.didSession;
    const workoutSessions = entry.structured?.workout?.sessions?.map((s: any) => s.label).join(', ') || 'Rest';
    const food = entry.structured?.food?.description || 'No food logged';
    const water = entry.structured?.water?.amountMl;
    const screenTime = entry.structured?.screenTimeMinutes;
    const energy = entry.energyEstimate;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
            <GlassCard onClick={onClick} className={`p-5 space-y-4 cursor-pointer hover:bg-white/[0.08] transition-all ${isLatest ? 'border-aura-accent/40 bg-white/[0.06]' : ''}`}>
                <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-zinc-100">
                        {dateDisplay}
                    </span>
                    {energy?.confidence && (
                        <GlassBadge color={
                            energy.confidence === 'high' ? 'success' :
                            energy.confidence === 'medium' ? 'warning' :
                            'error'
                        }>
                            {energy.confidence}
                        </GlassBadge>
                    )}
                </div>

                <div className="space-y-2">
                    {didWorkout && (
                        <div className="flex items-center gap-2">
                            <Dumbbell size={13} className="text-zinc-400 flex-shrink-0" />
                            <span className="text-[12px] font-semibold text-zinc-200 line-clamp-1">
                                {workoutSessions}
                            </span>
                        </div>
                    )}
                    {food && (
                        <div className="flex items-center gap-2">
                            <Utensils size={13} className="text-zinc-400 flex-shrink-0" />
                            <span className="text-[12px] font-semibold text-zinc-200 line-clamp-1">
                                {food}
                            </span>
                        </div>
                    )}
                    {(energy || water) && (
                        <div className="flex gap-2 pt-1">
                            {energy && (
                                <div className="glass-panel-sm px-2 py-1 flex items-center gap-1">
                                    <span className="text-[11px] text-zinc-500 font-bold">⚡</span>
                                    <span className="text-[12px] font-bold text-zinc-100">{energy.caloriesInEstimate || '—'}</span>
                                </div>
                            )}
                            {water && (
                                <div className="glass-panel-sm px-2 py-1 flex items-center gap-1">
                                    <Droplets size={12} className="text-zinc-400" />
                                    <span className="text-[12px] font-bold text-zinc-100">{(water / 1000).toFixed(1)}L</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </GlassCard>
        </motion.div>
    );
};

export default function DashboardPage() {
    const { user } = useProtectedUser();
    const [welcome, setWelcome] = useState<any>(null);
    const [entries, setEntries] = useState<any[]>([]);
    const [goals, setGoals] = useState<{ targets: any; notes?: string } | null>(null);
    const [latestSummary, setLatestSummary] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [summaryStatus, setSummaryStatus] = useState<'idle' | 'generating' | 'success'>('idle');
    const [showGoalsModal, setShowGoalsModal] = useState(false);
    const [editTargets, setEditTargets] = useState<any>({});
    const [savingGoals, setSavingGoals] = useState(false);
    const [expandedSummary, setExpandedSummary] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState<any>(null);
    const [chartOffsets, setChartOffsets] = useState<{ [key: string]: number }>({
        calories: 0,
        workout: 0,
        water: 0,
        screenTime: 0,
        sleep: 0,
        food: 0,
    });

    const fetchData = async () => {
        try {
            const [welcomeRes, entriesRes, goalsRes, summariesRes] = await Promise.all([
                api.fetch('/api/me/welcome'),
                api.fetch('/api/daily-entries'),
                api.fetch('/api/goals'),
                api.fetch('/api/summaries?limit=1'),
            ]);
            if (welcomeRes.ok) setWelcome(await welcomeRes.json());
            if (entriesRes.ok) {
                const data = await entriesRes.json();
                setEntries(data.entries || []);
            }
            if (goalsRes.ok) {
                const data = await goalsRes.json();
                setGoals({ targets: data.targets || {}, notes: data.notes });
                setEditTargets(data.targets || {});
            }
            if (summariesRes.ok) {
                const data = await summariesRes.json();
                setLatestSummary(data.summaries?.[0] || null);
            }
        } catch (err) {
            console.error('Failed to fetch dashboard data:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleRefresh = async (e: React.MouseEvent) => {
        e.preventDefault();
        setRefreshing(true);
        await fetchData();
    };

    const handleGenerateSummary = async () => {
        if (entries.length === 0) return;
        setSummaryStatus('generating');
        try {
            const latestEntry = entries[0];
            const earliestEntry = entries[Math.min(entries.length - 1, 6)];

            const res = await api.fetch('/api/summaries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'weekly',
                    rangeStart: earliestEntry.dateKey,
                    rangeEnd: latestEntry.dateKey
                })
            });

            if (res.ok) {
                setSummaryStatus('success');
                setTimeout(() => setSummaryStatus('idle'), 3000);
                fetchData();
            }
        } catch (e) {
            console.error(e);
            setSummaryStatus('idle');
        }
    };

    const handleSaveGoals = async () => {
        setSavingGoals(true);
        try {
            const res = await api.fetch('/api/goals', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targets: editTargets })
            });

            if (res.ok) {
                setGoals({ targets: editTargets, notes: goals?.notes });
                setShowGoalsModal(false);
            }
        } catch (e) {
            console.error('Failed to save goals:', e);
        } finally {
            setSavingGoals(false);
        }
    };

    const handleChartNav = (chartKey: string, direction: 'prev' | 'next') => {
        const newOffset = direction === 'next'
            ? chartOffsets[chartKey] + 7
            : Math.max(0, chartOffsets[chartKey] - 7);

        // Prevent scrolling too far into future
        const maxOffset = Math.max(0, entries.length - 7);
        setChartOffsets({
            ...chartOffsets,
            [chartKey]: Math.min(newOffset, maxOffset)
        });
    };

    // Chart data generation
    const calorieChartData = useMemo(() => {
        const offset = chartOffsets.calories;
        return entries.slice(offset, offset + 7).reverse().map(e => ({
            date: e.dateKey.split('-').slice(1).join('/'),
            in: e.energyEstimate?.caloriesInEstimate || 0,
            out: e.energyEstimate?.caloriesOutWorkoutEstimate || 0,
        }));
    }, [entries, chartOffsets.calories]);

    const workoutChartData = useMemo(() => {
        const offset = chartOffsets.workout;
        return entries.slice(offset, offset + 7).reverse().map(e => ({
            date: e.dateKey.split('-')[2],
            workouts: e.structured?.workout?.didSession ? 1 : 0,
        }));
    }, [entries, chartOffsets.workout]);

    const waterChartData = useMemo(() => {
        const offset = chartOffsets.water;
        return entries.slice(offset, offset + 7).reverse().map(e => ({
            date: e.dateKey.split('-')[2],
            liters: (e.structured?.water?.amountMl || 0) / 1000,
        }));
    }, [entries, chartOffsets.water]);

    const foodBreakdown = useMemo(() => {
        const offset = chartOffsets.food;
        const foods: { [key: string]: number } = {};
        entries.slice(offset, offset + 7).forEach(e => {
            if (e.structured?.food?.label) {
                foods[e.structured.food.label] = (foods[e.structured.food.label] || 0) + 1;
            }
        });
        return Object.entries(foods).map(([name, value]) => ({ name, value })).slice(0, 5);
    }, [entries, chartOffsets.food]);

    const screenTimeData = useMemo(() => {
        const offset = chartOffsets.screenTime;
        return entries.slice(offset, offset + 7).reverse().map(e => ({
            date: e.dateKey.split('-')[2],
            minutes: e.structured?.screenTimeMinutes || 0,
        }));
    }, [entries, chartOffsets.screenTime]);

    const sleepData = useMemo(() => {
        const offset = chartOffsets.sleep;
        return entries.slice(offset, offset + 7).reverse().map(e => ({
            date: e.dateKey.split('-')[2],
            mainSleep: e.structured?.sleep?.mainSleepHours || 0,
            naps: e.structured?.sleep?.napHours || 0,
        }));
    }, [entries, chartOffsets.sleep]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="space-y-4">
                    <div className="relative w-12 h-12">
                        <div className="absolute inset-0 rounded-full border-2 border-aura-accent/20 border-t-aura-accent animate-spin" />
                    </div>
                    <div className="text-[12px] font-bold uppercase tracking-[0.4em] text-aura-secondary animate-pulse">Loading...</div>
                </div>
            </div>
        );
    }

    if (user?.status === 'pending') {
        return (
            <div className="max-w-4xl mx-auto px-6 py-12 text-center">
                <h1 className="text-7xl md:text-9xl font-bold tracking-tight mb-8">Pending Activation</h1>
                <p className="text-aura-secondary text-lg">Manual verification required to establish link.</p>
            </div>
        );
    }

    const today = new Date().toISOString().split('T')[0];
    const latestEntry = entries[0];
    const isLatestToday = latestEntry?.dateKey === today;

    return (
        <div className="w-full px-6 lg:px-8 max-w-7xl mx-auto">
            <AnimatedHero />

            {/* Top Stats Row */}
            {latestEntry && isLatestToday && (
                <div className="mb-8 grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <StatCard label="Calories In" value={latestEntry.energyEstimate?.caloriesInEstimate ?? '—'} unit="kcal" valueColor="text-zinc-100" />
                    <StatCard label="Burned" value={latestEntry.energyEstimate?.caloriesOutWorkoutEstimate ?? '—'} unit="kcal" valueColor="text-zinc-100" />
                    <StatCard label="Water" value={latestEntry.structured?.water ? (latestEntry.structured.water.amountMl / 1000).toFixed(1) : '—'} unit="L" icon={Droplets} valueColor="text-zinc-100" />
                    <StatCard label="Workout" value={latestEntry.structured?.workout?.didSession ? '✓' : 'Rest'} unit={latestEntry.structured?.workout?.didSession ? 'Done' : 'Day'} icon={Dumbbell} valueColor="text-zinc-100" />
                </div>
            )}

            {/* Summary + Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Summary + Goals (Left) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Weekly Summary */}
                    {latestSummary ? (
                        <GlassCard className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-base font-bold text-zinc-100 uppercase tracking-widest">Weekly Summary</h3>
                                <span className="text-[11px] text-zinc-500">{latestSummary.rangeStart} to {latestSummary.rangeEnd}</span>
                            </div>
                            <motion.div
                                initial={{ maxHeight: '4.5rem', overflow: 'hidden' }}
                                animate={{ maxHeight: expandedSummary ? '4000px' : '4.5rem' }}
                                transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                                className="overflow-hidden"
                            >
                                <div className={`prose prose-invert prose-sm max-w-none text-sm prose-p:m-0 prose-p:leading-relaxed prose-p:text-zinc-300 prose-li:m-0 prose-li:text-zinc-300 prose-headings:text-zinc-100 prose-headings:font-bold prose-headings:font-sans prose-h1:text-3xl md:prose-h1:text-4xl prose-h2:text-2xl md:prose-h2:text-3xl prose-h3:text-xl prose-h4:text-lg prose-strong:text-zinc-100 prose-code:text-aura-accent`}>
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {latestSummary.summaryText}
                                    </ReactMarkdown>
                                </div>
                            </motion.div>
                            <button
                                onClick={() => setExpandedSummary(!expandedSummary)}
                                className="text-[11px] text-zinc-100 hover:underline"
                            >
                                {expandedSummary ? 'Show less ↑' : 'Read full summary →'}
                            </button>
                        </GlassCard>
                    ) : (
                        <GlassCard className="space-y-3 p-6 text-center">
                            <p className="text-sm text-zinc-400">No summary yet</p>
                            <button
                                onClick={handleGenerateSummary}
                                disabled={summaryStatus !== 'idle' || entries.length === 0}
                                className="w-full glass-button py-2 text-[12px] font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                            >
                                {summaryStatus === 'generating' ? (
                                    <Loader2 size={12} className="animate-spin" />
                                ) : (
                                    <Zap size={12} />
                                )}
                                {summaryStatus === 'generating' ? 'Generating...' : 'Generate Summary'}
                            </button>
                        </GlassCard>
                    )}

                    {/* Goals */}
                    <GlassCard className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-zinc-400 uppercase tracking-widest">Goals</h3>
                            <button onClick={() => setShowGoalsModal(true)} className="p-1.5 rounded-lg hover:bg-white/[0.05]">
                                <Plus size={16} className="text-zinc-100" />
                            </button>
                        </div>
                        {goals?.targets && Object.keys(goals.targets).length > 0 ? (
                            <div className="grid grid-cols-2 gap-2">
                                {Object.entries(goals.targets).map(([key, value]: any) => (
                                    <div key={key} className="glass-panel-sm p-2.5">
                                        <div className="text-[11px] text-zinc-500 font-bold capitalize">{key.replace(/([A-Z])/g, ' $1')}</div>
                                        <div className="text-sm font-bold text-zinc-100 mt-1">{value}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-zinc-600 italic">No goals set</p>
                        )}
                    </GlassCard>

                    {/* Calorie Chart */}
                    <GlassCard className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-zinc-400 uppercase tracking-widest">Energy Trends</h3>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => handleChartNav('calories', 'prev')}
                                    disabled={chartOffsets.calories === 0}
                                    className="p-1.5 rounded hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                    title="Previous week"
                                >
                                    <ChevronLeft size={14} />
                                </button>
                                <button
                                    onClick={() => handleChartNav('calories', 'next')}
                                    disabled={chartOffsets.calories >= entries.length - 7}
                                    className="p-1.5 rounded hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                    title="Next week"
                                >
                                    <ChevronRight size={14} />
                                </button>
                            </div>
                        </div>
                        <div className="w-full h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={calorieChartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="date" tick={{ fill: '#a1a1aa', fontSize: 12 }} />
                                    <YAxis tick={{ fill: '#a1a1aa', fontSize: 12 }} />
                                    <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                                    <Legend />
                                    <Line type="monotone" dataKey="in" stroke="#10b981" strokeWidth={2} name="Consumed" />
                                    <Line type="monotone" dataKey="out" stroke="#f59e0b" strokeWidth={2} name="Burned" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </GlassCard>

                    {/* Water Intake + Workout Heatmap Row */}
                    <div className="grid grid-cols-2 gap-6">
                        <GlassCard className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-base font-bold text-zinc-400 uppercase tracking-widest">Water Intake</h3>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => handleChartNav('water', 'prev')}
                                        disabled={chartOffsets.water === 0}
                                        className="p-1.5 rounded hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                        title="Previous week"
                                    >
                                        <ChevronLeft size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleChartNav('water', 'next')}
                                        disabled={chartOffsets.water >= entries.length - 7}
                                        className="p-1.5 rounded hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                        title="Next week"
                                    >
                                        <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>
                            <div className="h-[200px]" style={{ minWidth: 0, minHeight: 0 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={waterChartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="date" tick={{ fill: '#a1a1aa', fontSize: 12 }} />
                                        <YAxis tick={{ fill: '#a1a1aa', fontSize: 12 }} />
                                        <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.1)' }} />
                                        <Bar dataKey="liters" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </GlassCard>

                        <GlassCard className="space-y-3 flex flex-col justify-between">
                            <div className="flex-1 flex flex-col">
                                <WorkoutHeatmap entries={entries} />
                            </div>
                        </GlassCard>
                    </div>

                    {/* Screen Time */}
                    <GlassCard className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-zinc-400 uppercase tracking-widest">Screen Time</h3>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => handleChartNav('screenTime', 'prev')}
                                    disabled={chartOffsets.screenTime === 0}
                                    className="p-1.5 rounded hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                    title="Previous week"
                                >
                                    <ChevronLeft size={14} />
                                </button>
                                <button
                                    onClick={() => handleChartNav('screenTime', 'next')}
                                    disabled={chartOffsets.screenTime >= entries.length - 7}
                                    className="p-1.5 rounded hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                    title="Next week"
                                >
                                    <ChevronRight size={14} />
                                </button>
                            </div>
                        </div>
                        <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={screenTimeData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="date" tick={{ fill: '#a1a1aa', fontSize: 12 }} />
                                    <YAxis tick={{ fill: '#a1a1aa', fontSize: 12 }} />
                                    <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.1)' }} />
                                    <Area type="monotone" dataKey="minutes" fill="#a855f7" stroke="#a855f7" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </GlassCard>

                    {/* Sleep Patterns */}
                    <GlassCard className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-zinc-400 uppercase tracking-widest">Sleep Patterns</h3>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => handleChartNav('sleep', 'prev')}
                                    disabled={chartOffsets.sleep === 0}
                                    className="p-1.5 rounded hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                    title="Previous week"
                                >
                                    <ChevronLeft size={14} />
                                </button>
                                <button
                                    onClick={() => handleChartNav('sleep', 'next')}
                                    disabled={chartOffsets.sleep >= entries.length - 7}
                                    className="p-1.5 rounded hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                    title="Next week"
                                >
                                    <ChevronRight size={14} />
                                </button>
                            </div>
                        </div>
                        <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={sleepData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="date" tick={{ fill: '#a1a1aa', fontSize: 12 }} />
                                    <YAxis tick={{ fill: '#a1a1aa', fontSize: 12 }} />
                                    <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.1)' }} />
                                    <Legend />
                                    <Area type="monotone" dataKey="mainSleep" fill="#06b6d4" stroke="#06b6d4" name="Night Sleep (h)" stackId="1" />
                                    <Area type="monotone" dataKey="naps" fill="#8b5cf6" stroke="#8b5cf6" name="Naps (h)" stackId="1" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </GlassCard>

                    {/* Food Types */}
                    {foodBreakdown.length > 0 && (
                        <GlassCard className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-base font-bold text-zinc-400 uppercase tracking-widest">Food Types</h3>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => handleChartNav('food', 'prev')}
                                        disabled={chartOffsets.food === 0}
                                        className="p-1.5 rounded hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                        title="Previous week"
                                    >
                                        <ChevronLeft size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleChartNav('food', 'next')}
                                        disabled={chartOffsets.food >= entries.length - 7}
                                        className="p-1.5 rounded hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                        title="Next week"
                                    >
                                        <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>
                            <div className="h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={foodBreakdown} cx="50%" cy="50%" outerRadius={80} paddingAngle={2} dataKey="value">
                                            {foodBreakdown.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.1)' }} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </GlassCard>
                    )}
                </div>

                {/* Right Sidebar: Recent Logs + Actions */}
                <div className="space-y-6">
                    {/* Action Buttons */}
                    <div className="space-y-2">
                        <button
                            onClick={handleGenerateSummary}
                            disabled={summaryStatus !== 'idle' || entries.length === 0}
                            className="w-full glass-button py-2.5 text-[12px] font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                        >
                            {summaryStatus === 'generating' ? (
                                <Loader2 size={12} className="animate-spin" />
                            ) : summaryStatus === 'success' ? (
                                <Sparkles size={12} />
                            ) : (
                                <Zap size={12} />
                            )}
                            {summaryStatus === 'generating' ? 'Compiling' : 'Summary'}
                        </button>
                        <Link href="/log">
                            <button className="w-full aura-btn-primary py-2.5 text-[12px] font-bold">
                                Log Today
                            </button>
                        </Link>
                    </div>

                    {/* Recent Entries */}
                    <GlassCard className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-zinc-400 uppercase tracking-widest">Recent Logs</h3>
                            <button onClick={handleRefresh} disabled={refreshing} className="p-1 rounded hover:bg-white/[0.03]">
                                <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
                            </button>
                        </div>
                        <div className="space-y-2">
                            {entries.length > 0 ? (
                                entries.slice(0, 5).map((entry, idx) => (
                                    <motion.div
                                        key={entry._id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{
                                            delay: idx * 0.045,
                                            duration: 0.38,
                                            ease: [0.22, 1, 0.36, 1],
                                        }}
                                    >
                                        <div onClick={() => setSelectedEntry(entry)}>
                                            <EntryCard entry={entry} isLatest={idx === 0} isToday={entry.dateKey === today} onClick={() => setSelectedEntry(entry)} />
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <p className="text-[12px] text-zinc-500 text-center py-4">No entries yet</p>
                            )}
                        </div>
                    </GlassCard>

                    {/* Stats Summary */}
                    <GlassCard className="space-y-3 p-4">
                        <div className="space-y-2">
                            {welcome?.streak !== undefined && (
                                <div className="flex items-center justify-between">
                                    <span className="text-[12px] text-zinc-500">Streak</span>
                                    <span className="text-sm font-bold text-zinc-100">{welcome.streak} days</span>
                                </div>
                            )}
                            <div className="flex items-center justify-between">
                                <span className="text-[12px] text-zinc-500">Total Logs</span>
                                <span className="text-sm font-bold text-zinc-100">{entries.length}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[12px] text-zinc-500">Avg Energy</span>
                                <span className="text-sm font-bold text-zinc-100">
                                    {entries.length > 0
                                        ? Math.round(
                                            entries.reduce((sum, e) => sum + (e.energyEstimate?.caloriesInEstimate || 0), 0) /
                                            entries.length
                                        )
                                        : '—'}
                                </span>
                            </div>
                        </div>
                    </GlassCard>

                    {/* Talk to Arete CTA */}
                    <Link href="/coach">
                        <GlassCard className="p-3 flex items-center justify-between group hover:bg-white/[0.08] cursor-pointer">
                            <div>
                                <h4 className="text-base font-bold text-white">Talk to Arete</h4>
                                <p className="text-[11px] text-zinc-500">Get guidance & insights</p>
                            </div>
                            <Sparkles size={16} className="text-zinc-100" />
                        </GlassCard>
                    </Link>
                </div>
            </div>

            {/* Goals Modal */}
            <AnimatePresence>
                {showGoalsModal && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                            onClick={() => setShowGoalsModal(false)}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.97, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.97, y: 12 }}
                            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50"
                        >
                            <div className="glass-panel-elevated p-8 space-y-6">
                                <h2 className="text-3xl md:text-4xl font-bold">Set Goals</h2>
                                <div className="space-y-4">
                                    {['workoutsPerWeek', 'readingPagesPerWeek', 'targetWaterMlPerDay', 'codingHoursPerWeek'].map(key => (
                                        <div key={key}>
                                            <label className="text-[12px] font-bold text-aura-secondary uppercase block mb-2">{key.replace(/([A-Z])/g, ' $1')}</label>
                                            <input
                                                type="number"
                                                value={editTargets[key] || ''}
                                                onChange={(e) => setEditTargets({ ...editTargets, [key]: e.target.value ? parseFloat(e.target.value) : undefined })}
                                                className="w-full input-aura text-sm"
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => setShowGoalsModal(false)} className="flex-1 glass-button py-2 text-[12px] font-bold">Cancel</button>
                                    <button onClick={handleSaveGoals} disabled={savingGoals} className="flex-1 aura-btn-primary py-2 text-[12px] font-bold">
                                        {savingGoals ? 'Saving...' : 'Save'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Entry Detail Modal */}
            <AnimatePresence>
                {selectedEntry && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                            onClick={() => setSelectedEntry(null)}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                        />
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                            onClick={(e) => e.currentTarget === e.target && setSelectedEntry(null)}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        >
                            <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 8 }}
                            transition={{ type: 'spring', damping: 24, stiffness: 340 }}
                            className="glass-scrollbar w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-6 p-8 bg-black/70 backdrop-blur-xl rounded-2xl border border-white/[0.1]">
                                {/* Header */}
                                <div className="flex items-center justify-between border-b border-white/[0.05] pb-4">
                                    <div>
                                        <h2 className="text-3xl md:text-4xl font-bold text-zinc-100">
                                            {selectedEntry.dateKey === today ? 'Today' : new Date(selectedEntry.dateKey + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                        </h2>
                                        <p className="text-[12px] text-zinc-500 mt-1">{selectedEntry.dateKey}</p>
                                    </div>
                                    <button onClick={() => setSelectedEntry(null)} className="p-2 rounded-lg hover:bg-white/[0.05]">
                                        <X size={20} className="text-zinc-400" />
                                    </button>
                                </div>

                                {/* Daily Summary */}
                                {selectedEntry.dailySummary && (
                                    <div className="space-y-2">
                                        <h3 className="text-base font-bold text-zinc-400 uppercase tracking-widest">Summary</h3>
                                        <p className="text-sm text-zinc-200 leading-relaxed italic">"{selectedEntry.dailySummary}"</p>
                                    </div>
                                )}

                                {/* Food & Macros */}
                                {selectedEntry.structured?.food && (
                                    <div className="space-y-3 p-4 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                                        <div className="flex items-center gap-2">
                                            <Utensils size={16} className="text-zinc-400" />
                                            <h3 className="text-base font-bold text-zinc-100">Food</h3>
                                        </div>
                                        <p className="text-sm text-zinc-200">{selectedEntry.structured.food.description}</p>

                                        {selectedEntry.structured.food.macros && (
                                            <div className="space-y-2 pt-2 border-t border-white/[0.05]">
                                                <h4 className="text-base font-bold text-zinc-400 uppercase tracking-widest">Macros</h4>
                                                <div className="grid grid-cols-2 gap-2 text-[12px]">
                                                    {selectedEntry.structured.food.macros.proteinG && <div className="glass-panel-sm p-2"><span className="text-zinc-500">Protein</span><div className="text-zinc-100 font-bold">{selectedEntry.structured.food.macros.proteinG}g</div></div>}
                                                    {selectedEntry.structured.food.macros.carbsG && <div className="glass-panel-sm p-2"><span className="text-zinc-500">Carbs</span><div className="text-zinc-100 font-bold">{selectedEntry.structured.food.macros.carbsG}g</div></div>}
                                                    {selectedEntry.structured.food.macros.fatsG && <div className="glass-panel-sm p-2"><span className="text-zinc-500">Fats</span><div className="text-zinc-100 font-bold">{selectedEntry.structured.food.macros.fatsG}g</div></div>}
                                                    {selectedEntry.structured.food.macros.fiberG && <div className="glass-panel-sm p-2"><span className="text-zinc-500">Fiber</span><div className="text-zinc-100 font-bold">{selectedEntry.structured.food.macros.fiberG}g</div></div>}
                                                </div>

                                                {/* Micronutrients */}
                                                <div className="space-y-1 pt-2">
                                                    <h5 className="text-sm font-bold text-zinc-500 uppercase">Key Micronutrients</h5>
                                                    <div className="flex flex-wrap gap-1">
                                                        {['vitaminC', 'vitaminD', 'iron', 'calcium', 'potassium', 'magnesium'].map((micro) => selectedEntry.structured.food.macros[micro as any] && (
                                                            <GlassBadge key={micro} color="info" className="text-[11px]">
                                                                {micro.replace(/([A-Z])/g, ' $1').trim()}: {selectedEntry.structured.food.macros[micro as any]}
                                                            </GlassBadge>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {selectedEntry.structured.food.macroSummary && (
                                            <p className="text-[12px] text-zinc-400 italic pt-2 border-t border-white/[0.05]">
                                                {selectedEntry.structured.food.macroSummary}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Energy Estimate */}
                                {selectedEntry.energyEstimate && (
                                    <div className="space-y-3 p-4 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                                        <div className="flex items-center gap-2">
                                            <Zap size={16} className="text-aura-accent" />
                                            <h3 className="text-base font-bold text-zinc-100">Energy Balance</h3>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            {selectedEntry.energyEstimate.caloriesInEstimate && (
                                                <div className="glass-panel-sm p-3">
                                                    <div className="text-[11px] text-zinc-500 mb-1">Consumed</div>
                                                    <div className="text-base font-bold text-zinc-100">~{selectedEntry.energyEstimate.caloriesInEstimate} kcal</div>
                                                </div>
                                            )}
                                            {selectedEntry.energyEstimate.caloriesOutWorkoutEstimate && (
                                                <div className="glass-panel-sm p-3">
                                                    <div className="text-[11px] text-zinc-500 mb-1">Burned</div>
                                                    <div className="text-base font-bold text-zinc-100">~{selectedEntry.energyEstimate.caloriesOutWorkoutEstimate} kcal</div>
                                                </div>
                                            )}
                                        </div>
                                        {selectedEntry.energyEstimate.confidence && (
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[11px] text-zinc-500">Estimation Quality:</span>
                                                    <GlassBadge color={selectedEntry.energyEstimate.confidence === 'high' ? 'success' : selectedEntry.energyEstimate.confidence === 'medium' ? 'warning' : 'error'} className="text-[11px]">
                                                        {selectedEntry.energyEstimate.confidence}
                                                    </GlassBadge>
                                                </div>
                                                <p className="text-[11px] text-zinc-600 italic">
                                                    {selectedEntry.energyEstimate.confidence === 'high' && "High: Specific food portions and workout details provided."}
                                                    {selectedEntry.energyEstimate.confidence === 'medium' && "Medium: Some portion/detail estimates needed."}
                                                    {selectedEntry.energyEstimate.confidence === 'low' && "Low: Vague descriptions—estimates based on assumptions."}
                                                </p>
                                            </div>
                                        )}
                                        {selectedEntry.energyEstimate.rationale && (
                                            <p className="text-[12px] text-zinc-400 italic border-t border-white/[0.05] pt-2">
                                                {selectedEntry.energyEstimate.rationale}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Workout */}
                                {selectedEntry.structured?.workout?.didSession && (
                                    <div className="space-y-3 p-4 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                                        <div className="flex items-center gap-2">
                                            <Dumbbell size={16} className="text-zinc-400" />
                                            <h3 className="text-base font-bold text-zinc-100">Workout</h3>
                                        </div>
                                        {selectedEntry.structured.workout.sessions?.map((session: any, idx: number) => (
                                            <div key={idx} className="flex items-center justify-between text-sm">
                                                <span className="text-zinc-200">{session.label}</span>
                                                {session.durationMin && <span className="text-[12px] text-zinc-500">{session.durationMin} min</span>}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Sleep */}
                                {selectedEntry.structured?.sleep && (selectedEntry.structured.sleep.mainSleepHours || selectedEntry.structured.sleep.napHours) && (
                                    <div className="space-y-3 p-4 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                                        <div className="flex items-center gap-2">
                                            <Moon size={16} className="text-zinc-400" />
                                            <h3 className="text-base font-bold text-zinc-100">Sleep</h3>
                                        </div>
                                        <div className="space-y-2 text-sm">
                                            {selectedEntry.structured.sleep.mainSleepHours && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-zinc-400">Night Sleep</span>
                                                    <span className="text-zinc-200 font-bold">{selectedEntry.structured.sleep.mainSleepHours}h</span>
                                                </div>
                                            )}
                                            {selectedEntry.structured.sleep.napHours > 0 && (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-zinc-400">Naps</span>
                                                    <span className="text-zinc-200 font-bold">{selectedEntry.structured.sleep.napHours}h</span>
                                                </div>
                                            )}
                                            {selectedEntry.structured.sleep.sleepQuality && (
                                                <div className="flex items-center justify-between pt-2 border-t border-white/[0.05]">
                                                    <span className="text-zinc-400">Quality</span>
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 h-1.5 bg-white/[0.1] rounded-full overflow-hidden w-16">
                                                            <div className="h-full bg-cyan-400" style={{ width: `${(selectedEntry.structured.sleep.sleepQuality / 10) * 100}%` }} />
                                                        </div>
                                                        <span className="text-[11px] text-zinc-300 font-bold">{selectedEntry.structured.sleep.sleepQuality}/10</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Water & Screen Time */}
                                <div className="grid grid-cols-2 gap-4">
                                    {selectedEntry.structured?.water?.amountMl && (
                                        <div className="space-y-2 p-4 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                                            <div className="flex items-center gap-2">
                                                <Droplets size={14} className="text-zinc-400" />
                                                <h4 className="text-base font-bold text-zinc-100">Water</h4>
                                            </div>
                                            <p className="text-sm font-bold text-zinc-200">{selectedEntry.structured.water.amountMl}ml</p>
                                        </div>
                                    )}
                                    {selectedEntry.structured?.screenTimeMinutes && (
                                        <div className="space-y-2 p-4 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                                            <div className="flex items-center gap-2">
                                                <Smartphone size={14} className="text-zinc-400" />
                                                <h4 className="text-base font-bold text-zinc-100">Screen Time</h4>
                                            </div>
                                            <p className="text-sm font-bold text-zinc-200">{selectedEntry.structured.screenTimeMinutes} min</p>
                                        </div>
                                    )}
                                </div>

                                {/* Productivity & Habits Scores */}
                                <div className="grid grid-cols-2 gap-4">
                                    {selectedEntry.structured?.productivityScore !== undefined && (
                                        <div className="space-y-2 p-4 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                                            <h4 className="text-base font-bold text-zinc-100">Productivity</h4>
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-2 bg-white/[0.1] rounded-full overflow-hidden">
                                                    <div className="h-full bg-aura-accent" style={{ width: `${(selectedEntry.structured.productivityScore / 10) * 100}%` }} />
                                                </div>
                                                <span className="text-sm font-bold text-zinc-100">{selectedEntry.structured.productivityScore}/10</span>
                                            </div>
                                        </div>
                                    )}
                                    {selectedEntry.structured?.habitsScore !== undefined && (
                                        <div className="space-y-2 p-4 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                                            <h4 className="text-base font-bold text-zinc-100">Habits</h4>
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-2 bg-white/[0.1] rounded-full overflow-hidden">
                                                    <div className="h-full bg-aura-accent" style={{ width: `${(selectedEntry.structured.habitsScore / 10) * 100}%` }} />
                                                </div>
                                                <span className="text-sm font-bold text-zinc-100">{selectedEntry.structured.habitsScore}/10</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Reading */}
                                {selectedEntry.structured?.reading?.didRead && (
                                    <div className="space-y-2 p-4 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                                        <h4 className="text-base font-bold text-zinc-100">Reading</h4>
                                        <p className="text-sm text-zinc-200">
                                            {selectedEntry.structured.reading.pages && `${selectedEntry.structured.reading.pages} pages`}
                                            {selectedEntry.structured.reading.title && ` of ${selectedEntry.structured.reading.title}`}
                                        </p>
                                    </div>
                                )}
                            </motion.div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
