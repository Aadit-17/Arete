'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/ui/Navbar';
import { api } from '@/lib/api-client';

type SidebarContextValue = {
    sidebarExpanded: boolean;
    setSidebarExpanded: (v: boolean) => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function useSidebarInset() {
    const ctx = useContext(SidebarContext);
    if (!ctx) throw new Error('useSidebarInset must be used within AppChrome');
    return ctx;
}

function useProtectedShell(pathname: string | null): boolean {
    if (!pathname) return false;
    return (
        pathname === '/dashboard' ||
        pathname.startsWith('/dashboard/') ||
        pathname === '/log' ||
        pathname.startsWith('/log/') ||
        pathname === '/coach' ||
        pathname.startsWith('/coach/')
    );
}

export function AppChrome({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const [sidebarExpanded, setSidebarExpanded] = useState(false);
    const [hasToken, setHasToken] = useState(false);

    useEffect(() => {
        setHasToken(typeof window !== 'undefined' && !!api.getToken());
    }, [pathname]);

    const shell = useProtectedShell(pathname);
    const showDrawerInset = shell && hasToken;

    const value = useMemo(
        () => ({
            sidebarExpanded,
            setSidebarExpanded,
        }),
        [sidebarExpanded]
    );

    const mainPad = showDrawerInset ? (sidebarExpanded ? 'pl-56' : 'pl-16') : '';

    return (
        <SidebarContext.Provider value={value}>
            <Navbar />
            <main
                className={`pt-24 pb-32 lg:pb-0 min-h-screen relative z-10 transition-[padding] duration-300 ease-out ${mainPad}`}
            >
                {children}
            </main>
        </SidebarContext.Provider>
    );
}
