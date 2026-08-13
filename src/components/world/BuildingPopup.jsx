import { Html } from "@react-three/drei";

function BuildingPopup({
  project,
  onClose,
  onOpenProject,
}) {
  if (!project) return null;

  return (
    <group>
      {/* Building */}
      <mesh position={[0, 0.7, 0]}>
        <boxGeometry
          args={[0.8, 1.4, 0.8]}
        />

        <meshStandardMaterial
          color="#dceeff"
          metalness={0.7}
          roughness={0.2}
        />
      </mesh>

      {/* Roof */}
      <mesh position={[0, 1.45, 0]}>
        <boxGeometry
          args={[0.9, 0.12, 0.9]}
        />

        <meshStandardMaterial
          color="#8bdcff"
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Windows */}
      {[-0.22, 0, 0.22].map(
        (x) => (
          <mesh
            key={x}
            position={[
              x,
              0.9,
              0.405,
            ]}
          >
            <boxGeometry
              args={[
                0.12,
                0.2,
                0.02,
              ]}
            />

            <meshBasicMaterial
              color="#ffffff"
            />
          </mesh>
        )
      )}

      {/* Information */}
      <Html
        position={[1.1, 1.2, 0]}
        distanceFactor={5}
        style={{
          pointerEvents: "auto",
        }}
      >
        <div
          style={{
            width: "290px",

            padding: "22px",

            background:
              "rgba(4,8,15,0.94)",

            backdropFilter:
              "blur(18px)",

            border:
              "1px solid rgba(255,255,255,0.15)",

            color: "white",

            fontFamily:
              "Arial, sans-serif",
          }}
        >
          <div
            style={{
              fontSize: "9px",
              letterSpacing: "3px",
              opacity: 0.5,
              marginBottom: "8px",
            }}
          >
            PROJECT
          </div>

          <h2
            style={{
              margin: "0 0 7px",
              fontSize: "23px",
              fontWeight: 400,
            }}
          >
            {project.name}
          </h2>

          <div
            style={{
              fontSize: "11px",
              opacity: 0.6,
              marginBottom: "15px",
            }}
          >
            {project.city} ·{" "}
            {project.category}
          </div>

          <p
            style={{
              fontSize: "12px",
              lineHeight: 1.6,
              opacity: 0.7,
            }}
          >
            {project.description}
          </p>

          <div
            style={{
              display: "flex",
              gap: "6px",
              flexWrap: "wrap",
              margin:
                "16px 0",
            }}
          >
            {project.technologies.map(
              (technology) => (
                <span
                  key={technology}
                  style={{
                    padding:
                      "5px 8px",

                    border:
                      "1px solid rgba(255,255,255,0.15)",

                    fontSize: "9px",
                    letterSpacing: "1px",
                  }}
                >
                  {technology}
                </span>
              )
            )}
          </div>

          <button
            onClick={
              onOpenProject
            }
            style={{
              width: "100%",
              padding: "12px",

              background: "white",
              color: "black",

              border: "none",

              cursor: "pointer",

              fontSize: "10px",
              letterSpacing: "2px",
            }}
          >
            VIEW PROJECT →
          </button>

          <button
            onClick={onClose}
            style={{
              width: "100%",
              marginTop: "8px",
              padding: "9px",

              background:
                "transparent",

              color: "white",

              border:
                "1px solid rgba(255,255,255,0.15)",

              cursor: "pointer",

              fontSize: "10px",
            }}
          >
            CLOSE
          </button>
        </div>
      </Html>
    </group>
  );
}

export default BuildingPopup;