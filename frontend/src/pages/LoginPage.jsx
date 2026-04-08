import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { authApi } from "../api/endpoints";
import { useAuthStore } from "../store/authStore";
import { Mail, Lock, Eye, EyeOff, AlertCircle, Activity } from "lucide-react";

// Firebase Auth
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../config/firebase";

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const res = await authApi.login(form);
      setAuth(res.data.user, res.data.access_token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed. Please check your credentials.");
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      // Step 1: Firebase popup -> get real Google ID token
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const idToken = await user.getIdToken();

      console.log("Firebase auth successful, sending token to backend...");

      // Step 2: Send token to OUR backend for verification + user upsert
      const res = await authApi.googleAuth(
        idToken,
        user.displayName,
        user.photoURL
      );

      setAuth(res.data.user, res.data.access_token);
      navigate("/dashboard");
    } catch (err) {
      console.error("Google auth error:", err);

      // Handle specific Firebase errors
      if (err.code === "auth/popup-blocked") {
        setError("Popup was blocked by your browser. Please allow popups for this site and try again.");
      } else if (err.code === "auth/popup-closed-by-user") {
        setError("Sign-in popup was closed. Please try again.");
      } else if (err.code === "auth/cancelled-popup-request") {
        setError("Another sign-in attempt is in progress. Please wait.");
      } else if (err.code === "auth/unauthorized-domain") {
        setError("This domain is not authorized for Google sign-in. Please add localhost to Firebase authorized domains.");
      } else {
        const msg = err.response?.data?.detail || err.message || "Google sign-in failed.";
        setError(msg);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
    }
  };

  return (
    <div className="page-center" style={{ position: "relative", overflow: "hidden" }}>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{ width: "100%", maxWidth: 420, zIndex: 1 }}
      >
        {/* Header */}
        <motion.div variants={itemVariants} style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 5 }}
            style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: 64, height: 64, borderRadius: "20px",
              background: "var(--bg-card)",
              border: "1px solid var(--border-color)", marginBottom: "1.5rem",
              boxShadow: "var(--shadow-md)"
            }}>
            <Activity size={32} color="#FF3366" strokeWidth={2.5} />
          </motion.div>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.04em", marginBottom: 10 }}>
            Welcome back
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", letterSpacing: "0.01em" }}>
            Identify yourself to continue to Pulse
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="card" style={{ padding: "2.5rem", backdropFilter: "blur(10px)", background: "var(--glass-bg)" }}>
          {/* Google Sign-In */}
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="btn btn-google btn-full"
            onClick={handleGoogle}
            disabled={googleLoading}
            style={{ marginBottom: "1.5rem", fontSize: "0.92rem", fontWeight: 600, border: "1px solid var(--border-color)", background: "var(--bg-base)" }}
          >
            {googleLoading ? <div className="spinner" style={{ borderTopColor: "#4285f4" }} /> : (
              <svg width="18" height="18" viewBox="0 0 24 24" style={{ marginRight: 10 }}>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Continue with Google
          </motion.button>


          <motion.div variants={itemVariants} className="form-divider">or sign in with email</motion.div>

          {/* Error message */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: "var(--radius-md)", padding: "12px 16px",
                color: "#f87171", fontSize: "0.85rem", marginBottom: "1.5rem", marginTop: "1rem"
              }}>
              <AlertCircle size={16} /> {error}
            </motion.div>
          )}

          {/* Email / Password form */}
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <motion.div variants={itemVariants} className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Email address</label>
              <div style={{ position: "relative" }}>
                <Mail size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input
                  name="email" type="email" required
                  className="form-input"
                  placeholder="you@example.com"
                  value={form.email} onChange={handleChange}
                  style={{ paddingLeft: 42 }}
                />
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Password</label>
              <div style={{ position: "relative" }}>
                <Lock size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input
                  name="password" type={showPass ? "text" : "password"} required
                  className="form-input"
                  placeholder="••••••••"
                  value={form.password} onChange={handleChange}
                  style={{ paddingLeft: 42, paddingRight: 42 }}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "none", color: "var(--text-muted)", display: "flex" }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </motion.div>

            <motion.button 
              variants={itemVariants}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? <><div className="spinner" /> Verification...</> : "Sign In"}
            </motion.button>
          </form>
        </motion.div>

        <motion.p variants={itemVariants} style={{ textAlign: "center", marginTop: "2rem", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
          Don't have an account?{" "}
          <Link to="/register" style={{ color: "var(--text-primary)", fontWeight: 700, textDecoration: "none", borderBottom: "1.5px solid var(--border-color)" }}>
            Create one free
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
}