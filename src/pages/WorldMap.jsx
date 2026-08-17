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

/*
=====================================================
CAMERA TUNING

Per-city overrides for the journey. `hop` is the relative
scroll-timeline weight of the flight INTO that city (a
longer haul like London gets more scroll distance than a
short hop across the Mumbai metro). Cities not listed fall
back to DEFAULT_CITY_CAMERA so adding a new entry to
projects.js keeps working automatically.
=====================================================
*/

const CITY_CAMERA = {
  mumbai: { zoom: 12.6, pitch: 55, bearing: -18, hop: 1.1 },
  borivali: { zoom: 13.4, pitch: 58, bearing: -12, hop: 0.7 },
  thane: { zoom: 13.4, pitch: 58, bearing: -22, hop: 0.7 },
  colaba: { zoom: 14, pitch: 60, bearing: -25, hop: 0.7 },
  bangalore: { zoom: 12.8, pitch: 55, bearing: -15, hop: 1.4 },
  london: { zoom: 12.4, pitch: 52, bearing: -10, hop: 1.6 },
};

const DEFAULT_CITY_CAMERA = { zoom: 13.2, pitch: 56, bearing: -18, hop: 1 };

function cityCameraFor(project) {
  return CITY_CAMERA[project.id] ?? DEFAULT_CITY_CAMERA;
}

// How long (in timeline units) the journey pauses on a
// city once it arrives, before the next hop begins.
const DWELL = 0.6;

/*
=====================================================
JOURNEY WAYPOINTS

Two intro waypoints (world / regional) followed by one
per project — generated straight from projects.js so it
stays the single source of truth.
=====================================================
*/

const waypoints = [
  {
    title: "WORLDWIDE",
    project: null,
    camera: { center: [78, 21.5], zoom: 3.3, pitch: 20, bearing: 0 },
  },

  {
    title: "INDIA",
    project: null,
    camera: { center: [77.4, 20.2], zoom: 4.6, pitch: 30, bearing: -5 },
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

// Extra scroll room beyond the raw hop/dwell count, purely
// for pacing — bigger number = slower, longer journey.
const SCROLL_VH_PER_UNIT = 90;

function emptyLineFeature() {
  return {
    type: "Feature",
    geometry: { type: "LineString", coordinates: [] },
  };
}

/*
=====================================================
HIDE LABELS — city names, POI icons and road/place text
are all MapLibre "symbol" layers. Switching every symbol
layer off (regardless of the exact layer names MapTiler's
style ships with) leaves roads, buildings and terrain
fully intact while clearing the map down to just our own
Brainwing markers.
=====================================================
*/

function hideLabelLayers(map) {
  map
    .getStyle()
    .layers.filter((layer) => layer.type === "symbol")
    .forEach((layer) => {
      map.setLayoutProperty(layer.id, "visibility", "none");
    });
}

/*
=====================================================
REALISTIC 3D BUILDINGS — MapTiler's own building
footprints, extruded to real height and tinted to match
the Brainwing dark navy/cyan palette. We don't know the
exact source id MapTiler assigns per style, so we look up
whichever source already carries a "building" layer and
extrude from that.
=====================================================
*/

function addRealisticBuildings(map) {
  const existingBuildingLayer = map
    .getStyle()
    .layers.find((layer) => layer["source-layer"] === "building");

  if (!existingBuildingLayer) return;

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
        ["coalesce", ["get", "render_height"], ["get", "height"], 8],
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

function WorldMap() {
  const storyRef = useRef(null);
  const mapContainerRef = useRef(null);
  const compassNeedleRef = useRef(null);

  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const markerElsRef = useRef({});

  const timelineRef = useRef(null);
  const breakpointsRef = useRef([]);
  const cameraProxyRef = useRef({ ...waypoints[0].camera });
  const activeIdRef = useRef(null);

  const [activeProject, setActiveProject] = useState(null);

  /*
  =====================================================
  ROUTE — full path always faint, visited path glows and
  literally draws itself as the camera flies each hop.
  =====================================================
  */

  const setActiveRoute = (coordinates) => {
    const source = mapRef.current?.getSource(
      "brainwing-route-active"
    );

    if (!source) return;

    source.setData({
      type: "Feature",
      geometry: { type: "LineString", coordinates },
    });
  };

  const setActiveMarker = (id) => {
    Object.entries(markerElsRef.current).forEach(([projectId, el]) => {
      el.classList.toggle("is-active", projectId === id);
    });
  };

  /*
  =====================================================
  JOURNEY STATE — derived every scroll tick from where the
  timeline currently sits: dwelling on a waypoint, or
  mid-flight between two of them.
  =====================================================
  */

  const enterWaypoint = (waypoint) => {
    const id = waypoint.project?.id ?? null;

    if (activeIdRef.current !== id) {
      activeIdRef.current = id;
      setActiveProject(waypoint.project);
      setActiveMarker(id);
    }

    setActiveRoute(
      waypoint.project
        ? projects
            .slice(0, projects.indexOf(waypoint.project) + 1)
            .map((project) => [project.lng, project.lat])
        : []
    );
  };

  const transitFrom = (fromWaypoint) => {
    if (activeIdRef.current !== null) {
      activeIdRef.current = null;
      setActiveProject(null);
      setActiveMarker(null);
    }

    const priorCoords = fromWaypoint.project
      ? projects
          .slice(0, projects.indexOf(fromWaypoint.project) + 1)
          .map((project) => [project.lng, project.lat])
      : [];

    const tip = cameraProxyRef.current;

    setActiveRoute([...priorCoords, [tip.lng, tip.lat]]);
  };

  const syncJourneyState = (time) => {
    const breakpoints = breakpointsRef.current;

    if (!breakpoints.length) return;

    for (let k = 0; k < breakpoints.length; k++) {
      const bp = breakpoints[k];
      const isLast = k === breakpoints.length - 1;

      if (time >= bp.arrive && (isLast || time < bp.leave)) {
        enterWaypoint(bp.waypoint);
        return;
      }
    }

    for (let k = 0; k < breakpoints.length - 1; k++) {
      if (time >= breakpoints[k].leave && time < breakpoints[k + 1].arrive) {
        transitFrom(breakpoints[k].waypoint);
        return;
      }
    }
  };

  /*
  =====================================================
  SCROLL-SCRUBBED CAMERA TIMELINE

  A single GSAP timeline moves a camera proxy through
  every waypoint in order. Gaps between hops are the
  "dwell" pauses at each city. Scrub ties timeline time
  directly to scroll position — the map camera IS the
  scrollbar.
  =====================================================
  */

  const buildJourneyTimeline = (map) => {
    const proxy = cameraProxyRef.current;
    const breakpoints = [{ waypoint: waypoints[0], arrive: 0, leave: DWELL }];

    const syncCamera = () => {
      map.jumpTo({
        center: [proxy.lng, proxy.lat],
        zoom: proxy.zoom,
        pitch: proxy.pitch,
        bearing: proxy.bearing,
      });

      if (compassNeedleRef.current) {
        compassNeedleRef.current.style.transform = `rotate(${-proxy.bearing}deg)`;
      }
    };

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: storyRef.current,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.7,
        onUpdate: () => syncJourneyState(tl.time()),
      },
    });

    let cursor = DWELL;

    for (let i = 1; i < waypoints.length; i++) {
      const hopLength = waypoints[i].hop ?? 1;
      const target = waypoints[i].camera;

      tl.to(
        proxy,
        {
          lng: target.center[0],
          lat: target.center[1],
          zoom: target.zoom,
          pitch: target.pitch,
          bearing: target.bearing,
          duration: hopLength,
          ease: "power1.inOut",
          onUpdate: syncCamera,
        },
        cursor
      );

      cursor += hopLength;

      breakpoints.push({
        waypoint: waypoints[i],
        arrive: cursor,
        leave: cursor + DWELL,
      });

      cursor += DWELL;
    }

    timelineRef.current = tl;
    breakpointsRef.current = breakpoints;

    syncJourneyState(0);
  };

  /*
  =====================================================
  SCROLL TO A GIVEN PROJECT — shared by markers, the
  sidebar and the bottom stepper.
  =====================================================
  */

  const scrollToProject = (project) => {
    const tl = timelineRef.current;
    const storyEl = storyRef.current;

    const breakpoint = breakpointsRef.current.find(
      (bp) => bp.waypoint.project?.id === project.id
    );

    if (!tl || !storyEl || !breakpoint) return;

    const fraction = breakpoint.arrive / tl.duration();
    const scrollRange = storyEl.offsetHeight - window.innerHeight;

    window.scrollTo({
      top: storyEl.offsetTop + fraction * scrollRange,
      behavior: "smooth",
    });
  };

  /*
  =====================================================
  INITIALIZE MAP
  =====================================================
  */

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapRef.current) return;

    const apiKey = import.meta.env.VITE_MAPTILER_KEY;

    if (!apiKey) {
      console.error("VITE_MAPTILER_KEY is missing from .env");
      return;
    }

    maptilersdk.config.apiKey = apiKey;

    const map = new maptilersdk.Map({
      container: mapContainerRef.current,

      style: maptilersdk.MapStyle.STREETS.DARK,

      center: waypoints[0].camera.center,
      zoom: waypoints[0].camera.zoom,
      pitch: waypoints[0].camera.pitch,
      bearing: waypoints[0].camera.bearing,

      maxPitch: 68,

      navigationControl: false,
      geolocateControl: false,

      // MapTiler requires attribution on the free tier — keep
      // it, just styled to sit quietly in the corner.
      attributionControl: { compact: true },

      dragRotate: true,
      touchZoomRotate: true,

      // The page scroll drives the journey, so the map must
      // not also treat wheel input as "zoom the map" — that
      // would fight the user for control of every scroll.
      scrollZoom: false,

      // Real elevation relief for the wide-map → descend feel.
      terrain: true,
      terrainExaggeration: 1.2,
    });

    mapRef.current = map;

    map.on("load", () => {
      /*
      ===================================================
      STRIP LABELS, KEEP MAPTILER'S REAL 3D BUILDINGS
      ===================================================
      */

      hideLabelLayers(map);
      addRealisticBuildings(map);

      /*
      ===================================================
      ROUTE — base (always faint) + active (glows, grows)
      ===================================================
      */

      map.addSource("brainwing-route-full", {
        type: "geojson",

        data: {
          type: "Feature",

          geometry: {
            type: "LineString",
            coordinates: projects.map((project) => [
              project.lng,
              project.lat,
            ]),
          },
        },
      });

      map.addLayer({
        id: "brainwing-route-full",
        type: "line",
        source: "brainwing-route-full",

        paint: {
          "line-color": "#5fd8ea",
          "line-width": 1.2,
          "line-opacity": 0.2,
          "line-dasharray": [1, 2],
        },
      });

      map.addSource("brainwing-route-active", {
        type: "geojson",
        data: emptyLineFeature(),
      });

      map.addLayer({
        id: "brainwing-route-active-glow",
        type: "line",
        source: "brainwing-route-active",

        paint: {
          "line-color": "#7ff7ff",
          "line-width": 8,
          "line-opacity": 0.16,
          "line-blur": 6,
        },
      });

      map.addLayer({
        id: "brainwing-route-active-core",
        type: "line",
        source: "brainwing-route-active",

        paint: {
          "line-color": "#baffff",
          "line-width": 2.2,
          "line-opacity": 0.9,
        },
      });

      /*
      ===================================================
      LOCATION MARKERS — numbered pins, click jumps scroll
      ===================================================
      */

      projects.forEach((project, index) => {
        const markerElement = document.createElement("button");

        markerElement.className = "brainwing-scroll-marker";
        markerElement.type = "button";

        markerElement.innerHTML = `
          <span class="marker-pulse"></span>
          <span class="marker-pin">
            <span class="marker-number">${String(index + 1).padStart(
              2,
              "0"
            )}</span>
          </span>
          <span class="marker-label">${project.city.toUpperCase()}</span>
        `;

        markerElement.setAttribute("aria-label", project.city);

        markerElement.addEventListener("click", (event) => {
          event.stopPropagation();
          scrollToProject(project);
        });

        markerElsRef.current[project.id] = markerElement;

        const marker = new maptilersdk.Marker({
          element: markerElement,
          anchor: "center",
        })
          .setLngLat([project.lng, project.lat])
          .addTo(map);

        markersRef.current.push(marker);
      });

      buildJourneyTimeline(map);
    });

    return () => {
      timelineRef.current?.scrollTrigger?.kill();
      timelineRef.current?.kill();
      timelineRef.current = null;

      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      markerElsRef.current = {};

      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /*
  =====================================================
  RESET — close panel, scroll back to the start
  =====================================================
  */

  const resetMap = () => {
    if (!storyRef.current) return;

    window.scrollTo({
      top: storyRef.current.offsetTop,
      behavior: "smooth",
    });
  };

  const totalJourneyUnits =
    DWELL +
    waypoints.slice(1).reduce((sum, wp) => sum + (wp.hop ?? 1) + DWELL, 0);

  return (
    <section
      className="world-map-story"
      ref={storyRef}
      style={{
        minHeight: `${totalJourneyUnits * SCROLL_VH_PER_UNIT}vh`,
      }}
    >
      {/* =========================================
          STICKY MAP
      ========================================== */}

      <div className="world-map-sticky">
        <div ref={mapContainerRef} className="world-map" />

        <div className="map-vignette" />
        <div className="map-gradient" />

        {/* TOP BRAND */}
        {/* <div className="world-brand">
          <span>B R A I N W I N G</span>
          <small>I N N O V A T I O N</small>
        </div> */}

        {/* CENTER HEADING */}
        {/* <div className="world-heading">
          G L O B A L&nbsp;&nbsp; P R O J E C T S
        </div> */}

        {/* JOURNEY SIDEBAR */}
        <JourneySidebar
          projects={projects}
          activeId={activeProject?.id ?? null}
          onSelect={scrollToProject}
        />

        {/* SCROLL INDICATOR */}
        {!activeProject && (
          <div className="map-scroll-hint">
            <span>SCROLL TO EXPLORE</span>

            <div className="scroll-mouse">
              <span />
            </div>
          </div>
        )}

        {/* PROJECT PANEL */}
        <LocationPanel location={activeProject} onClose={resetMap} />

        {/* MAP CONTROLS */}
        <div className="map-controls">
          <button
            type="button"
            className="map-control-btn"
            aria-label="Toggle map theme"
            onClick={() =>
              console.log("Theme toggle — light basemap coming soon")
            }
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
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
            onClick={() => mapRef.current?.resetNorth?.({ duration: 600 })}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              ref={compassNeedleRef}
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeOpacity="0.35"
              />
              <path d="M12 3 15 12 12 21 9 12Z" fill="currentColor" />
            </svg>
          </button>
        </div>

        <div className="map-zoom">
          <button
            type="button"
            aria-label="Zoom in"
            onClick={() => mapRef.current?.zoomIn({ duration: 350 })}
          >
            +
          </button>

          <button
            type="button"
            aria-label="Zoom out"
            onClick={() => mapRef.current?.zoomOut({ duration: 350 })}
          >
            −
          </button>
        </div>

        {/* JOURNEY STEPPER */}
        <JourneyStepper
          projects={projects}
          activeId={activeProject?.id ?? null}
          onSelect={scrollToProject}
        />
      </div>
    </section>
  );
}

export default WorldMap;
