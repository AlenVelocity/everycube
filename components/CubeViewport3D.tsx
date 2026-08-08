"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { FACE_HEX } from "@/lib/cubeState";
import {
  CUBIE_STICKERS,
  NUM_CUBIES,
  cubiePlacements,
  type CubiePlacement,
  type Mat3,
} from "@/lib/cubiePlacement";

// The cube is 26 physical pieces with stickers painted on once (solved
// colors). A state change never recolors anything — pieces travel to
// their new slots with their real reorientation, so twists/flips read as
// pieces rotating in place and swaps read as pieces trading homes.

const Z_AXIS = new THREE.Vector3(0, 0, 1);

const CUBIE_GEOMETRY = CUBIE_STICKERS.map((stickers) =>
  stickers.map((s) => {
    const normal = new THREE.Vector3(...s.normal);
    return {
      color: FACE_HEX[s.face],
      position: normal.clone().multiplyScalar(0.492),
      quaternion: new THREE.Quaternion().setFromUnitVectors(Z_AXIS, normal),
    };
  })
);

function toQuaternion(m: Mat3): THREE.Quaternion {
  const m4 = new THREE.Matrix4();
  // prettier-ignore
  m4.set(
    m[0][0], m[0][1], m[0][2], 0,
    m[1][0], m[1][1], m[1][2], 0,
    m[2][0], m[2][1], m[2][2], 0,
    0, 0, 0, 1
  );
  return new THREE.Quaternion().setFromRotationMatrix(m4);
}

// Keep the whole cube in frame at any viewport aspect: the camera's
// distance from the origin grows as the viewport narrows.
const BASE_DISTANCE = 9.2; // fits the cube's bounding sphere at fov 32

function FitCamera() {
  const { camera, size } = useThree();
  useEffect(() => {
    const aspect = size.width / size.height;
    camera.position.setLength(BASE_DISTANCE * Math.max(1, 1 / aspect));
    camera.updateProjectionMatrix();
  }, [camera, size]);
  return null;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// With FX off there's no animation at all — pieces snap straight to
// their new pose, same as a plain color change. With FX on, bigger
// index jumps get slower, more deliberate animations: scroll ticks stay
// snappy, ruler drags across the space read as a full rearrangement.
function durationFor(delta: bigint, fxOn: boolean): number {
  if (!fxOn) return 0;
  if (delta < 10_000n) return 0.45;
  if (delta < 1_000_000_000n) return 0.75;
  return 1.2;
}

interface AnimState {
  startP: THREE.Vector3[];
  startQ: THREE.Quaternion[];
  endP: THREE.Vector3[];
  endQ: THREE.Quaternion[];
  liftDir: THREE.Vector3[];
  liftAmp: number[];
  t: number;
  dur: number;
}

function Cubies({ n, fx }: { n: bigint; fx: boolean }) {
  const placements = useMemo(() => cubiePlacements(n), [n]);
  const groups = useRef<(THREE.Group | null)[]>(Array(NUM_CUBIES).fill(null));
  const anim = useRef<AnimState | null>(null);
  // Changes arriving mid-flight are latched here; the running transition
  // always completes, then one new transition starts toward the latest
  // state (intermediate states are skipped).
  const pending = useRef<{ placements: CubiePlacement[]; n: bigint } | null>(
    null
  );
  const lastN = useRef(n);
  const fxRef = useRef(fx);
  fxRef.current = fx;

  if (!anim.current) {
    const endP = placements.map((p) => new THREE.Vector3(...p.position));
    const endQ = placements.map((p) => toQuaternion(p.rotation));
    anim.current = {
      startP: endP.map((v) => v.clone()),
      startQ: endQ.map((q) => q.clone()),
      endP,
      endQ,
      liftDir: endP.map(() => new THREE.Vector3(0, 1, 0)),
      liftAmp: Array(NUM_CUBIES).fill(0),
      t: 1,
      dur: 1,
    };
  }

  const begin = useCallback((next: CubiePlacement[], targetN: bigint) => {
    const a = anim.current!;
    const fxOn = fxRef.current;
    const delta =
      targetN > lastN.current ? targetN - lastN.current : lastN.current - targetN;
    lastN.current = targetN;
    const newP = next.map((p) => new THREE.Vector3(...p.position));
    const newQ = next.map((p) => toQuaternion(p.rotation));
    const changed = new Array<boolean>(NUM_CUBIES);
    let moved = 0;
    for (let i = 0; i < NUM_CUBIES; i++) {
      changed[i] =
        newP[i].distanceToSquared(a.endP[i]) > 1e-6 ||
        Math.abs(newQ[i].dot(a.endQ[i])) < 0.99999;
      if (changed[i]) moved++;
    }
    if (moved === 0) return;
    for (let i = 0; i < NUM_CUBIES; i++) {
      const g = groups.current[i];
      a.startP[i] = g ? g.position.clone() : a.endP[i];
      a.startQ[i] = g ? g.quaternion.clone() : a.endQ[i];
      a.endP[i] = newP[i];
      a.endQ[i] = newQ[i];
      const dist = a.startP[i].distanceTo(newP[i]);
      const mid = a.startP[i].clone().add(newP[i]);
      a.liftDir[i] =
        mid.lengthSq() > 0.25
          ? mid.normalize()
          : a.startP[i].clone().normalize();
      // Every changing piece clears the cube before turning/travelling:
      // in-place rotators pop out ~0.9 (a rotating cubie sweeps ~0.34
      // beyond its cell), travellers arc farther the longer the trip.
      // No arc at all with FX off — that mode has no motion to clip.
      a.liftAmp[i] = fxOn && changed[i] ? Math.min(0.9 + 0.35 * dist, 2.2) : 0;
    }
    a.dur = durationFor(delta, fxOn);
    a.t = 0;
  }, []);

  useEffect(() => {
    if (anim.current!.t < 1) pending.current = { placements, n };
    else begin(placements, n);
  }, [placements, n, begin]);

  useFrame((_, dt) => {
    const a = anim.current!;
    if (a.t >= 1) {
      if (pending.current) {
        const next = pending.current;
        pending.current = null;
        begin(next.placements, next.n);
      }
      return;
    }
    a.t = a.dur <= 0 ? 1 : Math.min(1, a.t + dt / a.dur);
    const e = easeInOutCubic(a.t);
    const arc = Math.sin(Math.PI * a.t);
    for (let i = 0; i < NUM_CUBIES; i++) {
      const g = groups.current[i];
      if (!g) continue;
      g.position
        .lerpVectors(a.startP[i], a.endP[i], e)
        .addScaledVector(a.liftDir[i], arc * a.liftAmp[i]);
      g.quaternion.slerpQuaternions(a.startQ[i], a.endQ[i], e);
    }
  });

  return (
    <>
      {CUBIE_GEOMETRY.map((stickers, i) => (
        <group
          key={i}
          ref={(g: THREE.Group | null) => {
            if (g && !groups.current[i]) {
              g.position.copy(anim.current!.endP[i]);
              g.quaternion.copy(anim.current!.endQ[i]);
            }
            groups.current[i] = g;
          }}
        >
          <RoundedBox args={[0.97, 0.97, 0.97]} radius={0.055} smoothness={4}>
            <meshStandardMaterial color="#e4e4e7" />
          </RoundedBox>
          {stickers.map((s, k) => (
            <mesh key={k} position={s.position} quaternion={s.quaternion}>
              <planeGeometry args={[0.86, 0.86]} />
              <meshBasicMaterial color={s.color} />
            </mesh>
          ))}
        </group>
      ))}
    </>
  );
}

export default function CubeViewport3D({
  n,
  fx,
}: {
  n: bigint;
  fx: boolean;
}) {
  return (
    <Canvas
      className="!absolute inset-0"
      camera={{ position: [4.4, 3.6, 5.4], fov: 32 }}
      dpr={[1, 2]}
      gl={{ antialias: true }}
    >
      <color attach="background" args={["#fafafa"]} />
      <FitCamera />
      <ambientLight intensity={1.15} />
      <directionalLight position={[6, 8, 5]} intensity={0.9} />
      <Cubies n={n} fx={fx} />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.7}
        // One-finger touch is reserved for scrolling through permutations
        // (useScrollIndex); only a two-finger drag rotates the cube.
        touches={{ ONE: undefined as unknown as THREE.TOUCH, TWO: THREE.TOUCH.ROTATE }}
      />
    </Canvas>
  );
}
