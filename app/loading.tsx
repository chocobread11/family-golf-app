import React from 'react';

export default function DashboardLoading() {
  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-xl animate-pulse flex-col justify-start bg-background px-4 pb-8 pt-[calc(1rem+env(safe-area-inset-top))] select-none md:max-w-3xl md:px-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between gap-4 pb-2 pt-2">
        <div className="space-y-2.5">
          <div className="h-2.5 w-20 rounded-full bg-[#E7E2D8]" />
          <div className="h-8 w-40 rounded-lg bg-[#EFEAE0]" />
          <div className="h-3.5 w-28 rounded-full bg-[#EFEAE0]" />
        </div>
        <div className="h-[72px] w-[72px] flex-shrink-0 rounded-full bg-[#EFEAE0]" />
      </div>

      <div className="space-y-5 pt-5">
        {/* Hero Card Skeleton */}
        <div className="flex items-center gap-4 rounded-3xl border border-line/60 bg-surface p-4">
          <div className="h-20 w-20 flex-shrink-0 rounded-2xl bg-[#EFEAE0]" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-20 rounded-full bg-[#EFEAE0]" />
            <div className="h-5 w-32 rounded-lg bg-[#EFEAE0]" />
            <div className="h-3 w-40 rounded-full bg-[#EFEAE0]" />
          </div>
        </div>

        {/* Start Match Button Skeleton */}
        <div className="h-[70px] w-full rounded-3xl bg-[#EFEAE0]" />

        {/* List Skeleton */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between px-1">
            <div className="h-3 w-24 rounded bg-[#E7E2D8]" />
            <div className="h-5 w-20 rounded-full bg-[#E7E2D8]" />
          </div>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex h-[88px] w-full items-center gap-3.5 rounded-3xl border border-line/60 bg-surface p-3"
            >
              <div className="h-16 w-16 flex-shrink-0 rounded-2xl bg-[#EFEAE0]" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-2/3 rounded-full bg-[#EFEAE0]" />
                <div className="h-2.5 w-1/3 rounded-full bg-[#EFEAE0]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
