import { useEffect, lazy, Suspense } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAuthStore } from "./store/authStore";
import { useThemeStore } from "./store/themeStore";
import { authApi } from "./api/endpoints";
import Navbar from "./components/Navbar";
import FluidCursor from "./components/FluidCursor";
const ParticleBackground = lazy(() => import("./components/ParticleBackground"));
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import InterviewPage from "./pages/InterviewPage";
import ResultPage from "./pages/ResultPage";
import HistoryPage from "./pages/HistoryPage";
import PopulationPage from "./pages/PopulationPage";
import ProfilePage from "./pages/ProfilePage";
import LandingPage from "./pages/LandingPage";
import FindDoctorsPage from "./pages/FindDoctorsPage";
import ContactPage from "./pages/ContactPage";
import Footer from "./components/Footer";

function PrivateRoute({ children }) {
  const token = useAuthStore((s) => s.token);
  return token ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const token = useAuthStore((s) => s.token);
  return !token ? children : <Navigate to="/dashboard" replace />;
}

export default function App() {
  const { token, setUser, logout } = useAuthStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (token) {
      authApi.getMe().then(r => setUser(r.data)).catch(err => {
        if (err.response?.status === 401) logout();
      });
    }
  }, [token, setUser, logout]);

  const location = useLocation();

  return (
    <div className="app-layout">
      <Suspense fallback={null}>
        <ParticleBackground />
      </Suspense>
      <FluidCursor />
      <Navbar />
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, scale: 0.99 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.01 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          style={{ flex: 1, display: "flex", flexDirection: "column" }}
        >
          <Routes location={location}>
            <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
            <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
            <Route path="/interview" element={<PrivateRoute><InterviewPage /></PrivateRoute>} />
            <Route path="/result/:sessionId" element={<PrivateRoute><ResultPage /></PrivateRoute>} />
            <Route path="/history" element={<PrivateRoute><HistoryPage /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
            <Route path="/population" element={<PopulationPage />} />
            <Route path="/find-doctors" element={<PrivateRoute><FindDoctorsPage /></PrivateRoute>} />
            <Route path="/contact" element={<ContactPage />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
      {!["/interview", "/find-doctors"].includes(location.pathname) && <Footer />}
    </div>
  );
}
