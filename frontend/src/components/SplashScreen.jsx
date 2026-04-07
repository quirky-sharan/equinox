import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cat, Activity } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { useSessionStore } from "../store/sessionStore";

const PRELOAD_MODULES = [
  () => import("../components/ParticleBackground"),
  () => import("../pages/InterviewPage"),
  () => import("../pages/DashboardPage"),
  () => import("../pages/ResultPage"),
  () => import("../pages/LandingPage"),
  () => import("../pages/FindDoctorsPage"),
  () => import("../pages/LoginPage"),
  () => import("../pages/RegisterPage"),
  () => import("../pages/HistoryPage"),
  () => import("../pages/ProfilePage"),
  () => import("../pages/PopulationPage"),
  () => import("../pages/ContactPage"),
];

// Preload Google Fonts
const FONT_URLS = [
  "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600&display=swap",
];

export default function SplashScreen({ onFinished }) {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Initializing core systems…");
  const [exiting, setExiting] = useState(false);
  const startTime = useRef(Date.now());

  useEffect(() => {
    let cancelled = false;
    const MIN_DISPLAY_MS = 2800; // Minimum splash display for polish

    async function preload() {
      const totalTasks = PRELOAD_MODULES.length + FONT_URLS.length + 1; // +1 for final step
      let completed = 0;

      const statusMessages = [
        "Loading neural inference modules…",
        "Warming up clinical engine…",
        "Initializing particle systems…",
        "Preparing diagnostic pipelines…",
        "Calibrating Bayesian networks…",
        "Loading interaction models…",
        "Syncing behavioral capture…",
        "Preparing visualization layers…",
        "Loading interview protocols…",
        "Initializing voice synthesis…",
        "Loading risk assessment models…",
        "Final system checks…",
      ];

      // Preload fonts
      for (const url of FONT_URLS) {
        try {
          const link = document.createElement("link");
          link.rel = "preload";
          link.as = "style";
          link.href = url;
          document.head.appendChild(link);
        } catch (_) {
          // Non-critical
        }
        completed++;
        if (!cancelled) {
          setProgress(Math.round((completed / totalTasks) * 100));
          setStatusText(statusMessages[completed % statusMessages.length]);
        }
      }

      // Preload all modules in parallel batches
      const batchSize = 3;
      for (let i = 0; i < PRELOAD_MODULES.length; i += batchSize) {
        const batch = PRELOAD_MODULES.slice(i, i + batchSize);
        await Promise.allSettled(batch.map((fn) => fn()));
        completed += batch.length;
        if (!cancelled) {
          const pct = Math.round((completed / totalTasks) * 95);
          setProgress(pct);
          setStatusText(
            statusMessages[Math.min(completed, statusMessages.length - 1)]
          );
        }
        // Small delay between batches for smooth progress animation
        await new Promise((r) => setTimeout(r, 120));
      }

      // Preload the ML health check (warm up backend connection)
      try {
        const mlUrl = import.meta.env.VITE_ML_URL || "http://localhost:8001";
        fetch(`${mlUrl}/health`, { mode: "cors" }).catch(() => {});
      } catch (_) {}

      // Preload API health
      try {
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8005/api";
        fetch(`${apiUrl}/../health`, { mode: "cors" }).catch(() => {});
      } catch (_) {}

      // If user is authenticated, preload the clinical session in advance
      if (!cancelled) {
        const token = useAuthStore.getState().token;
        if (token) {
           setProgress(98);
           setStatusText("Initializing clinical session…");
           try {
             await useSessionStore.getState().preloadSession();
           } catch (e) {
             // Non-critical if it fails here, InterviewPage will handle failure/retry
           }
        }
      }

      if (!cancelled) {
        setProgress(100);
        setStatusText("Systems online. Ready to deploy.");
      }

      // Ensure minimum display time for smooth UX
      const elapsed = Date.now() - startTime.current;
      const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);
      await new Promise((r) => setTimeout(r, remaining));

      if (!cancelled) {
        setExiting(true);
        // Wait for exit animation
        setTimeout(() => {
          if (!cancelled) onFinished();
        }, 800);
      }
    }

    preload();
    return () => {
      cancelled = true;
    };
  }, [onFinished]);

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05, filter: "blur(20px)" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="splash-screen"
        >
          {/* Ambient glow effects */}
          <div className="splash-glow splash-glow-1" />
          <div className="splash-glow splash-glow-2" />
          <div className="splash-glow splash-glow-3" />

          {/* DNA Helix animation */}
          <div className="splash-helix">
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div
                key={i}
                className="helix-dot"
                animate={{
                  y: [0, -8, 0, 8, 0],
                  opacity: [0.3, 1, 0.3, 1, 0.3],
                  scale: [0.8, 1.2, 0.8, 1.2, 0.8],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.12,
                  ease: "easeInOut",
                }}
                style={{
                  background: `hsl(${196 + i * 8}, 90%, ${55 + i * 2}%)`,
                }}
              />
            ))}
          </div>

          {/* Central icon */}
          <motion.div
            className="splash-icon"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 15,
              delay: 0.2,
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear",
              }}
              className="splash-icon-ring"
            />
            <Cat size={36} strokeWidth={1.5} />
          </motion.div>

          {/* Title */}
          <motion.h1
            className="splash-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            meowmeow
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className="splash-subtitle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <Activity
              size={14}
              style={{ display: "inline", verticalAlign: "middle" }}
            />{" "}
            Clinical Intelligence Platform
          </motion.p>

          {/* Progress bar */}
          <motion.div
            className="splash-progress-container"
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 280 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <div className="splash-progress-track">
              <motion.div
                className="splash-progress-fill"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
            <div className="splash-progress-text">
              <span>{statusText}</span>
              <span className="splash-progress-pct">{progress}%</span>
            </div>
          </motion.div>

          {/* Floating particles */}
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={`particle-${i}`}
              className="splash-particle"
              initial={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                opacity: 0,
              }}
              animate={{
                y: [null, Math.random() * -200 - 50],
                opacity: [0, 0.6, 0],
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: Math.random() * 4 + 2,
                height: Math.random() * 4 + 2,
              }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
