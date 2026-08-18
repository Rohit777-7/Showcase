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
===================================================== */

const DWELL = 0;

const SCROLL_VH_PER_UNIT = 90;

/* =====================================================
   TERRAIN GATING

   Terrain relief / 3D buildings are unnecessary at the
   INDIA overview zoom and still cost a full GPU
   re-render on every jumpTo. Below this zoom they're
   switched off entirely; every city stop is well above it
   (12.4+), so local hops are unaffected.
===================================================== */

const TERRAIN_MIN_ZOOM = 9;

const TERRAIN_EXAGGERATION = 1.2;

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

    // Initial state only — first scroll immediately moves
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


/* =====================================================
   PROGRESSIVE ROUTE DRAWING

   The route is drawn together with the camera scroll.

   progress = 0
      → no new route

   progress = 1
      → full route to the current destination
===================================================== */

function progressiveLineCoordinates(
  coordinates,
  progress
) {
  if (
    !Array.isArray(coordinates) ||
    coordinates.length < 2
  ) {
    return [];
  }

  const p =
    Math.max(
      0,
      Math.min(1, progress)
    );

  if (p <= 0) {
    return [];
  }

  if (p >= 1) {
    return coordinates;
  }

  const distances = [0];

  let totalDistance = 0;

  for (
    let i = 1;
    i < coordinates.length;
    i++
  ) {
    const [x1, y1] =
      coordinates[i - 1];

    const [x2, y2] =
      coordinates[i];

    const dx = x2 - x1;
    const dy = y2 - y1;

    totalDistance +=
      Math.sqrt(
        dx * dx +
        dy * dy
      );

    distances.push(
      totalDistance
    );
  }

  if (totalDistance <= 0) {
    return coordinates.slice(
      0,
      2
    );
  }

  const targetDistance =
    totalDistance * p;

  const result = [
    coordinates[0],
  ];

  for (
    let i = 1;
    i < coordinates.length;
    i++
  ) {
    if (
      distances[i] <
      targetDistance
    ) {
      result.push(
        coordinates[i]
      );

      continue;
    }

    const previousDistance =
      distances[i - 1];

    const segmentDistance =
      distances[i] -
      previousDistance;

    const localProgress =
      segmentDistance > 0
        ? (
            targetDistance -
            previousDistance
          ) /
          segmentDistance
        : 0;

    const [x1, y1] =
      coordinates[i - 1];

    const [x2, y2] =
      coordinates[i];

    result.push([
      x1 +
        (x2 - x1) *
          localProgress,

      y1 +
        (y2 - y1) *
          localProgress,
    ]);

    break;
  }

  return result;
}


function progressiveRouteFromPrevious(
  coordinates,
  previousPoint,
  progress
) {
  if (
    !Array.isArray(coordinates) ||
    coordinates.length < 2 ||
    !previousPoint
  ) {
    return [];
  }

  let nearestIndex = 0;
  let nearestDistance = Infinity;

  coordinates.forEach(
    (coordinate, index) => {
      const dx =
        coordinate[0] -
        previousPoint[0];

      const dy =
        coordinate[1] -
        previousPoint[1];

      const distance =
        dx * dx + dy * dy;

      if (
        distance <
        nearestDistance
      ) {
        nearestDistance =
          distance;

        nearestIndex =
          index;
      }
    }
  );

  const completed =
    coordinates.slice(
      0,
      nearestIndex + 1
    );

  const currentSegment =
    coordinates.slice(
      nearestIndex
    );

  const partial =
    progressiveLineCoordinates(
      currentSegment,
      progress
    );

  if (
    partial.length <= 1
  ) {
    return completed;
  }

  return [
    ...completed,
    ...partial.slice(1),
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
   project (enterWaypoint + a quick scroll back) share one
   fetch instead of firing twice.
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

    // Starts hidden — matches terrainActiveRef's initial
    // false; syncCamera() flips this in step with terrain.
    layout: {
      visibility:
        "none",
    },

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

  const terrainActiveRef =
    useRef(false);

  const routeRequestIdRef =
    useRef(0);

  // Keeps the best available route geometry for each project.
  // Starts with straight coordinates and upgrades to road
  // geometry when MapTiler routing resolves.
  const routeGeometryRef =
    useRef(new Map());

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

     Shows the straight-line path immediately (so the
     route is never empty while a request is in flight),
     then swaps in the real road-routed geometry once it
     resolves — see roadRouteCoordinatesFor() above, which
     caches per project and falls back to the straight
     line on any fetch failure.

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

      const fallbackRoute =
        straightLineCoordinatesFor(
          project
        );

      routeGeometryRef.current.set(
        project.id,
        fallbackRoute
      );

      setActiveRoute(
        fallbackRoute
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

        routeGeometryRef.current.set(
          project.id,
          coordinates
        );

        setActiveRoute(
          coordinates
        );
      });
    }, [setActiveRoute]);

  /* =====================================================
     ENTER PROJECT

     When scroll reaches a project:

     HQ → current project

     route becomes visible.
  ===================================================== */

  const enterWaypoint =
    useCallback((waypoint) => {
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
     DURING CAMERA TRANSITION

     IMPORTANT:

     Never add camera coordinates
     to route.
  ===================================================== */

  const transitFrom =
    useCallback((fromWaypoint) => {
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

      // Keep the route that has already been completed.
      // Do not wait for the next destination to be reached.
      if (fromWaypoint.project) {
        const route =
          routeGeometryRef.current.get(
            fromWaypoint.project.id
          );

        if (route) {
          setActiveRoute(
            route
          );
        } else {
          applyRoute(
            fromWaypoint.project
          );
        }
      } else {
        setActiveRoute([]);
      }
    }, [applyRoute, setActiveMarker, setActiveRoute]);

  /* =====================================================
     SYNC JOURNEY STATE
  ===================================================== */

  const syncJourneyState =
    useCallback((time) => {
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
    }, [enterWaypoint, transitFrom]);

  /* =====================================================
     BUILD CAMERA TIMELINE
  ===================================================== */

  const buildJourneyTimeline =
    useCallback((map) => {
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

      /* ================================================
         SYNC CAMERA

         jumpTo is already the cheap, non-animated path
         (GSAP's own ticker already batches this to one
         call per animation frame, so there's no cheaper
         per-tick update to throttle to).

         What actually made every tick expensive was
         terrain + 3D buildings recomputing a full GPU
         scene even during the low-zoom WORLDWIDE/INDIA
         legs where neither is visible. Both are now
         toggled on/off only when crossing the zoom
         threshold, not re-applied every frame.
      ================================================= */

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

          const shouldHaveTerrain =
            proxy.zoom >=
            TERRAIN_MIN_ZOOM;

          if (
            shouldHaveTerrain !==
            terrainActiveRef.current
          ) {
            terrainActiveRef.current =
              shouldHaveTerrain;

            if (
              shouldHaveTerrain
            ) {
              map.enableTerrain(
                TERRAIN_EXAGGERATION
              );
            } else {
              map.disableTerrain();
            }

            if (
              map.getLayer(
                "brainwing-3d-buildings"
              )
            ) {
              map.setLayoutProperty(
                "brainwing-3d-buildings",
                "visibility",
                shouldHaveTerrain
                  ? "visible"
                  : "none"
              );
            }
          }

          if (
            compassNeedleRef.current
          ) {
            compassNeedleRef.current.style.transform =
              `rotate(${-proxy.bearing}deg)`;
          }
        };

      /* ================================================
         SCRUBBING STATE

         Panels overlaying the canvas use backdrop-filter
         blur, which forces a re-composite of the live
         WebGL layer beneath them on every repaint. That's
         fine at rest, but during active scroll (every
         frame repainting anyway) it's pure added cost —
         so it's suspended while scrubbing and restored a
         moment after scrolling settles.
      ================================================= */

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
              () => {
                markScrubbing();

                syncJourneyState(
                  tl.time()
                );
              },
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
        const waypoint =
          waypoints[i];

        const hopLength =
          waypoint.hop ??
          1;

        const target =
          waypoint.camera;

        /*
         * INDIA → BRAINWING
         *
         * No project route is drawn here.
         * BrainWing is the fixed HQ.
         */
        const isProjectWaypoint =
          Boolean(
            waypoint.project
          );

        const targetProject =
          waypoint.project;

        /*
         * Start with the straight fallback immediately.
         * If the routing request resolves later, the same
         * scroll animation will automatically use the road
         * geometry from that point onward.
         */
        let routeCoordinates =
          targetProject
            ? (
                routeGeometryRef.current.get(
                  targetProject.id
                ) ??
                straightLineCoordinatesFor(
                  targetProject
                )
              )
            : [];

        if (
          targetProject &&
          !routeGeometryRef.current.has(
            targetProject.id
          )
        ) {
          routeGeometryRef.current.set(
            targetProject.id,
            routeCoordinates
          );

          roadRouteCoordinatesFor(
            targetProject,
            maptilersdk.config.apiKey
          ).then((coordinates) => {
            routeGeometryRef.current.set(
              targetProject.id,
              coordinates
            );
          });
        }

        const segmentStart =
          cursor;

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
              () => {
                syncCamera();

                /*
                 * Draw the connecting route at the same
                 * progress as the camera.
                 *
                 * India → BrainWing:
                 * no route because BrainWing is the HQ.
                 *
                 * BrainWing → Borivali:
                 * route grows from 0 → full.
                 *
                 * Borivali → Thane:
                 * completed Borivali route stays visible
                 * while the route extends toward Thane.
                 */
                if (
                  isProjectWaypoint &&
                  targetProject
                ) {
                  const progress =
                    hopLength > 0
                      ? Math.max(
                          0,
                          Math.min(
                            1,
                            (
                              tl.time() -
                              segmentStart
                            ) /
                              hopLength
                          )
                        )
                      : 1;

                  const latestRoute =
                    routeGeometryRef.current.get(
                      targetProject.id
                    ) ??
                    routeCoordinates;

                  const previousWaypoint =
                    waypoints[i - 1];

                  const previousPoint =
                    previousWaypoint.project
                      ? [
                          previousWaypoint.project.lng,
                          previousWaypoint.project.lat,
                        ]
                      : [
                          BRAINWING_HQ.lng,
                          BRAINWING_HQ.lat,
                        ];

                  setActiveRoute(
                    progressiveRouteFromPrevious(
                      latestRoute,
                      previousPoint,
                      progress
                    )
                  );
                } else {
                  setActiveRoute([]);
                }
              },
          },

          cursor
        );

        cursor +=
          hopLength;

        breakpoints.push({
          waypoint,

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
    }, [syncJourneyState]);

  /* =====================================================
     SCROLL TO PROJECT
  ===================================================== */

  const scrollToProject =
    useCallback((project) => {
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

        // Terrain starts disabled — the initial camera
        // (waypoints[0], zoom 4.6) is below
        // TERRAIN_MIN_ZOOM, and syncCamera() enables it
        // once scroll brings zoom into city range.
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