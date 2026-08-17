import BrainwingIntro from "../components/Intro/BrainwingIntro";
import LadyScroll from "../components/Lady/LadyScroll";
import WorldMap from "./WorldMap";

function Home() {
  return (
    <main>
      {/* PAGE 1 — BRAINWING INTRO */}
     

      {/* PAGE 2 — CINEMATIC LADY VIDEO */}
      <LadyScroll />

      {/* PAGE 3 — 3D GLOBAL MAP */}
      <div id="world-map-section">
       <WorldMap />
      </div>
    </main>
  );
}

export default Home;