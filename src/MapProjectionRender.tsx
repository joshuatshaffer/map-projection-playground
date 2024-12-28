import * as THREE from "three";
import mapImageSrc from "./assets/nasa-visible-earth-blue-marble-next-generation/july/world.topo.bathy.200407.3x5400x2700.jpg";
import azimuthalEquidistantFragmentShader from "./azimuthalEquidistant.frag?raw";
import vertexShader from "./basic.vert?raw";
import equirectangularFragmentShader from "./equirectangular.frag?raw";
import { makeInputs } from "./inputs";
import styles from "./MapProjectionRender.module.css";
import { radToDeg } from "./utils";

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
    centerHeading: { value: 0 },
  };

  const equirectangularMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.RawShaderMaterial({
      vertexShader,
      fragmentShader: equirectangularFragmentShader,
      uniforms,
    })
  );

  equirectangularMesh.position.x = -0.5;
  equirectangularMesh.position.y = 0.5;

  scene.add(equirectangularMesh);

  const azimuthalEquidistantMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.RawShaderMaterial({
      vertexShader,
      fragmentShader: azimuthalEquidistantFragmentShader,
      uniforms,
    })
  );

  azimuthalEquidistantMesh.position.x = 0.5;
  azimuthalEquidistantMesh.position.y = 0.5;

  scene.add(azimuthalEquidistantMesh);

  const mapCenter = new THREE.Quaternion();

  const inputs = makeInputs(canvas, {
    onDrag: ({ from, to }) => {
      mapCenter.multiply(
        new THREE.Quaternion().setFromEuler(
          new THREE.Euler(
            -((to.offsetX - from.offsetX) / window.innerWidth) * 10,
            ((to.offsetY - from.offsetY) / window.innerHeight) * 10,
            0
          )
        )
      );

      const mapCenterEuler = new THREE.Euler().setFromQuaternion(mapCenter);
      uniforms.centerLat.value = mapCenterEuler.y;
      uniforms.centerLon.value = mapCenterEuler.x;
      uniforms.centerHeading.value = -mapCenterEuler.z;

      console.log(
        "Map center",
        radToDeg(mapCenterEuler.y),
        radToDeg(mapCenterEuler.x),
        radToDeg(-mapCenterEuler.z)
      );
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
