import { useEffect, useRef, useState } from "react";
import * as maptilersdk from "@maptiler/sdk";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "@maptiler/sdk/dist/maptiler-sdk.css";

import { projects } from "../data/projects";
import LocationPanel from "../components/world/LocationPanel";
import JourneySidebar from "../components/world/JourneySidebar";
import JourneyStepper from "../components/world/JourneyStepper";
import "../styles/world-map.css";

gsap.registerPlugin(ScrollTrigger);

/* =====================================================
   CAMERA SETTINGS
===================================================== */

const CITY_CAMERA = {
  mumbai: {
    zoom: 12.6,
    pitch: 55,
    bearing: -18,
    hop: 1.1,
  },

  borivali: {
    zoom: 13.4,
    pitch: 58,
    bearing: -12,
    hop: 0.7,
  },

  thane: {
    zoom: 13.4,
    pitch: 58,
    bearing: -22,
    hop: 0.7,
  },

  colaba: {
    zoom: 14,
    pitch: 60,
    bearing: -25,
    hop: 0.7,
  },

  bangalore: {
    zoom: 12.8,
    pitch: 55,
    bearing: -15,
    hop: 1.4,
  },

  london: {
    zoom: 12.4,
    pitch: 52,
    bearing: -10,
    hop: 1.6,
  },
};

const DEFAULT_CITY_CAMERA = {
  zoom: 13.2,
  pitch: 56,
  bearing: -18,
  hop: 1,
};

function cityCameraFor(project) {
  return CITY_CAMERA[project.id] ?? DEFAULT_CITY_CAMERA;
}

const DWELL = 0.6;

const SCROLL_VH_PER_UNIT = 90;

/* =====================================================
   WAYPOINTS

   IMPORTANT:
   Locations come ONLY from projects.js.
===================================================== */

const waypoints = [
  {
    title: "WORLDWIDE",
    project: null,
    camera: {
      center: [78, 21.5],
      zoom: 3.3,
      pitch: 20,
      bearing: 0,
    },
  },

  {
    title: "INDIA",
    project: null,
    camera: {
      center: [77.4, 20.2],
      zoom: 4.6,
      pitch: 30,
      bearing: -5,
    },
    hop: 1.1,
  },

  ...projects.map((project) => {
    const cam = cityCameraFor(project);

    return {
      title: project.city.toUpperCase(),

      project,

      camera: {
        center: [project.lng, project.lat],
        zoom: cam.zoom,
        pitch: cam.pitch,
        bearing: cam.bearing,
      },

      hop: cam.hop,
    };
  }),
];

/* =====================================================
   EMPTY ROUTE
===================================================== */

function emptyLineFeature() {
  return {
    type: "Feature",

    geometry: {
      type: "LineString",
      coordinates: [],
    },
  };
}

/* =====================================================
   HIDE MAPTILER LABELS

   We keep only Brainwing's own markers.
===================================================== */

function cleanMapLabels(map) {
  const hide = () => {
    const layers = map.getStyle()?.layers ?? [];

    layers.forEach((layer) => {
      if (layer.type !== "symbol") return;

      try {
        map.setLayoutProperty(layer.id, "visibility", "none");
      } catch (_) {}
    });
  };

  // Hide immediately.
  hide();

  // MapTiler can re-apply style layers while the style settles.
  // Hide them again after the map becomes idle.
  map.once("idle", hide);
  setTimeout(hide, 500);
}

/* =====================================================
   3D BUILDINGS
===================================================== */

function addRealisticBuildings(map) {
  const existingBuildingLayer = map
    .getStyle()
    ?.layers
    ?.find(
      (layer) =>
        layer["source-layer"] === "building"
    );

  if (!existingBuildingLayer) return;

  if (map.getLayer("brainwing-3d-buildings")) {
    return;
  }

  map.addLayer({
    id: "brainwing-3d-buildings",

    type: "fill-extrusion",

    source: existingBuildingLayer.source,

    "source-layer": "building",

    minzoom: 13,

    paint: {
      "fill-extrusion-color": [
        "interpolate",
        ["linear"],
        [
          "coalesce",
          ["get", "render_height"],
          ["get", "height"],
          8,
        ],

        0,
        "#0a1620",

        30,
        "#123244",

        90,
        "#1c4a5e",

        180,
        "#2f7a8f",
      ],

      "fill-extrusion-height": [
        "coalesce",
        ["get", "render_height"],
        ["get", "height"],
        8,
      ],

      "fill-extrusion-base": [
        "coalesce",
        ["get", "render_min_height"],
        ["get", "min_height"],
        0,
      ],

      "fill-extrusion-opacity": 0.92,
    },
  });
}

/* =====================================================
   WORLD MAP
===================================================== */

function WorldMap() {
  const storyRef = useRef(null);

  const mapContainerRef = useRef(null);

  const compassNeedleRef = useRef(null);

  const mapRef = useRef(null);

  const markersRef = useRef([]);

  const markerElsRef = useRef({});

  const timelineRef = useRef(null);

  const breakpointsRef = useRef([]);

  const cameraProxyRef = useRef({
    ...waypoints[0].camera,
  });

  const activeIdRef = useRef(null);

  const [activeProject, setActiveProject] =
    useState(null);

  /* =====================================================
     ACTIVE ROUTE

     This route ALWAYS contains ONLY actual projects.js
     coordinates.

     NEVER add camera coordinates here.
  ===================================================== */

  const setActiveRoute = (coordinates) => {
    const source =
      mapRef.current?.getSource(
        "brainwing-route-active"
      );

    if (!source) return;

    source.setData({
      type: "Feature",

      geometry: {
        type: "LineString",
        coordinates,
      },
    });
  };

  /* =====================================================
     ACTIVE MARKER
  ===================================================== */

  const setActiveMarker = (id) => {
    Object.entries(
      markerElsRef.current
    ).forEach(([projectId, element]) => {
      element.classList.toggle(
        "is-active",
        projectId === id
      );
    });
  };

  /* =====================================================
     WHEN ARRIVING AT A PROJECT

     Example:

     Mumbai
     Mumbai → Borivali
     Mumbai → Borivali → Thane
     etc.
  ===================================================== */

  const enterWaypoint = (waypoint) => {
    const id =
      waypoint.project?.id ?? null;

    if (activeIdRef.current !== id) {
      activeIdRef.current = id;

      setActiveProject(
        waypoint.project
      );

      setActiveMarker(id);
    }

    if (!waypoint.project) {
      setActiveRoute([]);
      return;
    }

    const projectIndex =
      projects.findIndex(
        (project) =>
          project.id ===
          waypoint.project.id
      );

    if (projectIndex < 0) {
      setActiveRoute([]);
      return;
    }

    const routeCoordinates =
      projects
        .slice(
          0,
          projectIndex + 1
        )
        .map((project) => [
          project.lng,
          project.lat,
        ]);

    setActiveRoute(
      routeCoordinates
    );
  };

  /* =====================================================
     DURING CAMERA TRANSITION

     IMPORTANT:
     We DO NOT add cameraProxyRef.current here.

     This was causing the unwanted extra route lines.
  ===================================================== */

  const transitFrom = (fromWaypoint) => {
    if (
      activeIdRef.current !== null
    ) {
      activeIdRef.current = null;

      setActiveProject(null);

      setActiveMarker(null);
    }

    if (!fromWaypoint.project) {
      setActiveRoute([]);
      return;
    }

    const projectIndex =
      projects.findIndex(
        (project) =>
          project.id ===
          fromWaypoint.project.id
      );

    if (projectIndex < 0) {
      setActiveRoute([]);
      return;
    }

    const priorCoordinates =
      projects
        .slice(
          0,
          projectIndex + 1
        )
        .map((project) => [
          project.lng,
          project.lat,
        ]);

    /*
      IMPORTANT:

      NO camera coordinate here.

      WRONG:

      [...priorCoordinates, [
        camera.lng,
        camera.lat
      ]]

      That was creating the unwanted
      diagonal/extra lines.
    */

    setActiveRoute(
      priorCoordinates
    );
  };

  /* =====================================================
     SYNC JOURNEY STATE
  ===================================================== */

  const syncJourneyState = (time) => {
    const breakpoints =
      breakpointsRef.current;

    if (!breakpoints.length) return;

    for (
      let k = 0;
      k < breakpoints.length;
      k++
    ) {
      const bp =
        breakpoints[k];

      const isLast =
        k ===
        breakpoints.length - 1;

      if (
        time >= bp.arrive &&
        (isLast ||
          time < bp.leave)
      ) {
        enterWaypoint(
          bp.waypoint
        );

        return;
      }
    }

    for (
      let k = 0;
      k <
      breakpoints.length - 1;
      k++
    ) {
      if (
        time >=
          breakpoints[k].leave &&
        time <
          breakpoints[k + 1]
            .arrive
      ) {
        transitFrom(
          breakpoints[k]
            .waypoint
        );

        return;
      }
    }
  };

  /* =====================================================
     BUILD CAMERA TIMELINE
  ===================================================== */

  const buildJourneyTimeline = (
    map
  ) => {
    const proxy =
      cameraProxyRef.current;

    const breakpoints = [
      {
        waypoint:
          waypoints[0],

        arrive: 0,

        leave: DWELL,
      },
    ];

    const syncCamera = () => {
      map.jumpTo({
        center: [
          proxy.lng,
          proxy.lat,
        ],

        zoom: proxy.zoom,

        pitch: proxy.pitch,

        bearing:
          proxy.bearing,
      });

      if (
        compassNeedleRef.current
      ) {
        compassNeedleRef.current.style.transform =
          `rotate(${-proxy.bearing}deg)`;
      }
    };

    const tl =
      gsap.timeline({
        scrollTrigger: {
          trigger:
            storyRef.current,

          start: "top top",

          end: "bottom bottom",

          scrub: 0.7,

          onUpdate: () =>
            syncJourneyState(
              tl.time()
            ),
        },
      });

    let cursor = DWELL;

    for (
      let i = 1;
      i < waypoints.length;
      i++
    ) {
      const hopLength =
        waypoints[i].hop ??
        1;

      const target =
        waypoints[i].camera;

      tl.to(
        proxy,
        {
          lng:
            target.center[0],

          lat:
            target.center[1],

          zoom:
            target.zoom,

          pitch:
            target.pitch,

          bearing:
            target.bearing,

          duration:
            hopLength,

          ease:
            "power1.inOut",

          onUpdate:
            syncCamera,
        },

        cursor
      );

      cursor +=
        hopLength;

      breakpoints.push({
        waypoint:
          waypoints[i],

        arrive:
          cursor,

        leave:
          cursor + DWELL,
      });

      cursor += DWELL;
    }

    timelineRef.current =
      tl;

    breakpointsRef.current =
      breakpoints;

    syncJourneyState(0);
  };

  /* =====================================================
     SCROLL TO PROJECT
  ===================================================== */

  const scrollToProject = (
    project
  ) => {
    const tl =
      timelineRef.current;

    const storyEl =
      storyRef.current;

    const breakpoint =
      breakpointsRef.current.find(
        (bp) =>
          bp.waypoint.project
            ?.id ===
          project.id
      );

    if (
      !tl ||
      !storyEl ||
      !breakpoint
    ) {
      return;
    }

    const fraction =
      breakpoint.arrive /
      tl.duration();

    const scrollRange =
      storyEl.offsetHeight -
      window.innerHeight;

    window.scrollTo({
      top:
        storyEl.offsetTop +
        fraction *
          scrollRange,

      behavior:
        "smooth",
    });
  };

  /* =====================================================
     INITIALIZE MAP
  ===================================================== */

  useEffect(() => {
    if (
      !mapContainerRef.current
    ) {
      return;
    }

    if (mapRef.current) {
      return;
    }

    const apiKey =
      import.meta.env
        .VITE_MAPTILER_KEY;

    if (!apiKey) {
      console.error(
        "VITE_MAPTILER_KEY is missing from .env"
      );

      return;
    }

    maptilersdk.config.apiKey =
      apiKey;

    const map =
      new maptilersdk.Map({
        container:
          mapContainerRef.current,

        style:
          maptilersdk.MapStyle.STREETS.DARK,

        center:
          waypoints[0]
            .camera.center,

        zoom:
          waypoints[0]
            .camera.zoom,

        pitch:
          waypoints[0]
            .camera.pitch,

        bearing:
          waypoints[0]
            .camera.bearing,

        maxPitch: 68,

        navigationControl:
          false,

        geolocateControl:
          false,

        attributionControl: {
          compact: true,
        },

        dragRotate: true,

        touchZoomRotate:
          true,

        scrollZoom: false,

        terrain: true,

        terrainExaggeration:
          1.2,
      });

    mapRef.current =
      map;

    /* =================================================
       MAP LOAD
    ================================================= */

    map.on(
      "load",
      () => {
        /* =============================================
           REMOVE NATIVE MAP LABELS
        ============================================= */

        cleanMapLabels(
          map
        );

        /* =============================================
           3D BUILDINGS
        ============================================= */

        addRealisticBuildings(
          map
        );
        /* =============================================
           ACTIVE ROUTE

           ONLY the route generated from projects.js is used.
           There is NO second full-route layer, so no duplicate
           line is drawn underneath the active route.
        ============================================= */

        map.addSource(
          "brainwing-route-active",
          {
            type:
              "geojson",

            data:
              emptyLineFeature(),
          }
        );

        /* =============================================
           ACTIVE ROUTE GLOW
        ============================================= */

        map.addLayer({
          id:
            "brainwing-route-active-glow",

          type:
            "line",

          source:
            "brainwing-route-active",

          layout: {
            "line-cap":
              "round",

            "line-join":
              "round",
          },

          paint: {
            "line-color":
              "#69f4ff",

            "line-width":
              8,

            "line-opacity":
              0.16,

            "line-blur":
              3,
          },
        });

        /* =============================================
           ACTIVE ROUTE CORE
        ============================================= */

        map.addLayer({
          id:
            "brainwing-route-active-core",

          type:
            "line",

          source:
            "brainwing-route-active",

          layout: {
            "line-cap":
              "round",

            "line-join":
              "round",
          },

          paint: {
            "line-color":
              "#d8ffff",

            "line-width":
              2.5,

            "line-opacity":
              0.9,
          },
        });

        /* =============================================
           PROJECT MARKERS

           ONLY locations from projects.js.
        ============================================= */

        projects.forEach(
          (
            project,
            index
          ) => {
            const markerElement =
              document.createElement(
                "button"
              );

            markerElement.className =
              "brainwing-scroll-marker";

            markerElement.type =
              "button";

            markerElement.innerHTML = `
              <span class="marker-pulse"></span>

              <span class="marker-pin">
                <span class="marker-number">
                  ${String(
                    index + 1
                  ).padStart(
                    2,
                    "0"
                  )}
                </span>
              </span>

              <span class="marker-label">
                ${project.city.toUpperCase()}
              </span>
            `;

            markerElement.setAttribute(
              "aria-label",
              project.city
            );

            markerElement.style.zIndex =
              "20";

            markerElement.style.pointerEvents =
              "auto";

            markerElement.addEventListener(
              "click",
              (event) => {
                event.stopPropagation();

                scrollToProject(
                  project
                );
              }
            );

            markerElsRef.current[
              project.id
            ] =
              markerElement;

            const marker =
              new maptilersdk.Marker(
                {
                  element:
                    markerElement,

                  anchor:
                    "center",
                }
              )
                .setLngLat([
                  project.lng,
                  project.lat,
                ])
                .addTo(map);

            markersRef.current.push(
              marker
            );
          }
        );

        /* =============================================
           BUILD SCROLL JOURNEY
        ============================================= */

        buildJourneyTimeline(
          map
        );
      }
    );

    /* =================================================
       CLEANUP
    ================================================= */

    return () => {
      timelineRef.current
        ?.scrollTrigger
        ?.kill();

      timelineRef.current
        ?.kill();

      timelineRef.current =
        null;

      markersRef.current.forEach(
        (marker) =>
          marker.remove()
      );

      markersRef.current =
        [];

      markerElsRef.current =
        {};

      map.remove();

      mapRef.current =
        null;
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* =====================================================
     RESET MAP
  ===================================================== */

  const resetMap = () => {
    if (
      !storyRef.current
    ) {
      return;
    }

    window.scrollTo({
      top:
        storyRef.current
          .offsetTop,

      behavior:
        "smooth",
    });
  };

  /* =====================================================
     TOTAL SCROLL DISTANCE
  ===================================================== */

  const totalJourneyUnits =
    DWELL +
    waypoints
      .slice(1)
      .reduce(
        (
          sum,
          wp
        ) =>
          sum +
          (wp.hop ?? 1) +
          DWELL,

        0
      );

  /* =====================================================
     UI
  ===================================================== */

  return (
    <section
      className="world-map-story"
      ref={storyRef}
      style={{
        minHeight: `${
          totalJourneyUnits *
          SCROLL_VH_PER_UNIT
        }vh`,
      }}
    >
      {/* =========================================
          STICKY MAP
      ========================================== */}

      <div className="world-map-sticky">

        <div
          ref={
            mapContainerRef
          }
          className="world-map"
        />

        <div className="map-vignette" />

        <div className="map-gradient" />

        {/* =========================================
            JOURNEY SIDEBAR
        ========================================== */}

        <JourneySidebar
          projects={
            projects
          }

          activeId={
            activeProject?.id ??
            null
          }

          onSelect={
            scrollToProject
          }
        />

        {/* =========================================
            SCROLL INDICATOR
        ========================================== */}

        {!activeProject && (
          <div className="map-scroll-hint">

            <span>
              SCROLL TO EXPLORE
            </span>

            <div className="scroll-mouse">
              <span />
            </div>

          </div>
        )}

        {/* =========================================
            PROJECT PANEL
        ========================================== */}

        <LocationPanel
          location={
            activeProject
          }

          onClose={
            resetMap
          }
        />

        {/* =========================================
            MAP CONTROLS
        ========================================== */}

        <div className="map-controls">

          <button
            type="button"
            className="map-control-btn"
            aria-label="Toggle map theme"
            onClick={() =>
              console.log(
                "Theme toggle — light basemap coming soon"
              )
            }
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M21 12.6A9 9 0 1 1 11.4 3a7 7 0 0 0 9.6 9.6Z"
                fill="currentColor"
              />
            </svg>
          </button>

          <button
            type="button"
            className="map-control-btn map-control-compass"
            aria-label="Reset bearing to north"
            onClick={() =>
              mapRef.current?.resetNorth?.(
                {
                  duration:
                    600,
                }
              )
            }
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              ref={
                compassNeedleRef
              }
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeOpacity="0.35"
              />

              <path
                d="M12 3 15 12 12 21 9 12Z"
                fill="currentColor"
              />
            </svg>
          </button>

        </div>

        {/* =========================================
            ZOOM
        ========================================== */}

        <div className="map-zoom">

          <button
            type="button"
            aria-label="Zoom in"
            onClick={() =>
              mapRef.current?.zoomIn(
                {
                  duration:
                    350,
                }
              )
            }
          >
            +
          </button>

          <button
            type="button"
            aria-label="Zoom out"
            onClick={() =>
              mapRef.current?.zoomOut(
                {
                  duration:
                    350,
                }
              )
            }
          >
            −
          </button>

        </div>

        {/* =========================================
            JOURNEY STEPPER
        ========================================== */}

        <JourneyStepper
          projects={
            projects
          }

          activeId={
            activeProject?.id ??
            null
          }

          onSelect={
            scrollToProject
          }
        />

      </div>
    </section>
  );
}

export default WorldMap;