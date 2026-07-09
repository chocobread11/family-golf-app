import React from 'react';

export default function DashboardLoading() {
  return (
    <div className="w-full max-w-md mx-auto min-h-[100dvh] bg-white p-4 pb-6 flex flex-col justify-start select-none animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between px-1.5 py-4 p-5 mb-4">
        <div className="space-y-2">
          <div className="h-8 w-40 bg-[#F1F5F9] rounded-lg"></div>
          <div className="h-5 w-32 bg-[#F1F5F9] rounded-lg"></div>
        </div>
        <div className="w-10 h-10 rounded-full bg-[#F1F5F9] flex-shrink-0"></div>
      </div>

      <div className="space-y-6">
        {/* Hero Card Skeleton */}
        <div className="bg-[#F4F6F9] rounded-3xl p-5 h-28 w-full border border-[#F1F5F9]/50"></div>

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
    </div>
  );
}