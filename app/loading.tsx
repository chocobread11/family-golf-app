import React from 'react';

export default function DashboardLoading() {
  return (
    <main aria-busy="true" aria-label="Loading dashboard" className="w-full max-w-xl md:max-w-3xl mx-auto min-h-[100dvh] bg-white px-4 md:px-6 py-0 md:py-6 pb-8 flex flex-col justify-start motion-safe:animate-pulse">
      {/* Header Skeleton */}
      <div aria-hidden="true" className="flex items-center justify-between gap-4 px-1.5 py-4 mb-4">
        <div className="space-y-2">
          <div className="h-8 w-40 bg-[#F1F5F9] rounded-lg"></div>
          <div className="h-5 w-32 bg-[#F1F5F9] rounded-lg"></div>
        </div>
        <div className="size-24 sm:size-40 rounded-full bg-[#F1F5F9] flex-shrink-0"></div>
      </div>

      <div aria-hidden="true" className="space-y-6">
        {/* Hero Card Skeleton */}
        <div className="bg-[#F4F6F9] rounded-3xl p-5 w-full border border-[#F1F5F9]/50 flex items-center gap-4"><div className="w-1/4 aspect-square rounded-2xl bg-[#E5E5EA]" /><div className="flex-1 space-y-2"><div className="h-4 w-1/3 rounded bg-[#E5E5EA]" /><div className="h-7 w-2/3 rounded bg-[#E5E5EA]" /><div className="h-3 w-1/2 rounded bg-[#E5E5EA]" /></div></div>

        {/* Start Match Button Skeleton */}
        <div className="w-full h-14 bg-[#F4F6F9] rounded-3xl"></div>

        {/* List Skeleton */}
        <div className="space-y-3">
          <div className="flex justify-between px-1">
            <div className="w-24 h-4 bg-[#F1F5F9] rounded"></div>
            <div className="w-16 h-4 bg-[#F1F5F9] rounded-full"></div>
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 w-full bg-[#F4F6F9] rounded-3xl border border-[#F1F5F9]/50"></div>
          ))}
        </div>
      </div>
    </main>
  );
}
