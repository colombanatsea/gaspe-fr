"use client";

import { useEffect, useImperativeHandle, forwardRef, useState, useRef } from "react";
import type { Member } from "@/types";
import { cn } from "@/lib/utils";

// DOM-TOM quick-fly destinations
const VIEWS = [
  { label: "France", lat: 46.6, lng: 2.2, zoom: 6 },
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
    const mapRef = useRef<any>(null);
    const markersRef = useRef<Map<string, any>>(new Map());

    useImperativeHandle(ref, () => ({
      flyToMember(member: Member) {
        const map = mapRef.current;
        if (!map) return;
        // Zoom to member location
        const zoom = member.territory === "dom-tom" ? 11 : 12;
        map.flyTo([member.latitude, member.longitude], zoom, { duration: 1.2 });
        // Open popup
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
        if (!container || (container as any)._leaflet_id) return;

        const map = L.map(container, {
          center: [46.6, 2.2],
          zoom: 6,
          zoomControl: false,
          scrollWheelZoom: true,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> &copy; <a href="https://www.openstreetmap.fr/">OSM France</a>',
          subdomains: "abc",
          maxZoom: 19,
        }).addTo(map);

        L.control.zoom({ position: "topright" }).addTo(map);

        function createIcon(isDomTom: boolean, isAssociate: boolean) {
          const color = isDomTom ? "#2F72A0" : "#1B7E8A";
          const size = isAssociate ? 10 : 14;
          const borderWidth = isAssociate ? 1.5 : 2;
          return L.divIcon({
            className: "gaspe-marker",
            html: `<div style="
              width:${size}px;height:${size}px;
              background:${color};
              border:${borderWidth}px solid white;
              border-radius:50%;
              box-shadow:0 2px 6px rgba(0,0,0,0.3);
            "></div>`,
            iconSize: [size + 4, size + 4],
            iconAnchor: [(size + 4) / 2, (size + 4) / 2],
          });
        }

        members.forEach((member) => {
          const icon = createIcon(member.territory === "dom-tom", member.category === "associe");
          const marker = L.marker([member.latitude, member.longitude], { icon });

          const logoHtml = member.logoUrl
            ? `<img src="${member.logoUrl}" alt="${member.name}" style="max-height:32px;max-width:120px;object-fit:contain;margin-bottom:6px;" />`
            : "";
          const categoryLabel = member.category === "titulaire" ? "Titulaire" : "Associé";
          const categoryColor = member.category === "titulaire" ? "#1B7E8A" : "#2F72A0";

          marker.bindPopup(`
            <div style="font-family:var(--font-body);min-width:180px;">
              ${logoHtml}
              <div style="font-weight:600;font-size:13px;color:#222221;">${member.name}</div>
              <div style="font-size:11px;color:#6B6560;margin-top:2px;">
                ${member.city} &middot; ${member.region}
              </div>
              <span style="
                display:inline-block;margin-top:6px;
                font-size:10px;font-weight:600;color:white;
                background:${categoryColor};
                padding:2px 8px;border-radius:9999px;
              ">${categoryLabel}</span>
              ${member.territory === "dom-tom" ? '<span style="display:inline-block;margin-top:6px;margin-left:4px;font-size:10px;font-weight:600;color:white;background:#EFCA8F;padding:2px 8px;border-radius:9999px;">Outre-mer</span>' : ""}
            </div>
          `, { closeButton: true, maxWidth: 260 });

          marker.addTo(map);
          markersRef.current.set(member.slug, marker);
        });

        mapRef.current = map;
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

    return (
      <div className={cn("relative isolate z-0", className)}>
        <div id="gaspe-member-map" className="w-full h-full" style={{ minHeight: 400 }} />

        <div className="absolute bottom-4 left-4 z-[500] flex flex-col gap-2">
          {VIEWS.map((view) => (
            <button
              key={view.label}
              onClick={() => flyTo(view.lat, view.lng, view.zoom)}
              className="rounded-md bg-background/90 backdrop-blur-sm px-3 py-1.5 text-xs font-medium text-foreground shadow-md hover:bg-background transition-colors border border-border-light"
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
