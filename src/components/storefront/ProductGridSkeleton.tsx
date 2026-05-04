import { Skeleton } from '@/components/ui/skeleton';

export default function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="aspect-[3/4] w-full rounded-xl" style={{ animationDelay: `${i * 60}ms` }} />
          <Skeleton className="h-3 w-1/3 rounded" style={{ animationDelay: `${i * 60 + 100}ms` }} />
          <Skeleton className="h-4 w-4/5 rounded" style={{ animationDelay: `${i * 60 + 150}ms` }} />
          <Skeleton className="h-4 w-1/3 rounded" style={{ animationDelay: `${i * 60 + 200}ms` }} />
        </div>
      ))}
    </div>
  );
}
