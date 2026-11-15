"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const chartLoading = () => (
  <div className="space-y-3 py-2">
    <Skeleton className="h-[190px] w-full rounded-lg" />
    <div className="flex gap-4">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-3 w-16" />
    </div>
  </div>
);

export const ThroughputChart = dynamic(
  () => import("./charts-inner").then((module) => module.ThroughputChart),
  { ssr: false, loading: chartLoading },
);

export const PipelineChart = dynamic(
  () => import("./charts-inner").then((module) => module.PipelineChart),
  { ssr: false, loading: chartLoading },
);
