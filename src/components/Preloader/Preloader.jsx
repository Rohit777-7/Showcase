import { useEffect } from "react";
import "./Preloader.css";

function Preloader({ onComplete }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="preloader">
      <div className="preloader-tagline">WE INNOVATE SOME CRAZY STUFF</div>

      <div className="preloader-brand-wrap">
        <div className="preloader-glow" />
        <div className="preloader-brand">BRAINWING</div>
      </div>
    </div>
  );
}

export default Preloader;
