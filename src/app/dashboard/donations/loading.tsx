import React from "react";

export default function AdminDonationsLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* 1. Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl skeleton-shimmer" />
            <div className="h-8 w-64 rounded-xl skeleton-shimmer" />
          </div>
          <div className="h-4 w-96 rounded-md skeleton-shimmer" />
        </div>
        <div className="flex gap-2.5">
          <div className="h-10 w-36 rounded-xl skeleton-shimmer" />
          <div className="h-10 w-40 rounded-xl skeleton-shimmer" />
        </div>
      </div>

      {/* 2. 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-28 rounded-md skeleton-shimmer" />
              <div className="w-9 h-9 rounded-xl skeleton-shimmer" />
            </div>
            <div className="h-7 w-36 rounded-lg skeleton-shimmer" />
            <div className="h-3.5 w-24 rounded-md skeleton-shimmer" />
          </div>
        ))}
      </div>

      {/* 3. Tab Buttons Skeleton */}
      <div className="flex gap-2 p-1.5 rounded-2xl bg-slate-100/80 w-fit">
        <div className="h-10 w-44 rounded-xl skeleton-shimmer" />
        <div className="h-10 w-40 rounded-xl skeleton-shimmer" />
        <div className="h-10 w-40 rounded-xl skeleton-shimmer" />
      </div>

      {/* 4. Table / Content Skeleton */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden p-6 space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="h-10 w-72 rounded-xl skeleton-shimmer" />
          <div className="flex gap-2">
            <div className="h-9 w-28 rounded-xl skeleton-shimmer" />
            <div className="h-9 w-28 rounded-xl skeleton-shimmer" />
          </div>
        </div>

        {/* Table Rows Shimmer */}
        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4, 5].map((row) => (
            <div
              key={row}
              className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl skeleton-shimmer shrink-0" />
                <div className="space-y-2">
                  <div className="h-4 w-48 rounded-md skeleton-shimmer" />
                  <div className="h-3 w-32 rounded-md skeleton-shimmer" />
                </div>
              </div>
              <div className="h-5 w-28 rounded-full skeleton-shimmer" />
              <div className="h-5 w-24 rounded-md skeleton-shimmer" />
              <div className="flex gap-2">
                <div className="h-8 w-20 rounded-lg skeleton-shimmer" />
                <div className="h-8 w-20 rounded-lg skeleton-shimmer" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
