import {
  useCallback,
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

   Every waypoint after the first owns a fixed chunk of
   the page's scroll range (sized by its "hop" weight).
   waypointThresholds[i] is the scroll position (in hop
   units) at which waypoint i becomes active.
===================================================== */

const waypointThresholds = (() => {
  const thresholds = [0];

  let cursor = 0;

  for (
    let i = 1;
    i < waypoints.length;
    i++
  ) {
    cursor +=
      waypoints[i].hop ?? 1;

    thresholds.push(cursor);
  }

  return thresholds;
})();

const TOTAL_JOURNEY_UNITS =
  waypointThresholds[
    waypointThresholds.length - 1
  ];

function waypointIndexForScrollUnits(
  scrollUnits
) {
  let index = 0;

  for (
    let i = 1;
    i < waypointThresholds.length;
    i++
  ) {
    if (
      scrollUnits >=
      waypointThresholds[i]
    ) {
      index = i;
    } else {
      break;
    }
  }

  return index;
}

/* =====================================================
   ROAD ROUTE (HQ -> ... -> CITY)

   Straight-line coordinates for every stop from HQ up
   to (and including) the given project — this is also
   the fallback used whenever the routing API can't be
   reached.

   NOTE: MapTiler's Routing/Directions API is currently
   beta / waitlist-only (see maptiler.com/routing) and is
   not enabled on every API key. Until an account has
   access, requests below will fail and this straight
   line is what actually renders — that's expected, not
   a bug in this fallback path.
===================================================== */

function straightLineCoordinatesFor(
  project
) {
  const index =
    journeyProjects.findIndex(
      (item) =>
        item.id === project.id
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
      .slice(0, index + 1)
      .map((item) => [
        item.lng,
        item.lat,
      ]),
  ];
}

const MAPTILER_ROUTING_URL =
  "https://api.maptiler.com/routing/v1/directions/driving";

async function fetchRoadRoute(
  points,
  apiKey
) {
  const coordinates = points
    .map(
      ([lng, lat]) =>
        `${lng},${lat}`
    )
    .join(";");

  const url =
    `${MAPTILER_ROUTING_URL}/${coordinates}` +
    `?geometries=geojson&overview=full&key=${apiKey}`;

  const response =
    await fetch(url);

  if (!response.ok) {
    throw new Error(
      `MapTiler routing request failed (${response.status})`
    );
  }

  const data =
    await response.json();

  const geometry =
    data?.routes?.[0]?.geometry;

  if (
    geometry?.type !==
      "LineString" ||
    !Array.isArray(
      geometry.coordinates
    ) ||
    geometry.coordinates.length <
      2
  ) {
    throw new Error(
      "MapTiler routing response had no usable route geometry"
    );
  }

  return geometry.coordinates;
}

/* =====================================================
   ROAD ROUTE CACHE

   Module-level (not component state) so a fetched route
   is remembered for as long as the page lives, even if
   WorldMap unmounts/remounts. Keyed by project id since
   the point list for a given project never changes.

   Stores the in-flight/resolved promise, not just the
   result, so two near-simultaneous requests for the same
   project don't fire twice.
===================================================== */

const roadRouteCache = new Map();

function roadRouteCoordinatesFor(
  project,
  apiKey
) {
  const cached =
    roadRouteCache.get(
      project.id
    );

  if (cached) {
    return cached;
  }

  const fallback =
    straightLineCoordinatesFor(
      project
    );

  const promise = apiKey
    ? fetchRoadRoute(
        fallback,
        apiKey
      ).catch((error) => {
        console.warn(
          `Road routing unavailable for ${project.city}, using straight line.`,
          error
        );

        return fallback;
      })
    : Promise.resolve(
        fallback
      );

  roadRouteCache.set(
    project.id,
    promise
  );

  return promise;
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

  const scrollTriggerRef =
    useRef(null);

  const activeIndexRef =
    useRef(0);

  const activeIdRef =
    useRef(null);

  const routeRequestIdRef =
    useRef(0);

  const stickyRef =
    useRef(null);

  const scrubTimeoutRef =
    useRef(null);

  const [activeProject, setActiveProject] =
    useState(null);

  /* =====================================================
     SET ACTIVE ROUTE
  ===================================================== */

  const setActiveRoute =
    useCallback((coordinates) => {
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
    }, []);

  /* =====================================================
     ACTIVE MARKER
  ===================================================== */

  const setActiveMarker =
    useCallback((id) => {
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
    }, []);

  /* =====================================================
     APPLY ROUTE

     Draws the full HQ → ... → current-city path in one
     shot (no per-frame progressive redraw). Shows the
     straight-line fallback immediately, then swaps in the
     real road-routed geometry once it resolves — see
     roadRouteCoordinatesFor() above, which caches per
     project and falls back to the straight line on fetch
     failure.

     routeRequestIdRef guards against a slow response for
     a project the user has since scrolled past
     overwriting a newer route.
  ===================================================== */

  const applyRoute =
    useCallback((project) => {
      const requestId =
        ++routeRequestIdRef.current;

      if (!project) {
        setActiveRoute([]);

        return;
      }

      setActiveRoute(
        straightLineCoordinatesFor(
          project
        )
      );

      roadRouteCoordinatesFor(
        project,
        maptilersdk.config
          .apiKey
      ).then((coordinates) => {
        if (
          routeRequestIdRef.current !==
          requestId
        ) {
          return;
        }

        setActiveRoute(
          coordinates
        );
      });
    }, [setActiveRoute]);

  /* =====================================================
     GO TO WAYPOINT

     Snaps the camera directly to a waypoint's final
     position (a single short easeTo, not a scroll-linked
     tween through every intermediate point) so the map
     only ever needs tiles for real stops.
  ===================================================== */

  const goToWaypoint =
    useCallback((index, { animate = true } = {}) => {
      const waypoint =
        waypoints[index];

      const map =
        mapRef.current;

      if (!waypoint || !map) {
        return;
      }

      const camera =
        waypoint.camera;

      if (animate) {
        map.easeTo({
          center:
            camera.center,

          zoom:
            camera.zoom,

          pitch:
            camera.pitch,

          bearing:
            camera.bearing,

          duration: 500,

          essential: true,
        });
      } else {
        map.jumpTo({
          center:
            camera.center,

          zoom:
            camera.zoom,

          pitch:
            camera.pitch,

          bearing:
            camera.bearing,
        });
      }

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

      applyRoute(
        waypoint.project
      );
    }, [applyRoute, setActiveMarker]);

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
        waypointThresholds[
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

        setupScrollJourney();

        activeIndexRef.current =
          0;

        goToWaypoint(0, {
          animate: false,
        });

        /* ==============================================
           FORCE INITIAL MAP RESIZE

           Helps prevent first-load visual glitch.
        ============================================== */

        requestAnimationFrame(
          () => {
            map.resize();
          }
        );
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
      className="world-map-story"
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
