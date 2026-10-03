"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  MapContainer, TileLayer, Marker, Popup, Pane, Polygon,
  LayersControl, GeoJSON, useMap, useMapEvents,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import L from "leaflet";
import type { MapReport } from "@/app/(public)/map/page";
import { CONDITION_LABELS, SEVERITY_LABELS } from "@/lib/types";
import { LIBERIA_COUNTIES, type LiberiaCounty } from "@/lib/counties";
import { countyAt, COUNTY_FEATURES, COUNTY_LABEL_POINTS, LIBERIA_OUTLINE, LIBERIA_BOUNDS } from "@/lib/geo";

/* Below this zoom the map summarises by county; at or above it, individual pins show. */
const PIN_ZOOM = 9;

/* ── Cluster bubble icon — matches brand colours instead of the plugin default ── */
function createClusterIcon(cluster: L.MarkerCluster) {
  const count = cluster.getChildCount();
  const size = count < 10 ? 36 : count < 50 ? 44 : 52;
  return L.divIcon({
    className: "",
    html: `
      <div style="
        display:flex;align-items:center;justify-content:center;
        width:${size}px;height:${size}px;border-radius:50%;
        background:#333e8d;border:3px solid #fff;
        box-shadow:0 2px 8px rgba(0,0,0,0.35);
        color:#fff;font-weight:700;font-family:inherit;
        font-size:${count < 100 ? 13 : 12}px;
      ">${count}</div>`,
    iconSize: [size, size],
  });
}

const { BaseLayer } = LayersControl;

/* ── Severity colours ── */
const SEVERITY_COLOR: Record<string, string> = {
  low:      "#22c55e",
  medium:   "#f59e0b",
  high:     "#f97316",
  critical: "#e0001a",
};
const SEVERITY_BG: Record<string, string> = {
  low:      "#dcfce7",
  medium:   "#fef9c3",
  high:     "#ffedd5",
  critical: "#fee2e2",
};
const SEVERITY_TEXT: Record<string, string> = {
  low:      "#166534",
  medium:   "#713f12",
  high:     "#9a3412",
  critical: "#7f1d1d",
};

const SEVERITY_RANK: Record<string, number> = { low: 1, medium: 2, high: 3, critical: 4 };

/* ── Severity icon SVG for pin placeholder ── */
function severityIconSvg(severity: string, color: string): string {
  const attrs = `width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;
  switch (severity) {
    case "low":
      return `<svg ${attrs}><polyline points="20 6 9 17 4 12"/></svg>`;
    case "medium":
      return `<svg ${attrs}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
    case "high":
      return `<svg ${attrs}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
    default:
      return `<svg ${attrs}><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
  }
}

/* ── Photo-card marker icon ── */
function pinIcon(severity: string, photoUrl?: string | null) {
  const color = SEVERITY_COLOR[severity] ?? "#6b7280";
  const inner = photoUrl
    ? `<img src="${photoUrl}" style="width:100%;height:100%;object-fit:cover;display:block;" />`
    : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#f1f5f9;">
         ${severityIconSvg(severity, color)}
       </div>`;
  return L.divIcon({
    className: "",
    html: `
      <div style="width:50px;text-align:center;">
        <div style="
          width:46px;height:46px;background:#fff;
          border:3px solid ${color};border-radius:10px;
          overflow:hidden;box-shadow:0 3px 10px rgba(0,0,0,0.3);
        ">${inner}</div>
        <div style="
          width:0;height:0;
          border-left:7px solid transparent;
          border-right:7px solid transparent;
          border-top:8px solid ${color};
          margin:0 auto;margin-top:-1px;
        "></div>
      </div>`,
    iconSize: [50, 56],
    iconAnchor: [25, 56],
    popupAnchor: [0, -60],
  });
}

/* ── Keep tiles laid out as the container resizes, and frame Liberia once it has a real size ── */
function FitToLiberia() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    let framed = false;
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
      if (!framed && container.clientWidth > 0 && container.clientHeight > 0) {
        map.fitBounds(LIBERIA_BOUNDS, { padding: [24, 24] });
        framed = true;
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);
  return null;
}

/* ── Track active base layer so styles stay readable ── */
function LayerTracker({ onLayerChange }: { onLayerChange: (name: string) => void }) {
  const map = useMap();
  useEffect(() => {
    const handler = (e: L.LayersControlEvent) => onLayerChange(e.name);
    map.on("baselayerchange", handler);
    return () => { map.off("baselayerchange", handler); };
  }, [map, onLayerChange]);
  return null;
}

/* ── Per-county summary: report count and worst severity ── */
interface CountyStats { count: number; worst: string | null }

/* ── County label — name, plus a count badge coloured by worst severity ── */
function countyLabelIcon(name: string, stats: CountyStats) {
  const badge = stats.count > 0
    ? `<span style="
        display:inline-flex;align-items:center;justify-content:center;
        min-width:20px;height:20px;padding:0 6px;border-radius:10px;
        background:${SEVERITY_COLOR[stats.worst ?? ""] ?? "#333e8d"};color:#fff;
        font-size:11px;font-weight:700;">${stats.count}</span>`
    : "";
  const pill = stats.count > 0
    ? "background:#fff;border-radius:999px;padding:3px 4px 3px 10px;box-shadow:0 2px 8px rgba(18,20,28,0.18);cursor:pointer;"
    : "text-shadow:0 0 3px #fff,0 0 3px #fff,0 0 3px #fff;";
  return L.divIcon({
    className: "",
    html: `
      <div style="display:flex;justify-content:center;">
        <div style="display:inline-flex;align-items:center;gap:6px;white-space:nowrap;font-family:inherit;${pill}">
          <span style="font-size:11px;font-weight:600;letter-spacing:0.01em;color:${stats.count > 0 ? "#12141c" : "#4a4f63"};">${name}</span>
          ${badge}
        </div>
      </div>`,
    iconSize: [160, 26],
    iconAnchor: [80, 13],
  });
}

/* ── Counties: shaded polygons, labels when zoomed out, pins clustered per county when zoomed in ── */
function CountyLayers({ reportsByCounty, activeLayer }: {
  reportsByCounty: Record<LiberiaCounty, MapReport[]>;
  activeLayer: string;
}) {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());
  useMapEvents({ zoomend: () => setZoom(map.getZoom()) });
  const showPins = zoom >= PIN_ZOOM;

  const stats = useMemo(() => {
    const acc = {} as Record<LiberiaCounty, CountyStats>;
    for (const county of LIBERIA_COUNTIES) {
      const list = reportsByCounty[county];
      const worst = list.reduce<string | null>(
        (w, r) => (SEVERITY_RANK[r.severity] ?? 0) > (SEVERITY_RANK[w ?? ""] ?? 0) ? r.severity : w, null);
      acc[county] = { count: list.length, worst };
    }
    return acc;
  }, [reportsByCounty]);
  const maxCount = Math.max(1, ...Object.values(stats).map((s) => s.count));

  /* Zoom into a county, far enough that its pins show */
  const focusCounty = useCallback((name: LiberiaCounty) => {
    const feature = COUNTY_FEATURES.features.find((f) => f.properties.name === name);
    if (!feature) return;
    const bounds = L.geoJSON(feature).getBounds();
    const fit = map.getBoundsZoom(bounds, false, L.point(40, 40));
    map.flyTo(bounds.getCenter(), Math.max(fit, PIN_ZOOM), { duration: 0.8 });
  }, [map]);

  const isSat  = activeLayer === "Satellite";
  const isDark = activeLayer === "Dark";
  const accent = isSat || isDark ? "#ffffff" : "#333e8d";

  const fillFor = (name: LiberiaCounty) => {
    const { count } = stats[name];
    if (count === 0) return 0;
    const base = 0.1 + 0.3 * (count / maxCount);
    return showPins ? base * 0.4 : base;
  };

  return (
    <>
      <GeoJSON
        key={`counties-${activeLayer}-${showPins}-${maxCount}`}
        data={COUNTY_FEATURES}
        pane="counties-pane"
        style={(feature) => ({
          color:       isSat || isDark ? "#ffffff" : "#1e3a8a",
          weight:      1.25,
          opacity:     isSat ? 0.85 : 0.55,
          fillColor:   accent,
          fillOpacity: fillFor(feature?.properties.name),
        })}
        onEachFeature={(feature, layer) => {
          const name  = feature.properties.name as LiberiaCounty;
          const count = stats[name].count;
          const base  = fillFor(name);

          layer.bindTooltip(
            `<div style="font-family:inherit;white-space:nowrap;">
               <strong style="font-size:13px;color:#fff;">${name} County</strong>
               <div style="font-size:11px;color:rgba(255,255,255,0.7);margin-top:3px;">
                 <span style="color:#7b93ff;font-weight:700;">${count}</span>
                 &thinsp;report${count !== 1 ? "s" : ""}${count > 0 && !showPins ? " · click to view" : ""}
               </div>
             </div>`,
            { className: "nrf-county-tooltip", sticky: true, opacity: 1 },
          );

          layer.on({
            mouseover: (e: L.LeafletMouseEvent) => (e.target as L.Path).setStyle({ fillOpacity: base + 0.1, weight: 2 }),
            mouseout:  (e: L.LeafletMouseEvent) => (e.target as L.Path).setStyle({ fillOpacity: base, weight: 1.25 }),
            click:     () => focusCounty(name),
          });
        }}
      />

      {/* ── Town and road names — only once zoomed in, so they don't compete with county labels ── */}
      {showPins && activeLayer === "Clean" && (
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
          pane="place-names-pane"
          maxNativeZoom={16}
        />
      )}

      {/* ── County labels (zoomed out) ── */}
      {!showPins && LIBERIA_COUNTIES.map((name) => (
        <Marker
          key={`label-${name}-${stats[name].count}-${stats[name].worst}`}
          position={COUNTY_LABEL_POINTS[name]}
          icon={countyLabelIcon(name, stats[name])}
          pane="labels-pane"
          interactive={stats[name].count > 0}
          zIndexOffset={stats[name].count > 0 ? 1000 : 0}
          eventHandlers={{ click: () => focusCounty(name) }}
        />
      ))}

      {/* ── Report pins (zoomed in) — clustered only within their own county ── */}
      {showPins && LIBERIA_COUNTIES.filter((name) => stats[name].count > 0).map((name) => (
        <MarkerClusterGroup
          key={`cluster-${name}`}
          iconCreateFunction={createClusterIcon}
          maxClusterRadius={50}
          spiderfyOnMaxZoom
          showCoverageOnHover={false}
        >
          {reportsByCounty[name].map((report) => <ReportMarker key={report.id} report={report} />)}
        </MarkerClusterGroup>
      ))}
    </>
  );
}

/* ── Single report pin with photo popup ── */
function ReportMarker({ report }: { report: MapReport }) {
  return (
    <Marker
      position={[report.latitude, report.longitude]}
      icon={pinIcon(report.severity, report.cover_photo_url)}
    >
      <Popup className="nrf-popup" maxWidth={280} minWidth={240}>
        <div style={{ fontFamily: "inherit", borderRadius: 10, overflow: "hidden" }}>
          {report.cover_photo_url && (
            <div style={{ height: 150, overflow: "hidden" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={report.cover_photo_url}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            </div>
          )}
          <div style={{ padding: "12px 14px 14px" }}>
            <p style={{ fontWeight: 700, fontSize: 13, color: "#12141c", margin: "0 0 3px", lineHeight: 1.4 }}>
              {report.title ?? CONDITION_LABELS[report.condition_type as keyof typeof CONDITION_LABELS]}
            </p>
            <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 10px" }}>
              {report.community}, {report.county} County
            </p>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              background: SEVERITY_BG[report.severity]   ?? "#f3f4f6",
              color:      SEVERITY_TEXT[report.severity] ?? "#374151",
              borderRadius: 4, padding: "3px 8px",
              fontSize: 11, fontWeight: 700, marginBottom: 12,
            }}>
              <span style={{
                width: 7, height: 7, borderRadius: "50%",
                background: SEVERITY_COLOR[report.severity] ?? "#6b7280",
                display: "inline-block", flexShrink: 0,
              }} />
              {SEVERITY_LABELS[report.severity as keyof typeof SEVERITY_LABELS]} severity
            </span>
            <a
              href={`/reports/${report.reference_number}`}
              style={{
                display: "block", textAlign: "center",
                background: "#333e8d", color: "#fff",
                borderRadius: 6, padding: "7px 12px",
                fontSize: 12, fontWeight: 600, textDecoration: "none",
              }}
            >
              View full report →
            </a>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

/* ── Outside-Liberia mask — world box with Liberia cut out, as Leaflet [lat, lng] rings ── */
const MASK_RINGS: [number, number][][] = [
  [[-5, -25], [-5, 15], [25, 15], [25, -25]],
  ...LIBERIA_OUTLINE.geometry.coordinates.map((poly) => poly[0].map(([lng, lat]) => [lat, lng] as [number, number])),
];

/* ── Main export ── */
export function LeafletMap({ reports }: { reports: MapReport[] }) {
  const [activeLayer,  setActiveLayer]  = useState("Clean");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  /* Group reports by the county their GPS falls in, falling back to the county they picked */
  const reportsByCounty = useMemo(() => {
    const acc = Object.fromEntries(LIBERIA_COUNTIES.map((c) => [c, [] as MapReport[]])) as Record<LiberiaCounty, MapReport[]>;
    for (const r of reports) {
      const county = countyAt(r.latitude, r.longitude) ?? (LIBERIA_COUNTIES.includes(r.county as LiberiaCounty) ? r.county as LiberiaCounty : null);
      if (county) acc[county].push(r);
    }
    return acc;
  }, [reports]);

  const handleLayerChange = useCallback((name: string) => setActiveLayer(name), []);

  const toggleFullscreen = useCallback(() => {
    const el = wrapperRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, []);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  return (
    <div ref={wrapperRef} className="relative h-full w-full">
      {/* Fullscreen toggle button */}
      <button
        onClick={toggleFullscreen}
        title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        style={{
          position: "absolute", bottom: 32, right: 10, zIndex: 1000,
          background: "#fff", border: "2px solid rgba(0,0,0,0.2)",
          borderRadius: 4, width: 30, height: 30,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
        }}
      >
        {isFullscreen ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/>
            <path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/>
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7V3h4"/><path d="M21 7V3h-4"/>
            <path d="M3 17v4h4"/><path d="M21 17v4h-4"/>
          </svg>
        )}
      </button>
    <MapContainer
      bounds={LIBERIA_BOUNDS}
      minZoom={6}
      maxZoom={17}
      maxBounds={[[1, -16], [12, -3]]}
      maxBoundsViscosity={0.8}
      zoomSnap={0.25}
      style={{ height: "100%", width: "100%", minHeight: 400 }}
      scrollWheelZoom
    >
      {/* ── Custom panes — control rendering order ── */}
      <Pane name="mask-pane"     style={{ zIndex: 350 }} />
      <Pane name="outline-pane"  style={{ zIndex: 360 }} />
      <Pane name="counties-pane" style={{ zIndex: 400 }} />
      <Pane name="place-names-pane" style={{ zIndex: 420, pointerEvents: "none" }} />
      <Pane name="labels-pane"   style={{ zIndex: 450 }} />

      {/* ── Base tile layers ── */}
      <LayersControl position="topright">
        <BaseLayer checked name="Clean">
          <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}" attribution="Tiles &copy; Esri" maxNativeZoom={16} />
        </BaseLayer>
        <BaseLayer name="Street">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" maxZoom={19} />
        </BaseLayer>
        <BaseLayer name="Dark">
          <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}" attribution="Tiles &copy; Esri" maxNativeZoom={16} />
        </BaseLayer>
        <BaseLayer name="Terrain">
          <TileLayer url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png" attribution="" maxZoom={17} />
        </BaseLayer>
        <BaseLayer name="Satellite">
          <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution="Imagery &copy; Esri" maxZoom={19} />
        </BaseLayer>
      </LayersControl>

      <FitToLiberia />
      <LayerTracker onLayerChange={handleLayerChange} />

      {/* ── Outside-Liberia mask — world box with Liberia cut out (Leaflet evenodd fill) ── */}
      <Polygon
        pane="mask-pane"
        positions={MASK_RINGS}
        interactive={false}
        pathOptions={{
          fillColor:   activeLayer === "Dark" ? "#0b0d12" : "#d9d6cf",
          fillOpacity: 0.85,
          color:       "transparent",
          weight:      0,
        }}
      />

      {/* ── Liberia country outline ── */}
      <GeoJSON
        key={`outline-${activeLayer}`}
        data={LIBERIA_OUTLINE}
        pane="outline-pane"
        interactive={false}
        style={() =>
          activeLayer === "Dark"
            ? { color: "#e2e8f0", weight: 3, opacity: 1, fillOpacity: 0 }
            : activeLayer === "Satellite"
            ? { color: "#ffffff", weight: 3, opacity: 1, fillOpacity: 0 }
            : { color: "#1e3a8a", weight: 3, opacity: 0.9, fillColor: "#ffffff", fillOpacity: 0.25 }
        }
      />

      {/* ── Counties, labels and report pins ── */}
      <CountyLayers reportsByCounty={reportsByCounty} activeLayer={activeLayer} />
    </MapContainer>
    </div>
  );
}
