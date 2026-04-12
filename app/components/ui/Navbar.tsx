'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { useSidebarInset } from '@/components/layout/AppChrome';
import { LogOut, Home, Plus, MessageSquare, RefreshCcw, PanelLeft } from 'lucide-react';

export function Navbar() {
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);
    const { sidebarExpanded: mobileMenuOpen, setSidebarExpanded: setMobileMenuOpen } = useSidebarInset();

    useEffect(() => {
        setMounted(true);
    }, []);

    const isLoggedIn = mounted && !!api.getToken();
    const isProtected = pathname.startsWith('/(protected)') || ['/dashboard', '/log', '/coach'].some(p => pathname.includes(p));

    const handleLogout = async () => {
        try {
            await api.fetch('/api/auth/logout', { method: 'POST' });
        } catch (e) {
            console.error('Logout failed', e);
        } finally {
            api.setToken(null);
            window.location.href = '/login';
        }
    };

    const navLinks = [
        { href: '/dashboard', label: 'Insights', icon: <Home size={20} /> },
        { href: '/coach', label: 'Arete', icon: <MessageSquare size={20} /> },
        { href: '/log', label: 'Log', icon: <Plus size={20} /> },
    ];

    if (!isLoggedIn || !isProtected) {
        return (
            <nav className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-6 md:px-8 py-6 border-b border-white/[0.08] backdrop-blur-[20px] saturate-[180%] brightness-105 bg-white/[0.04] shadow-[inset_0_-1px_0_rgba(255,255,255,0.06)]">
                <Link href="/" className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/[0.03] border border-white/[0.08] rounded-lg flex items-center justify-center">
                        <div className="w-1 h-1 rounded-full bg-aura-accent shadow-[0_0_8px_var(--color-aura-accent)]" />
                    </div>
                    <span className="font-bold text-lg">Arete</span>
                </Link>

                <div className="flex items-center gap-4">
                    {isLoggedIn ? (
                        <button onClick={handleLogout} className="aura-btn-glass text-xs py-2 px-3">
                            <LogOut size={13} />
                            Logout
                        </button>
                    ) : (
                        <Link href="/login" className="aura-btn-primary text-xs">
                            Access
                        </Link>
                    )}
                </div>
            </nav>
        );
    }

    // Protected pages - show left drawer nav
    return (
        <>
            {/* Expandable Left Sidebar */}
            <div className={`fixed left-0 top-0 z-[99] h-screen flex flex-col border-r border-white/[0.05] bg-white/[0.02] transition-all duration-300 ${
                mobileMenuOpen ? 'w-56' : 'w-16'
            }`}>
                {/* Header - Arete Branding with Toggle (shown when expanded) */}
                {mobileMenuOpen ? (
                    <div className="p-4 border-b border-white/[0.05] flex items-start justify-between gap-3">
                        <Link href="/" className="flex items-center gap-3 group flex-1 min-w-0">
                            <img src="/favicon.png" alt="Arete" className="w-8 h-8 rounded-lg flex-shrink-0" />
                            <div className="min-w-0">
                                <div className="font-bold text-sm leading-none">Arete</div>
                                <div className="text-[11px] text-zinc-500 mt-0.5">Your Personal Agent</div>
                            </div>
                        </Link>
                        <button
                            onClick={() => setMobileMenuOpen(false)}
                            className="h-8 w-8 flex items-center justify-center hover:bg-white/[0.05] transition-all flex-shrink-0 rounded-lg"
                            title="Collapse"
                        >
                            <PanelLeft size={20} />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setMobileMenuOpen(true)}
                        className="h-16 w-16 flex items-center justify-center hover:bg-white/[0.05] transition-all flex-shrink-0"
                        title="Expand"
                    >
                        <PanelLeft size={20} />
                    </button>
                )}

                {/* Navigation Links */}
                <nav className="flex-1 flex flex-col gap-2 p-2 overflow-y-auto">
                    {navLinks.map((link) => (
                        <Link key={link.href} href={link.href}>
                            <button
                                className={`w-full h-12 flex items-center gap-3 px-3 rounded-lg transition-all ${
                                    pathname === link.href
                                        ? 'bg-white/[0.08] text-zinc-100'
                                        : 'text-zinc-400 hover:text-white hover:bg-white/[0.03]'
                                } ${mobileMenuOpen ? 'justify-start' : 'justify-center'}`}
                                title={link.label}
                            >
                                <span className="flex-shrink-0">{link.icon}</span>
                                {mobileMenuOpen && <span className="text-sm font-medium truncate">{link.label}</span>}
                            </button>
                        </Link>
                    ))}
                </nav>

                {/* Bottom Action Buttons */}
                <div className={`flex flex-col gap-2 p-2 border-t border-white/[0.05] flex-shrink-0 ${mobileMenuOpen ? '' : ''}`}>
                    <button
                        onClick={() => window.location.reload()}
                        className={`h-12 flex items-center gap-3 px-3 rounded-lg hover:bg-white/[0.05] transition-all text-zinc-400 hover:text-white ${mobileMenuOpen ? 'justify-start' : 'justify-center'}`}
                        title="Sync"
                    >
                        <span className="flex-shrink-0"><RefreshCcw size={20} /></span>
                        {mobileMenuOpen && <span className="text-sm font-medium truncate">Sync</span>}
                    </button>
                    <button
                        onClick={handleLogout}
                        className={`h-12 flex items-center gap-3 px-3 rounded-lg hover:bg-white/[0.05] transition-all text-zinc-400 hover:text-white ${mobileMenuOpen ? 'justify-start' : 'justify-center'}`}
                        title="Logout"
                    >
                        <span className="flex-shrink-0"><LogOut size={20} /></span>
                        {mobileMenuOpen && <span className="text-sm font-medium truncate">Logout</span>}
                    </button>
                </div>
            </div>
        </>
    );
}
