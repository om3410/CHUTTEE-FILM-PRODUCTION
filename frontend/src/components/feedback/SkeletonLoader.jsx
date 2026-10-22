import { cn } from '../../lib/utils';

export default function SkeletonLoader({ variant = 'card', className }) {
  if (variant === 'title') return <div className={cn('shimmer h-8 w-2/3 rounded-premium', className)} />;
  return (
    <div className={cn('shimmer rounded-premium border border-zinc-800 p-5', className)}>
      <div className="space-y-3">
        <div className="shimmer h-4 w-3/4 rounded" />
        <div className="shimmer h-3 w-1/2 rounded" />
        <div className="shimmer h-3 w-2/3 rounded" />
      </div>
    </div>
  );
}
