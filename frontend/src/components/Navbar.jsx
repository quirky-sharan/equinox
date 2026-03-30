import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Cat, BarChart2, Clock, Moon, Sun, Monitor, Coffee, LogOut } from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "../store/authStore";
import { useThemeStore } from "../store/themeStore";

export default function Navbar() {
  const { user, token, logout } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const cycleTheme = () => {
    const modes = ["light", "dark", "sepia", "midnight"];
    const idx = modes.indexOf(theme);
    setTheme(modes[(idx + 1) % modes.length]);
  };

  const getThemeIcon = () => {
    if (theme === "light") return <Sun size={16} />;
    if (theme === "dark") return <Moon size={16} />;
    if (theme === "sepia") return <Coffee size={16} />;
    return <Monitor size={16} />;
  };

  const isActive = (path) => location.pathname.startsWith(path) ? "active" : "";

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || "?";

  return (
    <motion.nav 
      className="navbar"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link to="/" className="navbar-brand" style={{ display: "flex", alignItems: "center", textDecoration: "none", color: "var(--text-primary)" }}>
        <motion.div whileHover={{ rotate: 10, scale: 1.1 }} style={{ marginRight: 8 }}>
          <Cat size={24} style={{ fill: "var(--text-primary)" }} strokeWidth={1.5} />
        </motion.div>
        <span style={{ fontWeight: 800, letterSpacing: "-0.05em" }}>Meowmeow</span>
      </Link>


      {token && (
        <>
          <div className="navbar-actions" style={{ display: "flex" }}>
            <Link to="/dashboard" className={`nav-link ${isActive("/dashboard")}`}>Dashboard</Link>
            <Link to="/history" className={`nav-link ${isActive("/history")}`}>
              <Clock size={14} style={{ display: "inline", marginRight: 4 }} />History
            </Link>
            <Link to="/population" className={`nav-link ${isActive("/population")}`}>
              <BarChart2 size={14} style={{ display: "inline", marginRight: 4 }} />Population
            </Link>
            <button 
              onClick={cycleTheme} 
              title={`Theme: ${theme}`}
              style={{ background: "transparent", border: "1px solid var(--border-color)", borderRadius: "50%", padding: 6, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-secondary)" }}
            >
              {getThemeIcon()}
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginLeft: "10px", paddingLeft: "20px", borderLeft: "1px solid var(--border-color)" }}>
              <Link to="/profile" className="avatar-btn" title="Your Profile">
                {user?.photo_url
                  ? <img src={user.photo_url} alt="avatar" style={{width: "100%", height: "100%", objectFit: "cover"}} referrerPolicy="no-referrer" />
                  : initials
                }
              </Link>
              <button 
                onClick={handleLogout} 
                className="btn-icon"
                title="Logout"
                style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "none", display: "flex", padding: 4 }}
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </>
      )}

      {!token && (
        <div className="navbar-actions" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button 
            onClick={cycleTheme} 
            title={`Theme: ${theme}`}
            style={{ background: "transparent", border: "1px solid var(--border-color)", borderRadius: "50%", padding: 6, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-secondary)" }}
          >
            {getThemeIcon()}
          </button>
          <Link to="/login" className="btn btn-secondary btn-sm">Sign In</Link>
          <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
        </div>
      )}
      </motion.nav>
  );
}
