import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Effects } from '@react-three/drei';
import { UnrealBloomPass } from 'three-stdlib';
import * as THREE from 'three';

// Extend R3F with UnrealBloomPass
import { extend } from '@react-three/fiber';
extend({ UnrealBloomPass });

/* ───────────────────────────────────────────
   Mouse tracker – passes normalised coords
   into the particle system via a ref
   ─────────────────────────────────────────── */
function MouseTracker({ mouseRef }) {
  const { size } = useThree();

  useEffect(() => {
    const onMove = (e) => {
      mouseRef.current.x = (e.clientX / size.width) * 2 - 1;
      mouseRef.current.y = -(e.clientY / size.height) * 2 + 1;
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [size, mouseRef]);

  return null;
}

/* ───────────────────────────────────────────
   Lorenz Butterfly Particle Swarm
   ─────────────────────────────────────────── */
const ParticleSwarm = ({ mouseRef }) => {
  const meshRef = useRef();
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const count = isMobile ? 12000 : 25000;
  const speedMult = 0.5;
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const target = useMemo(() => new THREE.Vector3(), []);
  const pColor = useMemo(() => new THREE.Color(), []);

  const positions = useMemo(() => {
    const pos = [];
    for (let i = 0; i < count; i++) {
      pos.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 100,
          (Math.random() - 0.5) * 100,
          (Math.random() - 0.5) * 100
        )
      );
    }
    return pos;
  }, [count]);

  const material = useMemo(() => new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 }), []);
  const geometry = useMemo(() => new THREE.TetrahedronGeometry(0.15), []);

  const PARAMS = useMemo(
    () => ({ speed: 0.5, scale: 22, thick: 3.0, chaos: 0.6 }),
    []
  );

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime() * speedMult;

    // Mouse influence
    const mx = mouseRef.current.x * 8;
    const my = mouseRef.current.y * 6;

    for (let i = 0; i < count; i++) {
      const { speed, scale, thick, chaos } = PARAMS;

      const t = (i / count) * Math.PI * 2.0;
      const anim = time * speed * 0.4;
      const ta = t + anim;

      const denom = 1.0 + Math.sin(ta) * Math.sin(ta);
      const lx = Math.cos(ta) / (denom + 0.001);
      const ly = (Math.sin(ta) * Math.cos(ta)) / (denom + 0.001);
      const zBase = Math.cos(t * 2.5 + anim * 1.8);
      const lz = zBase * zBase * Math.sign(zBase + 0.001) * 0.7;

      const r1 = Math.sin(i * 127.1) * 0.5 + 0.5;
      const r2 = Math.sin(i * 311.7) * 0.5 + 0.5;
      const r3 = Math.sin(i * 74.3) * 0.5 + 0.5;
      const sr = r1 * r1 * thick * 0.1;
      const sa = r2 * Math.PI * 2.0;
      const sx = Math.cos(sa) * sr;
      const sy = Math.sin(sa) * sr * 0.5;
      const sz = (r3 - 0.5) * thick * 0.12;

      const noise =
        Math.sin(i * 0.017 + time * 2.1) * Math.cos(i * 0.031 - time * 0.9) +
        Math.sin(i * 0.007 - time * 1.6) * 0.4;

      // Add mouse influence as a gentle attraction force
      const mouseInfluence = 0.06;
      target.set(
        (lx + sx + noise * chaos * 0.025) * scale + mx * mouseInfluence * scale * 0.1,
        (lz + sy + noise * chaos * 0.02) * scale + my * mouseInfluence * scale * 0.1,
        (ly + sz + noise * chaos * 0.015) * scale
      );

      const wingBlend = Math.sin(t) * Math.sin(t);
      const hue = 0.54 + 0.3 * (t / (Math.PI * 2.0));
      const lit = 0.3 + 0.35 * wingBlend + 0.2 * r1;
      pColor.setHSL(hue, 1.0, Math.min(lit, 0.85));

      positions[i].lerp(target, 0.08);
      dummy.position.copy(positions[i]);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
      meshRef.current.setColorAt(i, pColor);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor)
      meshRef.current.instanceColor.needsUpdate = true;
  });

  return <instancedMesh ref={meshRef} args={[geometry, material, count]} />;
};

/* ───────────────────────────────────────────
   Exported wrapper – full-viewport Canvas
   ─────────────────────────────────────────── */
export default function ParticleBackground() {
  const mouseRef = useRef({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);

  // Fade in after mount to avoid flash
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        opacity: visible ? 0.45 : 0,
        transition: 'opacity 1.5s ease',
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 120], fov: 55 }}
        dpr={[1, 1.5]}
        style={{ background: 'transparent' }}
        gl={{ alpha: true, antialias: false, powerPreference: 'high-performance' }}
      >
        <MouseTracker mouseRef={mouseRef} />
        <ParticleSwarm mouseRef={mouseRef} />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.3}
          enableDamping
        />
        <Effects disableGamma>
          <unrealBloomPass threshold={0.15} strength={0.9} radius={0.4} />
        </Effects>
      </Canvas>
    </div>
  );
}
