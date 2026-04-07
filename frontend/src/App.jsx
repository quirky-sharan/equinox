import { useEffect, useState, useCallback } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useAuthStore } from "./store/authStore";
import { useThemeStore } from "./store/themeStore";
import { authApi } from "./api/endpoints";
import Navbar from "./components/Navbar";
import FluidCursor from "./components/FluidCursor";
import ParticleBackground from "./components/ParticleBackground";
import SplashScreen from "./components/SplashScreen";
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
import SupportPage from "./pages/SupportPage";
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
  const [appReady, setAppReady] = useState(false);

  const handleSplashFinished = useCallback(() => {
    setAppReady(true);
  }, []);

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

  const isTouchDevice = !window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  // Show splash screen until all assets are preloaded
  if (!appReady) {
    return <SplashScreen onFinished={handleSplashFinished} />;
  }

  return (
    <div className="app-layout">
      <ParticleBackground />
      {!isTouchDevice && <FluidCursor />}
      <Navbar />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 30, filter: "blur(12px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -30, filter: "blur(12px)", scale: 0.98 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
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
            <Route path="/support" element={<SupportPage />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
      {!["/interview", "/find-doctors", "/support"].includes(location.pathname) && <Footer />}
    </div>
  );
}
