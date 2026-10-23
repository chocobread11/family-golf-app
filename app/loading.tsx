import React from 'react';

export default function DashboardLoading() {
  return (
    <div className="min-h-[100dvh] w-full animate-pulse bg-canvas pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-[calc(1.15rem+env(safe-area-inset-top))] select-none">
      <div className="mx-auto w-full max-w-md px-4">
        {/* Header Skeleton */}
        <div className="flex items-start justify-between gap-4 pt-2">
          <div className="space-y-2.5">
            <div className="h-2.5 w-20 rounded-full bg-white" />
            <div className="h-7 w-40 rounded-lg bg-white" />
            <div className="h-3 w-44 rounded-full bg-white" />
          </div>
          <div className="h-12 w-12 flex-shrink-0 rounded-full bg-white" />
        </div>

        {/* Hero Skeleton */}
        <div className="mt-6 h-[292px] w-full rounded-[30px] bg-white/70" />

        {/* Flight Skeleton */}
        <div className="mt-4 h-[110px] w-full rounded-[26px] bg-white" />

        {/* List Skeleton */}
        <div className="mt-7">
          <div className="flex items-center justify-between">
            <div className="h-3 w-24 rounded-full bg-white" />
            <div className="h-5 w-7 rounded-full bg-white" />
          </div>
          <div className="mt-3 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex h-[80px] items-center gap-3 rounded-[24px] bg-white p-3">
                <div className="h-14 w-14 flex-shrink-0 rounded-[18px] bg-canvas" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-2/3 rounded-full bg-canvas" />
                  <div className="h-2.5 w-1/3 rounded-full bg-canvas" />
                </div>
                <div className="h-8 w-10 rounded-xl bg-canvas" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Nav Skeleton */}
      <div className="fixed inset-x-0 bottom-0 mx-auto w-full max-w-md px-4 pb-[calc(0.85rem+env(safe-area-inset-bottom))]">
        <div className="h-[58px] w-full rounded-full bg-white/80" />
      </div>
    </div>
  );
}
