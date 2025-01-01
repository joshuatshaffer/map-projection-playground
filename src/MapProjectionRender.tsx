import * as THREE from "three";
import mapImageSrc from "./assets/nasa-visible-earth-blue-marble-next-generation/july/world.topo.bathy.200407.3x5400x2700.jpg";
import azimuthalEquidistantFragmentShader from "./azimuthalEquidistant.frag?raw";
import vertexShader from "./basic.vert?raw";
import equirectangularFragmentShader from "./equirectangular.frag?raw";
import { makeInputs } from "./inputs";
import styles from "./MapProjectionRender.module.css";
import { MapPlaygroundState, store } from "./store";

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

  const mapTexture = new THREE.TextureLoader().load(mapImageSrc);

  const uniforms = {
    diffuse: { value: mapTexture },
    centerLat: { value: 0 },
    centerLon: { value: 0 },
    centerHeading: { value: 0 },
    rotation: { value: new THREE.Matrix4() },
  };

  const updateUniforms = (state: MapPlaygroundState) => {
    uniforms.centerLat.value = state.mapCenter.lat;
    uniforms.centerLon.value = state.mapCenter.lon;
    uniforms.centerHeading.value = state.mapCenter.heading;
    uniforms.rotation.value.makeRotationFromEuler(
      new THREE.Euler(
        state.mapCenter.heading,
        state.mapCenter.lat,
        -state.mapCenter.lon
      )
    );
  };

  updateUniforms(store.getState());
  const unsubscribeUpdateUniforms = store.subscribe(updateUniforms);

  const planeGeometry = new THREE.PlaneGeometry(1, 1);

  const equirectangularMesh = new THREE.Mesh(
    planeGeometry,
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
    planeGeometry,
    new THREE.RawShaderMaterial({
      vertexShader,
      fragmentShader: azimuthalEquidistantFragmentShader,
      uniforms,
      alphaToCoverage: true,
    })
  );

  azimuthalEquidistantMesh.position.x = 0.5;
  azimuthalEquidistantMesh.position.y = 0.5;

  scene.add(azimuthalEquidistantMesh);

  const mapCenter = new THREE.Quaternion();

  const updateMapCenter = (state: MapPlaygroundState) => {
    mapCenter.setFromEuler(
      new THREE.Euler(
        state.mapCenter.lon,
        state.mapCenter.lat,
        -state.mapCenter.heading
      )
    );
  };

  updateMapCenter(store.getState());
  const unsubscribeUpdateMapCenter = store.subscribe(updateMapCenter);

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

      store.setState((state) => ({
        ...state,
        mapCenter: {
          lat: mapCenterEuler.y,
          lon: mapCenterEuler.x,
          heading: -mapCenterEuler.z,
        },
      }));
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

    // Fill the screen without distorting the aspect ratio.
    if (window.innerHeight > window.innerWidth) {
      camera.left = -1;
      camera.right = 1;
      camera.top = window.innerHeight / window.innerWidth;
      camera.bottom = -window.innerHeight / window.innerWidth;
    } else {
      camera.left = -window.innerWidth / window.innerHeight;
      camera.right = window.innerWidth / window.innerHeight;
      camera.top = 1;
      camera.bottom = -1;
    }
    camera.updateProjectionMatrix();
  };

  onWindowResize();
  window.addEventListener("resize", onWindowResize);

  return () => {
    inputs.dispose();

    window.removeEventListener("resize", onWindowResize);
    renderer.setAnimationLoop(null);
    renderer.dispose();

    unsubscribeUpdateUniforms();
    unsubscribeUpdateMapCenter();

    equirectangularMesh.material.dispose();
    azimuthalEquidistantMesh.material.dispose();
    planeGeometry.dispose();
    mapTexture.dispose();
  };
}
