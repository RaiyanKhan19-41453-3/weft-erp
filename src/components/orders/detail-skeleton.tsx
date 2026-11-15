import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export function OrderDetailSkeleton() {
  return (
    <>
      <div className="mb-5">
        <Skeleton className="h-3 w-28" />
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <Skeleton className="h-3 w-40" />
            <Skeleton className="mt-2 h-7 w-44" />
            <Skeleton className="mt-2 h-3 w-64" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      </div>
      <Card className="mb-3 overflow-hidden">
        <div className="grid grid-cols-2 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="border-b border-r border-line px-4 py-3 last:border-r-0 sm:border-b-0">
              <Skeleton className="h-2.5 w-20" />
              <Skeleton className="mt-2 h-4 w-28" />
              <Skeleton className="mt-1.5 h-2.5 w-24" />
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 border-t border-line px-4 py-3">
          <Skeleton className="h-2 w-20" />
          <Skeleton className="h-1.5 flex-1" />
        </div>
      </Card>
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.62fr_1fr]">
        <Card className="p-4">
          <div className="flex gap-4 border-b border-line pb-3">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-12" />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-5 sm:grid-cols-3">
            {Array.from({ length: 9 }).map((_, index) => (
              <div key={index}>
                <Skeleton className="h-2.5 w-14" />
                <Skeleton className="mt-2 h-3.5 w-28" />
                <Skeleton className="mt-1.5 h-2.5 w-20" />
              </div>
            ))}
          </div>
        </Card>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="p-4">
              <Skeleton className="h-3.5 w-24" />
              <div className="mt-4 space-y-3">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
