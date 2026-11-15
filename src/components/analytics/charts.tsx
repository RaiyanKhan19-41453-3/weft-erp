"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const loading = () => (
  <div className="space-y-3 py-2">
    <Skeleton className="h-[240px] w-full rounded-lg" />
    <div className="flex gap-4">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-3 w-24" />
    </div>
  </div>
);

export const FactoryOutputChart = dynamic(
  () => import("./charts-inner").then((module) => module.FactoryOutputChart),
  { ssr: false, loading },
);

export const OnTimeTrendChart = dynamic(
  () => import("./charts-inner").then((module) => module.OnTimeTrendChart),
  { ssr: false, loading },
);
