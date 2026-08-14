import BrainwingIntro from "../components/Intro/BrainwingIntro";
import LadyScroll from "../components/Lady/LadyScroll";

function Home({ introReady }) {
  return (
    <main>
      {/* PAGE 1 — BRAINWING INTRO */}

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