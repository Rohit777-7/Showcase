import { useEffect, useRef, useState } from "react";
import * as maptilersdk from "@maptiler/sdk";
import "@maptiler/sdk/dist/maptiler-sdk.css";

import { projects } from "../data/projects";
import "../styles/world-map.css";

function WorldMap() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  const [selectedLocation, setSelectedLocation] = useState(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapRef.current) return;

    const apiKey = import.meta.env.VITE_MAPTILER_KEY;

    if (!apiKey) {
      console.error(
        "MapTiler API key missing. Add VITE_MAPTILER_KEY to .env"
      );
      return;
    }

    maptilersdk.config.apiKey = apiKey;

    /*
    =====================================================
    CREATE MAP
    =====================================================
    */

    const map = new maptilersdk.Map({
      container: mapContainerRef.current,

      // Dark MapTiler map
      style: maptilersdk.MapStyle.STREETS.DARK,

      /*
      Worldwide starting position
      */
      center: [55, 25],

      zoom: 2.7,

      /*
      Cinematic perspective
      */
      pitch: 35,

      bearing: 0,

      /*
      Hide default controls
      */
      navigationControl: false,
      geolocateControl: false,
      attributionControl: false,

      /*
      Interaction
      */
      dragPan: true,
      dragRotate: true,
      touchZoomRotate: true,
      scrollZoom: true,
    });

    mapRef.current = map;

    /*
    =====================================================
    MAP LOADED
    =====================================================
    */

    map.on("load", () => {
      console.log("Map loaded successfully");
      console.log("Brainwing projects:", projects);

      /*
      ===================================================
      BRAINWING CONNECTION LINE
      ===================================================
      */

      const routeCoordinates = projects
        .filter(
          (project) =>
            typeof project.lng === "number" &&
            typeof project.lat === "number"
        )
        .map((project) => [
          project.lng,
          project.lat,
        ]);

      if (routeCoordinates.length > 1) {
        map.addSource("brainwing-route", {
          type: "geojson",

          data: {
            type: "Feature",

            geometry: {
              type: "LineString",
              coordinates: routeCoordinates,
            },
          },
        });

        map.addLayer({
          id: "brainwing-route",

          type: "line",

          source: "brainwing-route",

          paint: {
            "line-color": "#8ceff5",

            "line-width": 1.5,

            "line-opacity": 0.55,

            "line-blur": 1,
          },
        });
      }

      /*
      ===================================================
      CREATE PROJECT MARKERS
      ===================================================
      */

      projects.forEach((project) => {
        console.log(
          `Creating marker for ${project.city}`,
          project.lng,
          project.lat
        );

        /*
        -----------------------------------------------
        Marker element
        -----------------------------------------------
        */

        const markerElement =
          document.createElement("button");

        markerElement.className =
          "brainwing-project-marker";

        markerElement.type = "button";

        markerElement.setAttribute(
          "aria-label",
          `Open ${project.city} projects`
        );

        /*
        Marker HTML
        */

        markerElement.innerHTML = `
          <span class="project-marker-pulse"></span>
          <span class="project-marker-ring"></span>
          <span class="project-marker-dot"></span>
        `;

        /*
        -----------------------------------------------
        Click marker
        -----------------------------------------------
        */

        markerElement.addEventListener(
          "click",
          (event) => {
            event.stopPropagation();

            console.log(
              "Selected project:",
              project.city
            );

            /*
            Open panel
            */

            setSelectedLocation(project);

            /*
            Cinematic zoom
            */

            map.flyTo({
              center: [
                project.lng,
                project.lat,
              ],

              zoom:
                project.id === "london"
                  ? 11
                  : 12.5,

              pitch: 55,

              bearing: -18,

              duration: 1800,

              essential: true,
            });
          }
        );

        /*
        -----------------------------------------------
        Add marker at EXACT coordinates
        -----------------------------------------------
        */

        new maptilersdk.Marker({
          element: markerElement,

          anchor: "center",
        })
          .setLngLat([
            project.lng,
            project.lat,
          ])
          .addTo(map);
      });
    });

    /*
    =====================================================
    CLEANUP
    =====================================================
    */

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  /*
  =====================================================
  RESET MAP
  =====================================================
  */

  const resetMap = () => {
    setSelectedLocation(null);

    if (!mapRef.current) return;

    mapRef.current.flyTo({
      center: [55, 25],

      zoom: 2.7,

      pitch: 35,

      bearing: 0,

      duration: 1500,

      essential: true,
    });
  };

  /*
  =====================================================
  RENDER
  =====================================================
  */

  return (
    <section className="world-map-page">

      {/* =================================================
          MAP
      ================================================= */}

      <div
        ref={mapContainerRef}
        className="world-map"
      />

      {/* =================================================
          DARK CINEMATIC OVERLAY
      ================================================= */}

      <div className="map-dark-overlay" />

      {/* =================================================
          TOP LEFT BRAND
      ================================================= */}

      <div className="world-brand">
        <div>
          B R A I N W I N G
        </div>

        <small>
          I N N O V A T I O N
        </small>
      </div>

      {/* =================================================
          TOP CENTER
      ================================================= */}

      <div className="world-heading">
        G L O B A L&nbsp;&nbsp; P R O J E C T S
      </div>

      {/* =================================================
          HAMBURGER
      ================================================= */}

      <div className="world-menu">
        <span />
        <span />
        <span />
      </div>

      {/* =================================================
          BOTTOM LEFT
      ================================================= */}

      <div className="world-bottom">

        <small>
          03
        </small>

        <h1>
          WORLDWIDE
        </h1>

        <p>
          OUR WORK ACROSS THE WORLD
        </p>

      </div>

      {/* =================================================
          BOTTOM RIGHT
      ================================================= */}

      {!selectedLocation && (
        <div className="map-instruction">
          CLICK A LOCATION TO EXPLORE
        </div>
      )}

      {/* =================================================
          LOCATION PANEL
      ================================================= */}

      {selectedLocation && (
        <aside className="location-panel">

          {/* Close */}

          <button
            className="location-close"
            onClick={resetMap}
            aria-label="Close location"
          >
            ×
          </button>

          {/* Small heading */}

          <div className="panel-kicker">
            PROJECT LOCATION
          </div>

          {/* City */}

          <h2>
            {selectedLocation.city}
          </h2>

          {/* Country */}

          <div className="panel-country">
            {selectedLocation.country}
          </div>

          <div className="panel-divider" />

          {/* Services */}

          <div className="panel-section-title">
            BRAINWING SERVICES
          </div>

          <div className="service-list">

            {selectedLocation.services?.map(
              (service, index) => (
                <div
                  className="service-item"
                  key={service}
                >

                  <span>
                    {String(index + 1).padStart(
                      2,
                      "0"
                    )}
                  </span>

                  <p>
                    {service}
                  </p>

                </div>
              )
            )}

          </div>

          {/* Project button */}

          <button
            className="project-button"
            onClick={() => {
              console.log(
                "Projects:",
                selectedLocation.city
              );
            }}
          >
            VIEW PROJECTS

            <span>
              →
            </span>
          </button>

        </aside>
      )}

    </section>
  );
}

export default WorldMap;