import React from 'react';

export default function DashboardLoading() {
  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-xl animate-pulse flex-col bg-white px-5 pb-10 pt-[calc(1rem+env(safe-area-inset-top))] select-none md:max-w-3xl md:px-8">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between gap-5 pt-4">
        <div className="space-y-2.5">
          <div className="h-2.5 w-20 rounded-full bg-neutral-100" />
          <div className="h-7 w-40 rounded-lg bg-neutral-100" />
          <div className="h-3.5 w-44 rounded-full bg-neutral-100" />
        </div>
        <div className="h-14 w-14 flex-shrink-0 rounded-full bg-neutral-100" />
      </div>

      {/* Action Skeleton */}
      <div className="mt-8 h-[52px] w-full rounded-2xl bg-neutral-100" />

      {/* List Skeleton */}
      <div className="mt-10">
        <div className="flex items-center justify-between">
          <div className="h-2.5 w-24 rounded-full bg-neutral-100" />
          <div className="h-2.5 w-6 rounded-full bg-neutral-100" />
        </div>
        <div className="mt-2 divide-y divide-neutral-100">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex h-[76px] items-center gap-4 py-4">
              <div className="h-12 w-12 flex-shrink-0 rounded-xl bg-neutral-100" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-2/3 rounded-full bg-neutral-100" />
                <div className="h-2.5 w-1/3 rounded-full bg-neutral-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
