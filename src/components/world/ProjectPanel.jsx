function ProjectPanel({
  project,
  onClose,
  onOpen,
}) {
  if (!project) return null;

  return (
    <div
      style={{
        position: "absolute",

        right: "35px",
        bottom: "35px",

        width: "300px",

        padding: "24px",

        background:
          "rgba(3,7,12,0.88)",

        backdropFilter:
          "blur(20px)",

        border:
          "1px solid rgba(255,255,255,0.12)",

        color: "white",

        zIndex: 30,
      }}
    >
      <div
        style={{
          fontSize: "9px",
          letterSpacing: "3px",
          opacity: 0.45,
        }}
      >
        LOCATION
      </div>

      <h2
        style={{
          margin: "8px 0",
          fontSize: "28px",
          fontWeight: 300,
          letterSpacing: "2px",
        }}
      >
        {project.city}
      </h2>

      <p
        style={{
          fontSize: "12px",
          lineHeight: 1.6,
          opacity: 0.65,
        }}
      >
        {project.description}
      </p>

      <button
        onClick={onOpen}
        style={{
          marginTop: "15px",
          padding: "12px 18px",

          background: "white",
          color: "black",

          border: "none",

          cursor: "pointer",

          letterSpacing: "2px",
          fontSize: "10px",
        }}
      >
        VIEW PROJECT →
      </button>

      <button
        onClick={onClose}
        style={{
          marginLeft: "8px",

          padding: "12px 18px",

          background:
            "transparent",

          color: "white",

          border:
            "1px solid rgba(255,255,255,0.2)",

          cursor: "pointer",

          fontSize: "10px",
        }}
      >
        CLOSE
      </button>
    </div>
  );
}

export default ProjectPanel;