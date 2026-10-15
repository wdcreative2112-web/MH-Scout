import React from "react";

export default function PublicLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10 animate-fade-in">
      {/* Hero / Header Skeleton */}
      <div className="relative rounded-3xl p-8 sm:p-12 glossy-panel border border-white/80 overflow-hidden space-y-5">
        <div className="h-6 w-36 rounded-full skeleton-shimmer" />
        <div className="space-y-3 max-w-2xl">
          <div className="h-9 sm:h-12 w-4/5 rounded-2xl skeleton-shimmer" />
          <div className="h-4 w-3/5 rounded-lg skeleton-shimmer" />
        </div>
        <div className="flex gap-3 pt-2">
          <div className="h-11 w-36 rounded-xl skeleton-shimmer" />
          <div className="h-11 w-36 rounded-xl skeleton-shimmer" />
        </div>
      </div>

      {/* Grid of Content Skeletons */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-7 w-48 rounded-xl skeleton-shimmer" />
          <div className="h-5 w-24 rounded-lg skeleton-shimmer" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="glossy-card rounded-2xl overflow-hidden p-0 border border-slate-200/60 shadow-xs space-y-4"
            >
              <div className="h-44 w-full skeleton-shimmer" />
              <div className="p-5 space-y-3">
                <div className="h-4 w-24 rounded-full skeleton-shimmer" />
                <div className="h-6 w-full rounded-lg skeleton-shimmer" />
                <div className="h-4 w-4/5 rounded-md skeleton-shimmer" />
                <div className="h-4 w-2/3 rounded-md skeleton-shimmer" />
                <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                  <div className="h-4 w-20 rounded-md skeleton-shimmer" />
                  <div className="h-4 w-16 rounded-md skeleton-shimmer" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
