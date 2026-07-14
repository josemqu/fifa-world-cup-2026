"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";
import { Trophy } from "lucide-react";

// Custom shader for the Reflector to achieve a smooth radial fade-out
const CustomReflectorShader = {
  name: "CustomReflectorShader",
  uniforms: {
    color: { value: null },
    tDiffuse: { value: null },
    textureMatrix: { value: null },
    maxRadius: { value: 3.0 },
  },
  vertexShader: `
    uniform mat4 textureMatrix;
    varying vec4 vUv;
    varying vec2 vPosition;

    #include <common>
    #include <logdepthbuf_pars_vertex>

    void main() {
      vPosition = position.xy;
      vUv = textureMatrix * vec4( position, 1.0 );
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
      #include <logdepthbuf_vertex>
    }
  `,
  fragmentShader: `
    uniform vec3 color;
    uniform sampler2D tDiffuse;
    uniform float maxRadius;
    varying vec4 vUv;
    varying vec2 vPosition;

    #include <logdepthbuf_pars_fragment>

    float blendOverlay( float base, float blend ) {
      return( base < 0.5 ? ( 2.0 * base * blend ) : ( 1.0 - 2.0 * ( 1.0 - base ) * ( 1.0 - blend ) ) );
    }

    vec3 blendOverlay( vec3 base, vec3 blend ) {
      return vec3( blendOverlay( base.r, blend.r ), blendOverlay( base.g, blend.g ), blendOverlay( base.b, blend.b ) );
    }

    void main() {
      #include <logdepthbuf_fragment>
      vec4 base = texture2DProj( tDiffuse, vUv );
      
      // Calculate distance from center of the reflector plane
      float dist = length(vPosition);
      
      // Fades out from the center (using dynamic maxRadius)
      float falloff = 1.0 - smoothstep(0.0, maxRadius, dist);
      
      // Multiply by 0.45 for a premium, subtle reflection
      gl_FragColor = vec4( blendOverlay( base.rgb, color ), falloff * 0.45 );

      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `,
};

interface TrophyCanvasProps {
  targetHeight?: number;
  cameraPosition?: [number, number, number];
  interactive?: boolean;
}

export default function TrophyCanvas({
  targetHeight = 4.8,
  cameraPosition = [0, -0.2, 7.0],
  interactive = true,
}: TrophyCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    // References for reflector disposal
    let groundMirror: Reflector | null = null;
    let reflectorGeometry: THREE.PlaneGeometry | null = null;

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
    camera.position.set(cameraPosition[0], cameraPosition[1], cameraPosition[2]);

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

    // References for entrance animation
    let loadedPivot: THREE.Group | null = null;
    let targetScale = 1.0;
    let hasFinishedIntro = false;

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
        const scaleFactor = targetHeight / maxDim;
        
        // Store targets for intro animation
        targetScale = scaleFactor;
        loadedPivot = pivot;
        
        // Initial state for animation (start small and below view)
        pivot.scale.setScalar(0.01);
        pivot.position.y = -2.0;

        trophyGroup.add(pivot);

        // Create Reflector surface at the bottom base of the trophy
        const bottomY = - (size.y * scaleFactor) / 2;
        reflectorGeometry = new THREE.PlaneGeometry(12, 12);
        
        // Calculate dynamic maxRadius proportional to targetHeight (50% of targetHeight)
        const calculatedMaxRadius = targetHeight * 0.5;
        
        // Clone and configure the shader for this instance to have a custom maxRadius uniform value
        const instanceShader = {
          name: "CustomReflectorShader",
          uniforms: {
            color: { value: null },
            tDiffuse: { value: null },
            textureMatrix: { value: null },
            maxRadius: { value: calculatedMaxRadius },
          },
          vertexShader: CustomReflectorShader.vertexShader,
          fragmentShader: CustomReflectorShader.fragmentShader,
        };

        groundMirror = new Reflector(reflectorGeometry, {
          clipBias: 0.003,
          textureWidth: 512,
          textureHeight: 512,
          color: 0x7f7f7f,
          shader: instanceShader,
        });
        
        if (groundMirror.material instanceof THREE.ShaderMaterial) {
          groundMirror.material.transparent = true;
        }
        
        // Position slightly below the base to prevent z-fighting
        groundMirror.position.y = bottomY - 0.02;
        groundMirror.rotateX(-Math.PI / 2);
        scene.add(groundMirror);

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
      // Clamp X rotation to avoid flipping or clipping the base through the reflector
      const newRotX = trophyGroup.rotation.x + deltaY * 0.007;
      trophyGroup.rotation.x = Math.max(-0.15, Math.min(0.15, newRotX));

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
      trophyGroup.rotation.x = Math.max(-0.15, Math.min(0.15, newRotX));

      dragVelocity = { x: deltaX, y: deltaY };
      previousMousePosition = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    };

    // Listeners
    if (interactive) {
      canvas.addEventListener("mousedown", onMouseDown);
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
      canvas.addEventListener("touchstart", onTouchStart, { passive: true });
      canvas.addEventListener("touchmove", onTouchMove, { passive: true });
      window.addEventListener("touchend", onMouseUp);
    }

    // Hover effect: Spin faster on hover
    const onMouseEnter = () => {
      targetAutoSpeed = 0.012;
    };
    const onMouseLeave = () => {
      targetAutoSpeed = 0.005;
      isDragging = false; // safe release
    };
    
    if (interactive) {
      container.addEventListener("mouseenter", onMouseEnter);
      container.addEventListener("mouseleave", onMouseLeave);
    }

    // 6. Animation Loop
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Smooth rise & scale-up intro animation
      if (loadedPivot && !hasFinishedIntro) {
        if (loadedPivot.scale.x < targetScale * 0.99) {
          const nextScale = THREE.MathUtils.lerp(loadedPivot.scale.x, targetScale, 0.05);
          loadedPivot.scale.setScalar(nextScale);
          
          const nextY = THREE.MathUtils.lerp(loadedPivot.position.y, 0, 0.05);
          loadedPivot.position.y = nextY;
        } else {
          loadedPivot.scale.setScalar(targetScale);
          loadedPivot.position.y = 0;
          hasFinishedIntro = true;
        }
      }

      if (!isDragging) {
        // Decay drag momentum
        if (Math.abs(dragVelocity.x) > 0.01) {
          trophyGroup.rotation.y += dragVelocity.x * 0.007;
          dragVelocity.x *= 0.95;
        }
        if (Math.abs(dragVelocity.y) > 0.01) {
          const newRotX = trophyGroup.rotation.x + dragVelocity.y * 0.007;
          trophyGroup.rotation.x = Math.max(-0.15, Math.min(0.15, newRotX));
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

      // Dispose reflector resources
      if (groundMirror) {
        if (reflectorGeometry) reflectorGeometry.dispose();
        groundMirror.dispose();
      }

      // Remove event listeners
      if (interactive) {
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
      <canvas
        ref={canvasRef}
        className={`w-full h-full block transition-all duration-1000 ease-out ${
          isLoading ? "opacity-0 scale-95" : "opacity-100 scale-100"
        }`}
      />

      {/* Glassmorphic overlay loading / placeholder */}
      {isLoading && interactive && (
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
      {!isLoading && !loadError && interactive && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 opacity-0 group-hover/canvas:opacity-100 transition-opacity duration-300 pointer-events-none text-[10px] font-semibold text-slate-500 bg-white/80 dark:bg-slate-900/80 px-2 py-0.5 rounded-full border border-slate-200/50 dark:border-slate-800/50 shadow-xs backdrop-blur-xs">
          Arrastrá para rotar
        </div>
      )}
    </div>
  );
}
