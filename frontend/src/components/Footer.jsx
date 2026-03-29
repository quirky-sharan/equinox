import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Cat, Code, Camera, MessageSquare, Mail } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <motion.footer 
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      style={{ 
        borderTop: "1px solid var(--border-color)", 
        background: "var(--bg-base)", 
        padding: "4rem 2rem 2rem",
        marginTop: "auto"
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "3rem", marginBottom: "3rem" }}>
          
          {/* Brand */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <Link to="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none", color: "var(--text-primary)" }}>
              <Cat size={24} strokeWidth={1.5} />
              <span style={{ fontWeight: 800, letterSpacing: "-0.05em", fontSize: "1.25rem" }}>Meowmeow</span>
            </Link>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6, maxWidth: 300 }}>
              Pioneering the future of clinical intelligence. High-fidelity probabilistic health assessments driven by advanced AI.
            </p>
            <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
              <a href="https://github.com" target="_blank" rel="noreferrer" style={{ color: "var(--text-muted)", transition: "color 0.2s" }}><Code size={20} /></a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" style={{ color: "var(--text-muted)", transition: "color 0.2s" }}><Camera size={20} /></a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" style={{ color: "var(--text-muted)", transition: "color 0.2s" }}><MessageSquare size={20} /></a>
              <a href="mailto:contact@meowmeow.health" style={{ color: "var(--text-muted)", transition: "color 0.2s" }}><Mail size={20} /></a>
            </div>

          </div>

          {/* Links */}
          <div>
            <h4 style={{ fontWeight: 700, marginBottom: "1.5rem", color: "var(--text-primary)" }}>Platform</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <li><Link to="/login" style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.9rem", transition: "color 0.2s" }}>Sign In</Link></li>
              <li><Link to="/register" style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.9rem", transition: "color 0.2s" }}>Create Account</Link></li>
              <li><Link to="#vision" style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.9rem", transition: "color 0.2s" }}>Our Vision</Link></li>
              <li><Link to="#founders" style={{ color: "var(--text-secondary)", textDecoration: "none", fontSize: "0.9rem", transition: "color 0.2s" }}>Founders</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 style={{ fontWeight: 700, marginBottom: "1.5rem", color: "var(--text-primary)" }}>Legal & Terms</h4>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <li><span style={{ color: "var(--text-secondary)", fontSize: "0.9rem", cursor: "pointer" }}>Privacy Policy</span></li>
              <li><span style={{ color: "var(--text-secondary)", fontSize: "0.9rem", cursor: "pointer" }}>Terms of Service</span></li>
              <li><span style={{ color: "var(--text-secondary)", fontSize: "0.9rem", cursor: "pointer" }}>Medical Disclaimer</span></li>
              <li><span style={{ color: "var(--text-secondary)", fontSize: "0.9rem", cursor: "pointer" }}>HIPAA Notice</span></li>
            </ul>
          </div>

        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", borderTop: "1px solid var(--border-color)", paddingTop: "2rem", textAlign: "center" }}>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
            &copy; {currentYear} Meowmeow Health Intelligence. All rights reserved. <br/>
            MIT License - Open Source Core.
          </p>
          <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", maxWidth: 600, margin: "0 auto", lineHeight: 1.5 }}>
            DISCLAIMER: Meowmeow is a probabilistic analysis engine and does not provide formal medical diagnoses. 
            Always consult a licensed medical professional for formal clinical decisions.
          </p>
        </div>
      </div>
    </motion.footer>
  );
}
