import { Html } from "@react-three/drei";

function LocationMarker({
  project,
  position,
  selected,
  onClick,
  labelOffset = [0, 0],
}) {
  return (
    <group position={position}>
      {/* Outer glow */}
      <mesh>
        <sphereGeometry args={[0.11, 24, 24]} />

        <meshBasicMaterial
          color="#72d8ff"
          transparent
          opacity={0.12}
        />
      </mesh>

      {/* Main point */}
      <mesh
        onClick={(event) => {
          event.stopPropagation();
          onClick(project);
        }}
      >
        <sphereGeometry
          args={[
            selected ? 0.075 : 0.055,
            24,
            24,
          ]}
        />

        <meshBasicMaterial
          color={selected ? "#ffffff" : "#9be7ff"}
        />
      </mesh>

      {/* Label */}
      <Html
        position={[0, 0, 0]}
        center
        distanceFactor={7}
        style={{
          pointerEvents: "none",
          whiteSpace: "nowrap",
        }}
      >
        <div
          style={{
            transform: `translate(${labelOffset[0]}px, ${labelOffset[1]}px)`,

            display: "flex",
            alignItems: "center",
            gap: "8px",

            color: "#ffffff",

            fontFamily:
              "Arial, Helvetica, sans-serif",

            fontSize: "12px",
            fontWeight: 500,

            letterSpacing: "3px",

            textTransform: "uppercase",

            textShadow:
              "0 0 10px rgba(0,0,0,1), 0 0 20px rgba(0,0,0,1)",
          }}
        >
          <span
            style={{
              width: "24px",
              height: "1px",
              background:
                "rgba(255,255,255,0.7)",
            }}
          />

          {project.city}
        </div>
      </Html>
    </group>
  );
}

export default LocationMarker;