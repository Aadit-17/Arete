'use client';

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';

export type CurrentUser = {
    id: string;
    email: string;
    username: string;
    status: 'pending' | 'approved';
    timezone: string;
    createdAt?: string;
};

type ProtectedUserContextValue = {
    user: CurrentUser | null;
    refreshUser: () => Promise<void>;
};

const ProtectedUserContext = createContext<ProtectedUserContextValue | null>(null);

function isRestrictedCoachOrLogPath(pathname: string): boolean {
    return (
        pathname === '/log' ||
        pathname.startsWith('/log/') ||
        pathname === '/coach' ||
        pathname.startsWith('/coach/')
    );
}

export function ProtectedUserProvider({ children }: { children: ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<CurrentUser | null>(null);
    const [bootstrapping, setBootstrapping] = useState(true);

    const refreshUser = useCallback(async () => {
        const res = await api.fetch('/api/me');
        if (!res.ok) return;
        const data = await res.json();
        setUser({
            id: data.id,
            email: data.email,
            username: data.username,
            status: data.status,
            timezone: data.timezone,
            createdAt: data.createdAt,
        });
    }, []);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            if (!api.getToken()) {
                router.push('/login');
                if (!cancelled) setBootstrapping(false);
                return;
            }
            const res = await api.fetch('/api/me');
            if (cancelled) return;
            if (!res.ok) {
                router.push('/login');
                setBootstrapping(false);
                return;
            }
            const data = await res.json();
            setUser({
                id: data.id,
                email: data.email,
                username: data.username,
                status: data.status,
                timezone: data.timezone,
                createdAt: data.createdAt,
            });
            setBootstrapping(false);
        })();
        return () => {
            cancelled = true;
        };
    }, [router]);

    useEffect(() => {
        if (bootstrapping || !user) return;
        if (user.status === 'pending' && isRestrictedCoachOrLogPath(pathname)) {
            router.replace('/dashboard');
        }
    }, [bootstrapping, pathname, router, user]);

    if (bootstrapping) {
        return (
            <div className="flex items-center justify-center min-h-[80vh]">
                <div className="animate-pulse text-aura-accent text-sm uppercase tracking-widest font-light">
                    Securing Connection...
                </div>
            </div>
        );
    }

    return (
        <ProtectedUserContext.Provider value={{ user, refreshUser }}>
            {children}
        </ProtectedUserContext.Provider>
    );
}

export function useProtectedUser() {
    const ctx = useContext(ProtectedUserContext);
    if (!ctx) {
        throw new Error('useProtectedUser must be used within ProtectedUserProvider');
    }
    return ctx;
}
