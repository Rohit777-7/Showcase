import {
  useEffect,
  useRef,
  useState,
} from "react";

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
   BRAINWING HQ

   This is NOT a project.

   It is the fixed starting location of the company.
   Lower Parel, Mumbai.
===================================================== */

const BRAINWING_HQ = {
  id: "brainwing-hq",

  title: "BRAINWING",

  city: "LOWER PAREL",

  country: "INDIA",

  lng: 72.8279,
  lat: 18.9953,

  camera: {
    center: [72.8279, 18.9953],

    zoom: 13,

    pitch: 54,

    bearing: -12,
  },
};

/* =====================================================
   REMOVE MUMBAI FROM PROJECT LOCATIONS

   Mumbai is no longer a project location.

   BrainWing HQ / Lower Parel is represented separately.
===================================================== */

const journeyProjects = projects.filter(
  (project) => {
    const city =
      project.city
        ?.trim()
        .toLowerCase();

    return city !== "mumbai";
  }
);

/* =====================================================
   CAMERA SETTINGS
===================================================== */

const CITY_CAMERA = {
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
  return (
    CITY_CAMERA[project.id] ??
    DEFAULT_CITY_CAMERA
  );
}

/* =====================================================
   JOURNEY SETTINGS
===================================================== */

const DWELL = 0.6;

const SCROLL_VH_PER_UNIT = 90;

/* =====================================================
   WAYPOINTS

   IMPORTANT:

   WORLDWIDE
       ↓
   INDIA
       ↓
   BRAINWING HQ / LOWER PAREL
       ↓
   BORIVALI
       ↓
   THANE
       ↓
   COLABA
       ↓
   BANGALORE
       ↓
   LONDON
===================================================== */

const waypoints = [
  /* ================================================
     WORLD
  ================================================= */

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

  /* ================================================
     INDIA
  ================================================= */

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

  /* ================================================
     BRAINWING HQ

     This is NOT shown in sidebar as a project.
  ================================================= */

  {
    title: "BRAINWING",

    project: null,

    hq: true,

    camera: {
      center:
        BRAINWING_HQ.camera.center,

      zoom:
        BRAINWING_HQ.camera.zoom,

      pitch:
        BRAINWING_HQ.camera.pitch,

      bearing:
        BRAINWING_HQ.camera.bearing,
    },

    hop: 1,
  },

  /* ================================================
     PROJECT LOCATIONS

     Mumbai already removed.
  ================================================= */

  ...journeyProjects.map(
    (project) => {
      const cam =
        cityCameraFor(project);

      return {
        title:
          project.city.toUpperCase(),

        project,

        camera: {
          center: [
            project.lng,
            project.lat,
          ],

          zoom:
            cam.zoom,

          pitch:
            cam.pitch,

          bearing:
            cam.bearing,
        },

        hop:
          cam.hop,
      };
    }
  ),
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

   We keep BrainWing's own markers.
===================================================== */

function cleanMapLabels(map) {
  const hide = () => {
    const layers =
      map.getStyle()?.layers ?? [];

    layers.forEach((layer) => {
      if (
        layer.type !== "symbol"
      ) {
        return;
      }

      try {
        map.setLayoutProperty(
          layer.id,
          "visibility",
          "none"
        );
      } catch (_) {}
    });
  };

  hide();

  map.once(
    "idle",
    hide
  );

  setTimeout(
    hide,
    500
  );
}

/* =====================================================
   3D BUILDINGS
===================================================== */

function addRealisticBuildings(map) {
  const existingBuildingLayer =
    map
      .getStyle()
      ?.layers
      ?.find(
        (layer) =>
          layer[
            "source-layer"
          ] === "building"
      );

  if (
    !existingBuildingLayer
  ) {
    return;
  }

  if (
    map.getLayer(
      "brainwing-3d-buildings"
    )
  ) {
    return;
  }

  map.addLayer({
    id:
      "brainwing-3d-buildings",

    type:
      "fill-extrusion",

    source:
      existingBuildingLayer.source,

    "source-layer":
      "building",

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
        [
          "get",
          "render_min_height",
        ],

        [
          "get",
          "min_height",
        ],

        0,
      ],

      "fill-extrusion-opacity":
        0.92,
    },
  });
}

/* =====================================================
   WORLD MAP
===================================================== */

function WorldMap() {
  const storyRef =
    useRef(null);

  const mapContainerRef =
    useRef(null);

  const compassNeedleRef =
    useRef(null);

  const mapRef =
    useRef(null);

  const markersRef =
    useRef([]);

  const markerElsRef =
    useRef({});

  const timelineRef =
    useRef(null);

  const breakpointsRef =
    useRef([]);

  const cameraProxyRef =
    useRef({
      ...waypoints[0].camera,
    });

  const activeIdRef =
    useRef(null);

  const [activeProject, setActiveProject] =
    useState(null);

  /* =====================================================
     ROUTE STOPS

     HQ is always the first point.

     Then all project locations.

     Example:

     HQ
      ↓
     Borivali
      ↓
     Thane
      ↓
     Colaba
      ↓
     Bangalore
      ↓
     London
  ===================================================== */

  const routeStops = [
    BRAINWING_HQ,
    ...journeyProjects,
  ];

  /* =====================================================
     CREATE ROUTE COORDINATES

     ONLY real locations.

     NEVER camera coordinates.
  ===================================================== */

  const coordinatesForProject =
    (project) => {
      const index =
        journeyProjects.findIndex(
          (item) =>
            item.id ===
            project.id
        );

      if (index < 0) {
        return [];
      }

      return [
        [
          BRAINWING_HQ.lng,
          BRAINWING_HQ.lat,
        ],

        ...journeyProjects
          .slice(
            0,
            index + 1
          )
          .map(
            (item) => [
              item.lng,
              item.lat,
            ]
          ),
      ];
    };

  /* =====================================================
     SET ACTIVE ROUTE
  ===================================================== */

  const setActiveRoute =
    (coordinates) => {
      const source =
        mapRef.current?.getSource(
          "brainwing-route-active"
        );

      if (!source) {
        return;
      }

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

  const setActiveMarker =
    (id) => {
      Object.entries(
        markerElsRef.current
      ).forEach(
        ([
          projectId,
          element,
        ]) => {
          element.classList.toggle(
            "is-active",
            projectId === id
          );
        }
      );
    };

  /* =====================================================
     ENTER PROJECT

     When scroll reaches a project:

     HQ → current project

     route becomes visible.
  ===================================================== */

  const enterWaypoint =
    (waypoint) => {
      const id =
        waypoint.project?.id ??
        null;

      if (
        activeIdRef.current !==
        id
      ) {
        activeIdRef.current =
          id;

        setActiveProject(
          waypoint.project
        );

        setActiveMarker(id);
      }

      if (
        !waypoint.project
      ) {
        setActiveRoute(
          []
        );

        return;
      }

      const routeCoordinates =
        coordinatesForProject(
          waypoint.project
        );

      setActiveRoute(
        routeCoordinates
      );
    };

  /* =====================================================
     DURING CAMERA TRANSITION

     IMPORTANT:

     Never add camera coordinates
     to route.
  ===================================================== */

  const transitFrom =
    (fromWaypoint) => {
      if (
        activeIdRef.current !==
        null
      ) {
        activeIdRef.current =
          null;

        setActiveProject(
          null
        );

        setActiveMarker(
          null
        );
      }

      if (
        !fromWaypoint.project
      ) {
        setActiveRoute(
          []
        );

        return;
      }

      const routeCoordinates =
        coordinatesForProject(
          fromWaypoint.project
        );

      setActiveRoute(
        routeCoordinates
      );
    };

  /* =====================================================
     SYNC JOURNEY STATE
  ===================================================== */

  const syncJourneyState =
    (time) => {
      const breakpoints =
        breakpointsRef.current;

      if (
        !breakpoints.length
      ) {
        return;
      }

      /* ================================================
         PROJECT ARRIVAL
      ================================================= */

      for (
        let k = 0;
        k <
        breakpoints.length;
        k++
      ) {
        const bp =
          breakpoints[k];

        const isLast =
          k ===
          breakpoints.length -
            1;

        if (
          time >= bp.arrive &&
          (
            isLast ||
            time < bp.leave
          )
        ) {
          enterWaypoint(
            bp.waypoint
          );

          return;
        }
      }

      /* ================================================
         BETWEEN PROJECTS
      ================================================= */

      for (
        let k = 0;
        k <
        breakpoints.length -
          1;
        k++
      ) {
        if (
          time >=
            breakpoints[k]
              .leave &&
          time <
            breakpoints[
              k + 1
            ].arrive
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

  const buildJourneyTimeline =
    (map) => {
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

      const syncCamera =
        () => {
          map.jumpTo({
            center: [
              proxy.lng,
              proxy.lat,
            ],

            zoom:
              proxy.zoom,

            pitch:
              proxy.pitch,

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

            start:
              "top top",

            end:
              "bottom bottom",

            scrub: 0.7,

            onUpdate:
              () =>
                syncJourneyState(
                  tl.time()
                ),
          },
        });

      let cursor =
        DWELL;

      /* ================================================
         CAMERA JOURNEY
      ================================================= */

      for (
        let i = 1;
        i <
        waypoints.length;
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

        cursor +=
          DWELL;
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

  const scrollToProject =
    (project) => {
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

    if (
      mapRef.current
    ) {
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

    /* ================================================
       MAP
    ================================================= */

    const map =
      new maptilersdk.Map({
        container:
          mapContainerRef.current,

        style:
          maptilersdk.MapStyle
            .STREETS.DARK,

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

        maxPitch:
          68,

        navigationControl:
          false,

        geolocateControl:
          false,

        attributionControl:
          {
            compact: true,
          },

        dragRotate:
          true,

        touchZoomRotate:
          true,

        scrollZoom:
          false,

        terrain:
          true,

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
        /* ==============================================
           REMOVE MAP LABELS
        ============================================== */

        cleanMapLabels(
          map
        );

        /* ==============================================
           3D BUILDINGS
        ============================================== */

        addRealisticBuildings(
          map
        );

        /* ==============================================
           ROUTE SOURCE
        ============================================== */

        map.addSource(
          "brainwing-route-active",
          {
            type:
              "geojson",

            data:
              emptyLineFeature(),
          }
        );

        /* ==============================================
           ROUTE GLOW
        ============================================== */

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
              10,

            "line-opacity":
              0.18,

            "line-blur":
              3,
          },
        });

        /* ==============================================
           ROUTE CORE
        ============================================== */

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
              3,

            "line-opacity":
              0.95,

            "line-dasharray":
              [
                1,
                1.8,
              ],
          },
        });

        /* ==============================================
           BRAINWING HQ MARKER
        ============================================== */

        const hqElement =
          document.createElement(
            "button"
          );

        hqElement.className =
          "brainwing-hq-marker";

        hqElement.type =
          "button";

        hqElement.innerHTML = `
          <span class="hq-pulse"></span>

          <span class="hq-core">
            <span class="hq-logo-dot">
              B
            </span>
          </span>

          <span class="hq-label">
            <strong>
              BRAINWING
            </strong>

            <small>
              LOWER PAREL
            </small>
          </span>
        `;

        hqElement.setAttribute(
          "aria-label",
          "BrainWing Lower Parel"
        );

        hqElement.style.zIndex =
          "1000";

        hqElement.style.pointerEvents =
          "auto";

        const hqMarker =
          new maptilersdk.Marker({
            element:
              hqElement,

            anchor:
              "center",
          })
            .setLngLat([
              BRAINWING_HQ.lng,
              BRAINWING_HQ.lat,
            ])
            .addTo(map);

        markersRef.current.push(
          hqMarker
        );

        /* ==============================================
           PROJECT MARKERS

           IMPORTANT:

           journeyProjects is used,
           NOT projects.

           Therefore Mumbai is gone.
        ============================================== */

        journeyProjects.forEach(
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
              "900";

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
              new maptilersdk.Marker({
                element:
                  markerElement,

                anchor:
                  "center",
              })
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

        /* ==============================================
           BUILD SCROLL JOURNEY
        ============================================== */

        buildJourneyTimeline(
          map
        );

        /* ==============================================
           FORCE INITIAL MAP RESIZE

           Helps prevent first-load visual glitch.
        ============================================== */

        requestAnimationFrame(
          () => {
            map.resize();
          }
        );

        setTimeout(
          () => {
            map.resize();
          },
          300
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

  const resetMap =
    () => {
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
          (wp.hop ??
            1) +
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
        minHeight:
          `${
            totalJourneyUnits *
            SCROLL_VH_PER_UNIT
          }vh`,
      }}
    >
      {/* =================================================
          STICKY MAP
      ================================================= */}

      <div className="world-map-sticky">

        <div
          ref={
            mapContainerRef
          }
          className="world-map"
        />

        <div className="map-vignette" />

        <div className="map-gradient" />

        {/* =================================================
            JOURNEY SIDEBAR

            IMPORTANT:
            Mumbai removed.
        ================================================= */}

        <JourneySidebar
          projects={
            journeyProjects
          }

          activeId={
            activeProject?.id ??
            null
          }

          onSelect={
            scrollToProject
          }
        />

        {/* =================================================
            SCROLL INDICATOR
        ================================================= */}

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

        {/* =================================================
            PROJECT PANEL
        ================================================= */}

        <LocationPanel
          location={
            activeProject
          }

          onClose={
            resetMap
          }
        />

        {/* =================================================
            MAP CONTROLS
        ================================================= */}

        <div className="map-controls">

          {/* THEME */}

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

          {/* COMPASS */}

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

        {/* =================================================
            ZOOM
        ================================================= */}

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

        {/* =================================================
            JOURNEY STEPPER

            Mumbai removed.
        ================================================= */}

        <JourneyStepper
          projects={
            journeyProjects
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