'use client';

import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { Send } from 'lucide-react';

export const AnimatedHero = () => {
    const [mounted, setMounted] = useState(false);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSendMessage = async () => {
        if (!message.trim()) return;

        try {
            setLoading(true);

            const convResponse = await api.fetch('/api/coach/conversations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: message.substring(0, 50),
                }),
            });

            const convData = await convResponse.json();
            const conversationId = convData.id;

            if (!conversationId) throw new Error('Failed to create conversation');

            const msgResponse = await api.fetch(`/api/coach/conversations/${conversationId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: message }),
            });

            if (!msgResponse.ok) {
                const error = await msgResponse.json();
                throw new Error(error.error || 'Failed to send message');
            }

            router.push(`/coach?convId=${conversationId}`);
        } catch (error) {
            console.error('Failed to start conversation', error);
        } finally {
            setLoading(false);
            setMessage('');
        }
    };

    if (!mounted) return null;

    return (
        <section className="relative w-full pt-2 pb-8 md:pb-10">
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                    delay: 0.12,
                    duration: 0.55,
                    ease: [0.22, 1, 0.36, 1],
                }}
                className="space-y-5 max-w-2xl mx-auto text-center"
            >
                <div className="space-y-3">
                    <h2 className="text-4xl md:text-5xl font-semibold text-zinc-100 tracking-tight [text-shadow:0_1px_24px_rgba(0,0,0,0.45)]">
                        Welcome to Arete
                    </h2>
                    <p className="text-base text-zinc-400 leading-relaxed [text-shadow:0_1px_16px_rgba(0,0,0,0.4)]">
                        Your personal agent for excellence.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 w-full max-w-2xl mx-auto">
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSendMessage();
                        }}
                        placeholder="Ask Arete anything..."
                        className="flex-1 input-aura text-sm min-w-0"
                        disabled={loading}
                    />
                    <button
                        type="button"
                        onClick={handleSendMessage}
                        disabled={loading || !message.trim()}
                        className="glass-button px-5 py-3 sm:py-0 sm:min-w-[3.25rem] flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Send message"
                    >
                        <Send size={16} />
                    </button>
                </div>
            </motion.div>
        </section>
    );
};
