'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Location } from '@/lib/types';

interface Props {
  location: Location;
  onReady?: () => void;
}

export default function HistoricViewPane({ location, onReady }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ── Three.js scene ──────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000,
    );
    camera.position.set(0, 0, 0.001);

    // Sphere with texture mapped on the INSIDE
    const geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.scale(-1, 1, 1); // flip normals inward

    const texture = new THREE.TextureLoader().load(
      location.panoUrl || '',
      () => {
        // texture loaded — signal ready
        if (onReadyRef.current) onReadyRef.current();
      },
      undefined,
      () => {
        // error — still signal ready so game doesn't freeze
        if (onReadyRef.current) onReadyRef.current();
      },
    );
    texture.colorSpace = THREE.SRGBColorSpace;

    const material = new THREE.MeshBasicMaterial({ map: texture });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    // ── Camera rotation state ───────────────────────────────────────────────
    let lon = 0;   // horizontal rotation (degrees)
    let lat = 0;   // vertical   rotation (degrees)
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;
    let velX = 0;
    let velY = 0;

    // ── Pointer events ──────────────────────────────────────────────────────
    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      velX = 0;
      velY = 0;
      container.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      velX = dx;
      velY = dy;
      lon -= dx * 0.15;
      lat += dy * 0.15;
      lat = Math.max(-85, Math.min(85, lat));
    };

    const onPointerUp = () => { isDragging = false; };

    container.addEventListener('pointerdown', onPointerDown);
    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('pointerup', onPointerUp);
    container.addEventListener('pointercancel', onPointerUp);

    // ── Resize observer ──────────────────────────────────────────────────────
    const ro = new ResizeObserver(() => {
      renderer.setSize(container.clientWidth, container.clientHeight);
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
    });
    ro.observe(container);

    // ── Render loop ──────────────────────────────────────────────────────────
    let animId: number;
    const render = () => {
      animId = requestAnimationFrame(render);

      // Momentum when not dragging
      if (!isDragging) {
        velX *= 0.92;
        velY *= 0.92;
        lon -= velX * 0.15;
        lat += velY * 0.15;
        lat = Math.max(-85, Math.min(85, lat));
      }

      // Slow auto-rotate (disabled per user request)
      // if (!isDragging && Math.abs(velX) < 0.5) {
      //   lon -= 0.02;
      // }

      // Convert lon/lat → camera look-at target
      const phi   = THREE.MathUtils.degToRad(90 - lat);
      const theta = THREE.MathUtils.degToRad(lon);
      camera.lookAt(
        500 * Math.sin(phi) * Math.cos(theta),
        500 * Math.cos(phi),
        500 * Math.sin(phi) * Math.sin(theta),
      );

      renderer.render(scene, camera);
    };
    render();

    // Fallback: call onReady after 2s even if texture hasn't loaded
    const safetyTimer = setTimeout(() => {
      if (onReadyRef.current) onReadyRef.current();
    }, 2000);

    return () => {
      clearTimeout(safetyTimer);
      cancelAnimationFrame(animId);
      container.removeEventListener('pointerdown', onPointerDown);
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerup', onPointerUp);
      container.removeEventListener('pointercancel', onPointerUp);
      ro.disconnect();
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      texture.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [location.panoUrl]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        cursor: 'grab',
        touchAction: 'none',
        background: '#06080f',
      }}
    />
  );
}
