import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createRoot } from "react-dom/client";
import ProjectMarkerPopup from "../components/world/ProjectMarkerPopup";
import * as maptilersdk from "@maptiler/sdk";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import "@maptiler/sdk/dist/maptiler-sdk.css";

import { projects } from "../data/projects";

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

    // Close cinematic view of BrainWing / Lower Parel
    zoom: 16.5,

    pitch: 35,

    bearing: 0,
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

   SCROLL_VH_PER_UNIT controls how much page scroll each
   waypoint's "hop" weight is worth. The camera no longer
   animates through this range — see WAYPOINTS below —
   it just gives the reader scroll room to sit on each
   stop before the next one snaps in.
===================================================== */

const SCROLL_VH_PER_UNIT = 90;

/* =====================================================
   WAYPOINTS

   JOURNEY:

   PAGE OPENS
       ↓
   INDIA FULL MAP
       ↓  FIRST SCROLL
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

   The camera SNAPS directly between these stops on
   scroll instead of flying through every point in
   between — see goToWaypoint() below. That's what keeps
   tile loading to "one stop at a time" instead of the
   map continuously streaming tiles for every coordinate
   along a flight path.
===================================================== */

const waypoints = [
  /* ================================================
     INDIA — INITIAL VIEW

     The experience opens directly on India.
     There is NO worldwide camera step.
  ================================================= */

  {
    title: "INDIA",

    project: null,

    camera: {
      center: [77.4, 20.2],

      // Full India view
      zoom: 4.6,

      pitch: 30,

      bearing: -5,
    },

    // Initial state only — first scroll immediately snaps
    // from India to BrainWing.
    hop: 0,
  },

  /* ================================================
     BRAINWING HQ

     India overview
        ↓
     BrainWing / Lower Parel
        ↓
     Project locations
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

    // First scroll: India → BrainWing.
    hop: 1.5,
  },

  /* ================================================
     PROJECT LOCATIONS

     Mumbai is removed from the project list.
     BrainWing HQ is the separate Mumbai/Lower Parel
     starting location.
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
   SCROLL → WAYPOINT LOOKUP

   Every waypoint (after India) owns a fixed chunk of the
   page's scroll range sized by ITS OWN "hop" weight —
   waypointStarts[i] is the scroll position (in hop units)
   at which waypoint i becomes active.

   India (index 0) owns no scroll range of its own — it's
   only what's on screen before any scrolling happens.
   The very first pixel of scroll snaps straight to
   BrainWing, so there's no dead scroll zone up front.
===================================================== */

const waypointStarts = (() => {
  const starts = [0];

  let cursor = 0;

  for (
    let i = 1;
    i < waypoints.length;
    i++
  ) {
    starts.push(cursor);

    cursor +=
      waypoints[i].hop ?? 1;
  }

  return starts;
})();

const TOTAL_JOURNEY_UNITS =
  waypointStarts[
    waypointStarts.length - 1
  ] +
  (waypoints[
    waypoints.length - 1
  ].hop ?? 1);

function waypointIndexForScrollUnits(
  scrollUnits
) {
  if (scrollUnits <= 0) {
    return 0;
  }

  let index = 0;

  for (
    let i = 1;
    i < waypointStarts.length;
    i++
  ) {
    if (
      scrollUnits >=
      waypointStarts[i]
    ) {
      index = i;
    } else {
      break;
    }
  }

  return index;
}

/* =====================================================
   ROAD ROUTING

   Every project gets its own route from BrainWing HQ.
   We do NOT chain Borivali -> Thane -> Colaba, etc.
   The visual routes are:

   BrainWing -> Borivali
   BrainWing -> Thane
   BrainWing -> Colaba
   BrainWing -> Bangalore
   BrainWing -> London

   OSRM returns actual drivable road geometry. If the
   routing service is unavailable, a curved fallback keeps
   the experience visually intact.
===================================================== */

function fallbackRoadRoute(project) {
  const a = [BRAINWING_HQ.lng, BRAINWING_HQ.lat];
  const b = [project.lng, project.lat];

  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const distance = Math.max(0.001, Math.sqrt(dx * dx + dy * dy));

  const nx = -dy / distance;
  const ny = dx / distance;
  const bend = Math.min(2.2, Math.max(0.3, distance * 0.07));
  const steps = Math.max(20, Math.min(100, Math.ceil(distance * 10)));
  const points = [];

  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const curve = Math.sin(t * Math.PI) * bend;

    points.push([
      a[0] + dx * t + nx * curve,
      a[1] + dy * t + ny * curve,
    ]);
  }

  return points;
}

async function fetchRoadRoute(project) {
  const start = `${BRAINWING_HQ.lng},${BRAINWING_HQ.lat}`;
  const end = `${project.lng},${project.lat}`;

  const url =
    `https://router.project-osrm.org/route/v1/driving/${start};${end}` +
    `?overview=full&geometries=geojson&steps=false`;

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`OSRM ${response.status}`);
    }

    const data = await response.json();
    const coordinates = data?.routes?.[0]?.geometry?.coordinates;

    if (!Array.isArray(coordinates) || coordinates.length < 2) {
      throw new Error("No road geometry returned");
    }

    return coordinates;
  } catch (error) {
    console.warn(
      `Road route unavailable for ${project.city}; using fallback.`,
      error
    );

    return fallbackRoadRoute(project);
  }
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

  map.once(
    "idle",
    hide
  );
}

/* =====================================================
   PROJECT VIEWER

   The selected live project opens inside the showcase.
   × closes it and leaves the map at the same scroll state.
   OPEN LIVE remains available for projects that block iframe
   embedding.
===================================================== */

function ProjectViewer({ item, location, onClose }) {
  const [loaded, setLoaded] = useState(false);

  if (!item) return null;

  return (
    <div className="project-viewer" role="dialog" aria-modal="true">
      <div className="project-viewer-backdrop" />

      <div className="project-viewer-shell">
        <header className="project-viewer-header">
          <div>
            <span className="project-viewer-kicker">
              {location?.city?.toUpperCase()} · BRAINWING PROJECT
            </span>
            <h3>{item.name}</h3>
          </div>

          <div className="project-viewer-actions">
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="project-viewer-open"
            >
              OPEN LIVE ↗
            </a>

            <button
              type="button"
              className="project-viewer-close"
              onClick={onClose}
              aria-label="Back to project map"
            >
              ×
            </button>
          </div>
        </header>

        <div className="project-viewer-content">
          {!loaded && (
            <div className="project-viewer-loader">
              <span>LOADING PROJECT</span>
              <div className="project-loader-line"><i /></div>
              <small>{item.category}</small>
            </div>
          )}

          <iframe
            src={item.url}
            title={item.name}
            onLoad={() => setLoaded(true)}
            className={loaded ? "is-loaded" : ""}
          />
        </div>
      </div>
    </div>
  );
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

  const popupRootsRef =
    useRef({});

  const scrollTriggerRef =
    useRef(null);

  const activeIndexRef =
    useRef(0);

  const activeIdRef =
    useRef(null);

  const routeCacheRef =
    useRef({});

  const routeAnimationRef =
    useRef(null);

  const [mapReady, setMapReady] =
    useState(false);

  const [selectedProjectItem, setSelectedProjectItem] =
    useState(null);

  const stickyRef =
    useRef(null);

  const scrubTimeoutRef =
    useRef(null);

  const [activeProject, setActiveProject] =
    useState(null);

  /* =====================================================
     ROUTE + CAMERA ANIMATION

     Camera movement and road drawing share one duration.
     The route is progressively revealed while the camera
     travels toward the selected location.
  ===================================================== */

  const setRouteData = useCallback((coordinates) => {
    const source = mapRef.current?.getSource(
      "brainwing-route-active"
    );

    if (!source) return;

    source.setData({
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: coordinates ?? [],
      },
    });
  }, []);

  const animateRoute = useCallback((coordinates, duration) => {
    if (routeAnimationRef.current) {
      cancelAnimationFrame(routeAnimationRef.current);
      routeAnimationRef.current = null;
    }

    if (!coordinates?.length) {
      setRouteData([]);
      return;
    }

    const started = performance.now();

    const draw = (now) => {
      const progress = Math.min(1, (now - started) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const count = Math.max(2, Math.floor(eased * coordinates.length));

      setRouteData(coordinates.slice(0, count));

      if (progress < 1) {
        routeAnimationRef.current = requestAnimationFrame(draw);
      } else {
        routeAnimationRef.current = null;
      }
    };

    routeAnimationRef.current = requestAnimationFrame(draw);
  }, [setRouteData]);

  const animateRoadAndCamera = useCallback((waypoint, coordinates) => {
    const map = mapRef.current;
    if (!map || !waypoint) return;

    const camera = waypoint.camera;
    const duration = waypoint.project ? 2200 : 1800;

    map.stop();

    if (waypoint.project && coordinates?.length) {
      animateRoute(coordinates, duration);
    } else {
      setRouteData([]);
    }

    map.easeTo({
      center: camera.center,
      zoom: camera.zoom,
      pitch: camera.pitch,
      bearing: camera.bearing,
      duration,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      essential: true,
    });
  }, [animateRoute, setRouteData]);

  const setActiveMarker =
    useCallback((id) => {
      Object.entries(
        markerElsRef.current
      ).forEach(
        ([projectId, element]) => {
          element.classList.toggle(
            "is-active",
            projectId === id
          );
        }
      );
    }, []);

  const goToWaypoint =
    useCallback(async (index) => {
      const waypoint = waypoints[index];
      const map = mapRef.current;

      if (!waypoint || !map) return;

      const id = waypoint.project?.id ?? null;

      activeIdRef.current = id;
      setActiveProject(waypoint.project ?? null);
      setActiveMarker(id);

      if (!waypoint.project) {
        // India is the initial static state. Do not animate the
        // camera or wait for route data on the first paint.
        map.stop();
        setRouteData([]);
        map.jumpTo({
          center: waypoint.camera.center,
          zoom: waypoint.camera.zoom,
          pitch: waypoint.camera.pitch,
          bearing: waypoint.camera.bearing,
        });
        return;
      }

      const project = waypoint.project;
      let coordinates = routeCacheRef.current[project.id];

      if (!coordinates) {
        // Use a visual route immediately so the camera never waits.
        const fallback = fallbackRoadRoute(project);
        animateRoadAndCamera(waypoint, fallback);

        coordinates = await fetchRoadRoute(project);
        routeCacheRef.current[project.id] = coordinates;

        // If the user is still on this waypoint, replace the fallback
        // with the actual road route and draw it again.
        if (activeIndexRef.current !== index) return;

        map.stop();
        animateRoadAndCamera(waypoint, coordinates);
        return;
      }

      animateRoadAndCamera(waypoint, coordinates);
    }, [animateRoadAndCamera, setActiveMarker]);

  /* =====================================================
     SCROLL → ACTIVE WAYPOINT

     Cheap on every scroll frame: just a lookup, no camera
     work. The map only moves when the resolved index
     actually changes.
  ===================================================== */

  const setupScrollJourney =
    useCallback(() => {
      const markScrubbing =
        () => {
          stickyRef.current?.classList.add(
            "is-scrubbing"
          );

          if (
            scrubTimeoutRef.current
          ) {
            clearTimeout(
              scrubTimeoutRef.current
            );
          }

          scrubTimeoutRef.current =
            setTimeout(() => {
              stickyRef.current?.classList.remove(
                "is-scrubbing"
              );
            }, 160);
        };

      scrollTriggerRef.current =
        ScrollTrigger.create({
          trigger:
            storyRef.current,

          start:
            "top top",

          end:
            "bottom bottom",

          onUpdate:
            (self) => {
              markScrubbing();

              const scrollUnits =
                self.progress *
                TOTAL_JOURNEY_UNITS;

              const index =
                waypointIndexForScrollUnits(
                  scrollUnits
                );

              if (
                index !==
                activeIndexRef.current
              ) {
                activeIndexRef.current =
                  index;

                goToWaypoint(
                  index
                );
              }
            },
        });
    }, [goToWaypoint]);

  /* =====================================================
     SCROLL TO PROJECT
  ===================================================== */

  const scrollToProject =
    useCallback((project) => {
      const storyEl =
        storyRef.current;

      const index =
        waypoints.findIndex(
          (wp) =>
            wp.project?.id ===
            project.id
        );

      if (
        !storyEl ||
        index < 0
      ) {
        return;
      }

      const fraction =
        waypointStarts[
          index
        ] /
        TOTAL_JOURNEY_UNITS;

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
    }, []);

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

        // No terrain / 3D buildings — they were forcing a
        // full GPU scene rebuild (and, for terrain, extra
        // tile requests) on every camera move. The journey
        // reads fine as a flat, fast map.
      });

    mapRef.current =
      map;

    /* =================================================
       COMPASS SYNC

       Keep the compass needle in step with the map's
       actual bearing (including the short easeTo
       animations), instead of recomputing it by hand.
    ================================================= */

    map.on(
      "rotate",
      () => {
        if (
          compassNeedleRef.current
        ) {
          compassNeedleRef.current.style.transform =
            `rotate(${-map.getBearing()}deg)`;
        }
      }
    );

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
           ROUTE SOURCE
        ============================================== */

        map.addSource(
          "brainwing-route-active",
          {
            type:
              "geojson",

            lineMetrics: true,

            data: {
              type: "Feature",

              geometry: {
                type: "LineString",

                coordinates: [],
              },
            },
          }
        );

        /* ==============================================
           ROUTE LINE
        ============================================== */

        map.addLayer({
          id:
            "brainwing-route-active",

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
            "line-color": "#9ff8ff",
            "line-width": 4,
            "line-opacity": 0.92,
            "line-blur": 0.3,
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
                "div"
              );

            markerElement.className =
              "brainwing-scroll-marker";

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

              <span class="project-popup-mount"></span>
            `;

            /* ==============================================
               PROJECT POPUP
            ============================================== */

            const popupMount =
              markerElement.querySelector(
                ".project-popup-mount"
              );

            if (popupMount) {
              const popupRoot =
                createRoot(
                  popupMount
                );

              popupRootsRef.current[
                project.id
              ] = popupRoot;

              popupRoot.render(
                <ProjectMarkerPopup
                  project={project}
                  onOpenProject={(item) => {
                    setSelectedProjectItem({
                      item,
                      location: project,
                    });
                  }}
                />
              );
            }

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
                element: markerElement,
                anchor: "center",
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
           PREFETCH ROAD ROUTES IN THE BACKGROUND

           The map itself becomes usable immediately. Routes
           are fetched after load so the first interaction is
           not held hostage by routing/network latency.
        ============================================== */

        journeyProjects.forEach((project, index) => {
          window.setTimeout(() => {
            fetchRoadRoute(project).then((coordinates) => {
              routeCacheRef.current[project.id] = coordinates;
            });
          }, index * 350);
        });

        /* ==============================================
           BUILD SCROLL JOURNEY
        ============================================== */

        setupScrollJourney();

        activeIndexRef.current =
          0;

        goToWaypoint(0);

        /* ==============================================
           FORCE INITIAL MAP RESIZE

           Helps prevent first-load visual glitch.
        ============================================== */

        requestAnimationFrame(() => {
          map.resize();
          setMapReady(true);
        });
      }
    );

    /* =================================================
       CLEANUP
    ================================================= */

    return () => {
      if (
        scrubTimeoutRef.current
      ) {
        clearTimeout(
          scrubTimeoutRef.current
        );
      }

      scrollTriggerRef.current
        ?.kill();

      scrollTriggerRef.current =
        null;

      if (routeAnimationRef.current) {
        cancelAnimationFrame(routeAnimationRef.current);
      }

      routeAnimationRef.current = null;

      Object.values(
        popupRootsRef.current
      ).forEach((root) => {
        root.unmount();
      });

      popupRootsRef.current =
        {};

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
    useCallback(() => {
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
    }, []);

  /* =====================================================
     UI
  ===================================================== */

  return (
    <section
      className={`world-map-story${mapReady ? " is-map-ready" : ""}`}
      ref={storyRef}
      style={{
        minHeight:
          `${
            TOTAL_JOURNEY_UNITS *
            SCROLL_VH_PER_UNIT
          }vh`,
      }}
    >
      {/* =================================================
          STICKY MAP
      ================================================= */}

      <div
        className="world-map-sticky"
        ref={stickyRef}
      >

        <div
          ref={mapContainerRef}
          className="world-map"
        />

        {!mapReady && (
          <div className="map-loading-screen" aria-live="polite">
            <span>BRAINWING</span>
            <strong>INITIALIZING MAP</strong>
            <i><b /></i>
          </div>
        )}

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

        {selectedProjectItem && (
          <ProjectViewer
            item={selectedProjectItem.item}
            location={selectedProjectItem.location}
            onClose={() => setSelectedProjectItem(null)}
          />
        )}

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

export default WorldMap