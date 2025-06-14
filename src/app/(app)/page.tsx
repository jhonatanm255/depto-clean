
"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page's sole purpose is to redirect to /dashboard if accessed directly.
// The main dashboard content is now in (app)/dashboard/page.tsx
export default function AppRootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return null; // Or a minimal loader, but redirect should be fast
}
