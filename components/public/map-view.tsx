"use client";

import dynamic from "next/dynamic";
import type { MapReport } from "@/app/(map)/map/page";

const LeafletMap = dynamic(
  () => import("./leaflet-map").then((m) => m.LeafletMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-muted/30">
        <p className="text-sm text-muted-foreground">Loading map…</p>
      </div>
    ),
  },
);

export function MapView({ reports }: { reports: MapReport[] }) {
  return (
    <div className="h-full w-full">
      <LeafletMap reports={reports} />
    </div>
  );
}
