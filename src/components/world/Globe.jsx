import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import gsap from "gsap";

import locations from "../../data/projects";

function Globe({ onSelectLocation }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    // --------------------------------
    // SCENE
    // --------------------------------

    const scene = new THREE.Scene();

    // --------------------------------
    // CAMERA
    // --------------------------------

    const camera = new THREE.PerspectiveCamera(
      35,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );

    camera.position.set(0, 0, 8);

    // --------------------------------
    // RENDERER
    // --------------------------------

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });

    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, 2)
    );

    renderer.setSize(
      container.clientWidth,
      container.clientHeight
    );

    renderer.outputColorSpace = THREE.SRGBColorSpace;

    container.appendChild(renderer.domElement);

    // --------------------------------
    // LIGHT
    // --------------------------------

    const ambientLight = new THREE.AmbientLight(
      0xffffff,
      0.7
    );

    scene.add(ambientLight);

    const directionalLight =
      new THREE.DirectionalLight(
        0xffffff,
        1.8
      );

    directionalLight.position.set(
      5,
      3,
      5
    );

    scene.add(directionalLight);

    // --------------------------------
    // EARTH
    // --------------------------------

    const textureLoader =
      new THREE.TextureLoader();

    const earthTexture =
      textureLoader.load(
        "https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg"
      );

    earthTexture.colorSpace =
      THREE.SRGBColorSpace;

    const earthGeometry =
      new THREE.SphereGeometry(
        2.65,
        96,
        96
      );

    const earthMaterial =
      new THREE.MeshPhongMaterial({
        map: earthTexture,
        shininess: 8,
      });

    const earth =
      new THREE.Mesh(
        earthGeometry,
        earthMaterial
      );

    scene.add(earth);

    // --------------------------------
    // ATMOSPHERE
    // --------------------------------

    const atmosphereGeometry =
      new THREE.SphereGeometry(
        2.72,
        64,
        64
      );

    const atmosphereMaterial =
      new THREE.MeshBasicMaterial({
        color: 0x4ecfff,
        transparent: true,
        opacity: 0.08,
        side: THREE.BackSide,
      });

    const atmosphere =
      new THREE.Mesh(
        atmosphereGeometry,
        atmosphereMaterial
      );

    scene.add(atmosphere);

    // --------------------------------
    // STAR FIELD
    // --------------------------------

    const starGeometry =
      new THREE.BufferGeometry();

    const starPositions = [];

    for (let i = 0; i < 1800; i++) {
      const radius = 25;

      const theta =
        Math.random() *
        Math.PI *
        2;

      const phi =
        Math.acos(
          2 * Math.random() - 1
        );

      starPositions.push(
        radius *
          Math.sin(phi) *
          Math.cos(theta),

        radius *
          Math.sin(phi) *
          Math.sin(theta),

        radius *
          Math.cos(phi)
      );
    }

    starGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(
        starPositions,
        3
      )
    );

    const starMaterial =
      new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.035,
        transparent: true,
        opacity: 0.65,
      });

    const stars =
      new THREE.Points(
        starGeometry,
        starMaterial
      );

    scene.add(stars);

    // --------------------------------
    // MARKER GROUP
    // --------------------------------

    const markerGroup =
      new THREE.Group();

    scene.add(markerGroup);

    const markerObjects = [];

    // --------------------------------
    // LAT LNG → 3D
    // --------------------------------

    function latLngToVector3(
      lat,
      lng,
      radius
    ) {
      const phi =
        (90 - lat) *
        (Math.PI / 180);

      const theta =
        (lng + 180) *
        (Math.PI / 180);

      const x =
        -radius *
        Math.sin(phi) *
        Math.cos(theta);

      const z =
        radius *
        Math.sin(phi) *
        Math.sin(theta);

      const y =
        radius *
        Math.cos(phi);

      return new THREE.Vector3(
        x,
        y,
        z
      );
    }

    // --------------------------------
    // CREATE MARKERS
    // --------------------------------

    locations.forEach((location) => {
      const position =
        latLngToVector3(
          location.lat,
          location.lng,
          2.72
        );

      // Main glowing point
      const markerGeometry =
        new THREE.SphereGeometry(
          0.055,
          24,
          24
        );

      const markerMaterial =
        new THREE.MeshBasicMaterial({
          color: 0x9be8ff,
        });

      const marker =
        new THREE.Mesh(
          markerGeometry,
          markerMaterial
        );

      marker.position.copy(position);

      marker.userData = location;

      markerGroup.add(marker);

      // Outer glow
      const glowGeometry =
        new THREE.RingGeometry(
          0.07,
          0.11,
          32
        );

      const glowMaterial =
        new THREE.MeshBasicMaterial({
          color: 0x63d9ff,
          transparent: true,
          opacity: 0.75,
          side: THREE.DoubleSide,
        });

      const glow =
        new THREE.Mesh(
          glowGeometry,
          glowMaterial
        );

      glow.position.copy(position);

      glow.lookAt(
        new THREE.Vector3(0, 0, 0)
      );

      markerGroup.add(glow);

      // Vertical light beam
      const beamGeometry =
        new THREE.CylinderGeometry(
          0.006,
          0.006,
          0.35,
          8
        );

      const beamMaterial =
        new THREE.MeshBasicMaterial({
          color: 0x8deaff,
          transparent: true,
          opacity: 0.45,
        });

      const beam =
        new THREE.Mesh(
          beamGeometry,
          beamMaterial
        );

      beam.position.copy(
        position.clone().multiplyScalar(1.06)
      );

      beam.lookAt(
        new THREE.Vector3(0, 0, 0)
      );

      markerGroup.add(beam);

      markerObjects.push({
        marker,
        glow,
        beam,
        location,
      });
    });

    // --------------------------------
    // CONTROLS
    // --------------------------------

    const controls =
      new OrbitControls(
        camera,
        renderer.domElement
      );

    controls.enableDamping = true;

    controls.dampingFactor = 0.05;

    controls.enablePan = false;

    controls.minDistance = 3.5;

    controls.maxDistance = 10;

    controls.autoRotate = true;

    controls.autoRotateSpeed = 0.18;

    // --------------------------------
    // CLICK
    // --------------------------------

    const raycaster =
      new THREE.Raycaster();

    const mouse =
      new THREE.Vector2();

    const handlePointerDown = (
      event
    ) => {
      const rect =
        renderer.domElement.getBoundingClientRect();

      mouse.x =
        ((event.clientX -
          rect.left) /
          rect.width) *
          2 -
        1;

      mouse.y =
        -(
          ((event.clientY -
            rect.top) /
            rect.height) *
            2 -
          1
        );

      raycaster.setFromCamera(
        mouse,
        camera
      );

      const intersects =
        raycaster.intersectObjects(
          markerObjects.map(
            (item) => item.marker
          )
        );

      if (!intersects.length) return;

      const selected =
        intersects[0].object.userData;

      // Stop automatic rotation
      controls.autoRotate = false;

      // Notify parent
      onSelectLocation(selected);

      // Smooth zoom
      const target =
        latLngToVector3(
          selected.lat,
          selected.lng,
          2.65
        );

      const direction =
        target.clone().normalize();

      const destination =
        direction.multiplyScalar(4.3);

      gsap.to(camera.position, {
        x: destination.x,
        y: destination.y,
        z: destination.z,
        duration: 1.5,
        ease: "power3.inOut",
      });
    };

    renderer.domElement.addEventListener(
      "pointerdown",
      handlePointerDown
    );

    // --------------------------------
    // RESIZE
    // --------------------------------

    const handleResize = () => {
      const width =
        container.clientWidth;

      const height =
        container.clientHeight;

      camera.aspect =
        width / height;

      camera.updateProjectionMatrix();

      renderer.setSize(
        width,
        height
      );
    };

    window.addEventListener(
      "resize",
      handleResize
    );

    // --------------------------------
    // ANIMATION
    // --------------------------------

    let animationFrame;

    const animate = () => {
      animationFrame =
        requestAnimationFrame(
          animate
        );

      controls.update();

      earth.rotation.y +=
        0.00025;

      atmosphere.rotation.y +=
        0.0002;

      stars.rotation.y +=
        0.00005;

      markerObjects.forEach(
        (item, index) => {
          const pulse =
            1 +
            Math.sin(
              Date.now() * 0.003 +
                index
            ) *
              0.15;

          item.glow.scale.set(
            pulse,
            pulse,
            pulse
          );
        }
      );

      renderer.render(
        scene,
        camera
      );
    };

    animate();

    // --------------------------------
    // CLEANUP
    // --------------------------------

    return () => {
      cancelAnimationFrame(
        animationFrame
      );

      window.removeEventListener(
        "resize",
        handleResize
      );

      renderer.domElement.removeEventListener(
        "pointerdown",
        handlePointerDown
      );

      controls.dispose();

      earthGeometry.dispose();
      earthMaterial.dispose();

      atmosphereGeometry.dispose();
      atmosphereMaterial.dispose();

      starGeometry.dispose();
      starMaterial.dispose();

      markerGroup.traverse(
        (object) => {
          if (object.geometry) {
            object.geometry.dispose();
          }

          if (object.material) {
            object.material.dispose();
          }
        }
      );

      renderer.dispose();

      if (
        container.contains(
          renderer.domElement
        )
      ) {
        container.removeChild(
          renderer.domElement
        );
      }
    };
  }, [onSelectLocation]);

  return (
    <div
      ref={containerRef}
      className="globe-container"
    />
  );
}

export default Globe;