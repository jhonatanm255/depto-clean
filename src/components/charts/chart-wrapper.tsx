"use client";

import dynamic from 'next/dynamic';
import { LoadingSpinner } from '@/components/core/loading-spinner';

// Lazy load Chart.js components
const ChartComponents = dynamic(
  () => import('./chart-components').then((mod) => mod.ChartComponents),
  {
    loading: () => (
      <div className="flex items-center justify-center h-full min-h-[250px]">
        <LoadingSpinner size={24} />
      </div>
    ),
    ssr: false,
  }
);

export { ChartComponents };
