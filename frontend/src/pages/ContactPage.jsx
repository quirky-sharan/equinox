import { motion } from "framer-motion";
import { Mail, Phone, Link as LinkIcon, GitBranch, Activity, TerminalSquare, User } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="page-center" style={{ flexDirection: "column", padding: "2rem", minHeight: "calc(100vh - 80px)", position: "relative", overflow: "hidden" }}>
      
      {/* Dynamic Background Glow */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.03, 0.06, 0.03],
          rotate: [0, 90, 0]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        style={{ 
          position: "absolute", top: "10%", left: "50%", x: "-50%", 
          width: "120%", height: "120%", 
          background: "radial-gradient(circle, var(--accent-blue) 0%, transparent 60%)", 
          zIndex: 0, pointerEvents: "none" 
        }}
      />

      <div style={{ zIndex: 1, width: "100%", maxWidth: 900, display: "flex", flexDirection: "column", gap: "3rem" }}>
        
        {/* Header Title */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          style={{ textAlign: "center" }}
        >
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "8px 24px", borderRadius: "100px", background: "rgba(14, 165, 233, 0.1)", border: "1px solid rgba(14, 165, 233, 0.2)", color: "var(--accent-blue)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", fontSize: "0.8rem", marginBottom: "1rem" }}>
            <Activity size={14} /> Get In Touch
          </div>
          <h1 style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)", fontWeight: 900, letterSpacing: "-0.04em", margin: "0 0 1rem 0", lineHeight: 1.1, backgroundImage: "linear-gradient(to right, #fff, var(--text-muted))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            We're Here To Help.
          </h1>
          <p style={{ fontSize: "1.1rem", color: "var(--text-secondary)", maxWidth: 600, margin: "0 auto" }}>
            Have questions about the Pulse Clinical AI? Need technical support? Or just want to say hi? Reach out to us directly.
          </p>
        </motion.div>

        {/* Primary Focus: Contact Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
          
          {/* Email Card */}
          <motion.a
            href="mailto:imsharansoni@gmail.com"
            whileHover={{ y: -8, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="card"
            style={{
              padding: "2.5rem", textDecoration: "none",
              display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
              background: "var(--glass-bg)", backdropFilter: "blur(20px)",
              border: "1px solid var(--border-color)", borderTop: "2px solid var(--accent-blue)",
              boxShadow: "0 20px 40px -10px rgba(0,0,0,0.3)"
            }}
          >
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(14, 165, 233, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.5rem", border: "1px solid rgba(14, 165, 233, 0.2)" }}>
              <Mail size={32} color="var(--accent-blue)" />
            </div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0 0 0.5rem 0", color: "var(--text-primary)" }}>Email Us</h2>
            <p style={{ color: "var(--text-secondary)", margin: "0 0 1.5rem 0", fontSize: "0.95rem" }}>For queries, feedback, or enterprise clinical solutions.</p>
            <div style={{ background: "rgba(255,255,255,0.05)", padding: "12px 24px", borderRadius: "100px", color: "var(--accent-blue)", fontWeight: 700, letterSpacing: "0.02em", fontFamily: "monospace", fontSize: "1rem" }}>
              imsharansoni@gmail.com
            </div>
          </motion.a>

          {/* Phone Card */}
          <motion.a
            href="tel:+919511928019"
            whileHover={{ y: -8, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="card"
            style={{
              padding: "2.5rem", textDecoration: "none",
              display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
              background: "var(--glass-bg)", backdropFilter: "blur(20px)",
              border: "1px solid var(--border-color)", borderTop: "2px solid #10b981",
              boxShadow: "0 20px 40px -10px rgba(0,0,0,0.3)"
            }}
          >
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(16, 185, 129, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.5rem", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
              <Phone size={32} color="#10b981" />
            </div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 800, margin: "0 0 0.5rem 0", color: "var(--text-primary)" }}>Call Us</h2>
            <p style={{ color: "var(--text-secondary)", margin: "0 0 1.5rem 0", fontSize: "0.95rem" }}>Immediate assistance for critical platform issues.</p>
            <div style={{ background: "rgba(255,255,255,0.05)", padding: "12px 24px", borderRadius: "100px", color: "#10b981", fontWeight: 700, letterSpacing: "0.02em", fontFamily: "monospace", fontSize: "1rem" }}>
              +91 79905 88077
            </div>
          </motion.a>

        </div>

        {/* Developers Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }}
          style={{ marginTop: "2rem" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: "1.5rem" }}>
            <div style={{ flex: 1, height: 1, background: "var(--border-color)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-muted)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>
              <TerminalSquare size={16} /> Meet the Core Team
            </div>
            <div style={{ flex: 1, height: 1, background: "var(--border-color)" }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem" }}>
            
            {/* Devatman Pal */}
            <div className="card" style={{ padding: "1.5rem", background: "var(--bg-card)", border: "1px solid var(--border-color)", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: "12px", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <User size={24} color="var(--text-primary)" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary)" }}>Devatman Pal</h3>
                  <div style={{ fontSize: "0.75rem", color: "var(--accent-blue)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Core Developer</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {/* Paste LinkedIn Profile URL below */}
                <a href="" target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ flex: 1, padding: "8px", fontSize: "0.8rem", gap: 6 }}><LinkIcon size={14} /> LinkedIn</a>
                {/* Paste GitHub Profile URL below */}
                <a href="" target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ flex: 1, padding: "8px", fontSize: "0.8rem", gap: 6 }}><GitBranch size={14} /> GitHub</a>
              </div>
            </div>

            {/* Sharan Soni */}
            <div className="card" style={{ padding: "1.5rem", background: "var(--bg-card)", border: "1px solid var(--border-color)", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: "12px", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <User size={24} color="var(--text-primary)" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary)" }}>Sharan Soni</h3>
                  <div style={{ fontSize: "0.75rem", color: "var(--accent-blue)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Core Developer</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {/* Paste LinkedIn Profile URL below */}
                <a href="" target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ flex: 1, padding: "8px", fontSize: "0.8rem", gap: 6 }}><LinkIcon size={14} /> LinkedIn</a>
                {/* Paste GitHub Profile URL below */}
                <a href="" target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ flex: 1, padding: "8px", fontSize: "0.8rem", gap: 6 }}><GitBranch size={14} /> GitHub</a>
              </div>
            </div>

          </div>
        </motion.div>

      </div>
    </div>
  );
}
