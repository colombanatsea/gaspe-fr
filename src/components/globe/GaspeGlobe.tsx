"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
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
      const ROUTE_RADIUS = GLOBE_RADIUS + 0.004;
      const DOT_RADIUS = GLOBE_RADIUS + 0.008;
      const SPHERE_SEG = 96;
      const PX_RATIO = Math.min(window.devicePixelRatio, 2);
      const BG_COLOR = 0x0a1520;
      const TEAL_400 = 0x6daaac;

      // ── SCENE ──
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        45, container!.clientWidth / container!.clientHeight, 0.01, 100,
      );

      // Initial view: France from Atlantic
      const initLon = 2;
      const initLat = 35;
      const initDist = 2.2;
      const phi = ((90 - initLat) * Math.PI) / 180;
      const theta = (-initLon * Math.PI) / 180;
      camera.position.set(
        initDist * Math.sin(phi) * Math.cos(theta),
        initDist * Math.cos(phi),
        initDist * Math.sin(phi) * Math.sin(theta),
      );
      camera.lookAt(0, 0, 0);

      const renderer = new THREE.WebGLRenderer({
        antialias: true, alpha: false, powerPreference: "high-performance",
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
      controls.autoRotate = false;

      // ── LIGHTING ──
      scene.add(new THREE.AmbientLight(0x666666, 1.5));
      const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
      dirLight.position.set(5, 3, 5);
      scene.add(dirLight);
      const backLight = new THREE.DirectionalLight(0x1b4455, 0.4);
      backLight.position.set(-3, -2, -5);
      scene.add(backLight);

      // ── GLOBE with Earth texture ──
      const globeGeo = new THREE.SphereGeometry(GLOBE_RADIUS, SPHERE_SEG, SPHERE_SEG);
      const globeMat = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        shininess: 25,
        bumpScale: 0.015,
      });
      const globe = new THREE.Mesh(globeGeo, globeMat);
      scene.add(globe);

      // Load textures — routes only start drawing AFTER texture is visible
      let textureReady = false;
      const textureLoader = new THREE.TextureLoader();
      const texturePath = "/assets/textures/";
      textureLoader.load(
        texturePath + "earth-blue-marble.jpg",
        (t: import("three").Texture) => {
          t.colorSpace = THREE.SRGBColorSpace;
          globeMat.map = t;
          globeMat.needsUpdate = true;
          // Small delay so the globe renders a few frames before routes start
          setTimeout(() => { textureReady = true; }, 300);
          setLoaded(true);
        },
        undefined,
        () => {
          // Fallback: dark ocean with visible wireframe
          globeMat.color.set(0x0a1520);
          globeMat.emissive = new THREE.Color(0x060e18);
          globeMat.emissiveIntensity = 0.4;
          globeMat.transparent = true;
          globeMat.opacity = 0.8;
          globeMat.needsUpdate = true;
          // Make wireframe more visible as visual indicator
          const fallbackWire = new THREE.Mesh(
            new THREE.SphereGeometry(GLOBE_RADIUS + 0.002, 36, 18),
            new THREE.MeshBasicMaterial({ color: TEAL_400, wireframe: true, transparent: true, opacity: 0.15, depthWrite: false }),
          );
          pivotGroup.add(fallbackWire);
          setTimeout(() => { textureReady = true; }, 300);
          setLoaded(true);
        },
      );
      textureLoader.load(texturePath + "earth-topology.png", (t: import("three").Texture) => {
        globeMat.bumpMap = t;
        globeMat.needsUpdate = true;
      });

      // ── ATMOSPHERE (GASPE teal glow) ──
      const atmoVS = `varying vec3 vNormal; void main() { vNormal = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
      const atmoFS = `varying vec3 vNormal; void main() { float i = pow(0.65 - dot(vNormal, vec3(0,0,1)), 3.0); gl_FragColor = vec4(0.1, 0.5, 0.55, 1.0) * i * 0.7; }`;
      const atmosphere = new THREE.Mesh(
        new THREE.SphereGeometry(GLOBE_RADIUS * 1.12, 64, 64),
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

      // ── STARFIELD ──
      const starGeo = new THREE.BufferGeometry();
      const starVerts: number[] = [];
      for (let i = 0; i < 1200; i++) {
        const r = 15 + Math.random() * 35;
        const st = Math.random() * Math.PI * 2;
        const sp = Math.acos(2 * Math.random() - 1);
        starVerts.push(
          r * Math.sin(sp) * Math.cos(st),
          r * Math.sin(sp) * Math.sin(st),
          r * Math.cos(sp),
        );
      }
      starGeo.setAttribute("position", new THREE.Float32BufferAttribute(starVerts, 3));
      scene.add(
        new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xaabbdd, size: 0.04, sizeAttenuation: true })),
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
        const pts: import("three").Vector3[] = [];
        for (let s = 1; s <= steps; s++) {
          const t = s / steps;
          pts.push(latLonToVec3(lat1 + dLat * t, lon1 + dLon * t, r));
        }
        return pts;
      }

      // ── PIVOT GROUP — everything rotates together ──
      const pivotGroup = new THREE.Group();
      pivotGroup.add(globe);
      pivotGroup.add(atmosphere);

      // ── PORT DOTS at route endpoints ──
      const dotGroup = new THREE.Group();
      const dotGeo = new THREE.SphereGeometry(0.010, 12, 12);
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
            color: 0x4dd9e6,
            transparent: true,
            opacity: 1.0,
          });
          const dot = new THREE.Mesh(dotGeo, dotMat);
          dot.position.copy(pos);
          dotGroup.add(dot);

          // Glow ring
          const ringGeo = new THREE.RingGeometry(0.014, 0.019, 16);
          const ringMat = new THREE.MeshBasicMaterial({
            color: TEAL_400,
            transparent: true,
            opacity: 0.35,
            side: THREE.DoubleSide,
            depthWrite: false,
          });
          const ring = new THREE.Mesh(ringGeo, ringMat);
          ring.position.copy(pos);
          ring.lookAt(0, 0, 0);
          dotGroup.add(ring);
        });
      });
      pivotGroup.add(dotGroup);

      // ── ROUTE LINES with progressive draw animation ──
      interface AnimatedRoute {
        line: import("three").Line;
        totalPoints: number;
        drawnPoints: number;
        drawSpeed: number;
        started: boolean;
        startDelay: number;
      }

      const routeGroup = new THREE.Group();
      const animatedRoutes: AnimatedRoute[] = [];

      const BRIGHT_TEAL = 0x4dd9e6; // Brighter for visibility on texture
      const ROUTE_COLORS: Record<number, { color: number; opacity: number }> = {
        1: { color: BRIGHT_TEAL, opacity: 1.0 },
        2: { color: TEAL_400, opacity: 0.8 },
        3: { color: TEAL_400, opacity: 0.5 },
      };

      maritimeRoutes.forEach((route, idx) => {
        const style = ROUTE_COLORS[route.tier];
        if (!style) return;

        const mat = new THREE.LineBasicMaterial({
          color: style.color,
          transparent: true,
          opacity: style.opacity,
          depthWrite: false,
        });

        const points: import("three").Vector3[] = [];
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

        if (points.length < 2) return;

        const geo = new THREE.BufferGeometry().setFromPoints(points);
        geo.setDrawRange(0, 0); // Start hidden

        const line = new THREE.Line(geo, mat);
        routeGroup.add(line);

        animatedRoutes.push({
          line,
          totalPoints: points.length,
          drawnPoints: 0,
          drawSpeed: Math.max(1, Math.ceil(points.length / 15)), // draw in ~15 frames
          started: false,
          startDelay: idx * 4, // stagger 4 frames apart
        });
      });

      pivotGroup.add(routeGroup);
      scene.add(pivotGroup);

      // ── CONTINUOUS ROTATION ──
      const CRUISE_SPEED = 0.0004;
      let drawFrameCount = 0;
      let routeDrawingStarted = false;

      function animate() {
        if (disposed) return;
        requestAnimationFrame(animate);

        pivotGroup.rotation.y += CRUISE_SPEED;

        // Only start drawing routes AFTER texture is loaded and visible
        if (textureReady) {
          if (!routeDrawingStarted) {
            routeDrawingStarted = true;
            drawFrameCount = 0;
          }
          drawFrameCount++;

          for (const ar of animatedRoutes) {
            if (ar.drawnPoints >= ar.totalPoints) continue;
            if (!ar.started) {
              if (drawFrameCount >= ar.startDelay) ar.started = true;
              else continue;
            }
            ar.drawnPoints = Math.min(ar.drawnPoints + ar.drawSpeed, ar.totalPoints);
            ar.line.geometry.setDrawRange(0, ar.drawnPoints);
          }
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
          <div className="h-48 w-48 rounded-full gaspe-gradient-animated opacity-60" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center">
            <span className="font-heading text-3xl font-bold">28</span>
            <span className="text-xs uppercase tracking-wider opacity-80">compagnies</span>
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
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--gaspe-neutral-950)]">
          <div className="text-center">
            <div className="h-8 w-8 mx-auto border-2 border-[var(--gaspe-teal-400)] border-t-transparent rounded-full animate-spin" />
            <p className="mt-3 text-xs text-white/40 uppercase tracking-wider">Chargement du globe...</p>
          </div>
        </div>
      )}
    </div>
  );
}
