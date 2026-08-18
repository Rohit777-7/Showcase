import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Preloader from "./components/Preloader/Preloader";
import Home from "./pages/Home";

function App() {
  const [loading, setLoading] = useState(true);

  // ==========================================
  // ALWAYS START FROM TOP ON REFRESH
  // ==========================================

  useEffect(() => {
    // Tell browser NOT to restore previous
    // scroll position after refresh.
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    const resetScroll = () => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "instant",
      });
    };

    // Reset immediately
    resetScroll();

    // Reset again after browser layout
    requestAnimationFrame(() => {
      resetScroll();
    });
  }, []);

  // ==========================================
  // PRELOADER COMPLETE
  // ==========================================

  const handlePreloaderComplete = useCallback(() => {
    setLoading(false);

    // Make sure the main experience starts
    // from the very beginning.
    requestAnimationFrame(() => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "instant",
      });
    });
  }, []);

  return (
    <BrowserRouter>
      {/* PRELOADER */}
      {loading && (
        <Preloader
          onComplete={handlePreloaderComplete}
        />
      )}

      {/* MAIN EXPERIENCE */}
      <Routes>
        <Route
          path="/"
          element={<Home />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;