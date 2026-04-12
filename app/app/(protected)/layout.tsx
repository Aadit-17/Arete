'use client';

import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { ProtectedUserProvider } from '@/contexts/ProtectedUserContext';

function ProtectedMotionShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
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

export default function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ProtectedUserProvider>
            <ProtectedMotionShell>{children}</ProtectedMotionShell>
        </ProtectedUserProvider>
    );
}
