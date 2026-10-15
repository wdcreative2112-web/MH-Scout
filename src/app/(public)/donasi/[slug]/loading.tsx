import React from "react";

export default function CampaignDetailLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 animate-fade-in">
      {/* Back button skeleton */}
      <div className="h-6 w-36 rounded-lg skeleton-shimmer" />

      {/* Main Campaign Hero Skeleton */}
      <div className="glossy-card rounded-3xl overflow-hidden border border-slate-200/60 space-y-6">
        <div className="h-64 sm:h-96 w-full skeleton-shimmer" />
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex gap-2">
            <div className="h-6 w-28 rounded-full skeleton-shimmer" />
            <div className="h-6 w-20 rounded-full skeleton-shimmer" />
          </div>

          <div className="h-9 sm:h-12 w-4/5 rounded-2xl skeleton-shimmer" />

          {/* Progress bar and metrics */}
          <div className="p-6 rounded-2xl bg-slate-50/80 border border-slate-200/50 space-y-4">
            <div className="flex justify-between items-end">
              <div className="space-y-2">
                <div className="h-4 w-28 rounded-md skeleton-shimmer" />
                <div className="h-8 w-44 rounded-xl skeleton-shimmer" />
              </div>
              <div className="space-y-2 text-right">
                <div className="h-4 w-24 rounded-md skeleton-shimmer ml-auto" />
                <div className="h-6 w-32 rounded-lg skeleton-shimmer" />
              </div>
            </div>
            <div className="h-3 w-full rounded-full skeleton-shimmer" />
          </div>

          {/* Action button skeleton */}
          <div className="flex gap-4 pt-2">
            <div className="h-12 flex-1 rounded-xl skeleton-shimmer" />
            <div className="h-12 w-40 rounded-xl skeleton-shimmer" />
          </div>
        </div>
      </div>

      {/* Narrative & Donor list skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-4">
          <div className="h-7 w-48 rounded-xl skeleton-shimmer" />
          <div className="space-y-2.5">
            <div className="h-4 w-full rounded-md skeleton-shimmer" />
            <div className="h-4 w-full rounded-md skeleton-shimmer" />
            <div className="h-4 w-4/5 rounded-md skeleton-shimmer" />
            <div className="h-4 w-3/4 rounded-md skeleton-shimmer" />
          </div>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <div className="h-7 w-36 rounded-xl skeleton-shimmer" />
          <div className="space-y-3">
            {[1, 2, 3].map((d) => (
              <div key={d} className="p-4 rounded-xl border border-slate-200/60 space-y-2">
                <div className="h-5 w-32 rounded-md skeleton-shimmer" />
                <div className="h-4 w-24 rounded-md skeleton-shimmer" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
