<<<<<<< Updated upstream
import { useEffect } from "react";
=======
import { useEffect, useRef, useState } from "react";
>>>>>>> Stashed changes
import "./Preloader.css";

function Preloader({ onComplete }) {
  useEffect(() => {
<<<<<<< Updated upstream
    const timer = setTimeout(() => {
      onComplete();
    }, 5000);
=======
    const video = videoRef.current;

    if (!video) return;

    const updateProgress = () => {
      if (!video.duration || !isFinite(video.duration)) {
        setProgress(20);
        return;
      }

      if (video.buffered.length > 0) {
        const bufferedEnd =
          video.buffered.end(
            video.buffered.length - 1
          );

        const percent =
          (bufferedEnd / video.duration) * 100;

        setProgress(
          Math.min(Math.round(percent), 100)
        );
      }
    };

    const handleLoadedMetadata = () => {
      setProgress(30);
    };

    const handleCanPlay = () => {
      setProgress(100);
      setLoaded(true);
    };

    const handleError = () => {
      console.error(
        "Cinematic video failed to load."
      );

      // Don't trap the user on the preloader.
      setProgress(100);
      setLoaded(true);
    };

    video.addEventListener(
      "progress",
      updateProgress
    );

    video.addEventListener(
      "loadedmetadata",
      handleLoadedMetadata
    );

    video.addEventListener(
      "canplaythrough",
      handleCanPlay
    );

    video.addEventListener(
      "error",
      handleError
    );

    video.load();

    const interval = setInterval(
      updateProgress,
      200
    );

    return () => {
      clearInterval(interval);

      video.removeEventListener(
        "progress",
        updateProgress
      );

      video.removeEventListener(
        "loadedmetadata",
        handleLoadedMetadata
      );

      video.removeEventListener(
        "canplaythrough",
        handleCanPlay
      );

      video.removeEventListener(
        "error",
        handleError
      );
    };
  }, []);

  useEffect(() => {
    if (!loaded) return;

    const timer = setTimeout(() => {
      onComplete();
    }, 900);
>>>>>>> Stashed changes

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
<<<<<<< Updated upstream
    <div className="preloader">
      <div className="preloader-tagline">WE INNOVATE SOME CRAZY STUFF</div>

      <div className="preloader-brand-wrap">
        <div className="preloader-glow" />
        <div className="preloader-brand">BRAINWING</div>
      </div>
=======
    <div
      className={`preloader ${
        loaded ? "preloader-loaded" : ""
      }`}
    >

      {/* Hidden preload video */}
      <video
        ref={videoRef}
        className="preloader-video"
        src="/videos/cinematic_lady.mp4"
        preload="auto"
        muted
        playsInline
      />

      {/* Small top text */}
      <div className="preloader-top">
        <span>—</span>

        <span>
          BRAINWING INNOVATION
        </span>
      </div>

      {/* Center */}
      <div className="preloader-center">

        <div className="preloader-mark">
          B
        </div>

        <div className="preloader-brand">
          BRAINWING
        </div>

        <div className="preloader-sub">
          INNOVATION
        </div>

      </div>

      {/* Bottom */}
      <div className="preloader-bottom">

        <div className="preloader-status">
          <span>
            {loaded
              ? "EXPERIENCE READY"
              : "LOADING CINEMATIC EXPERIENCE"}
          </span>

          <span>
            {progress}%
          </span>
        </div>

        <div className="preloader-progress">
          <div
            style={{
              width: `${progress}%`,
            }}
          />
        </div>

      </div>

>>>>>>> Stashed changes
    </div>
  );
}

<<<<<<< Updated upstream
export default Preloader;
=======
export default Preloader; 
// import { useEffect, useRef, useState } from "react";
// import "./Preloader.css";

// function Preloader({ onComplete }) {
//   const videoRef = useRef(null);

//   const [progress, setProgress] = useState(0);
//   const [loaded, setLoaded] = useState(false);

//   useEffect(() => {
//     const video = videoRef.current;

//     if (!video) return;

//     const updateProgress = () => {
//       if (!video.duration || !isFinite(video.duration)) {
//         setProgress((prev) => Math.max(prev, 10));
//         return;
//       }

//       if (video.buffered.length > 0) {
//         const bufferedEnd = video.buffered.end(
//           video.buffered.length - 1
//         );

//         const percent =
//           (bufferedEnd / video.duration) * 100;

//         setProgress(
//           Math.min(Math.round(percent), 100)
//         );
//       }
//     };

//     const handleMetadata = () => {
//       setProgress(20);
//     };

//     const handleCanPlay = () => {
//       setProgress(100);
//       setLoaded(true);
//     };

//     const handleError = () => {
//       console.error(
//         "Cinematic video failed to load."
//       );

//       setProgress(100);
//       setLoaded(true);
//     };

//     video.addEventListener(
//       "progress",
//       updateProgress
//     );

//     video.addEventListener(
//       "loadedmetadata",
//       handleMetadata
//     );

//     video.addEventListener(
//       "canplaythrough",
//       handleCanPlay
//     );

//     video.addEventListener(
//       "error",
//       handleError
//     );

//     video.load();

//     const interval = setInterval(
//       updateProgress,
//       200
//     );

//     return () => {
//       clearInterval(interval);

//       video.removeEventListener(
//         "progress",
//         updateProgress
//       );

//       video.removeEventListener(
//         "loadedmetadata",
//         handleMetadata
//       );

//       video.removeEventListener(
//         "canplaythrough",
//         handleCanPlay
//       );

//       video.removeEventListener(
//         "error",
//         handleError
//       );
//     };
//   }, []);

//   useEffect(() => {
//     if (!loaded) return;

//     const timer = setTimeout(() => {
//       onComplete();
//     }, 700);

//     return () => clearTimeout(timer);
//   }, [loaded, onComplete]);

//   return (
//     <div className="preloader">

//       {/* Hidden video used only for preloading */}
//       <video
//         ref={videoRef}
//         src="/videos/cinematic-lady.mp4"
//         preload="auto"
//         muted
//         playsInline
//       />

//       {/* Top left */}
//       <div className="loader-top">
//         <span className="loader-dash">—</span>

//         <span>
//           DIGITAL EXPERIENCE
//         </span>
//       </div>

//       {/* Center loader */}
//       <div className="loader-center">

//         <div className="loader-ring">
//           <div className="loader-ring-inner">
//             {progress}
//           </div>
//         </div>

//         <div className="loader-title">
//           LOADING
//         </div>

//         <div className="loader-subtitle">
//           PREPARING EXPERIENCE
//         </div>

//       </div>

//       {/* Bottom */}
//       <div className="loader-bottom">

//         <div className="loader-status">
//           <span>
//             {loaded
//               ? "READY"
//               : "INITIALIZING"}
//           </span>

//           <span>
//             {String(progress).padStart(3, "0")}%
//           </span>
//         </div>

//         <div className="loader-line">
//           <div
//             style={{
//               width: `${progress}%`,
//             }}
//           />
//         </div>

//       </div>

//     </div>
//   );
// }

// export default Preloader;
>>>>>>> Stashed changes
