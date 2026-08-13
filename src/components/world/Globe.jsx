import { useMemo } from "react";
import {
  OrbitControls,
  useTexture,
} from "@react-three/drei";

import * as THREE from "three";

import LocationMarker from "./LocationMarker";

const EARTH_TEXTURE =
  "https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg";

function latLngToVector3(
  lat,
  lng,
  radius = 2.8
) {
  const phi =
    (90 - lat) * (Math.PI / 180);

  const theta =
    (lng + 180) * (Math.PI / 180);

  const x =
    -(radius *
      Math.sin(phi) *
      Math.cos(theta));

  const y =
    radius * Math.cos(phi);

  const z =
    radius *
    Math.sin(phi) *
    Math.sin(theta);

  return new THREE.Vector3(x, y, z);
}

function Globe({
  projects,
  selectedLocation,
  onSelectLocation,
  showMumbaiProjects,
  onSelectMumbaiProject,
}) {
  const earthTexture =
    useTexture(EARTH_TEXTURE);

  /*
    GLOBAL VIEW
    Only Mumbai + London are displayed.
  */
  const globalMarkers = useMemo(() => {
    return projects.map((project) => ({
      ...project,

      position: latLngToVector3(
        project.lat,
        project.lng,
        2.8
      ),
    }));
  }, [projects]);

  /*
    MUMBAI VIEW
    We deliberately use larger visual separation
    because Borivali / Thane / Colaba are geographically
    very close.
  */
  const mumbaiMarkers = [
    {
      project: projects[0].projects[0],
      position: [-0.75, 0.45, 2.65],
      offset: [80, -30],
    },

    {
      project: projects[0].projects[1],
      position: [0, 0, 2.7],
      offset: [80, 0],
    },

    {
      project: projects[0].projects[2],
      position: [-0.45, -0.45, 2.65],
      offset: [80, 30],
    },
  ];

  return (
    <>
      {/* EARTH */}
      <mesh>
        <sphereGeometry
          args={[2.8, 128, 128]}
        />

        <meshStandardMaterial
          map={earthTexture}
          roughness={0.85}
          metalness={0.05}
        />
      </mesh>

      {/* ATMOSPHERE */}
      <mesh scale={1.035}>
        <sphereGeometry
          args={[2.8, 64, 64]}
        />

        <meshBasicMaterial
          color="#69caff"
          transparent
          opacity={0.08}
          side={THREE.BackSide}
        />
      </mesh>

      {/* GLOBAL LOCATIONS */}
      {!showMumbaiProjects &&
        globalMarkers.map((project) => (
          <LocationMarker
            key={project.id}
            project={project}
            position={project.position}
            selected={
              selectedLocation?.id ===
              project.id
            }
            onClick={onSelectLocation}
            labelOffset={
              project.id === "london"
                ? [-20, -20]
                : [35, 0]
            }
          />
        ))}

      {/* MUMBAI PROJECTS */}
      {showMumbaiProjects &&
        mumbaiMarkers.map(
          ({
            project,
            position,
            offset,
          }) => (
            <LocationMarker
              key={project.id}
              project={project}
              position={position}
              selected={
                selectedLocation?.id ===
                project.id
              }
              onClick={
                onSelectMumbaiProject
              }
              labelOffset={offset}
            />
          )
        )}

      <OrbitControls
        enablePan={false}
        enableZoom
        enableDamping
        dampingFactor={0.05}
        minDistance={3.5}
        maxDistance={8}
        rotateSpeed={0.45}
      />
    </>
  );
}

export default Globe;