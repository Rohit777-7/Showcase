import { useEffect, useRef } from "react";
import "./LadyScroll.css";

function LadyScroll() {
  const sectionRef = useRef(null);
  const videoRef = useRef(null);
  const fadeRef = useRef(null);
  const hasCompletedRef = useRef(false);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    // Start video from beginning
    video.currentTime = 0;

    // ==========================================
    // PLAY VIDEO AUTOMATICALLY
    // ==========================================

    const playVideo = async () => {
      try {
        video.playbackRate = 0.8;
        await video.play();
      } catch (error) {
        console.log("Video autoplay error:", error);
      }
    };

    // ==========================================
    // WHEN VIDEO COMPLETELY FINISHES
    // ==========================================

    const handleVideoEnd = () => {
      if (hasCompletedRef.current) return;

      hasCompletedRef.current = true;

      const fadeEl = fadeRef.current;

      // Small pause after final frame, then fade to black
      setTimeout(() => {
        if (fadeEl) {
          fadeEl.style.opacity = "1";
        }

        // Wait for the fade-to-black to finish before jumping
        // the scroll position, so the cut is hidden.
        setTimeout(() => {
          const worldMap =
            document.getElementById("world-map-section");

          if (worldMap) {
            worldMap.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }

          // Fade back in once we've landed on the map section
          setTimeout(() => {
            if (fadeEl) {
              fadeEl.style.opacity = "0";
            }
          }, 700);
        }, 650);
      }, 400);
    };

    video.addEventListener("ended", handleVideoEnd);

    // ==========================================
    // WAIT UNTIL VIDEO IS READY
    // ==========================================

    if (video.readyState >= 3) {
      playVideo();
    } else {
      video.addEventListener("canplay", playVideo, {
        once: true,
      });
    }

    // ==========================================
    // CLEANUP
    // ==========================================

    return () => {
      video.removeEventListener(
        "ended",
        handleVideoEnd
      );

      video.removeEventListener(
        "canplay",
        playVideo
      );
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="lady-scroll-section"
    >
      <div className="lady-sticky">

        {/* =====================================
            CINEMATIC LADY VIDEO
        ====================================== */}

        <video
          ref={videoRef}
          className="lady-video"
          src="/videos/cinematic_lady.mp4"
          muted
          playsInline
          autoPlay
          preload="auto"
        />

        {/* =====================================
            DARK OVERLAY
        ====================================== */}

        <div className="lady-dark-overlay" />

        {/* =====================================
            YOUR EXISTING SIDE INFORMATION
        ====================================== */}

        <div className="lady-side-info">
        </div>

        {/* =====================================
            FADE-TO-BLACK TRANSITION OVERLAY
            (fades in as video ends, fades out
            once the map section is in view)
        ====================================== */}

        <div
          ref={fadeRef}
          className="lady-fade-out"
        />

        {/* =====================================
            YOUR EXISTING SCROLL TEXT
        ====================================== */}
{/* 
        <div className="lady-scroll-text">
          SCROLL TO EXPLORE

          <div className="lady-mouse">
            <div />
          </div>

          <div className="lady-scroll-line" />
        </div> */}

      </div>
    </section>
  );
}

export default LadyScroll;