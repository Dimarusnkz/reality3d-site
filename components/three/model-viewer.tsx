"use client";

import { Canvas } from "@react-three/fiber";
import { 
  OrbitControls, 
  Stage, 
  Center, 
  useProgress, 
  Html, 
  Bounds,
  PerspectiveCamera
} from "@react-three/drei";
import { Suspense, useEffect, useState } from "react";
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center gap-2 bg-slate-900/80 px-4 py-2 rounded-lg border border-slate-700">
        <div className="w-32 h-1 bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300" 
            style={{ width: `${progress}%` }} 
          />
        </div>
        <span className="text-xs font-medium text-white">{Math.round(progress)}%</span>
      </div>
    </Html>
  );
}

function Model({ url, type }: { url: string; type: "stl" | "obj" }) {
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null);
  const [object, setObject] = useState<THREE.Group | null>(null);

  useEffect(() => {
    if (type === "stl") {
      const loader = new STLLoader();
      loader.load(url, (geo) => {
        geo.computeVertexNormals();
        setGeometry(geo);
      });
    } else if (type === "obj") {
      const loader = new OBJLoader();
      loader.load(url, (obj) => {
        setObject(obj);
      });
    }
  }, [url, type]);

  if (type === "stl" && geometry) {
    return (
      <mesh geometry={geometry}>
        <meshStandardMaterial color="#FF5E00" roughness={0.3} metalness={0.2} />
      </mesh>
    );
  }

  if (type === "obj" && object) {
    return <primitive object={object} />;
  }

  return null;
}

export function ModelViewer({ url, fileName }: { url: string; fileName: string }) {
  const isStl = fileName.toLowerCase().endsWith(".stl");
  const isObj = fileName.toLowerCase().endsWith(".obj");

  if (!isStl && !isObj) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-950 rounded-xl border border-dashed border-slate-800 p-8 text-center">
        <p className="text-slate-500 text-sm">
          Просмотр доступен только для файлов .STL и .OBJ
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-[400px] bg-slate-950 rounded-xl border border-slate-800 overflow-hidden relative group">
      <div className="absolute top-4 left-4 z-10">
        <div className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-slate-800">
          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
            3D Preview: {fileName}
          </span>
        </div>
      </div>

      <Canvas shadows dpr={[1, 2]}>
        <Suspense fallback={<Loader />}>
          <Stage 
            intensity={0.5} 
            environment="city" 
            shadows={{ type: 'contact', opacity: 0.2, blur: 2 }} 
            adjustCamera={1.2}
          >
            <Center>
              <Model url={url} type={isStl ? "stl" : "obj"} />
            </Center>
          </Stage>
          <OrbitControls makeDefault autoRotate autoRotateSpeed={0.5} minPolarAngle={0} maxPolarAngle={Math.PI / 1.75} />
        </Suspense>
      </Canvas>

      <div className="absolute bottom-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="px-3 py-1 bg-black/40 text-[10px] text-slate-500 rounded">
          Вращайте мышью
        </div>
      </div>
    </div>
  );
}
