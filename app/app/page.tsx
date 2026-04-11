'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    if (api.getToken()) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="animate-pulse text-accent text-sm uppercase tracking-widest font-light">
        Initializing Universe...
      </div>
    </div>
  );
}
