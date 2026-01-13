import { Skeleton } from '@/components/ui/skeleton';

export function FileListSkeleton() {
  return (
    <div className="flex-1">
      <div className="grid grid-cols-12 gap-4 px-4 py-2 border-b border-border bg-muted/30">
        <Skeleton className="col-span-5 h-4" />
        <Skeleton className="col-span-2 h-4" />
        <Skeleton className="col-span-2 h-4" />
        <Skeleton className="col-span-2 h-4" />
        <Skeleton className="col-span-1 h-4" />
      </div>
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="grid grid-cols-12 gap-4 px-4 py-3 items-center border-b border-border/50"
        >
          <div className="col-span-5 flex items-center gap-3">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-4 flex-1 max-w-48" />
          </div>
          <Skeleton className="col-span-2 h-4" />
          <Skeleton className="col-span-2 h-4" />
          <Skeleton className="col-span-2 h-4" />
          <Skeleton className="col-span-1 h-4" />
        </div>
      ))}
    </div>
  );
}
