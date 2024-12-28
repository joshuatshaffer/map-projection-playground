import * as THREE from "three";
import mapImageSrc from "./assets/nasa-visible-earth-blue-marble-next-generation/july/world.topo.bathy.200407.3x5400x2700.jpg";
import { makeInputs } from "./inputs";
import fragmentShader from "./mapProjection.frag?raw";
import vertexShader from "./mapProjection.vert?raw";
import styles from "./MapProjectionRender.module.css";

export function MapProjectionRender() {
  return (
    <canvas
      ref={(canvas) => {
        if (canvas === null) {
          return;
        }

        return mapProjectionRender(canvas);
      }}
      className={styles.canvas}
    />
  );
}

function mapProjectionRender(canvas: HTMLCanvasElement) {
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const scene = new THREE.Scene();

  const uniforms = {
    diffuse: { value: new THREE.TextureLoader().load(mapImageSrc) },
    centerLat: { value: 0 },
    centerLon: { value: 0 },
  };

  scene.add(
    new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.RawShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms,
      })
    )
  );

  const inputs = makeInputs(canvas, {
    onDrag: ({ from, to }) => {
      uniforms.centerLat.value +=
        ((to.offsetY - from.offsetY) / window.innerHeight) * 10;

      uniforms.centerLon.value -=
        ((to.offsetX - from.offsetX) / window.innerWidth) * 10;
    },
  });

  const animate = () => {
    renderer.render(scene, camera);
  };

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setAnimationLoop(animate);
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;

  const onWindowResize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
  };

  window.addEventListener("resize", onWindowResize);

  return () => {
    console.log("Cleaning up AR overlay");

    inputs.dispose();

    renderer.setAnimationLoop(null);
    renderer.dispose();
    window.removeEventListener("resize", onWindowResize);
  };
}
