"use client";

import { useEffect, useImperativeHandle, forwardRef, useState, useRef } from "react";
import type { Member } from "@/types";
import { cn } from "@/lib/utils";

// DOM-TOM quick-fly destinations — zoom 6 pour la vue France donne le meilleur
// rapport contexte mer / identification des sites littoraux.
const DEFAULT_CENTER: [number, number] = [46.8, -1.8];
const DEFAULT_ZOOM = 6;

// Bounding box de l'hexagone — utilisé par `fitBounds` au chargement pour
// s'adapter à la hauteur réelle du conteneur (sinon, sur grand écran avec
// un panneau plein-hauteur, le zoom 6 fixe déborde jusqu'en mer du Nord).
// Coins SW (Pyrénées orientales) → NE (Dunkerque / Ardennes).
const METROPOLE_BOUNDS: [[number, number], [number, number]] = [
  [42.5, -5.0],
  [51.0, 8.5],
];

type View =
  | { label: string; fitBounds: true }
  | { label: string; lat: number; lng: number; zoom: number };

const VIEWS: View[] = [
  { label: "France", fitBounds: true },
  { label: "Guadeloupe", lat: 16.0, lng: -61.6, zoom: 10 },
  { label: "Martinique", lat: 14.6, lng: -61.0, zoom: 11 },
  { label: "Mayotte", lat: -12.8, lng: 45.2, zoom: 11 },
  { label: "St-Pierre-et-Miquelon", lat: 46.9, lng: -56.3, zoom: 10 },
];

export interface MemberMapHandle {
  flyToMember: (member: Member) => void;
}

interface MemberMapProps {
  members: Member[];
  className?: string;
}

export const MemberMap = forwardRef<MemberMapHandle, MemberMapProps>(
  function MemberMap({ members, className }, ref) {
    const [mapReady, setMapReady] = useState(false);
    const mapRef = useRef<import("leaflet").Map | null>(null);
    const markersRef = useRef<Map<string, import("leaflet").Marker>>(new Map());

    useImperativeHandle(ref, () => ({
      flyToMember(member: Member) {
        const map = mapRef.current;
        if (!map) return;
        const zoom = member.territory === "dom-tom" ? 11 : 12;
        map.flyTo([member.latitude, member.longitude], zoom, { duration: 1.2 });
        const marker = markersRef.current.get(member.slug);
        if (marker) {
          setTimeout(() => marker.openPopup(), 800);
        }
      },
    }));

    useEffect(() => {
      let cancelled = false;

      async function loadMap() {
        const L = (await import("leaflet")).default;
        await import("leaflet/dist/leaflet.css");

        if (cancelled) return;

        const container = document.getElementById("gaspe-member-map");
        if (!container || (container as HTMLElement & { _leaflet_id?: number })._leaflet_id) return;

        const map = L.map(container, {
          center: DEFAULT_CENTER,
          zoom: DEFAULT_ZOOM,
          minZoom: 3,
          maxZoom: 13, // limite d'Esri Ocean Base
          zoomControl: false,
          scrollWheelZoom: true,
          worldCopyJump: true,
        });

        // Fond Esri World Ocean Base — mise en valeur de la mer (bathymétrie
        // visible : plateau continental, fosses) et terre en gris très clair
        // sans aucune route. Idéal pour un site maritime.
        L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}",
          {
            attribution:
              "Tiles &copy; Esri &mdash; Sources: GEBCO, NOAA, National Geographic, DeLorme, HERE, Geonames.org",
            maxZoom: 13,
          },
        ).addTo(map);

        L.control.zoom({ position: "topright" }).addTo(map);

        function createIcon(isDomTom: boolean, isAssociate: boolean) {
          const color = isDomTom ? "var(--gaspe-blue-600)" : "var(--gaspe-teal-600)";
          const size = isAssociate ? 12 : 16;
          return L.divIcon({
            className: "gaspe-marker",
            html: `<div style="
              width:${size}px;height:${size}px;
              background:${color};
              border:2.5px solid white;
              border-radius:50%;
              box-shadow:0 2px 8px rgba(27,126,138,0.35);
              transition: transform 0.2s;
            "></div>`,
            iconSize: [size + 6, size + 6],
            iconAnchor: [(size + 6) / 2, (size + 6) / 2],
          });
        }

        members.forEach((member) => {
          const icon = createIcon(member.territory === "dom-tom", member.category === "associe");
          const marker = L.marker([member.latitude, member.longitude], { icon });

          const logoHtml = member.logoUrl
            ? `<img src="${member.logoUrl}" alt="${member.name}" style="max-height:36px;max-width:130px;object-fit:contain;margin-bottom:8px;" />`
            : "";
          const categoryLabel = member.category === "titulaire" ? "Titulaire" : "Associé";
          const categoryColor = member.category === "titulaire" ? "var(--gaspe-teal-600)" : "var(--gaspe-blue-600)";

          marker.bindPopup(`
            <div style="font-family:'DM Sans',system-ui,sans-serif;min-width:200px;padding:12px;">
              ${logoHtml}
              <div style="font-weight:600;font-size:14px;color:var(--gaspe-neutral-900);line-height:1.3;">${member.name}</div>
              <div style="font-size:12px;color:var(--gaspe-neutral-600);margin-top:4px;">
                ${member.city} &middot; ${member.region}
              </div>
              <div style="margin-top:8px;display:flex;gap:4px;flex-wrap:wrap;">
                <span style="
                  display:inline-block;
                  font-size:10px;font-weight:600;color:white;
                  background:${categoryColor};
                  padding:3px 10px;border-radius:9999px;
                ">${categoryLabel}</span>
                ${member.territory === "dom-tom" ? '<span style="display:inline-block;font-size:10px;font-weight:600;color:var(--gaspe-neutral-900);background:var(--gaspe-warm-300);padding:3px 10px;border-radius:9999px;">Outre-mer</span>' : ""}
              </div>
              ${member.websiteUrl ? `<a href="${member.websiteUrl}" target="_blank" rel="noopener" style="display:inline-block;margin-top:8px;font-size:11px;color:var(--gaspe-teal-600);text-decoration:none;font-weight:500;">Visiter le site &rarr;</a>` : ""}
            </div>
          `, { closeButton: true, maxWidth: 280 });

          marker.addTo(map);
          markersRef.current.set(member.slug, marker);
        });

        mapRef.current = map;
        map.whenReady(() => {
          setTimeout(() => {
            map.invalidateSize();
            // Ajuste le cadrage aux dimensions réelles du conteneur pour que
            // l'hexagone soit toujours visible en entier, quelle que soit la
            // hauteur du panneau (évite le débordement en mer du Nord sur
            // les grands écrans). `maxZoom` empêche de zoomer trop près sur
            // petits conteneurs ; `padding` laisse une marge littorale.
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

    function flyTo(lat: number, lng: number, zoom: number) {
      mapRef.current?.flyTo([lat, lng], zoom, { duration: 1.5 });
    }

    function flyToMetropole() {
      mapRef.current?.flyToBounds(METROPOLE_BOUNDS, {
        padding: [20, 20],
        maxZoom: DEFAULT_ZOOM,
        duration: 1.5,
      });
    }

    return (
      <div className={cn("relative isolate z-0", className)}>
        <div id="gaspe-member-map" className="w-full h-full" style={{ minHeight: 400 }} />

        {/* Territory buttons */}
        <div className="absolute bottom-4 left-4 z-[500] flex flex-wrap gap-2">
          {VIEWS.map((view) => (
            <button
              key={view.label}
              onClick={() =>
                "fitBounds" in view
                  ? flyToMetropole()
                  : flyTo(view.lat, view.lng, view.zoom)
              }
              className="rounded-xl bg-white/95 backdrop-blur-sm px-3.5 py-2 text-xs font-semibold text-foreground shadow-lg hover:bg-white hover:shadow-xl transition-all border border-[var(--gaspe-neutral-200)]"
            >
              {view.label}
            </button>
          ))}
        </div>

        {!mapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface z-[500]">
            <div className="text-center">
              <div className="h-8 w-8 mx-auto border-2 border-[var(--gaspe-teal-400)] border-t-transparent rounded-full animate-spin" />
              <p className="mt-3 text-xs text-foreground-muted">Chargement de la carte...</p>
            </div>
          </div>
        )}
      </div>
    );
  },
);
