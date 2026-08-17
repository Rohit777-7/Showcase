/*
=====================================================
JOURNEY SIDEBAR — persistent left-hand list of every
stop on the route, generated straight from projects.js.
=====================================================
*/

function JourneySidebar({ projects, activeId, onSelect }) {
  const totalProjects = projects.reduce(
    (sum, project) => sum + (project.projectCount ?? 0),
    0
  );

  return (
    <aside className="journey-sidebar">
      <div className="journey-sidebar-header">
        <div className="journey-sidebar-title">PROJECT JOURNEY</div>

        <div className="journey-sidebar-meta">
          {String(projects.length).padStart(2, "0")} Locations
          <span className="journey-meta-dot">•</span>
          {totalProjects}+ Projects
        </div>
      </div>

      <ol className="journey-list">
        {projects.map((project, index) => {
          const isActive = project.id === activeId;

          return (
            <li
              className={`journey-item${isActive ? " is-active" : ""}`}
              key={project.id}
            >
              <button type="button" onClick={() => onSelect(project)}>
                <span className="journey-index">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <span className="journey-row">
                  <span className="journey-thumb" aria-hidden="true">
                    {project.city.charAt(0)}
                  </span>

                  <span className="journey-text">
                    <strong>{project.city}</strong>
                    <small>{project.country}</small>
                    <em>
                      {project.projectCount ?? 0} Project
                      {project.projectCount === 1 ? "" : "s"}
                    </em>
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <button
        type="button"
        className="journey-view-all"
        onClick={() => console.log("View all projects")}
      >
        <span>VIEW ALL PROJECTS</span>
        <strong>→</strong>
      </button>
    </aside>
  );
}

export default JourneySidebar;
