import { Suspense, lazy } from "react";

import LadyScroll from "../components/Lady/LadyScroll";

const WorldMap = lazy(() => import("./WorldMap"));

function Home() {
  return (
    <main>
      {/* PAGE 2 — CINEMATIC LADY VIDEO */}
      <LadyScroll />

      {/* PAGE 3 — 3D GLOBAL MAP */}
      <div id="world-map-section">
        <Suspense fallback={null}>
          <WorldMap />
        </Suspense>
      </div>
    </main>
  );
}

export default Home;