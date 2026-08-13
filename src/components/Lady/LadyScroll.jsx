import { useEffect, useRef } from "react";
import "./LadyScroll.css";

function LadyScroll() {
  const sectionRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    const section = sectionRef.current;

    if (!video || !section) return;

    video.pause();
    video.currentTime = 0;

    const handleScroll = () => {
      const rect = section.getBoundingClientRect();

      const scrollDistance =
        section.offsetHeight - window.innerHeight;

      const scrolled = Math.min(
        Math.max(-rect.top, 0),
        scrollDistance
      );

      const progress =
        scrollDistance > 0
          ? scrolled / scrollDistance
          : 0;

      if (video.duration) {
        video.currentTime =
          progress * video.duration;
      }
    };

    const handleLoadedMetadata = () => {
      handleScroll();
    };

    video.addEventListener(
      "loadedmetadata",
      handleLoadedMetadata
    );

    window.addEventListener(
      "scroll",
      handleScroll,
      { passive: true }
    );

    handleScroll();

    return () => {
      video.removeEventListener(
        "loadedmetadata",
        handleLoadedMetadata
      );

      window.removeEventListener(
        "scroll",
        handleScroll
      );
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="lady-scroll-section"
    >
      <div className="lady-sticky">

        <video
          ref={videoRef}
          className="lady-video"
          src="/videos/cinematic_lady.mp4"
          muted
          playsInline
          preload="auto"
        />

        <div className="lady-dark-overlay" />

        <div className="lady-top">
          <span>—</span>
          <span>
            CRAFTING DIGITAL EXPERIENCES
          </span>
        </div>

        <div className="lady-menu">
          <span />
          <span />
          <span />
        </div>

        <div className="lady-side-info">

          <div className="lady-line">
            <div className="lady-dot active" />
          </div>

          <div>
            <strong>01</strong>
            <span>BACK VIEW</span>
          </div>

          <div>
            <strong>02</strong>
            <span>FRONT VIEW</span>
          </div>

          <div>
            <strong>03</strong>
            <span>SIDE ANGLE</span>
          </div>

        </div>

        <div className="lady-scroll-text">
          SCROLL TO EXPLORE

          <div className="lady-mouse">
            <div />
          </div>

          <div className="lady-scroll-line" />
        </div>

      </div>
    </section>
  );
}

export default LadyScroll;