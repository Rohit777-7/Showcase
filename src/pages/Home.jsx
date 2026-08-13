// import BrainwingIntro from "../components/Intro/BrainwingIntro";

// function Home() {
//   return (
//     <main>
//       <BrainwingIntro />

//       {/* 
//         TEMPORARY NEXT SECTION

//         Later this will become your lady video experience.
//       */}
//       <section
//         style={{
//           height: "100vh",
//           background: "#050505",
//           display: "flex",
//           alignItems: "center",
//           justifyContent: "center",
//           color: "white",
//           fontFamily: "Arial, sans-serif",
//           letterSpacing: "4px",
//         }}
//       >
//         PAGE 2 — LADY VIDEO EXPERIENCE
//       </section>
//     </main>
//   );
// }

// export default Home;

import BrainwingIntro from "../components/Intro/BrainwingIntro";
import LadyScroll from "../components/Lady/LadyScroll";

function Home() {
  return (
    <main>
      {/* PAGE 1 — BRAINWING INTRO */}
      <BrainwingIntro />

      {/* PAGE 2 — CINEMATIC LADY VIDEO */}
      <LadyScroll />

      {/* PAGE 3 — GLOBAL MAP */}
      <section
        style={{
          height: "100vh",
          background: "#000",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Arial, sans-serif",
          letterSpacing: "5px",
          fontSize: "14px",
        }}
      >
        GLOBAL MAP
      </section>
    </main>
  );
}

export default Home;