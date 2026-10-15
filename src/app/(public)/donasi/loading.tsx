import React from "react";

export default function DonasiLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12 animate-fade-in">
      {/* 1. Hero Header Skeleton */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="h-7 w-48 rounded-full skeleton-shimmer mx-auto" />
        <div className="h-10 sm:h-14 w-4/5 rounded-2xl skeleton-shimmer mx-auto" />
        <div className="h-5 w-3/5 rounded-lg skeleton-shimmer mx-auto" />
        <div className="flex justify-center gap-3 pt-3">
          <div className="h-12 w-44 rounded-xl skeleton-shimmer" />
          <div className="h-12 w-44 rounded-xl skeleton-shimmer" />
        </div>
      </div>

      {/* 2. Stat Counter Boxes */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="glossy-card rounded-2xl p-5 border border-slate-200/60 space-y-3"
          >
            <div className="w-10 h-10 rounded-xl skeleton-shimmer" />
            <div className="h-7 w-28 rounded-lg skeleton-shimmer" />
            <div className="h-4 w-20 rounded-md skeleton-shimmer" />
          </div>
        ))}
      </div>

      {/* 3. Official Accounts Skeleton */}
      <div className="space-y-4">
        <div className="h-6 w-52 rounded-xl skeleton-shimmer" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="glossy-card rounded-2xl p-5 border border-slate-200/60 space-y-3"
            >
              <div className="flex justify-between items-center">
                <div className="h-5 w-24 rounded-md skeleton-shimmer" />
                <div className="w-6 h-6 rounded-lg skeleton-shimmer" />
              </div>
              <div className="h-6 w-36 rounded-lg skeleton-shimmer" />
              <div className="h-4 w-28 rounded-md skeleton-shimmer" />
              <div className="h-9 w-full rounded-xl skeleton-shimmer" />
            </div>
          ))}
        </div>
      </div>

      {/* 4. Campaigns Cards Skeleton */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="h-8 w-60 rounded-xl skeleton-shimmer" />
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((b) => (
              <div key={b} className="h-9 w-24 rounded-full skeleton-shimmer" />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((c) => (
            <div
              key={c}
              className="glossy-card rounded-2xl overflow-hidden border border-slate-200/60 space-y-4"
            >
              <div className="h-48 w-full skeleton-shimmer" />
              <div className="p-5 space-y-4">
                <div className="h-4 w-28 rounded-full skeleton-shimmer" />
                <div className="h-6 w-full rounded-lg skeleton-shimmer" />
                <div className="h-4 w-4/5 rounded-md skeleton-shimmer" />
                
                {/* Progress bar shimmer */}
                <div className="space-y-2 pt-2">
                  <div className="h-2.5 w-full rounded-full skeleton-shimmer" />
                  <div className="flex justify-between">
                    <div className="h-4 w-20 rounded-md skeleton-shimmer" />
                    <div className="h-4 w-20 rounded-md skeleton-shimmer" />
                  </div>
                </div>

                <div className="h-11 w-full rounded-xl skeleton-shimmer pt-2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
