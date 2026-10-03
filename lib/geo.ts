import { LIBERIA_COUNTIES, type LiberiaCounty } from "@/lib/counties";
import COUNTY_BOUNDARIES from "@/lib/liberia-counties.json";
import COUNTRY_OUTLINE from "@/lib/liberia-outline.json";

/* County boundaries from GADM 4.1 (level 1), as [lng, lat] rings per polygon. */
type Ring = number[][];
const BOUNDARIES = COUNTY_BOUNDARIES as Record<LiberiaCounty, Ring[][]>;

// The boundary data is coarse along the coast and borders, so a road just past
// a line still counts. ~2 km in degrees at Liberia's latitude.
const EDGE_TOLERANCE_DEG = 0.018;

function inRing(lng: number, lat: number, ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function distToSegment(px: number, py: number, [ax, ay]: number[], [bx, by]: number[]): number {
  const dx = bx - ax, dy = by - ay;
  const t = dx || dy ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy))) : 0;
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/** The county containing the point, or the nearest one within ~2 km. Null when outside Liberia. */
export function countyAt(lat: number, lng: number): LiberiaCounty | null {
  let nearest: LiberiaCounty | null = null;
  let nearestDist = EDGE_TOLERANCE_DEG;

  for (const county of LIBERIA_COUNTIES) {
    for (const [outer, ...holes] of BOUNDARIES[county]) {
      if (inRing(lng, lat, outer) && !holes.some((h) => inRing(lng, lat, h))) return county;
      for (let i = 1; i < outer.length; i++) {
        const d = distToSegment(lng, lat, outer[i - 1], outer[i]);
        if (d < nearestDist) { nearestDist = d; nearest = county; }
      }
    }
  }
  return nearest;
}

/** Liberia's national border (GADM 4.1 level 0) as a GeoJSON feature. */
export const LIBERIA_OUTLINE: GeoJSON.Feature<GeoJSON.MultiPolygon> = {
  type: "Feature",
  properties: {},
  geometry: { type: "MultiPolygon", coordinates: COUNTRY_OUTLINE as number[][][][] },
};

/** Southwest and northeast corners of Liberia, as [lat, lng]. */
export const LIBERIA_BOUNDS: [[number, number], [number, number]] = [[4.35, -11.5], [8.55, -7.37]];

/** County boundaries as a GeoJSON FeatureCollection with `properties.name`. */
export const COUNTY_FEATURES: GeoJSON.FeatureCollection<GeoJSON.MultiPolygon, { name: LiberiaCounty }> = {
  type: "FeatureCollection",
  features: LIBERIA_COUNTIES.map((name) => ({
    type: "Feature",
    properties: { name },
    geometry: { type: "MultiPolygon", coordinates: BOUNDARIES[name] },
  })),
};

/** A point well inside each county (pole of inaccessibility), as [lat, lng], for labels. */
export const COUNTY_LABEL_POINTS: Record<LiberiaCounty, [number, number]> = {
  "Bomi":             [6.705, -10.84],
  "Bong":             [6.948, -9.513],
  "Gbarpolu":         [7.459, -10.294],
  "Grand Bassa":      [6.195, -9.913],
  "Grand Cape Mount": [7.24, -10.922],
  "Grand Gedeh":      [5.962, -8.142],
  "Grand Kru":        [4.823, -8.243],
  "Lofa":             [8.107, -9.878],
  "Margibi":          [6.649, -10.204],
  "Maryland":         [4.707, -7.685],
  "Montserrado":      [6.616, -10.486],
  "Nimba":            [6.933, -8.687],
  "River Gee":        [5.361, -8.035],
  "River Cess":       [5.917, -9.345],
  "Sinoe":            [5.299, -8.687],
};

export const OUTSIDE_LIBERIA_MESSAGE =
  "Your location appears to be outside Liberia. Turn off any VPN and try again on your phone.";
