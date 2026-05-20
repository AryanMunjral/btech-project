/**
 * LoadingSpinner — Reusable loading indicator.
 *
 * Sizes: sm (h-4 w-4), md (h-8 w-8), lg (h-12 w-12)
 *
 * Usage:
 *   <LoadingSpinner />
 *   <LoadingSpinner size="lg" text="Loading dashboard..." />
 */

import { Loader2 } from 'lucide-react';

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

function LoadingSpinner({ size = 'md', text }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <Loader2 className={`${sizeMap[size]} animate-spin text-primary-600`} />
      {text && <p className="text-sm text-gray-500">{text}</p>}
    </div>
  );
}

export default LoadingSpinner;
