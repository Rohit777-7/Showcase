import { memo } from "react";

/*
=====================================================
JOURNEY STEPPER — persistent bottom-center step nav,
mirrors the sidebar so the current stop is always
visible regardless of scroll position.
=====================================================
*/

function JourneyStepper({ projects, activeId, onSelect }) {
  return (
    <nav className="journey-stepper" aria-label="Journey steps">
      {projects.map((project, index) => (
        <button
          type="button"
          key={project.id}
          className={`stepper-item${
            project.id === activeId ? " is-active" : ""
          }`}
          onClick={() => onSelect(project)}
        >
          <span className="stepper-dot">
            {String(index + 1).padStart(2, "0")}
          </span>

          <span className="stepper-label">{project.city.toUpperCase()}</span>
        </button>
      ))}
    </nav>
  );
}

export default memo(JourneyStepper);
