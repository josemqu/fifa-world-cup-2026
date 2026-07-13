"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Trophy } from "lucide-react";

export default function TrophyCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    // 1. Initialize Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0f172a, 0.015); // slate-900 background fog

    const container = containerRef.current;
    const canvas = canvasRef.current;

    // Set up camera
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, -0.2, 7.0);

    // Set up renderer with antialiasing and shadow support
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 2. Lighting Setup (Studio lighting for realistic gold reflections)
    const ambientLight = new THREE.AmbientLight(0xfff8e7, 0.5);
    scene.add(ambientLight);

    // Key Light (Warm, bright, cast shadows)
    const keyLight = new THREE.DirectionalLight(0xfffaed, 2.5);
    keyLight.position.set(5, 8, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    // Fill Light (Cool, soft, from opposite side)
    const fillLight = new THREE.DirectionalLight(0xe0f2fe, 1.2);
    fillLight.position.set(-6, 4, -4);
    scene.add(fillLight);

    // Rim Light (Back light to make golden edges glow against background)
    const rimLight = new THREE.DirectionalLight(0xffe29a, 3.0);
    rimLight.position.set(0, 5, -8);
    scene.add(rimLight);

    // Glow Point Light to illuminate details in the center
    const pointLight = new THREE.PointLight(0xffd700, 1.8, 10);
    pointLight.position.set(0, 2, 2);
    scene.add(pointLight);

    // 3. Create Group to hold the loaded trophy
    const trophyGroup = new THREE.Group();
    scene.add(trophyGroup);

    // 4. Load GLTF Model
    const loader = new GLTFLoader();
    loader.load(
      "/copa_mundial/scene.gltf",
      (gltf) => {
        const model = gltf.scene;

        // Calculate bounding box to center and scale the model dynamically
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        // Create pivot group to center geometry relative to trophyGroup
        const pivot = new THREE.Group();
        model.position.set(-center.x, -center.y, -center.z);
        pivot.add(model);

        // Scale to fit target dimensions
        const maxDim = Math.max(size.x, size.y, size.z);
        const targetHeight = 4.8; // desired unit height
        const scaleFactor = targetHeight / maxDim;
        pivot.scale.setScalar(scaleFactor);

        // Adjust the pivot height so the middle of the trophy is at the scene origin
        // This ensures Y rotation rotates around the center of mass
        pivot.position.y = 0;

        trophyGroup.add(pivot);

        // Configure shadows and PBR material enhancements
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            // Adjust materials loaded from the GLTF to look extra premium
            if (child.material) {
              if (child.material instanceof THREE.MeshStandardMaterial) {
                const name = (child.name || "").toLowerCase() + (child.material.name || "").toLowerCase();

                // Enhance gold parts
                if (name.includes("copa") || name.includes("gold") || name.includes("letras")) {
                  child.material.metalness = 1.0;
                  child.material.roughness = 0.12;
                } else if (name.includes("base")) {
                  // Base material settings
                  child.material.roughness = 0.25;
                }
              }
            }
          }
        });

        setIsLoading(false);
      },
      undefined,
      (error) => {
        console.error("Error loading GLTF model:", error);
        setLoadError("No se pudo cargar el modelo 3D");
        setIsLoading(false);
      }
    );

    // 5. Mouse and Touch Interaction Logic
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let dragVelocity = { x: 0, y: 0 };

    // Auto-rotation speed settings
    let targetAutoSpeed = 0.005;
    let currentAutoSpeed = 0.005;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
      dragVelocity = { x: 0, y: 0 };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      trophyGroup.rotation.y += deltaX * 0.007;
      // Clamp X rotation to avoid flipping upside down
      const newRotX = trophyGroup.rotation.x + deltaY * 0.007;
      trophyGroup.rotation.x = Math.max(-0.4, Math.min(0.4, newRotX));

      dragVelocity = { x: deltaX, y: deltaY };
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    // Touch Support
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      isDragging = true;
      previousMousePosition = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
      dragVelocity = { x: 0, y: 0 };
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - previousMousePosition.x;
      const deltaY = e.touches[0].clientY - previousMousePosition.y;

      trophyGroup.rotation.y += deltaX * 0.007;
      const newRotX = trophyGroup.rotation.x + deltaY * 0.007;
      trophyGroup.rotation.x = Math.max(-0.4, Math.min(0.4, newRotX));

      dragVelocity = { x: deltaX, y: deltaY };
      previousMousePosition = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    };

    // Listeners
    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("touchstart", onTouchStart, { passive: true });
    canvas.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onMouseUp);

    // Hover effect: Spin faster on hover
    const onMouseEnter = () => {
      targetAutoSpeed = 0.012;
    };
    const onMouseLeave = () => {
      targetAutoSpeed = 0.005;
      isDragging = false; // safe release
    };
    container.addEventListener("mouseenter", onMouseEnter);
    container.addEventListener("mouseleave", onMouseLeave);

    // 6. Animation Loop
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (!isDragging) {
        // Decay drag momentum
        if (Math.abs(dragVelocity.x) > 0.01) {
          trophyGroup.rotation.y += dragVelocity.x * 0.007;
          dragVelocity.x *= 0.95;
        }
        if (Math.abs(dragVelocity.y) > 0.01) {
          const newRotX = trophyGroup.rotation.x + dragVelocity.y * 0.007;
          trophyGroup.rotation.x = Math.max(-0.4, Math.min(0.4, newRotX));
          dragVelocity.y *= 0.95;
        }

        // Return X rotation slowly to 0 (straight vertical position)
        trophyGroup.rotation.x *= 0.98;

        // Auto Y rotation with smooth speed transition
        currentAutoSpeed += (targetAutoSpeed - currentAutoSpeed) * 0.1;
        trophyGroup.rotation.y += currentAutoSpeed;
      }

      renderer.render(scene, camera);
    };
    animate();

    // 7. Handle Resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // 8. Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();

      // Remove event listeners
      if (canvas) {
        canvas.removeEventListener("mousedown", onMouseDown);
        canvas.removeEventListener("touchstart", onTouchStart);
        canvas.removeEventListener("touchmove", onTouchMove);
      }
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchend", onMouseUp);

      if (container) {
        container.removeEventListener("mouseenter", onMouseEnter);
        container.removeEventListener("mouseleave", onMouseLeave);
      }

      // Dispose resources
      scene.clear();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative flex items-center justify-center cursor-grab active:cursor-grabbing select-none group/canvas"
    >
      {/* 3D Canvas */}
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Glassmorphic overlay loading / placeholder */}
      {isLoading && (
        <div className="absolute inset-0 bg-slate-50/20 dark:bg-slate-950/20 backdrop-blur-xs flex items-center justify-center animate-pulse">
          <Trophy className="w-12 h-12 text-blue-500/40 animate-bounce" />
        </div>
      )}

      {/* Error overlay */}
      {loadError && (
        <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center">
          <Trophy className="w-10 h-10 text-red-500 mb-2" />
          <span className="text-xs font-bold text-slate-300">{loadError}</span>
        </div>
      )}

      {/* Decorative interactive tip */}
      {!isLoading && !loadError && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 opacity-0 group-hover/canvas:opacity-100 transition-opacity duration-300 pointer-events-none text-[10px] font-semibold text-slate-500 bg-white/80 dark:bg-slate-900/80 px-2 py-0.5 rounded-full border border-slate-200/50 dark:border-slate-800/50 shadow-xs backdrop-blur-xs">
          Arrastrá para rotar
        </div>
      )}
    </div>
  );
}
