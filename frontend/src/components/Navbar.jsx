import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Cat, BarChart2, Clock, Moon, Sun, Monitor, Coffee, LogOut, Stethoscope, Mail, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "../store/authStore";
import { useThemeStore } from "../store/themeStore";

export default function Navbar() {
  const { user, token, logout } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
    setMobileOpen(false);
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

  const closeMobile = () => setMobileOpen(false);

  const navLinks = token ? [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/history", label: "History", icon: <Clock size={14} style={{ display: "inline", marginRight: 4 }} /> },
    { to: "/population", label: "Population", icon: <BarChart2 size={14} style={{ display: "inline", marginRight: 4 }} /> },
    { to: "/find-doctors", label: "Find Doctors", icon: <Stethoscope size={14} style={{ display: "inline", marginRight: 4 }} /> },
    { to: "/contact", label: "Contact Us", icon: <Mail size={14} style={{ display: "inline", marginRight: 4 }} /> },
  ] : [
    { to: "/contact", label: "Contact Us", icon: <Mail size={14} style={{ display: "inline", marginRight: 4 }} /> },
  ];

  return (
    <>
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
          <span style={{ fontWeight: 800, letterSpacing: "-0.05em" }}>Pulse</span>
        </Link>

        {/* Desktop Nav */}
        {token && (
          <div className="navbar-actions" style={{ display: "flex" }}>
            {navLinks.map(link => (
              <Link key={link.to} to={link.to} className={`nav-link ${isActive(link.to)}`}>
                {link.icon}{link.label}
              </Link>
            ))}
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
        )}

        {!token && (
          <div className="navbar-actions" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Link to="/contact" className={`nav-link ${isActive("/contact")}`} style={{ marginRight: 10 }}>
              <Mail size={14} style={{ display: "inline", marginRight: 4 }} />Contact Us
            </Link>
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

        {/* Hamburger - Mobile Only (hidden on desktop via CSS) */}
        <div className="navbar-mobile-controls" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Theme toggle for mobile */}
          <button 
            onClick={cycleTheme} 
            title={`Theme: ${theme}`}
            style={{ background: "transparent", border: "1px solid var(--border-color)", borderRadius: "50%", padding: 8, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-secondary)", width: 36, height: 36 }}
          >
            {getThemeIcon()}
          </button>
          <button
            className="navbar-hamburger"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation menu"
          >
            <span style={{ transform: mobileOpen ? "rotate(45deg) translate(5px, 5px)" : "none" }} />
            <span style={{ opacity: mobileOpen ? 0 : 1 }} />
            <span style={{ transform: mobileOpen ? "rotate(-45deg) translate(5px, -5px)" : "none" }} />
          </button>
        </div>
      </motion.nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="navbar-mobile-drawer open"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`nav-link ${isActive(link.to)}`}
                onClick={closeMobile}
              >
                {link.icon}{link.label}
              </Link>
            ))}

            {token ? (
              <>
                <div className="nav-divider" />
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <Link to="/profile" className="avatar-btn" onClick={closeMobile} title="Your Profile">
                    {user?.photo_url
                      ? <img src={user.photo_url} alt="avatar" style={{width: "100%", height: "100%", objectFit: "cover"}} referrerPolicy="no-referrer" />
                      : initials
                    }
                  </Link>
                  <span style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>{user?.full_name || user?.email}</span>
                  <button 
                    onClick={handleLogout} 
                    style={{ marginLeft: "auto", background: "transparent", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", padding: "6px 12px", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem" }}
                  >
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="nav-divider" />
                <div className="mobile-btn-row">
                  <Link to="/login" className="btn btn-secondary" style={{ flex: 1, justifyContent: "center" }} onClick={closeMobile}>Sign In</Link>
                  <Link to="/register" className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }} onClick={closeMobile}>Get Started</Link>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
