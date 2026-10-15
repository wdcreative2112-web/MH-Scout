import React from "react";

export default function DashboardLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Top Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div className="space-y-2">
          <div className="h-8 w-56 rounded-xl skeleton-shimmer" />
          <div className="h-4 w-72 rounded-md skeleton-shimmer" />
        </div>
        <div className="flex gap-2.5">
          <div className="h-10 w-28 rounded-xl skeleton-shimmer" />
          <div className="h-10 w-32 rounded-xl skeleton-shimmer" />
        </div>
      </div>

      {/* 4 KPI Metrics Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-white border border-slate-200/70 shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 rounded-md skeleton-shimmer" />
              <div className="w-9 h-9 rounded-xl skeleton-shimmer" />
            </div>
            <div className="h-7 w-32 rounded-lg skeleton-shimmer" />
            <div className="h-3.5 w-20 rounded-md skeleton-shimmer" />
          </div>
        ))}
      </div>

      {/* Main Table / Content Skeleton */}
      <div className="bg-white rounded-2xl border border-slate-200/70 shadow-xs overflow-hidden space-y-4 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="h-6 w-40 rounded-lg skeleton-shimmer" />
          <div className="h-9 w-64 rounded-xl skeleton-shimmer" />
        </div>

        {/* Rows skeleton */}
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((row) => (
            <div
              key={row}
              className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl skeleton-shimmer shrink-0" />
                <div className="space-y-1.5">
                  <div className="h-4 w-40 rounded-md skeleton-shimmer" />
                  <div className="h-3 w-28 rounded-md skeleton-shimmer" />
                </div>
              </div>
              <div className="h-6 w-24 rounded-full skeleton-shimmer" />
              <div className="h-8 w-20 rounded-lg skeleton-shimmer hidden sm:block" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
