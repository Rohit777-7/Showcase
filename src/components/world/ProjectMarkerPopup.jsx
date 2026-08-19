import { memo } from "react";
import "./ProjectMarkerPopup.css";

function ProjectMarkerPopup({
  project,
  onOpenProject,
}) {
  if (!project) return null;

  /*
  =====================================================
  YOUR projects.js USES `items`
  =====================================================
  */

  const projectItems =
    project.items?.length
      ? project.items
      : [];


  return (
    <div
      className="project-marker-popup"
      onClick={(event) => {
        event.stopPropagation();
      }}
    >

      {/* =========================================
          HEADER
      ========================================= */}

      <div className="project-popup-kicker">
        BRAINWING PROJECT
      </div>


      <div className="project-popup-location">
        {project.city}
      </div>


      {/* =========================================
          PROJECTS
      ========================================= */}

      <div className="project-popup-list">

        {projectItems.length > 0 ? (

          projectItems.map(
            (item, index) => (
              <button
                key={`${project.id}-${index}`}
                type="button"
                className="project-popup-item"
                onClick={(event) => {
                  event.stopPropagation();

                  onOpenProject?.(
                    item
                  );
                }}
              >

                <span className="project-popup-number">
                  {String(
                    index + 1
                  ).padStart(
                    2,
                    "0"
                  )}
                </span>


                <span className="project-popup-name">

                  {item.name}

                </span>


                <span className="project-popup-arrow">
                  ↗
                </span>

              </button>
            )
          )

        ) : (

          <div className="project-popup-empty">
            No projects available
          </div>

        )}

      </div>


      {/* =========================================
          FOOTER
      ========================================= */}

      <div className="project-popup-footer">
        SELECT PROJECT TO EXPLORE
      </div>

    </div>
  );
}

export default memo(
  ProjectMarkerPopup
);