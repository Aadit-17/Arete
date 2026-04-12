'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Info } from 'lucide-react';
import { api } from '@/lib/api-client';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [demoLoading, setDemoLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showDemoTooltip, setShowDemoTooltip] = useState(false);
    const router = useRouter();

    const doLogin = async (loginEmail: string, loginPassword: string) => {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: loginEmail, password: loginPassword }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login failed');
        api.setToken(data.accessToken);
        router.push('/dashboard');
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await doLogin(email, password);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDemo = async () => {
        setDemoLoading(true);
        setError(null);
        try {
            const demoEmail = process.env.NEXT_PUBLIC_DEMO_ACCOUNT_EMAIL || 'demo@example.com';
            const demoPassword = process.env.NEXT_PUBLIC_DEMO_ACCOUNT_PASSWORD || 'demo123456';
            await doLogin(demoEmail, demoPassword);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setDemoLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[70vh] px-4">
            <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-md relative group"
            >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-aura-accent/10 via-blue-500/10 to-aura-accent/10 rounded-[2rem] blur-xl opacity-50 group-hover:opacity-100 transition duration-1000"></div>

                <div className="relative bg-black/40 backdrop-blur-[60px] border border-white/[0.05] rounded-[2rem] p-10 shadow-2xl">
                    <div className="text-center mb-10">
                        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-2">Welcome to Arete</h1>
                        <p className="text-aura-secondary text-sm font-light uppercase tracking-widest">Your Personal Agent for Excellence</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[12px] font-bold text-aura-secondary uppercase tracking-[0.2em] pl-1">Email</label>
                            <input
                                type="email"
                                required
                                className="input-aura"
                                placeholder="your@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[12px] font-bold text-aura-secondary uppercase tracking-[0.2em] pl-1">Password</label>
                            <input
                                type="password"
                                required
                                className="input-aura"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -4 }}
                                    className="bg-red-500/10 border border-red-500/20 text-red-200 text-[12px] font-bold uppercase tracking-widest py-3 px-4 rounded-xl text-center"
                                >
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button disabled={loading || demoLoading} className="aura-btn-primary w-full mt-4 flex items-center justify-center gap-2">
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                            ) : "Sign In"}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-4 my-6">
                        <div className="flex-1 h-px bg-white/[0.06]" />
                        <span className="text-[11px] font-bold text-zinc-600 uppercase tracking-widest">or</span>
                        <div className="flex-1 h-px bg-white/[0.06]" />
                    </div>

                    {/* Demo button */}
                    <div className="relative">
                        <button
                            onClick={handleDemo}
                            disabled={loading || demoLoading}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-aura-accent/[0.08] border border-aura-accent/20 text-aura-accent text-[12px] font-bold uppercase tracking-[0.2em] hover:bg-aura-accent/[0.14] hover:border-aura-accent/35 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {demoLoading ? (
                                <div className="w-4 h-4 border-2 border-aura-accent/30 border-t-aura-accent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Sparkles size={13} />
                                    Try Demo
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => setShowDemoTooltip(v => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
                            aria-label="Demo info"
                        >
                            <Info size={14} />
                        </button>
                    </div>

                    <AnimatePresence>
                        {showDemoTooltip && (
                            <motion.div
                                initial={{ opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                transition={{ duration: 0.22 }}
                                className="mt-3 bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4 text-[12px] text-zinc-400 leading-relaxed space-y-1"
                            >
                                <p className="text-zinc-200 font-bold">This is a shared demo account.</p>
                                <p>It comes pre-loaded with 10 days of sample data so you can explore the dashboard, coach, and log features without signing up.</p>
                                <p className="text-zinc-500">AI features use a limited demo key — you may hit rate limits if the demo is busy. Create your own account for unrestricted access.</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="mt-8 text-center">
                        <a href="/register" className="text-xs font-bold text-aura-accent hover:underline uppercase tracking-widest">Create Account</a>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
