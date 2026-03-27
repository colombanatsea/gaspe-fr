"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { members } from "@/data/members";
import { maritimeRoutes } from "@/data/routes";

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

      const GLOBE_RADIUS = 1.0;
      const ROUTE_RADIUS = GLOBE_RADIUS + 0.005;
      const DOT_RADIUS = GLOBE_RADIUS + 0.008;
      const PX_RATIO = Math.min(window.devicePixelRatio, 2);
      const BG_COLOR = 0x0a1520;
      const TEAL_600 = 0x1b7e8a;
      const TEAL_400 = 0x6daaac;
      const TEAL_300 = 0x8ac6ca;

      // ── SCENE ──
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        45,
        container!.clientWidth / container!.clientHeight,
        0.01,
        100,
      );

      // Initial view: looking at France from Atlantic
      const initLon = 2;
      const initLat = 35;
      const initDist = 2.4;
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
      controls.rotateSpeed = 0.4;
      controls.enableZoom = true;
      controls.zoomSpeed = 0.6;
      controls.minDistance = 1.6;
      controls.maxDistance = 3.5;
      controls.enablePan = false;
      controls.autoRotate = false;

      // ── LIGHTING (subtle) ──
      scene.add(new THREE.AmbientLight(0x444466, 2));
      const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
      dirLight.position.set(5, 3, 5);
      scene.add(dirLight);

      // ── GLOBE — clean dark sphere + wireframe ──
      const globeGeo = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64);

      // Solid dark sphere
      const globeMat = new THREE.MeshPhongMaterial({
        color: 0x0d1f2d,
        emissive: 0x060e18,
        emissiveIntensity: 0.5,
        shininess: 15,
        transparent: true,
        opacity: 0.95,
      });
      const globe = new THREE.Mesh(globeGeo, globeMat);
      scene.add(globe);

      // Wireframe overlay — subtle grid lines
      const wireGeo = new THREE.SphereGeometry(GLOBE_RADIUS + 0.001, 36, 18);
      const wireMat = new THREE.MeshBasicMaterial({
        color: TEAL_600,
        wireframe: true,
        transparent: true,
        opacity: 0.06,
        depthWrite: false,
      });
      scene.add(new THREE.Mesh(wireGeo, wireMat));

      // ── ATMOSPHERE (teal glow) ──
      const atmoVS = `varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`;
      const atmoFS = `varying vec3 vNormal;
        void main() {
          float intensity = pow(0.6 - dot(vNormal, vec3(0, 0, 1)), 3.0);
          gl_FragColor = vec4(0.1, 0.5, 0.54, 1.0) * intensity * 0.5;
        }`;
      const atmosphere = new THREE.Mesh(
        new THREE.SphereGeometry(GLOBE_RADIUS * 1.08, 48, 48),
        new THREE.ShaderMaterial({
          vertexShader: atmoVS,
          fragmentShader: atmoFS,
          blending: THREE.AdditiveBlending,
          side: THREE.BackSide,
          transparent: true,
          depthWrite: false,
        }),
      );
      scene.add(atmosphere);

      // ── STARFIELD (sparse) ──
      const starGeo = new THREE.BufferGeometry();
      const starVerts: number[] = [];
      for (let i = 0; i < 800; i++) {
        const r = 20 + Math.random() * 30;
        const t = Math.random() * Math.PI * 2;
        const p = Math.acos(2 * Math.random() - 1);
        starVerts.push(
          r * Math.sin(p) * Math.cos(t),
          r * Math.sin(p) * Math.sin(t),
          r * Math.cos(p),
        );
      }
      starGeo.setAttribute("position", new THREE.Float32BufferAttribute(starVerts, 3));
      scene.add(
        new THREE.Points(
          starGeo,
          new THREE.PointsMaterial({ color: 0x8899bb, size: 0.03, sizeAttenuation: true }),
        ),
      );

      // ── UTILITY ──
      function latLonToVec3(lat: number, lon: number, r: number) {
        const p = ((90 - lat) * Math.PI) / 180;
        const t = (-lon * Math.PI) / 180;
        return new THREE.Vector3(
          r * Math.sin(p) * Math.cos(t),
          r * Math.cos(p),
          r * Math.sin(p) * Math.sin(t),
        );
      }

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

      // ── PIVOT GROUP ──
      const pivotGroup = new THREE.Group();
      pivotGroup.add(globe);
      pivotGroup.add(new THREE.Mesh(wireGeo, wireMat));
      pivotGroup.add(atmosphere);

      // ── PORT DOTS (endpoints of each route) ──
      const dotGroup = new THREE.Group();
      const dotGeo = new THREE.SphereGeometry(0.008, 10, 10);
      const portSet = new Set<string>();

      maritimeRoutes.forEach((route) => {
        const coords = route.coordinates;
        const start = coords[0];
        const end = coords[coords.length - 1];

        [start, end].forEach(([lat, lon]) => {
          const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;
          if (portSet.has(key)) return;
          portSet.add(key);

          const pos = latLonToVec3(lat, lon, DOT_RADIUS);
          const dotMat = new THREE.MeshBasicMaterial({
            color: TEAL_300,
            transparent: true,
            opacity: 0.9,
          });
          const dot = new THREE.Mesh(dotGeo, dotMat);
          dot.position.copy(pos);
          dotGroup.add(dot);
        });
      });
      pivotGroup.add(dotGroup);

      // ── ROUTE LINES with draw animation ──
      interface AnimatedRoute {
        line: any;
        totalPoints: number;
        drawnPoints: number;
        drawSpeed: number;
        started: boolean;
        startDelay: number;
      }

      const routeGroup = new THREE.Group();
      const animatedRoutes: AnimatedRoute[] = [];

      maritimeRoutes.forEach((route, idx) => {
        const tier = route.tier;
        const opacity = tier === 1 ? 0.85 : tier === 2 ? 0.55 : 0.3;
        const lineWidth = 1; // LineBasicMaterial doesn't support width > 1 on most GPUs

        const mat = new THREE.LineBasicMaterial({
          color: TEAL_400,
          transparent: true,
          opacity,
          depthWrite: false,
        });

        // Build points
        const points: any[] = [];
        for (let i = 0; i < route.coordinates.length; i++) {
          const [lat, lon] = route.coordinates[i];
          if (points.length === 0) {
            points.push(latLonToVec3(lat, lon, ROUTE_RADIUS));
          } else {
            const [prevLat, prevLon] = route.coordinates[i - 1];
            const interp = interpolateGreatCircle(prevLat, prevLon, lat, lon, ROUTE_RADIUS, 1.5);
            points.push(...interp);
          }
        }

        if (points.length < 2) return;

        const geo = new THREE.BufferGeometry().setFromPoints(points);
        // Start hidden — draw range at 0
        geo.setDrawRange(0, 0);

        const line = new THREE.Line(geo, mat);
        routeGroup.add(line);

        animatedRoutes.push({
          line,
          totalPoints: points.length,
          drawnPoints: 0,
          drawSpeed: Math.max(1, Math.ceil(points.length / 20)), // draw in ~20 frames (~0.33s)
          started: false,
          startDelay: idx * 3, // stagger: 3 frames apart
        });
      });

      pivotGroup.add(routeGroup);
      scene.add(pivotGroup);

      setLoaded(true);

      // ── ANIMATION ──
      const CRUISE_SPEED = 0.0003;
      let frameCount = 0;

      function animate() {
        if (disposed) return;
        requestAnimationFrame(animate);
        frameCount++;

        // Rotate
        pivotGroup.rotation.y += CRUISE_SPEED;

        // Draw routes progressively
        for (const ar of animatedRoutes) {
          if (ar.drawnPoints >= ar.totalPoints) continue;

          if (!ar.started) {
            if (frameCount >= ar.startDelay) {
              ar.started = true;
            } else {
              continue;
            }
          }

          ar.drawnPoints = Math.min(ar.drawnPoints + ar.drawSpeed, ar.totalPoints);
          ar.line.geometry.setDrawRange(0, ar.drawnPoints);
        }

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
          <div className="h-48 w-48 rounded-full bg-gradient-to-br from-[#0d1f2d] to-[#142838] border border-[var(--gaspe-teal-600)]/20 flex items-center justify-center">
            <div className="absolute inset-2 rounded-full border border-[var(--gaspe-teal-600)]/10" />
            <div className="text-center">
              <span className="font-heading text-3xl font-bold text-[var(--gaspe-teal-400)]">28</span>
              <br />
              <span className="text-xs uppercase tracking-wider text-white/40">compagnies</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Loading overlay */}
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0a1520]">
          <div className="text-center">
            <div className="h-8 w-8 mx-auto border-2 border-[var(--gaspe-teal-400)] border-t-transparent rounded-full animate-spin" />
            <p className="mt-3 text-xs text-white/40 uppercase tracking-wider">Chargement...</p>
          </div>
        </div>
      )}
    </div>
  );
}
