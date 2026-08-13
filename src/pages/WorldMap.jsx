import { useState } from "react";
import { Canvas } from "@react-three/fiber";

import Globe from "../components/world/Globe";
import BuildingPopup from "../components/world/BuildingPopup";
import ProjectPanel from "../components/world/ProjectPanel";

import { projects } from "../data/projects";

function WorldMap() {
  const [selectedLocation, setSelectedLocation] =
    useState(null);

  const [selectedProject, setSelectedProject] =
    useState(null);

  const [showMumbaiProjects, setShowMumbaiProjects] =
    useState(false);

  const mumbai = projects.find(
    (project) => project.id === "mumbai"
  );

  const handleLocationClick = (
    location
  ) => {
    if (location.id === "mumbai") {
      setSelectedLocation(location);
      setSelectedProject(null);
      setShowMumbaiProjects(true);

      return;
    }

    setSelectedLocation(location);
    setSelectedProject(location);
  };

  const handleMumbaiProjectClick = (
    project
  ) => {
    setSelectedProject(project);
  };

  const handleBack = () => {
    setSelectedProject(null);
    setSelectedLocation(null);
    setShowMumbaiProjects(false);
  };

  const handleOpenProject = () => {
    if (!selectedProject?.projectUrl)
      return;

    window.open(
      selectedProject.projectUrl,
      "_blank"
    );
  };

  return (
    <main
      style={{
        position: "fixed",
        inset: 0,

        width: "100vw",
        height: "100vh",

        overflow: "hidden",

        background: "#000",
      }}
    >
      {/* Background */}
      <div
        style={{
          position: "absolute",
          inset: 0,

          background:
            "radial-gradient(circle at center, #07131e 0%, #02060b 50%, #000 100%)",
        }}
      />

      {/* TOP LEFT */}
      <div
        style={{
          position: "absolute",

          top: "30px",
          left: "40px",

          zIndex: 20,

          color: "white",

          pointerEvents: "none",
        }}
      >
        <div
          style={{
            fontSize: "13px",
            letterSpacing: "5px",
          }}
        >
          BRAINWING
        </div>

        <div
          style={{
            marginTop: "5px",

            fontSize: "8px",

            letterSpacing: "4px",

            opacity: 0.45,
          }}
        >
          INNOVATION
        </div>
      </div>

      {/* TOP CENTER */}
      <div
        style={{
          position: "absolute",

          top: "34px",
          left: "50%",

          transform:
            "translateX(-50%)",

          zIndex: 20,

          color: "white",

          fontSize: "10px",

          letterSpacing: "5px",

          opacity: 0.65,

          pointerEvents: "none",
        }}
      >
        {showMumbaiProjects
          ? "MUMBAI PROJECTS"
          : "GLOBAL PROJECTS"}
      </div>

      {/* MENU */}
      <div
        style={{
          position: "absolute",

          top: "30px",
          right: "40px",

          zIndex: 20,

          width: "30px",

          pointerEvents: "none",
        }}
      >
        {[1, 2, 3].map(
          (item) => (
            <div
              key={item}
              style={{
                height: "1px",

                width: "100%",

                background: "white",

                marginBottom: "7px",
              }}
            />
          )
        )}
      </div>

      {/* BACK BUTTON */}
      {showMumbaiProjects && (
        <button
          onClick={handleBack}
          style={{
            position: "absolute",

            top: "85px",
            left: "40px",

            zIndex: 30,

            background:
              "rgba(255,255,255,0.06)",

            border:
              "1px solid rgba(255,255,255,0.15)",

            color: "white",

            padding:
              "10px 15px",

            cursor: "pointer",

            fontSize: "9px",

            letterSpacing: "2px",
          }}
        >
          ← WORLD
        </button>
      )}

      {/* 3D WORLD */}
      <div
        style={{
          position: "absolute",
          inset: 0,

          zIndex: 5,
        }}
      >
        <Canvas
          dpr={[1, 2]}
          camera={{
            position: [0, 0, 5.5],
            fov: 42,
          }}
          gl={{
            antialias: true,
            alpha: true,
          }}
        >
          <ambientLight
            intensity={0.8}
          />

          <directionalLight
            position={[5, 5, 5]}
            intensity={2}
          />

          <pointLight
            position={[
              -5,
              -3,
              4,
            ]}
            intensity={1.5}
            color="#62caff"
          />

          <Globe
            projects={projects}
            selectedLocation={
              selectedLocation
            }
            onSelectLocation={
              handleLocationClick
            }
            showMumbaiProjects={
              showMumbaiProjects
            }
            onSelectMumbaiProject={
              handleMumbaiProjectClick
            }
          />

          {/* Building */}
          {selectedProject && (
            <BuildingPopup
              project={
                selectedProject
              }
              onClose={() =>
                setSelectedProject(
                  null
                )
              }
              onOpenProject={
                handleOpenProject
              }
            />
          )}
        </Canvas>
      </div>

      {/* BOTTOM LEFT */}
      <div
        style={{
          position: "absolute",

          left: "40px",
          bottom: "35px",

          zIndex: 20,

          color: "white",

          pointerEvents: "none",
        }}
      >
        <div
          style={{
            fontSize: "9px",

            letterSpacing: "4px",

            opacity: 0.4,

            marginBottom: "8px",
          }}
        >
          03
        </div>

        <div
          style={{
            fontSize: "34px",

            fontWeight: 300,

            letterSpacing: "5px",
          }}
        >
          {showMumbaiProjects
            ? "MUMBAI"
            : "WORLDWIDE"}
        </div>

        <div
          style={{
            marginTop: "8px",

            fontSize: "10px",

            letterSpacing: "2px",

            opacity: 0.4,
          }}
        >
          {showMumbaiProjects
            ? "OUR PROJECTS IN MUMBAI"
            : "OUR WORK ACROSS THE WORLD"}
        </div>
      </div>

      {/* BOTTOM RIGHT */}
      {!selectedProject && (
        <div
          style={{
            position: "absolute",

            right: "40px",
            bottom: "40px",

            zIndex: 20,

            color: "white",

            fontSize: "9px",

            letterSpacing: "3px",

            opacity: 0.4,

            pointerEvents: "none",
          }}
        >
          CLICK LOCATION · DRAG TO EXPLORE
        </div>
      )}

      {/* PROJECT PANEL */}
      {selectedProject && (
        <ProjectPanel
          project={
            selectedProject
          }
          onClose={() =>
            setSelectedProject(
              null
            )
          }
          onOpen={
            handleOpenProject
          }
        />
      )}
    </main>
  );
}

export default WorldMap;