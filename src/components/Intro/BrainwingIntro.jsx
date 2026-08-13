import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import "../../styles/intro.css";

gsap.registerPlugin(ScrollTrigger);

function BrainwingIntro() {
  const sectionRef = useRef(null);
  const logoRef = useRef(null);
  const logoMarkRef = useRef(null);
  const beamRef = useRef(null);
  const floorRef = useRef(null);
  const scrollTextRef = useRef(null);
  const scrollMouseRef = useRef(null);
  const topLeftRef = useRef(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1.2,
          pin: true,
        },
      });

      timeline
        // Logo moves toward viewer
        .to(
          logoRef.current,
          {
            scale: 1.8,
            y: -40,
            opacity: 0,
            ease: "power2.inOut",
          },
          0
        )

        // Logo mark disappears slightly later
        .to(
          logoMarkRef.current,
          {
            scale: 2.2,
            opacity: 0,
            ease: "power2.inOut",
          },
          0.05
        )

        // Light becomes stronger
        .to(
          beamRef.current,
          {
            opacity: 1,
            scale: 2.5,
            ease: "power2.inOut",
          },
          0
        )

        // Floor light expands
        .to(
          floorRef.current,
          {
            scaleX: 2.5,
            opacity: 0.9,
            ease: "power2.inOut",
          },
          0.1
        )

        // Scroll instruction disappears
        .to(
          scrollTextRef.current,
          {
            opacity: 0,
            y: 50,
            ease: "power2.out",
          },
          0
        )

        .to(
          scrollMouseRef.current,
          {
            opacity: 0,
            y: 50,
            ease: "power2.out",
          },
          0
        )

        // Top text disappears
        .to(
          topLeftRef.current,
          {
            opacity: 0,
            y: -20,
          },
          0
        );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="brainwing-intro"
    >
      {/* Cinematic background */}
      <div className="intro-background" />

      {/* Top left */}
      <div
        ref={topLeftRef}
        className="intro-top-left"
      >
        <span className="intro-dash">—</span>

        <span>
          CRAFTING DIGITAL EXPERIENCES
        </span>
      </div>

      {/* Hamburger */}
      <div className="intro-menu">
        <span />
        <span />
        <span />
      </div>

      {/* Main light beam */}
      <div
        ref={beamRef}
        className="intro-light-beam"
      />

      {/* Logo */}
      <div
        ref={logoRef}
        className="intro-logo"
      >
        <div
          ref={logoMarkRef}
          className="intro-logo-mark"
        >
          B
        </div>

        <div className="intro-brand">
          BRAINWING
        </div>

        <div className="intro-subbrand">
          INNOVATION
        </div>
      </div>

      {/* Floor */}
      <div
        ref={floorRef}
        className="intro-floor"
      />

      {/* Horizon light */}
      <div className="intro-horizon" />

      {/* Scroll instruction */}
      <div
        ref={scrollTextRef}
        className="intro-scroll-text"
      >
        S C R O L L &nbsp; T O &nbsp; E X P L O R E
      </div>

      {/* Mouse */}
      <div
        ref={scrollMouseRef}
        className="intro-scroll-wrapper"
      >
        <div className="intro-mouse">
          <div className="intro-mouse-dot" />
          <div className="intro-mouse-dot second" />
        </div>

        <div className="intro-scroll-line" />
      </div>
    </section>
  );
}

export default BrainwingIntro;