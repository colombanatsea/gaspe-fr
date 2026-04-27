"use client";

import { useEffect, useRef, useState } from "react";
import type { School } from "@/data/schools";
import { cn } from "@/lib/utils";

const DEFAULT_CENTER: [number, number] = [46.8, -1.8];
const DEFAULT_ZOOM = 6;
const METROPOLE_BOUNDS: [[number, number], [number, number]] = [
  [42.5, -5.0],
  [51.0, 8.5],
];

interface SchoolMapProps {
  schools: School[];
  className?: string;
}

/**
 * Carte interactive Leaflet des écoles maritimes (LPM + ENSM).
 * Pattern repris de `MemberMap` : lazy-load via `import("leaflet")`,
 * fond Esri Ocean Base, marqueurs custom (teal pour LPM, blue pour ENSM).
 */
export function SchoolMap({ schools, className }: SchoolMapProps) {
  const [mapReady, setMapReady] = useState(false);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const layersRef = useRef<Map<string, import("leaflet").Marker>>(new Map());

  useEffect(() => {
    let cancelled = false;

    async function loadMap() {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (cancelled) return;

      const container = document.getElementById("gaspe-school-map");
      if (
        !container ||
        (container as HTMLElement & { _leaflet_id?: number })._leaflet_id
      )
        return;

      const map = L.map(container, {
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        minZoom: 3,
        maxZoom: 13,
        zoomControl: false,
        scrollWheelZoom: true,
        worldCopyJump: true,
      });

      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}",
        {
          attribution:
            "Tiles &copy; Esri &mdash; Sources: GEBCO, NOAA, National Geographic, DeLorme, HERE, Geonames.org",
          maxZoom: 13,
        },
      ).addTo(map);

      L.control.zoom({ position: "topright" }).addTo(map);

      function createIcon(kind: "lpm" | "ensm") {
        const isEnsm = kind === "ensm";
        const color = isEnsm
          ? "var(--gaspe-blue-600)"
          : "var(--gaspe-teal-600)";
        const size = isEnsm ? 20 : 16;
        const symbol = isEnsm ? "★" : "●";
        return L.divIcon({
          className: "gaspe-school-marker",
          html: `<div style="
            display:flex;align-items:center;justify-content:center;
            width:${size}px;height:${size}px;
            background:${color};
            border:2.5px solid white;
            border-radius:50%;
            box-shadow:0 2px 8px rgba(27,126,138,0.35);
            color:white;font-size:${isEnsm ? 11 : 9}px;font-weight:700;
            line-height:1;
          ">${symbol}</div>`,
          iconSize: [size + 6, size + 6],
          iconAnchor: [(size + 6) / 2, (size + 6) / 2],
        });
      }

      schools.forEach((school) => {
        const icon = createIcon(school.kind);
        const marker = L.marker([school.lat, school.lng], { icon });

        const kindLabel =
          school.kind === "lpm" ? "Lycée Pro Maritime" : "ENSM";
        const kindColor =
          school.kind === "lpm"
            ? "var(--gaspe-teal-600)"
            : "var(--gaspe-blue-600)";

        const formationsHtml = school.formations
          .slice(0, 3)
          .map(
            (f) =>
              `<li style="font-size:11px;color:var(--gaspe-neutral-700);margin-top:2px;">&middot; ${f.title}</li>`,
          )
          .join("");

        marker.bindPopup(
          `
          <div style="font-family:'DM Sans',system-ui,sans-serif;min-width:240px;padding:14px;">
            <div style="display:inline-block;font-size:10px;font-weight:700;color:white;background:${kindColor};padding:3px 10px;border-radius:9999px;margin-bottom:8px;">${kindLabel}</div>
            <div style="font-weight:600;font-size:14px;color:var(--gaspe-neutral-900);line-height:1.3;">${school.shortName}</div>
            <div style="font-size:12px;color:var(--gaspe-neutral-600);margin-top:4px;">
              ${school.city} &middot; ${school.region}
            </div>
            ${
              school.description
                ? `<p style="font-size:11px;color:var(--gaspe-neutral-700);margin-top:8px;line-height:1.5;">${school.description}</p>`
                : ""
            }
            <ul style="list-style:none;padding:0;margin:8px 0 0;">${formationsHtml}</ul>
            <a href="${school.website}" target="_blank" rel="noopener" style="display:inline-block;margin-top:10px;font-size:11px;color:var(--gaspe-teal-600);text-decoration:none;font-weight:600;">
              Site officiel &rarr;
            </a>
          </div>
        `,
          { closeButton: true, maxWidth: 300 },
        );

        marker.addTo(map);
        layersRef.current.set(school.slug, marker);
      });

      mapRef.current = map;
      map.whenReady(() => {
        setTimeout(() => {
          map.invalidateSize();
          map.fitBounds(METROPOLE_BOUNDS, {
            padding: [20, 20],
            maxZoom: DEFAULT_ZOOM,
            animate: false,
          });
        }, 200);
      });
      setMapReady(true);
    }

    loadMap();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Met à jour la visibilité des marqueurs quand `schools` change (filtres).
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const visibleSlugs = new Set(schools.map((s) => s.slug));
    layersRef.current.forEach((marker, slug) => {
      if (visibleSlugs.has(slug)) {
        if (!map.hasLayer(marker)) marker.addTo(map);
      } else {
        if (map.hasLayer(marker)) map.removeLayer(marker);
      }
    });
  }, [schools]);

  return (
    <div className={cn("relative isolate z-0", className)}>
      <div
        id="gaspe-school-map"
        className="w-full h-full rounded-2xl overflow-hidden"
        style={{ minHeight: 480 }}
      />
      {!mapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface rounded-2xl z-[500]">
          <div className="text-center">
            <div className="h-8 w-8 mx-auto border-2 border-[var(--gaspe-teal-400)] border-t-transparent rounded-full animate-spin" />
            <p className="mt-3 text-xs text-foreground-muted">
              Chargement de la carte des écoles…
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
