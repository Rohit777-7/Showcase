import { useEffect, useRef } from "react";
import gsap from "gsap";

function ProjectPanel({
  location,
  onClose,
}) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!location) return;

    gsap.fromTo(
      panelRef.current,
      {
        opacity: 0,
        x: 80,
      },
      {
        opacity: 1,
        x: 0,
        duration: 0.7,
        ease: "power3.out",
      }
    );
  }, [location]);

  if (!location) {
    return null;
  }

  return (
    <aside
      ref={panelRef}
      className="project-panel"
    >
      <button
        className="project-close"
        onClick={onClose}
      >
        ×
      </button>

      <div className="project-location">
        GLOBAL PROJECT
      </div>

      <h2>
        {location.city}
      </h2>

      <div className="project-country">
        {location.country}
      </div>

      <div className="project-count">
        {String(
          location.projects.length
        ).padStart(2, "0")}{" "}
        PROJECTS
      </div>

      <div className="project-list">
        {location.projects.map(
          (project, index) => (
            <div
              className="project-item"
              key={project.name}
            >
              <div className="project-number">
                {String(
                  index + 1
                ).padStart(2, "0")}
              </div>

              <div className="project-content">
                <h3>
                  {project.name}
                </h3>

                <span>
                  {project.category}
                </span>

                <p>
                  {project.description}
                </p>

                <a
                  href={project.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  VIEW PROJECT
                  <span> →</span>
                </a>
              </div>
            </div>
          )
        )}
      </div>
    </aside>
  );
}

export default ProjectPanel;