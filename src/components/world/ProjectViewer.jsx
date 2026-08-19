import { memo } from "react";
import "./ProjectViewer.css";

function ProjectViewer({
  item,
  location,
  onClose,
}) {
  if (!item) return null;

  const projectUrl =
    item.url;

  return (
    <div className="project-viewer">

      {/* =========================================
          TOP BAR
      ========================================= */}

      <header className="project-viewer-header">

        {/* BACK TO MAP */}

        <button
          type="button"
          className="project-viewer-back"
          onClick={onClose}
        >
          <span className="project-viewer-back-icon">
            ←
          </span>

          <span>
            BACK TO MAP
          </span>
        </button>


        {/* PROJECT TITLE */}

        <div className="project-viewer-title">

          <span>
            {location?.city}
          </span>

          <strong>
            {item.name}
          </strong>

        </div>


        {/* OPEN LIVE */}

        {projectUrl && (
          <a
            href={projectUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="project-viewer-live"
          >
            OPEN LIVE ↗
          </a>
        )}

      </header>


      {/* =========================================
          PROJECT WEBSITE
      ========================================= */}

      <main className="project-viewer-content">

        {projectUrl ? (
          <iframe
            title={
              item.name ||
              "BrainWing Project"
            }

            src={projectUrl}

            className="project-viewer-frame"

            allow="fullscreen"

            loading="eager"
          />
        ) : (
          <div className="project-viewer-no-link">

            <div>
              PROJECT LINK
              UNAVAILABLE
            </div>

          </div>
        )}

      </main>

    </div>
  );
}

export default memo(
  ProjectViewer
);