'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { api } from '@/lib/api-client';

export default function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const checkAuth = async () => {
            if (!api.getToken()) {
                router.push('/login');
                return;
            }

            try {
                const res = await api.fetch('/api/me');
                if (!res.ok) {
                    router.push('/login');
                    return;
                }

                const user = await res.json();
                const isPending = user.status === 'pending';
                const restrictedPaths = ['/log', '/coach'];
                const isRestricted = restrictedPaths.some(p => pathname.startsWith(p));

                if (isPending && isRestricted) {
                    router.push('/dashboard');
                    return;
                }
            } catch (err) {
                router.push('/login');
                return;
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, [router, pathname]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[80vh]">
                <div className="animate-pulse text-aura-accent text-sm uppercase tracking-widest font-light">
                    Securing Connection...
                </div>
            </div>
        );
    }

    return (
        <motion.div
            key={pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
        >
            {children}
        </motion.div>
    );
}
