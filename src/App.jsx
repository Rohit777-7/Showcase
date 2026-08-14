import { useCallback, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Preloader from "./components/Preloader/Preloader";
import Home from "./pages/Home";

function App() {
  const [loading, setLoading] = useState(true);

  const handlePreloaderComplete = useCallback(() => {
    setLoading(false);

    // Always start the experience from the top
    window.scrollTo(0, 0);
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