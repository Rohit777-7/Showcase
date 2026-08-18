import { memo, useEffect, useRef, useState } from "react";
import gsap from "gsap";

/*
=====================================================
LOCATION PANEL — glassmorphism side panel

Stays mounted through the exit animation (the panel
slides itself out with GSAP before the DOM node is
actually removed), so it never flashes empty content
while closing.
=====================================================
*/

const REVEAL_DELAY = 1.05;

function formatCoordinate(lat, lng) {
  const latDir = lat >= 0 ? "N" : "S";
  const lngDir = lng >= 0 ? "E" : "W";

  return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lng).toFixed(
    4
  )}° ${lngDir}`;
}

function LocationPanel({ location, onClose }) {
  const panelRef = useRef(null);
  const [displayLocation, setDisplayLocation] = useState(location);
  const [prevLocation, setPrevLocation] = useState(location);

  // Adjust displayed content during render when a new location
  // arrives, so the panel never shows stale content while it
  // slides in (React's documented pattern for state derived from
  // a changing prop — plain state, not a ref, so it's safe to
  // read/write during render).
  if (location !== prevLocation) {
    setPrevLocation(location);

    if (location) {
      setDisplayLocation(location);
    }
  }

  useEffect(() => {
    const panel = panelRef.current;

    if (!panel) return;

    if (location) {
      gsap.fromTo(
        panel,
        { xPercent: 105, opacity: 0 },
        {
          xPercent: 0,
          opacity: 1,
          duration: 0.9,
          ease: "power4.out",
          delay: REVEAL_DELAY,
        }
      );

      return;
    }

    if (!displayLocation) return;

    gsap.to(panel, {
      xPercent: 105,
      opacity: 0,
      duration: 0.55,
      ease: "power3.in",
      onComplete: () => setDisplayLocation(null),
    });
    // displayLocation intentionally omitted: this exit tween
    // should only re-run when `location` itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  if (!displayLocation) return null;

  return (
    <aside ref={panelRef} className="map-project-panel">
      <button
        className="panel-close"
        onClick={onClose}
        aria-label="Close location"
      >
        ×
      </button>

      <div className="panel-kicker">PROJECT LOCATION</div>

      <h2>{displayLocation.city}</h2>

      <p className="panel-country">
        {(displayLocation.region ?? displayLocation.country).toUpperCase()}
      </p>

      <p className="panel-coordinates">
        {formatCoordinate(displayLocation.lat, displayLocation.lng)}
      </p>

      <div className="panel-line" />

      <div className="panel-services-title">BRAINWING SERVICES</div>

      <div className="panel-services">
        {displayLocation.services?.map((service, index) => (
          <div className="panel-service" key={service}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <p>{service}</p>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="panel-media"
        aria-label={`Preview ${displayLocation.city} projects`}
        onClick={() => console.log("Preview:", displayLocation.city)}
      >
        <span className="panel-media-glow" />

        <span className="panel-media-play">
          <svg width="16" height="18" viewBox="0 0 16 18" fill="none">
            <path d="M1 1.5v15l14-7.5-14-7.5Z" fill="currentColor" />
          </svg>
        </span>
      </button>

      <button
        className="view-projects-button"
        onClick={() => {
          console.log("Projects:", displayLocation.city);
        }}
      >
        <span>VIEW PROJECTS</span>
        <strong>→</strong>
      </button>
    </aside>
  );
}

export default memo(LocationPanel);
