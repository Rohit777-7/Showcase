import { useEffect, useRef } from "react";
import "./LadyScroll.css";

function LadyScroll() {
  const sectionRef = useRef(null);
  const videoRef = useRef(null);
  const hasPlayedRef = useRef(false);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    video.pause();
    video.currentTime = 0;

    const interactionEvents = [
      "scroll",
      "wheel",
      "touchstart",
      "keydown",
      "pointerdown",
    ];

    const handleInteraction = () => {
      if (hasPlayedRef.current) return;

      hasPlayedRef.current = true;

      video.play().catch(() => {});

      interactionEvents.forEach((event) =>
        window.removeEventListener(event, handleInteraction)
      );
    };

    interactionEvents.forEach((event) =>
      window.addEventListener(event, handleInteraction, {
        passive: true,
      })
    );

    return () => {
      interactionEvents.forEach((event) =>
        window.removeEventListener(event, handleInteraction)
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

       

      

        <div className="lady-side-info">

        

         
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