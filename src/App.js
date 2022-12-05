import { useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  PerspectiveCamera,
  Instance,
  Instances
} from "@react-three/drei";
import { Html, Html3DRenderer } from "./Html";
import { Perf } from "r3f-perf";
import {
  Color,
  MathUtils,
  MeshPhysicalMaterial,
  NoBlending,
  Vector3
} from "three";

function InstancedSpheres(props) {
  const array = useMemo(
    () =>
      Array.from({ length: props.count }, () => ({
        position: new Vector3(
          MathUtils.randFloat(-1, 1),
          MathUtils.randFloat(-1, 1),
          MathUtils.randFloat(-1, 1)
        ).multiplyScalar(5),
        scale: new Vector3().setScalar(MathUtils.randFloat(0.2, 0.7)),
        color: new Color(
          MathUtils.randFloat(0, 1),
          MathUtils.randFloat(0, 1),
          MathUtils.randFloat(0, 1)
        ),
        randFactor: MathUtils.randFloat(0, 1)
      })),
    [props.count]
  );

  const uniforms = useMemo(
    () => ({
      uTime: {
        value: 0
      }
    }),
    []
  );

  useFrame(({ clock }) => (uniforms.uTime.value = clock.elapsedTime));

  return (
    <group>
      <Instances castShadow receiveShadow>
        <sphereGeometry />
        <meshPhysicalMaterial {...props} />

        {array.map((props, i) => (
          <Instance key={i} {...props} />
        ))}
      </Instances>
    </group>
  );
}

export default function App() {
  return (
    <>
      <Canvas shadows>
        <Html3DRenderer>
          <PerspectiveCamera makeDefault position={[0, 0, 17]} fov={45} />
          <OrbitControls makeDefault />
          <Environment preset="apartment" background blur={0.5} />
          <directionalLight
            castShadow
            position={[0, 1, -10]}
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            shadow-camera-left={-50}
            shadow-camera-right={50}
            shadow-camera-top={50}
            shadow-camera-bottom={-50}
            shadow-bias={-0.0001}
            intensity={1}
          />

          <InstancedSpheres
            count={30}
            transmission={1}
            roughness={0}
            thickness={5}
          />
          <InstancedSpheres count={30} roughness={0.2} />

          <Html
            pointerEvents="none"
            center
            transform
            depthTest
            castShadow
            receiveShadow
            material={
              new MeshPhysicalMaterial({
                opacity: 0.1,
                color: 0x050505,
                roughness: 0.2,
                blending: NoBlending,
                envMapIntensity: 0.1
              })
            }
          >
            <iframe
              style={{
                verticalAlign: "top"
              }}
              width={560 * 2 + ""}
              height={315 * 2 + ""}
              src="https://beta.tldraw.com/"
              // title="YouTube video player"
              frameBorder="0"
            />
          </Html>
        </Html3DRenderer>
        <Perf />
      </Canvas>
      <div className="copy">
        Made with 🤔 by{" "}
        <a target="_blank" href="https://github.com/FarazzShaikh">
          Faraz Shaikh
        </a>
        <br />
        Inspired by{" "}
        <a target="_blank" href="https://codepen.io/trusktr/pen/RjzKJx">
          Joe Pea
        </a>
      </div>
    </>
  );
}
