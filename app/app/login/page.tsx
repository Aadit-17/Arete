'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { api } from '@/lib/api-client';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Login failed');
            api.setToken(data.accessToken);
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[70vh] px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md relative group"
            >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-aura-accent/10 via-blue-500/10 to-aura-accent/10 rounded-[2rem] blur-xl opacity-50 group-hover:opacity-100 transition duration-1000"></div>

                <div className="relative bg-black/40 backdrop-blur-[60px] border border-white/[0.05] rounded-[2rem] p-10 shadow-2xl">
                    <div className="text-center mb-10">
                        <h1 className="text-4xl font-bold tracking-tight mb-2">Welcome to Arete</h1>
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

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-200 text-[12px] font-bold uppercase tracking-widest py-3 px-4 rounded-xl text-center">
                                {error}
                            </div>
                        )}

                        <button disabled={loading} className="aura-btn-primary w-full mt-4 flex items-center justify-center gap-2">
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                            ) : "Sign In"}
                        </button>
                    </form>

                    <div className="mt-10 text-center">
                        <a href="/register" className="text-xs font-bold text-aura-accent hover:underline uppercase tracking-widest">Create Account</a>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
