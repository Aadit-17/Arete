'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, username, password, timezone }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Registration failed');

            setSuccess(true);
            setTimeout(() => router.push('/login'), 2500);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[70vh] px-4 animate-fade-in">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md relative group"
            >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-aura-accent/10 via-blue-500/10 to-aura-accent/10 rounded-[2rem] blur-xl opacity-50 group-hover:opacity-100 transition duration-1000"></div>

                <div className="relative bg-black/40 backdrop-blur-[60px] border border-white/[0.05] rounded-[2rem] p-10 shadow-2xl">
                    {success ? (
                        <div className="text-center py-12">
                            <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-aura-accent/20 text-aura-accent animate-pulse shadow-[0_0_15px_var(--color-aura-accent)]">
                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 className="text-3xl font-bold tracking-tight mb-2">Welcome to Arete</h2>
                            <p className="text-aura-secondary text-sm font-light leading-relaxed">Your account is ready. Signing you in...</p>
                        </div>
                    ) : (
                        <>
                            <div className="text-center mb-10">
                                <h1 className="text-4xl font-bold tracking-tight mb-2">Join Arete</h1>
                                <p className="text-aura-secondary text-sm font-light uppercase tracking-widest">Your Personal Agent</p>
                            </div>

                            <form onSubmit={handleRegister} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[12px] font-bold text-aura-secondary uppercase tracking-[0.2em] pl-1">Email</label>
                                    <input
                                        type="email"
                                        required
                                        className="input-aura"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[12px] font-bold text-aura-secondary uppercase tracking-[0.2em] pl-1">Username</label>
                                    <input
                                        type="text"
                                        required
                                        className="input-aura"
                                        placeholder="your-username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[12px] font-bold text-aura-secondary uppercase tracking-[0.2em] pl-1">Password</label>
                                    <input
                                        type="password"
                                        required
                                        minLength={8}
                                        className="input-aura"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <p className="text-[12px] text-white/20 pl-1 font-mono tracking-widest uppercase">Min 8 characters required</p>
                                </div>

                                {error && (
                                    <div className="bg-red-500/10 border border-red-500/20 text-red-200 text-[12px] font-bold uppercase tracking-widest py-3 px-4 rounded-xl text-center">
                                        {error}
                                    </div>
                                )}

                                <button disabled={loading} className="aura-btn-primary w-full mt-6">
                                    {loading ? (
                                        <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin mx-auto" />
                                    ) : "Create Account"}
                                </button>
                            </form>

                            <div className="mt-10 text-center">
                                <a href="/login" className="text-xs font-bold text-aura-accent hover:underline uppercase tracking-widest">Already have an account? Sign In</a>
                            </div>
                        </>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
