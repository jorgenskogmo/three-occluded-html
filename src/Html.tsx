import { applyProps, GroupProps, useFrame, useThree } from "@react-three/fiber";
import React, { useLayoutEffect, useMemo } from "react";
import * as ReactDOM from "react-dom/client";
import {
  BoxGeometry,
  Group,
  Material,
  Mesh,
  NoBlending,
  Scene,
  ShaderMaterial,
} from "three";
import {
  CSS3DObject,
  CSS3DRenderer,
} from "three/examples/jsm/renderers/CSS3DRenderer";

interface HtmlAPI {
  css3DRenderer: CSS3DRenderer;
  css3DScene: Scene;
}

const htmlContext = React.createContext<HtmlAPI>(null!);

interface Html3DRendererProps {}

export function Html3DRenderer({
  children,
}: React.PropsWithChildren<Html3DRendererProps>) {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const size = useThree((state) => state.size);

  const value = useMemo<HtmlAPI>(
    () => ({
      css3DRenderer: new CSS3DRenderer(),
      css3DScene: new Scene(),
    }),
    []
  );

  useLayoutEffect(() => {
    value.css3DRenderer.setSize(size.width, size.height);
  }, [size]);

  useLayoutEffect(() => {
    value.css3DRenderer.domElement.style.position = "absolute";
    // value.css3DRenderer.domElement.style.pointerEvents = "none";
    value.css3DRenderer.domElement.style.top = "0";
    value.css3DRenderer.domElement.style.zIndex = "5";

    gl.domElement.parentElement!.appendChild(value.css3DRenderer.domElement);

    gl.domElement.style.position = "absolute";
    gl.domElement.style.top = "0";
    gl.domElement.style.zIndex = "10";
    gl.domElement.style.pointerEvents = "none";

    scene.add(value.css3DScene);

    return () => {
      gl.domElement.parentElement!.removeChild(value.css3DRenderer.domElement);
      scene.remove(value.css3DScene);
    };
  }, []);

  useFrame((gl) => {
    value.css3DRenderer.render(gl.scene, gl.camera);
  });

  return <htmlContext.Provider value={value}>{children}</htmlContext.Provider>;
}

interface HtmlProps extends GroupProps {
  material?: Material;
}

export function Html({
  children,
  castShadow,
  receiveShadow,
  material,
  ...props
}: React.PropsWithChildren<HtmlProps>) {
  const viewport = useThree((state) => state.viewport);

  const [el] = React.useState(() => document.createElement("div"));
  const [group] = React.useState(() => new Group());
  const [ratio] = React.useState(() => 1 / viewport.factor);
  const root = React.useRef<ReactDOM.Root>();
  const mesh = React.useRef<Mesh>();
  const isMeshSizeSet = React.useRef<boolean>(true);

  const { css3DScene } = React.useContext(htmlContext);

  useLayoutEffect(() => {
    applyProps(group as any, props as any);
  });

  useLayoutEffect(() => {
    isMeshSizeSet.current = false;

    // Occluder mesh
    mesh.current = new Mesh(
      new BoxGeometry(1, 1, 0.001),
      material ||
        new ShaderMaterial({
          blending: NoBlending,
          fragmentShader: `
            void main() {
              gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
            }          
          `,
        })
    );
    mesh.current.castShadow = !!castShadow;
    mesh.current.receiveShadow = !!receiveShadow;
    group.add(mesh.current);

    root.current = ReactDOM.createRoot(el);
    root.current?.render(<>{children}</>);

    // Resize the element form 3js units to pixel units
    const css3DObject = new CSS3DObject(el);
    css3DObject.scale.set(ratio, ratio, 0.001);
    group.add(css3DObject);

    // Create a mesh the size of the element
    css3DScene.add(group);

    return () => {
      group.remove(css3DObject);
      css3DScene.remove(css3DObject);
      root.current?.unmount();

      mesh.current!.geometry.dispose();
      (mesh.current!.material as ShaderMaterial).dispose();
      group.remove(mesh.current!);
    };
  });

  useFrame(() => {
    if (!isMeshSizeSet.current && mesh.current && el.clientWidth) {
      const w = el.clientWidth * ratio;
      const h = el.clientHeight * ratio;

      mesh.current!.scale.set(w, h, 1);
      mesh.current!.updateMatrix();

      isMeshSizeSet.current = true;
    }
  });
}
