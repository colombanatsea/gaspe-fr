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
        if (!container || (container as any)._leaflet_id) return;

        const map = L.map(container, {
          center: [46.6, 2.2],
          zoom: 6,
          zoomControl: false,
          scrollWheelZoom: true,
        });

        // Minimal tile layer — CartoDB Positron no labels (coastlines + water only)
        L.tileLayer("https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 19,
        }).addTo(map);

        L.control.zoom({ position: "topright" }).addTo(map);

        function createIcon(isDomTom: boolean, isAssociate: boolean) {
          const color = isDomTom ? "#2F72A0" : "#1B7E8A";
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
          const categoryColor = member.category === "titulaire" ? "#1B7E8A" : "#2F72A0";

          marker.bindPopup(`
            <div style="font-family:'DM Sans',system-ui,sans-serif;min-width:200px;padding:12px;">
              ${logoHtml}
              <div style="font-weight:600;font-size:14px;color:#222221;line-height:1.3;">${member.name}</div>
              <div style="font-size:12px;color:#6B6560;margin-top:4px;">
                ${member.city} &middot; ${member.region}
              </div>
              <div style="margin-top:8px;display:flex;gap:4px;flex-wrap:wrap;">
                <span style="
                  display:inline-block;
                  font-size:10px;font-weight:600;color:white;
                  background:${categoryColor};
                  padding:3px 10px;border-radius:9999px;
                ">${categoryLabel}</span>
                ${member.territory === "dom-tom" ? '<span style="display:inline-block;font-size:10px;font-weight:600;color:#222;background:#EFCA8F;padding:3px 10px;border-radius:9999px;">Outre-mer</span>' : ""}
              </div>
              ${member.websiteUrl ? `<a href="${member.websiteUrl}" target="_blank" rel="noopener" style="display:inline-block;margin-top:8px;font-size:11px;color:#1B7E8A;text-decoration:none;font-weight:500;">Visiter le site &rarr;</a>` : ""}
            </div>
          `, { closeButton: true, maxWidth: 280 });

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

        {/* Territory buttons */}
        <div className="absolute bottom-4 left-4 z-[500] flex flex-wrap gap-2">
          {VIEWS.map((view) => (
            <button
              key={view.label}
              onClick={() => flyTo(view.lat, view.lng, view.zoom)}
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
