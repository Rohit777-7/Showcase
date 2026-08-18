import { useEffect, useRef } from "react";
import "./LadyScroll.css";

function LadyScroll() {
  const sectionRef = useRef(null);
  const videoRef = useRef(null);
  const fadeRef = useRef(null);

  const hasCompletedRef = useRef(false);
  const hasReachedMapRef = useRef(false);
  const ladyRestartedRef = useRef(false);

  const lastScrollYRef = useRef(0);

  const timeout1Ref = useRef(null);
  const timeout2Ref = useRef(null);
  const timeout3Ref = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    const section = sectionRef.current;

    if (!video || !section) return;

    // ==========================================
    // PLAY VIDEO
    // ==========================================

    const playVideo = async () => {
      try {
        video.playbackRate = 0.8;

        await video.play();
      } catch (error) {
        console.log(
          "Video autoplay error:",
          error
        );
      }
    };

    // ==========================================
    // INITIAL VIDEO
    // ==========================================

    const startInitialVideo = () => {
      video.currentTime = 0;
      video.playbackRate = 0.8;

      playVideo();
    };

    // ==========================================
    // VIDEO FINISHED
    // ==========================================

    const handleVideoEnd = () => {
      if (hasCompletedRef.current) return;

      hasCompletedRef.current = true;

      const fadeEl = fadeRef.current;

      // Small pause after final frame
      timeout1Ref.current = setTimeout(() => {
        if (fadeEl) {
          fadeEl.style.opacity = "1";
        }

        // Wait for fade
        timeout2Ref.current = setTimeout(() => {
          const worldMap =
            document.getElementById(
              "world-map-section"
            );

          if (worldMap) {
            worldMap.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }

          // Fade back in
          timeout3Ref.current = setTimeout(() => {
            if (fadeEl) {
              fadeEl.style.opacity = "0";
            }
          }, 700);
        }, 650);
      }, 400);
    };

    video.addEventListener(
      "ended",
      handleVideoEnd
    );

    // ==========================================
    // WAIT FOR VIDEO
    // ==========================================

    if (video.readyState >= 3) {
      startInitialVideo();
    } else {
      video.addEventListener(
        "canplay",
        startInitialVideo,
        {
          once: true,
        }
      );
    }

    // ==========================================
    // SCROLL DETECTION
    // ==========================================

    const handleScroll = () => {
      const currentY = window.scrollY;
      const previousY =
        lastScrollYRef.current;

      const scrollingUp =
        currentY < previousY;

      const ladyTop =
        section.offsetTop;

      const ladyBottom =
        ladyTop + section.offsetHeight;

      // ========================================
      // USER HAS REACHED MAP
      // ========================================

      if (
        currentY >= ladyBottom - 20
      ) {
        hasReachedMapRef.current = true;

        // Allow restart next time we return
        ladyRestartedRef.current = false;
      }

      // ========================================
      // MAP → LADY
      // ========================================

      const returningToLady =
        scrollingUp &&
        hasReachedMapRef.current &&
        currentY < ladyBottom - 20 &&
        !ladyRestartedRef.current;

      if (returningToLady) {
        ladyRestartedRef.current = true;

        // We are back in Lady world
        hasReachedMapRef.current = false;

        // Reset completion state
        hasCompletedRef.current = false;

        // Remove any fade
        if (fadeRef.current) {
          fadeRef.current.style.opacity = "0";
        }

        // ======================================
        // RESTART LADY VIDEO
        // ======================================

        video.pause();

        video.currentTime = 0;

        video.playbackRate = 0.8;

        playVideo();
      }

      lastScrollYRef.current =
        currentY;
    };

    // Initial scroll position
    lastScrollYRef.current =
      window.scrollY;

    window.addEventListener(
      "scroll",
      handleScroll,
      {
        passive: true,
      }
    );

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
        startInitialVideo
      );

      window.removeEventListener(
        "scroll",
        handleScroll
      );

      if (timeout1Ref.current) {
        clearTimeout(timeout1Ref.current);
      }

      if (timeout2Ref.current) {
        clearTimeout(timeout2Ref.current);
      }

      if (timeout3Ref.current) {
        clearTimeout(timeout3Ref.current);
      };
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
            SIDE INFORMATION
        ====================================== */}

        <div className="lady-side-info">
        </div>

        {/* =====================================
            FADE TO BLACK
        ====================================== */}

        <div
          ref={fadeRef}
          className="lady-fade-out"
        />

      </div>
    </section>
  );
}

export default LadyScroll;