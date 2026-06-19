"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  MapContainer, TileLayer, Marker, Popup, Pane,
  LayersControl, GeoJSON, useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import type { MapReport } from "@/app/(public)/map/page";
import { CONDITION_LABELS, SEVERITY_LABELS } from "@/lib/types";

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

/* ── Photo-card marker icon ── */
function pinIcon(severity: string, photoUrl?: string | null) {
  const color = SEVERITY_COLOR[severity] ?? "#6b7280";
  const inner = photoUrl
    ? `<img src="${photoUrl}" style="width:100%;height:100%;object-fit:cover;display:block;" />`
    : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#f1f5f9;">
         <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
              stroke="${color}" stroke-width="1.6"
              stroke-linecap="round" stroke-linejoin="round">
           <rect x="3" y="3" width="18" height="18" rx="2"/>
           <circle cx="8.5" cy="8.5" r="1.5"/>
           <polyline points="21,15 16,10 5,21"/>
         </svg>
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

/* ── Force correct tile layout after mount ── */
function SizeInvalidator() {
  const map = useMap();
  useEffect(() => { map.invalidateSize(); }, [map]);
  return null;
}

/* ── Snap map to Liberia on first load ── */
function LiberiaBoundsController() {
  const map = useMap();
  useEffect(() => {
    map.setView([6.45, -9.43], 8);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
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

/* ── Interactive county layer: hover tooltip + click popup ── */
function CountyLayer({
  borders,
  activeLayer,
  countyCounts,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  borders: any;
  activeLayer: string;
  countyCounts: Record<string, number>;
}) {
  if (!borders) return null;

  const isSat       = activeLayer === "Satellite";
  const borderColor = isSat ? "#ffffff" : "#1e3a8a";
  const hoverFill   = isSat ? "#ffffff" : "#333e8d";

  return (
    <GeoJSON
      key={`counties-${activeLayer}`}
      data={borders}
      pane="counties-pane"
      style={() => ({
        color:       borderColor,
        weight:      1.5,
        opacity:     isSat ? 0.85 : 0.7,
        fillColor:   hoverFill,
        fillOpacity: 0,
      })}
      onEachFeature={(feature, layer) => {
        const name  = feature.properties?.NAME_1 ?? "Unknown";
        const count = countyCounts[name] ?? 0;

        /* Dark sticky tooltip — follows cursor */
        layer.bindTooltip(
          `<div style="font-family:inherit;white-space:nowrap;">
             <strong style="font-size:13px;color:#fff;">${name} County</strong>
             <div style="font-size:11px;color:rgba(255,255,255,0.7);margin-top:3px;">
               <span style="color:#7b93ff;font-weight:700;">${count}</span>
               &thinsp;report${count !== 1 ? "s" : ""}
             </div>
           </div>`,
          { className: "nrf-county-tooltip", sticky: true, opacity: 1 }
        );

        /* Click popup with action */
        layer.bindPopup(
          `<div style="font-family:inherit;min-width:170px;padding:2px 0;">
             <p style="font-weight:700;font-size:14px;color:#12141c;margin:0 0 5px;">${name} County</p>
             <p style="font-size:12px;color:#4a4f63;margin:0 0 12px;">
               <span style="color:#333e8d;font-weight:700;">${count}</span>
               &nbsp;road report${count !== 1 ? "s" : ""}
             </p>
             <a href="/reports"
                style="display:block;text-align:center;background:#333e8d;color:#fff;
                       border-radius:6px;padding:7px 12px;font-size:12px;
                       font-weight:600;text-decoration:none;">
               Browse reports →
             </a>
           </div>`,
          { closeButton: false }
        );

        /* Highlight fill on hover */
        layer.on({
          mouseover(e: L.LeafletMouseEvent) {
            (e.target as L.Path).setStyle({ fillOpacity: 0.14 });
          },
          mouseout(e: L.LeafletMouseEvent) {
            (e.target as L.Path).setStyle({ fillOpacity: 0 });
          },
        });
      }}
    />
  );
}

/* ── Main export ── */
export function LeafletMap({ reports }: { reports: MapReport[] }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [borders, setBorders] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [mask,    setMask]    = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [outline, setOutline] = useState<any>(null);
  const [activeLayer, setActiveLayer] = useState("Street");

  /* Count reports per county to display in county popups */
  const countyCounts = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const r of reports) acc[r.county] = (acc[r.county] ?? 0) + 1;
    return acc;
  }, [reports]);

  useEffect(() => {
    /* World-minus-Liberia mask + country outline */
    fetch("https://geodata.ucdavis.edu/gadm/gadm4.1/json/gadm41_LBR_0.json")
      .then((r) => r.json())
      .then((data) => {
        const feature = (data.features ?? [data])[0];
        const geom = feature?.geometry;
        if (!geom) return;
        // Save raw feature for the country outline
        setOutline({ type: "Feature", geometry: geom, properties: {} });
        // Build world-minus-Liberia mask
        const worldRing: [number, number][] = [
          [-180, -90], [180, -90], [180, 90], [-180, 90], [-180, -90],
        ];
        const holes: [number, number][][] =
          geom.type === "Polygon"
            ? [geom.coordinates[0]]
            : geom.coordinates.map((poly: [number, number][][]) => poly[0]);
        setMask({
          type: "Feature",
          geometry: { type: "Polygon", coordinates: [worldRing, ...holes] },
          properties: {},
        });
      })
      .catch(() => {});

    /* County borders + polygons */
    fetch("https://geodata.ucdavis.edu/gadm/gadm4.1/json/gadm41_LBR_1.json")
      .then((r) => r.json())
      .then(setBorders)
      .catch(() => {});
  }, []);

  const handleLayerChange = useCallback((name: string) => setActiveLayer(name), []);

  return (
    <MapContainer
      center={[6.5, -9.4]}
      zoom={7}
      minZoom={6}
      maxZoom={17}
      maxBounds={[[3.8, -12.2], [8.9, -6.8]]}
      maxBoundsViscosity={1.0}
      style={{ height: "100%", width: "100%", minHeight: 400 }}
      scrollWheelZoom
    >
      {/* ── Custom panes — control rendering order ── */}
      <Pane name="mask-pane"     style={{ zIndex: 350 }} />
      <Pane name="outline-pane"  style={{ zIndex: 360 }} />
      <Pane name="counties-pane" style={{ zIndex: 400 }} />
      <Pane name="reports-pane"  style={{ zIndex: 600 }} />

      {/* ── Base tile layers ── */}
      <LayersControl position="topright">
        <BaseLayer checked name="Street">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="" maxZoom={19} />
        </BaseLayer>
        <BaseLayer name="Light">
          <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution="" maxZoom={19} />
        </BaseLayer>
        <BaseLayer name="Dark">
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="" maxZoom={19} />
        </BaseLayer>
        <BaseLayer name="Terrain">
          <TileLayer url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png" attribution="" maxZoom={17} />
        </BaseLayer>
        <BaseLayer name="Satellite">
          <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution="" maxZoom={19} />
        </BaseLayer>
      </LayersControl>

      <SizeInvalidator />
      <LiberiaBoundsController />
      <LayerTracker onLayerChange={handleLayerChange} />

      {/* ── Outside-Liberia mask ── */}
      {mask && (
        <GeoJSON
          key="mask"
          data={mask}
          pane="mask-pane"
          style={() => ({
            fillColor:   "#f8f9f5",
            fillOpacity: 1,
            color:       "transparent",
            weight:      0,
          })}
        />
      )}

      {/* ── Liberia country outline ── */}
      {outline && (
        <GeoJSON
          key={`outline-${activeLayer}`}
          data={outline}
          pane="outline-pane"
          interactive={false}
          style={() =>
            activeLayer === "Dark"
              ? { color: "#94a3b8", weight: 2.5, opacity: 0.9, fillOpacity: 0 }
              : activeLayer === "Satellite"
              ? { color: "#ffffff", weight: 2.5, opacity: 0.9, fillOpacity: 0 }
              : { color: "#1e3a5f", weight: 2.5, opacity: 0.85, fillColor: "#e8e4dc", fillOpacity: 0.12 }
          }
        />
      )}

      {/* ── County polygons — hover + click interactive ── */}
      <CountyLayer
        borders={borders}
        activeLayer={activeLayer}
        countyCounts={countyCounts}
      />

      {/* ── Report markers ── */}
      {reports.map((report) => (
        <Marker
          key={report.id}
          pane="reports-pane"
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
      ))}
    </MapContainer>
  );
}
