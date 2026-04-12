'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Orbit, MoreHorizontal, MessageSquare, Cpu, Atom, ChevronUp, Loader2, Trash2, Edit2, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api-client';
import { feedCoachSseBuffer } from '@/lib/sse-stream';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { GlassCard, GlassButton } from '@/components/ui/glass';

// --- Messaging Components from sample-ui ---

const BotMessage = ({ text }: { text: string }) => (
    <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col gap-2 max-w-[90%] group"
    >
        <div className="flex items-center gap-2 px-1">
            <div className="relative">
                <div className="absolute inset-0 bg-white/10 blur-md rounded-full animate-pulse" />
                <div className="relative w-1.5 h-1.5 rounded-full bg-white/20 border border-white/30" />
            </div>
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Arete</span>
        </div>
        <div className="relative glass-panel backdrop-blur-2xl p-4 overflow-hidden group/msg">
            <div className="absolute -inset-[1px] bg-gradient-to-r from-white/5 via-white/3 to-white/5 rounded-[1.5rem] blur-[2px] opacity-30 group-hover:opacity-50 transition-opacity duration-700 pointer-events-none" />
            <div className="relative z-[1] prose prose-invert prose-sm max-w-none text-sm prose-p:m-0 prose-p:leading-snug prose-p:text-zinc-200 prose-li:m-0 prose-li:text-zinc-200 prose-headings:text-zinc-100 prose-headings:font-bold prose-headings:font-sans prose-h1:text-3xl md:prose-h1:text-4xl prose-h2:text-2xl md:prose-h2:text-3xl prose-h3:text-xl prose-h4:text-lg prose-pre:bg-white/5 prose-pre:border prose-pre:border-white/10 prose-code:text-zinc-100 prose-strong:text-zinc-100">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {text}
                </ReactMarkdown>
            </div>
        </div>
    </motion.div>
);

const UserMessage = ({ text }: { text: string }) => (
    <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col gap-2 items-end ml-auto max-w-[85%] group"
    >
        <div className="flex items-center gap-2 px-1">
            <span className="text-[11px] font-bold text-aura-secondary uppercase tracking-[0.2em]">You</span>
            <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
        </div>
        <div className="relative glass-panel backdrop-blur-2xl p-4 shadow-2xl">
            <p className="font-sans text-sm text-zinc-200 tracking-tight font-light whitespace-pre-wrap break-words">
                {text}
            </p>
        </div>
    </motion.div>
);

// --- MAIN PAGE ---

export default function CoachPage() {
    const searchParams = useSearchParams();
    const convIdFromUrl = searchParams.get('convId');
    const [conversations, setConversations] = useState<any[]>([]);
    const [convPage, setConvPage] = useState(1);
    const [hasMoreConvs, setHasMoreConvs] = useState(false);

    const [activeConv, setActiveConv] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [hasMoreMsgs, setHasMoreMsgs] = useState(false);

    const [input, setInput] = useState('');
    const [loadingConv, setLoadingConv] = useState(true);
    const [loadingMsgs, setLoadingMsgs] = useState(false);
    const [loadingMoreMsgs, setLoadingMoreMsgs] = useState(false);
    const [streaming, setStreaming] = useState(false);
    const [streamingText, setStreamingText] = useState('');

    const [editingConvId, setEditingConvId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState('');
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    const scrollRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const isAutoScrollRef = useRef(true);
    const messagesRef = useRef<any[]>([]);
    const lastAppliedUrlConvId = useRef<string | null>(null);
    // Typewriter: received text lives in a ref; interval drips it into state
    const pendingTextRef = useRef('');
    const typewriterTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    // Update ref whenever messages state changes
    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    const fetchConvs = useCallback(async (page: number, append = false) => {
        try {
            const res = await api.fetch(`/api/coach/conversations?page=${page}&limit=15`);
            if (res.ok) {
                const data = await res.json();
                setConversations(prev => append ? [...prev, ...data.conversations] : data.conversations);
                setHasMoreConvs(data.has_next);
                if (!append && data.conversations.length > 0) {
                    const fromUrl =
                        convIdFromUrl &&
                        data.conversations.find((c: { _id: string }) => c._id === convIdFromUrl);
                    setActiveConv(fromUrl || data.conversations[0]);
                }
            }
        } catch (err) {
            console.error('Failed to fetch conversations', err);
        } finally {
            setLoadingConv(false);
        }
    }, [convIdFromUrl]);

    useEffect(() => {
        fetchConvs(1);
    }, [fetchConvs]);

    const fetchMsgs = useCallback(async (convId: string, cursor: string | null = null) => {
        if (cursor) setLoadingMoreMsgs(true);
        else setLoadingMsgs(true);

        try {
            const url = `/api/coach/conversations/${convId}/messages?limit=20${cursor ? `&cursor=${cursor}` : ''}`;
            const res = await api.fetch(url);
            if (res.ok) {
                const data = await res.json();
                const apiMsgs = data.messages.reverse(); // Convert newest-first to chronological

                if (cursor) {
                    // Prepend older messages and maintain scroll position
                    const scrollContainer = scrollRef.current;
                    const prevHeight = scrollContainer?.scrollHeight || 0;

                    setMessages(prev => [...apiMsgs, ...prev]);

                    // Next frame scroll adjustment
                    requestAnimationFrame(() => {
                        if (scrollContainer) {
                            scrollContainer.scrollTop = scrollContainer.scrollHeight - prevHeight;
                        }
                    });
                } else {
                    setMessages(apiMsgs);
                    isAutoScrollRef.current = true;
                }

                setNextCursor(data.next_cursor);
                setHasMoreMsgs(data.has_more);
            }
        } catch (err) {
            console.error('Failed to fetch messages', err);
        } finally {
            setLoadingMsgs(false);
            setLoadingMoreMsgs(false);
        }
    }, []);

    useEffect(() => {
        if (activeConv) {
            setMessages([]);
            setNextCursor(null);
            setHasMoreMsgs(false);
            fetchMsgs(activeConv._id);
        }
    }, [activeConv, fetchMsgs]);

    // Deep-link / hero handoff: apply ?convId= once when that conversation appears (avoid overriding manual picks while URL is stale).
    useEffect(() => {
        if (!convIdFromUrl) {
            lastAppliedUrlConvId.current = null;
            return;
        }
        if (!conversations.length) return;
        if (lastAppliedUrlConvId.current === convIdFromUrl) return;
        const conv = conversations.find((c) => c._id === convIdFromUrl);
        if (conv) {
            setActiveConv(conv);
            lastAppliedUrlConvId.current = convIdFromUrl;
        }
    }, [convIdFromUrl, conversations]);

    const handleScroll = () => {
        if (!scrollRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;

        // Detect top for loading more
        if (scrollTop < 10 && hasMoreMsgs && !loadingMoreMsgs) {
            fetchMsgs(activeConv._id, nextCursor);
        }

        // Detect if user has scrolled away from bottom
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
        isAutoScrollRef.current = isAtBottom;
    };

    const scrollToBottom = () => {
        if (scrollRef.current && isAutoScrollRef.current) {
            setTimeout(() => {
                scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'auto' });
            }, 0);
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, streamingText]);

    const handleNewConv = async () => {
        try {
            const res = await api.fetch('/api/coach/conversations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: 'New Reflection' }),
            });
            if (res.ok) {
                const data = await res.json();
                const newConv = { _id: data.id, title: data.title };
                setConversations(prev => [newConv, ...prev]);
                setActiveConv(newConv);
            }
        } catch (err) { console.error(err); }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || streaming || !activeConv) return;

        // Clear any leftover typewriter from a previous message
        if (typewriterTimerRef.current) {
            clearInterval(typewriterTimerRef.current);
            typewriterTimerRef.current = null;
        }

        const userMsg = { role: 'user', content: input, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        const currentInput = input;
        setInput('');
        setStreaming(true);
        setStreamingText('');
        pendingTextRef.current = '';
        isAutoScrollRef.current = true;

        let streamEnded = false;
        let finalized = false;

        const finalizeAssistant = () => {
            if (finalized) return;
            finalized = true;
            const full = pendingTextRef.current.trim();
            if (full) {
                setMessages(prev => [...prev, { role: 'assistant' as const, content: full, timestamp: new Date() }]);
            }
            setStreamingText('');
            setStreaming(false);
        };

        // Typewriter: 2 chars per 16 ms ≈ 125 chars/sec — smooth but visible
        let displayPos = 0;
        typewriterTimerRef.current = setInterval(() => {
            const target = pendingTextRef.current;
            if (displayPos < target.length) {
                displayPos = Math.min(displayPos + 2, target.length);
                setStreamingText(target.slice(0, displayPos));
            } else if (streamEnded) {
                clearInterval(typewriterTimerRef.current!);
                typewriterTimerRef.current = null;
                finalizeAssistant();
            }
        }, 16);

        try {
            const res = await api.fetch(`/api/coach/conversations/${activeConv._id}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: currentInput }),
            });

            if (!res.ok) throw new Error('Failed to send message');

            const reader = res.body?.getReader();
            if (!reader) throw new Error('No reader available');

            const decoder = new TextDecoder();
            let buffer = '';

            const onPayload = (data: { text?: string; done?: boolean; error?: string }) => {
                if (data.error) console.error('Coach stream:', data.error);
                if (data.text) pendingTextRef.current += data.text;
                if (data.done) streamEnded = true;
            };

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer = feedCoachSseBuffer(buffer, decoder.decode(value, { stream: true }), onPayload);
            }

            if (buffer.trim()) {
                for (const rawLine of buffer.split('\n')) {
                    const line = rawLine.trim();
                    if (!line.startsWith('data:')) continue;
                    const jsonPart = line.slice(5).trimStart();
                    if (!jsonPart) continue;
                    try { onPayload(JSON.parse(jsonPart)); } catch { /* incomplete */ }
                }
            }

            // Stream reader closed — mark done so the typewriter can finalize
            streamEnded = true;

        } catch (err) {
            console.error(err);
            clearInterval(typewriterTimerRef.current!);
            typewriterTimerRef.current = null;
            if (!finalized) {
                setStreamingText('');
                setStreaming(false);
            }
        }
    };

    const handleDeleteConv = async (convId: string) => {
        if (!confirm('Delete this conversation?')) return;
        try {
            const res = await api.fetch(`/api/coach/conversations/${convId}`, { method: 'DELETE' });
            if (res.ok) {
                setConversations(prev => prev.filter(c => c._id !== convId));
                if (activeConv?._id === convId) {
                    setMessages([]);
                    setActiveConv(conversations.find(c => c._id !== convId) || null);
                }
            }
        } catch (err) {
            console.error('Failed to delete conversation', err);
        }
    };

    const handleRenameConv = async (convId: string, newTitle: string) => {
        if (!newTitle.trim()) return;
        try {
            const res = await api.fetch(`/api/coach/conversations/${convId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: newTitle })
            });
            if (res.ok) {
                setConversations(prev =>
                    prev.map(c => c._id === convId ? { ...c, title: newTitle } : c)
                );
                if (activeConv?._id === convId) {
                    setActiveConv({ ...activeConv, title: newTitle });
                }
            }
        } catch (err) {
            console.error('Failed to rename conversation', err);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-6 py-12 h-[calc(100vh-140px)] flex flex-col animate-fade-in relative z-10 pb-20 lg:pb-0">

            <header className="mb-8 flex items-center justify-between">
                <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08]">
                        <Atom size={8} className="text-zinc-400 animate-spin-slow" />
                        <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Arete Connected</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Reflections</h1>
                </div>

                <button
                    onClick={handleNewConv}
                    className="aura-btn-primary px-6 py-3 text-[12px] font-bold uppercase tracking-widest flex items-center gap-2"
                >
                    <Sparkles size={14} />
                    New Reflection
                </button>
            </header>

            <div className="flex-1 flex gap-6 overflow-hidden">
                {/* Sidebar */}
                <aside className="w-64 hidden lg:flex flex-col gap-4 overflow-y-auto pr-2 no-scrollbar border-r border-white/[0.03]">
                    <span className="text-[12px] font-bold text-zinc-600 uppercase tracking-[0.4em] mb-2 px-1">Your Reflections</span>
                    {loadingConv ? (
                        <div className="space-y-3 animate-pulse">
                            {[1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-white/[0.02] border border-white/[0.05] rounded-2xl" />)}
                        </div>
                    ) : (
                        <>
                            {conversations.map((conv, idx) => (
                                <motion.div
                                    key={conv._id}
                                    whileHover={{
                                        x: 4,
                                        transition: { type: 'spring', stiffness: 420, damping: 30 },
                                    }}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{
                                        delay: idx * 0.035,
                                        duration: 0.36,
                                        ease: [0.22, 1, 0.36, 1],
                                    }}
                                    className="cursor-pointer relative group"
                                >
                                    {editingConvId === conv._id ? (
                                        <div className="glass-panel-sm backdrop-blur-xl p-3 flex gap-2">
                                            <input
                                                type="text"
                                                value={editingTitle}
                                                onChange={(e) => setEditingTitle(e.target.value)}
                                                autoFocus
                                                className="flex-1 input-aura text-[12px]"
                                                onBlur={() => {
                                                    handleRenameConv(conv._id, editingTitle);
                                                    setEditingConvId(null);
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        handleRenameConv(conv._id, editingTitle);
                                                        setEditingConvId(null);
                                                    }
                                                    if (e.key === 'Escape') setEditingConvId(null);
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <div
                                            onClick={() => setActiveConv(conv)}
                                            className={`glass-panel-sm backdrop-blur-xl p-3 transition-all flex items-center justify-between relative ${activeConv?._id === conv._id
                                                ? 'ring-1 ring-inset ring-white/25 border-white/15'
                                                : 'hover:ring-1 hover:ring-inset hover:ring-white/10'
                                                }`}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <span className={`text-[12px] font-bold tracking-tight truncate block ${activeConv?._id === conv._id ? 'text-zinc-100' : 'text-zinc-400'}`}>
                                                    {conv.title}
                                                </span>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenMenuId(openMenuId === conv._id ? null : conv._id);
                                                }}
                                                className="p-1.5 hover:bg-white/[0.15] rounded transition-all flex-shrink-0 ml-2"
                                                title="More options"
                                            >
                                                <MoreHorizontal size={14} className="text-zinc-500 hover:text-zinc-300" />
                                            </button>

                                            <AnimatePresence>
                                                {openMenuId === conv._id && (
                                                    <>
                                                        <motion.div
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            exit={{ opacity: 0 }}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setOpenMenuId(null);
                                                            }}
                                                            className="fixed inset-0 z-40"
                                                        />
                                                        <motion.div
                                                            initial={{ opacity: 0, y: -4, scale: 0.96 }}
                                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                                            exit={{ opacity: 0, y: -4, scale: 0.96 }}
                                                            transition={{
                                                                duration: 0.32,
                                                                ease: [0.22, 1, 0.36, 1],
                                                            }}
                                                            className="absolute right-0 top-full mt-2 w-40 glass-panel-sm backdrop-blur-xl p-2 space-y-1 z-50 border border-white/[0.1]"
                                                        >
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setEditingConvId(conv._id);
                                                                    setEditingTitle(conv.title);
                                                                    setOpenMenuId(null);
                                                                }}
                                                                className="w-full px-3 py-2 text-[11px] font-bold text-left rounded hover:bg-white/[0.1] flex items-center gap-2 transition-all"
                                                            >
                                                                <Edit2 size={13} />
                                                                Rename
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteConv(conv._id);
                                                                    setOpenMenuId(null);
                                                                }}
                                                                className="w-full px-3 py-2 text-[11px] font-bold text-left rounded hover:bg-red-500/20 text-red-400 flex items-center gap-2 transition-all"
                                                            >
                                                                <Trash2 size={13} />
                                                                Delete
                                                            </button>
                                                        </motion.div>
                                                    </>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                            {hasMoreConvs && (
                                <button
                                    onClick={() => { setConvPage(p => p + 1); fetchConvs(convPage + 1, true); }}
                                    className="py-3 text-[11px] font-bold uppercase tracking-widest text-zinc-600 hover:text-zinc-300 transition-colors"
                                >
                                    Load more reflections
                                </button>
                            )}
                        </>
                    )}
                </aside>

                {/* Chat Window */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    <GlassCard className="flex-1 !p-0 flex flex-col h-full overflow-hidden">

                            {/* Messages Area */}
                            <div
                                className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 no-scrollbar will-change-scroll"
                                ref={scrollRef}
                                onScroll={handleScroll}
                            >
                                {loadingMsgs ? (
                                    <div className="h-full flex flex-col items-center justify-center gap-4 grayscale opacity-40">
                                        <Loader2 size={24} className="animate-spin text-zinc-400" />
                                        <span className="text-[12px] font-bold uppercase tracking-[0.4em]">Loading Reflections...</span>
                                    </div>
                                ) : (
                                    <>
                                        {hasMoreMsgs && (
                                            <div className="flex justify-center py-4">
                                                <button
                                                    onClick={() => fetchMsgs(activeConv._id, nextCursor)}
                                                    disabled={loadingMoreMsgs}
                                                    className="text-[11px] font-bold uppercase tracking-widest text-zinc-600 hover:text-zinc-300 flex items-center gap-2"
                                                >
                                                    {loadingMoreMsgs ? <Loader2 size={10} className="animate-spin" /> : <ChevronUp size={10} />}
                                                    Show earlier reflections
                                                </button>
                                            </div>
                                        )}

                                        {messages.length === 0 && !loadingMsgs && (
                                            <div className="flex-1 flex flex-col items-center justify-center py-24 text-center space-y-4 opacity-20">
                                                <Orbit size={48} className="text-zinc-600 mx-auto" />
                                                <p className="text-sm font-light italic leading-relaxed max-w-xs">
                                                    Begin your reflection with a question or thought.
                                                </p>
                                            </div>
                                        )}

                                        {messages.map((m, i) => (
                                            m.role === 'user' ? (
                                                <UserMessage key={m._id || `user-${i}`} text={m.content} />
                                            ) : (
                                                <BotMessage key={m._id || `bot-${i}`} text={m.content} />
                                            )
                                        ))}

                                        {streaming && (
                                            <BotMessage
                                                key="streaming-bot"
                                                text={streamingText.length > 0 ? streamingText : '\u2026'}
                                            />
                                        )}

                                        <div ref={messagesEndRef} />
                                    </>
                                )}
                            </div>

                        {/* Input Box */}
                        <div className="p-4 md:p-6 border-t border-white/[0.05]">
                            <form onSubmit={handleSend} className="flex items-center gap-3">
                                <input
                                    type="text"
                                    placeholder="Ask me something..."
                                    className="flex-1 input-aura rounded-full"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    disabled={streaming || !activeConv}
                                />
                                <button
                                    type="submit"
                                    disabled={streaming || !input.trim() || !activeConv}
                                    className="aura-btn-primary w-10 h-10 p-0 flex items-center justify-center rounded-full"
                                >
                                    <Send size={14} />
                                </button>
                            </form>
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    );
}
