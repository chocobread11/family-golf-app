import { Skeleton } from '@/src/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <main aria-busy="true" aria-label="Loading dashboard" className="w-full max-w-3xl mx-auto min-h-dvh bg-white px-2 sm:px-4 md:px-6 md:py-6 pb-8">
      <div aria-hidden="true" className="flex items-center justify-between gap-4 px-1.5 py-4 mb-4">
        <div className="space-y-2"><Skeleton className="h-8 w-40" /><Skeleton className="h-5 w-32" /></div>
        <Skeleton className="size-24 sm:size-40 shrink-0 rounded-full" />
      </div>
      <div aria-hidden="true" className="space-y-6">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-12 w-full rounded-2xl" />
        <div className="space-y-3">
          <div className="flex justify-between"><Skeleton className="h-4 w-24" /><Skeleton className="h-4 w-16" /></div>
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
        </div>
      </div>
    </main>
  );
}
