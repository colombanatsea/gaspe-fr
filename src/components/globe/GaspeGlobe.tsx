"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { members } from "@/data/members";
import { maritimeRoutes } from "@/data/routes";
import { keyStats } from "@/data/stats";

/**
 * Globe 3D interactif GASPE — Three.js
 * Adapté du globe colombanatsea.com
 * Affiche les adhérents (marqueurs) et les routes maritimes (arcs)
 * Pas de ZEE ni de câbles sous-marins
 */

interface GaspeGlobeProps {
  className?: string;
}

export function GaspeGlobe({ className }: GaspeGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth <= 768) {
      setIsMobile(true);
      return;
    }

    const container = containerRef.current;
    if (!container || !container.offsetWidth) return;

    let disposed = false;

    async function init() {
      const THREE = await import("three");
      const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");

      if (disposed) return;

      // ── CONFIG ──
      const GLOBE_RADIUS = 1.0;
      const ROUTE_RADIUS = GLOBE_RADIUS + 0.004;
      const MARKER_RADIUS = GLOBE_RADIUS + 0.008;
      const SPHERE_SEG = 96;
      const PX_RATIO = Math.min(window.devicePixelRatio, 2);
      const AUTO_ROTATE_SPEED = 0.15;

      // GASPE design system colors
      const TEAL_600 = 0x1b7e8a;
      const TEAL_400 = 0x6daaac;
      const WARM_300 = 0xefca8f;
      const BG_COLOR = 0x0a1520;

      // ── SCENE ──
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, container!.clientWidth / container!.clientHeight, 0.01, 100);
      // Position to show France (hexagone) — looking from Atlantic side
      // Longitude France ~2°E, Latitude ~46°N
      // In Three.js: lon=-2° → theta=2°*π/180, lat=46° → phi=44°*π/180
      const initLon = 2; // France longitude
      const initLat = 35; // Slightly below France for better view including Mayotte arc
      const initDist = 2.2; // Distance — close enough to see routes
      const phi = ((90 - initLat) * Math.PI) / 180;
      const theta = (-initLon * Math.PI) / 180;
      camera.position.set(
        initDist * Math.sin(phi) * Math.cos(theta),
        initDist * Math.cos(phi),
        initDist * Math.sin(phi) * Math.sin(theta),
      );
      camera.lookAt(0, 0, 0);

      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      });
      renderer.setSize(container!.clientWidth, container!.clientHeight);
      renderer.setPixelRatio(PX_RATIO);
      renderer.setClearColor(BG_COLOR, 1);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      container!.appendChild(renderer.domElement);

      // ── CONTROLS ──
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.06;
      controls.rotateSpeed = 0.5;
      controls.enableZoom = true;
      controls.zoomSpeed = 0.8;
      controls.minDistance = 1.5;
      controls.maxDistance = 4;
      controls.enablePan = false;
      // We do NOT use controls.autoRotate — it stops on interaction.
      // Instead we manually rotate the scene in the animation loop.
      controls.autoRotate = false;

      // ── LIGHTING ──
      scene.add(new THREE.AmbientLight(0x666666, 1.5));
      const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
      dirLight.position.set(5, 3, 5);
      scene.add(dirLight);
      const backLight = new THREE.DirectionalLight(0x1b4455, 0.4);
      backLight.position.set(-3, -2, -5);
      scene.add(backLight);

      // ── GLOBE ──
      const globeGeo = new THREE.SphereGeometry(GLOBE_RADIUS, SPHERE_SEG, SPHERE_SEG);
      const globeMat = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        shininess: 25,
        bumpScale: 0.015,
      });
      const globe = new THREE.Mesh(globeGeo, globeMat);
      scene.add(globe);

      // Textures
      const textureLoader = new THREE.TextureLoader();
      const texturePath = "/assets/textures/";
      textureLoader.load(
        texturePath + "earth-blue-marble.jpg",
        (t) => {
          t.colorSpace = THREE.SRGBColorSpace;
          globeMat.map = t;
          globeMat.needsUpdate = true;
          setLoaded(true);
        },
        undefined,
        () => {
          // Fallback: dark ocean color
          globeMat.color.set(0x0f1d30);
          globeMat.emissive = new THREE.Color(0x050a14);
          globeMat.emissiveIntensity = 0.3;
          globeMat.needsUpdate = true;
          setLoaded(true);
        },
      );
      textureLoader.load(texturePath + "earth-topology.png", (t) => {
        globeMat.bumpMap = t;
        globeMat.needsUpdate = true;
      });

      // ── ATMOSPHERE (GASPE teal glow) ──
      const atmoVS = `varying vec3 vNormal; void main() { vNormal = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
      const atmoFS = `varying vec3 vNormal; void main() { float i = pow(0.65 - dot(vNormal, vec3(0,0,1)), 3.0); gl_FragColor = vec4(0.1, 0.5, 0.55, 1.0) * i * 0.7; }`;
      scene.add(
        new THREE.Mesh(
          new THREE.SphereGeometry(GLOBE_RADIUS * 1.12, 64, 64),
          new THREE.ShaderMaterial({
            vertexShader: atmoVS,
            fragmentShader: atmoFS,
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide,
            transparent: true,
            depthWrite: false,
          }),
        ),
      );

      // ── STARFIELD ──
      const starGeo = new THREE.BufferGeometry();
      const starVerts: number[] = [];
      for (let i = 0; i < 1500; i++) {
        const r = 15 + Math.random() * 35;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        starVerts.push(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta),
          r * Math.cos(phi),
        );
      }
      starGeo.setAttribute("position", new THREE.Float32BufferAttribute(starVerts, 3));
      scene.add(
        new THREE.Points(
          starGeo,
          new THREE.PointsMaterial({ color: 0xaabbdd, size: 0.04, sizeAttenuation: true }),
        ),
      );

      // ── UTILITY ──
      function latLonToVec3(lat: number, lon: number, r: number) {
        const phi = ((90 - lat) * Math.PI) / 180;
        const theta = (-lon * Math.PI) / 180;
        return new THREE.Vector3(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.cos(phi),
          r * Math.sin(phi) * Math.sin(theta),
        );
      }

      // ── MEMBER MARKERS (only for members WITHOUT routes) ──
      const markerGroup = new THREE.Group();
      scene.add(markerGroup);

      // Build set of members that have routes
      const membersWithRoutes = new Set(maritimeRoutes.map((r) => r.member));

      members.forEach((member) => {
        // Skip members that already have visible routes on the globe
        if (membersWithRoutes.has(member.name)) return;

        const pos = latLonToVec3(member.latitude, member.longitude, MARKER_RADIUS);
        // Same color for ALL members — no métropole/outre-mer distinction
        const color = TEAL_600;

        // Sphere marker
        const markerGeo = new THREE.SphereGeometry(0.010, 12, 12);
        const markerMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 });
        const marker = new THREE.Mesh(markerGeo, markerMat);
        marker.position.copy(pos);
        marker.userData = { member };
        markerGroup.add(marker);

        // Glow ring
        const ringGeo = new THREE.RingGeometry(0.014, 0.019, 16);
        const ringMat = new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.4,
          side: THREE.DoubleSide,
          depthWrite: false,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.copy(pos);
        ring.lookAt(0, 0, 0);
        markerGroup.add(ring);
      });

      // ── MARITIME ROUTES (arcs following globe surface) ──
      const routeGroup = new THREE.Group();
      scene.add(routeGroup);

      const ROUTE_COLORS: Record<number, { color: number; opacity: number }> = {
        1: { color: TEAL_400, opacity: 0.9 },
        2: { color: TEAL_400, opacity: 0.6 },
        3: { color: TEAL_400, opacity: 0.35 },
      };

      function interpolateGreatCircle(
        lat1: number, lon1: number, lat2: number, lon2: number, r: number, maxGapDeg: number,
      ) {
        const dLat = lat2 - lat1;
        const dLon = lon2 - lon1;
        const gap = Math.sqrt(dLat * dLat + dLon * dLon);
        if (gap <= maxGapDeg) return [latLonToVec3(lat2, lon2, r)];
        const steps = Math.ceil(gap / maxGapDeg);
        const pts: any[] = [];
        for (let s = 1; s <= steps; s++) {
          const t = s / steps;
          pts.push(latLonToVec3(lat1 + dLat * t, lon1 + dLon * t, r));
        }
        return pts;
      }

      maritimeRoutes.forEach((route) => {
        const style = ROUTE_COLORS[route.tier];
        if (!style) return;
        const mat = new THREE.LineBasicMaterial({
          color: style.color,
          transparent: true,
          opacity: style.opacity,
          depthWrite: false,
        });
        const points: any[] = [];
        for (let i = 0; i < route.coordinates.length; i++) {
          const [lat, lon] = route.coordinates[i];
          if (points.length === 0) {
            points.push(latLonToVec3(lat, lon, ROUTE_RADIUS));
          } else {
            const [prevLat, prevLon] = route.coordinates[i - 1];
            const interp = interpolateGreatCircle(prevLat, prevLon, lat, lon, ROUTE_RADIUS, 3);
            points.push(...interp);
          }
        }
        if (points.length >= 2) {
          routeGroup.add(
            new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), mat),
          );
        }
      });

      // ── CONTINUOUS ROTATION — truly never stops ──
      // We rotate the entire scene (globe + markers + routes) manually
      // instead of using OrbitControls.autoRotate which stops on drag.
      const CRUISE_SPEED = 0.0004; // radians per frame (~0.35°/s)
      const pivotGroup = new THREE.Group();
      // Move globe, markers, routes into the pivot group
      pivotGroup.add(globe);
      pivotGroup.add(markerGroup);
      pivotGroup.add(routeGroup);
      // Re-add atmosphere to pivot too
      scene.children
        .filter((c: any) => c.type === "Mesh" && c.geometry?.parameters?.radius > GLOBE_RADIUS)
        .forEach((atmo: any) => pivotGroup.add(atmo));
      scene.add(pivotGroup);

      // ── ANIMATION LOOP ──
      function animate() {
        if (disposed) return;
        requestAnimationFrame(animate);

        // Always rotate the pivot group around Y axis — NEVER stops
        pivotGroup.rotation.y += CRUISE_SPEED;

        controls.update();
        renderer.render(scene, camera);
      }

      animate();

      // ── RESIZE ──
      const ro = new ResizeObserver(() => {
        if (!container) return;
        const w = container.clientWidth;
        const h = container.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      });
      ro.observe(container!);

      // Cleanup
      return () => {
        disposed = true;
        ro.disconnect();
        renderer.dispose();
        controls.dispose();
        if (container && renderer.domElement.parentNode === container) {
          container.removeChild(renderer.domElement);
        }
      };
    }

    const cleanup = init();
    return () => {
      cleanup.then((fn) => fn?.());
    };
  }, []);

  if (isMobile) {
    return (
      <div className={cn("flex items-center justify-center", className)}>
        <div className="relative">
          <div className="h-48 w-48 rounded-full bg-gradient-to-br from-[#42B3D5] via-[#6DAAAC] to-[#5AA89A] animate-pulse opacity-60" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center">
            <span className="font-heading text-3xl font-bold">{keyStats[0].value}</span>
            <span className="text-xs uppercase tracking-wider opacity-80">armateurs</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Stats overlay */}
      <div className="absolute bottom-6 right-6 z-10 space-y-2">
        {keyStats.map((stat) => (
          <div key={stat.label} className="text-right">
            <div className="text-xs uppercase tracking-wider text-white/40">{stat.label}</div>
            <div className="font-heading text-lg font-bold text-[var(--gaspe-teal-400)]">
              {stat.value.toLocaleString("fr-FR")}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="absolute bottom-6 left-6 z-10 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="h-4 w-6 border-t border-[var(--gaspe-teal-400)] opacity-60" />
          <span className="text-[10px] text-white/50 uppercase tracking-wider">Routes maritimes</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-[var(--gaspe-teal-600)]" />
          <span className="text-[10px] text-white/50 uppercase tracking-wider">Adhérents</span>
        </div>
      </div>

      {/* Loading overlay */}
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0a1520]">
          <div className="text-center">
            <div className="h-8 w-8 mx-auto border-2 border-[var(--gaspe-teal-400)] border-t-transparent rounded-full animate-spin" />
            <p className="mt-3 text-xs text-white/40 uppercase tracking-wider">Chargement du globe...</p>
          </div>
        </div>
      )}
    </div>
  );
}
