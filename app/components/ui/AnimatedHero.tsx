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

            // 1. Create a new conversation
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

            // 2. Send the initial message to the new conversation
            const msgResponse = await api.fetch(`/api/coach/conversations/${conversationId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: message }),
            });

            if (!msgResponse.ok) {
                const error = await msgResponse.json();
                throw new Error(error.error || 'Failed to send message');
            }

            // 3. Navigate to the coach page with the conversation ID
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
        <div className="relative w-full h-80 overflow-hidden">
            {/* Animated background with planets */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/50">
                {/* Planet 1 - Cyan/Blue */}
                <motion.div
                    className="absolute w-40 h-40 rounded-full"
                    style={{
                        background: 'radial-gradient(circle at 30% 30%, rgba(0, 245, 255, 0.6), rgba(0, 180, 220, 0.3))',
                        filter: 'blur(1px)',
                        boxShadow: '0 0 60px rgba(0, 245, 255, 0.4)',
                    }}
                    animate={{
                        x: [0, 80, -40, 0],
                        y: [0, -100, 60, 0],
                        scale: [1, 1.1, 0.95, 1],
                    }}
                    transition={{
                        duration: 20,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                    initial={{ top: '10%', left: '5%' }}
                />

                {/* Planet 2 - Violet/Purple */}
                <motion.div
                    className="absolute w-32 h-32 rounded-full"
                    style={{
                        background: 'radial-gradient(circle at 30% 30%, rgba(168, 85, 247, 0.7), rgba(139, 92, 246, 0.3))',
                        filter: 'blur(1px)',
                        boxShadow: '0 0 50px rgba(168, 85, 247, 0.5)',
                    }}
                    animate={{
                        x: [-60, 50, 100, -60],
                        y: [80, -80, 40, 80],
                        scale: [0.9, 1.1, 0.85, 0.9],
                    }}
                    transition={{
                        duration: 25,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: 2,
                    }}
                    initial={{ top: '50%', right: '10%' }}
                />

                {/* Ambient glow */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20" />
            </div>

            {/* Content overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center px-6 pointer-events-none z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="space-y-6 w-full max-w-2xl"
                >
                    {/* Greeting */}
                    <div className="text-center space-y-3">
                        <h2 className="text-3xl font-bold text-zinc-100 tracking-tight">
                            Welcome to Arete
                        </h2>
                        <p className="text-sm text-zinc-400">
                            Your personal agent for excellence.
                        </p>
                    </div>

                    {/* Chat Input - Pointer events enabled for this section */}
                    <div className="pointer-events-auto flex gap-2">
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Ask Arete anything..."
                            className="flex-1 input-aura text-sm"
                            disabled={loading}
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={loading || !message.trim()}
                            className="glass-button px-4 py-2 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/[0.10]"
                        >
                            <Send size={16} />
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};
