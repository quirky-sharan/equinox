import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { sessionApi } from "../api/endpoints";
import {
  Shield, AlertTriangle, CheckCircle, XCircle,
  TrendingUp, TrendingDown, Minus, Download, RotateCcw,
  Activity, MessageSquare, ChevronRight, Cat, MapPin, FileText,
  Check, X as XIcon, Heart, Utensils, Leaf, Zap, AlertOctagon
} from "lucide-react";
import WellnessNudge from "../components/WellnessNudge";

const RISK_CONFIG = {
  low:      { color: "var(--risk-low)",      bg: "rgba(16,185,129,0.08)",  border: "rgba(16,185,129,0.25)",  icon: CheckCircle,   label: "LOW RISK" },
  medium:   { color: "var(--risk-medium)",   bg: "rgba(245,158,11,0.08)",   border: "rgba(245,158,11,0.25)",   icon: AlertTriangle, label: "MEDIUM RISK" },
  high:     { color: "var(--risk-high)",     bg: "rgba(249,115,22,0.08)",   border: "rgba(249,115,22,0.25)",   icon: AlertTriangle, label: "HIGH RISK" },
  critical: { color: "var(--risk-critical)", bg: "rgba(239,68,68,0.08)",    border: "rgba(239,68,68,0.25)",    icon: XCircle,       label: "CRITICAL" },
};

const TRAJECTORY_CONFIG = {
  stable:    { icon: Minus,         color: "var(--risk-low)",    cls: "badge-stable",    label: "STABLE" },
  worsening: { icon: TrendingDown,  color: "var(--risk-critical)",cls: "badge-worsening", label: "WORSENING" },
  improving: { icon: TrendingUp,    color: "var(--accent-blue)", cls: "badge-improving", label: "IMPROVING" },
  new_onset: { icon: Activity,      color: "var(--risk-medium)", cls: "badge-medium",    label: "NEW ONSET" },
};

export default function ResultPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [viewMode, setViewMode] = useState("patient");
  const mentalState = location.state?.mentalState;

  const { data, isLoading, error } = useQuery({
    queryKey: ["result", sessionId],
    queryFn: () => sessionApi.getResult(sessionId).then((r) => r.data),
  });

  if (isLoading) return (
    <div className="page-center" style={{ flexDirection: "column", gap: 24 }}>
      <motion.div 
        animate={{ rotate: 360 }} 
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        style={{ width: 48, height: 48, borderRadius: "14px", border: "2px solid var(--border-color)", borderTopColor: "var(--accent-blue)", display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <Cat size={20} color="var(--accent-blue)" />
      </motion.div>
      <p style={{ color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums", letterSpacing: "0.02em", fontSize: "0.9rem" }}>Synthesizing clinical results…</p>
    </div>
  );

  if (error) return (
    <div className="page-center">
      <div style={{ textAlign: "center", color: "var(--risk-critical)" }}>
        <p style={{ marginBottom: 16 }}>The clinical engine failed to retrieve the result set.</p>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate("/dashboard")}>Return to Dashboard</button>
      </div>
    </div>
  );

  const risk = RISK_CONFIG[data?.risk_tier] || RISK_CONFIG.medium;
  const traj = TRAJECTORY_CONFIG[data?.trajectory] || TRAJECTORY_CONFIG.stable;
  const RiskIcon = risk.icon;
  const TrajIcon = traj.icon;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <div className="page-container" style={{ maxWidth: 840, position: "relative" }}>
      {/* Background glow for critical state */}
      <AnimatePresence>
        {data?.risk_tier === "critical" && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 0.04 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, background: "radial-gradient(circle, var(--risk-critical) 0%, transparent 70%)", zIndex: -1 }} 
          />
        )}
      </AnimatePresence>

      <motion.div variants={containerVariants} initial="hidden" animate="visible">

        {/* View Mode Toggle */}
        <motion.div variants={itemVariants} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: "10px", background: "var(--bg-subtle)", border: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Activity size={20} color="var(--accent-blue)" strokeWidth={1.5} />
            </div>
            <div>
              <div style={{ fontSize: "1rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>Inference Report</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Session ID: {sessionId?.slice(0, 8)}</div>
            </div>
          </div>

          <div style={{ display: "inline-flex", background: "var(--bg-subtle)", borderRadius: "var(--radius-full)", padding: 4, border: "1px solid var(--border-color)" }}>
            <button 
              onClick={() => setViewMode("patient")}
              style={{ padding: "8px 18px", borderRadius: "100px", border: "none", background: viewMode === "patient" ? "var(--bg-card)" : "transparent", color: viewMode === "patient" ? "var(--text-primary)" : "var(--text-muted)", cursor: "pointer", fontWeight: 700, fontSize: "0.85rem", transition: "all 0.3s", boxShadow: viewMode === "patient" ? "0 4px 12px rgba(0,0,0,0.1)" : "none" }}
            >
              Patient
            </button>
            <button 
              onClick={() => setViewMode("doctor")}
              style={{ padding: "8px 18px", borderRadius: "100px", border: "none", background: viewMode === "doctor" ? "var(--bg-card)" : "transparent", color: viewMode === "doctor" ? "var(--text-primary)" : "var(--text-muted)", cursor: "pointer", fontWeight: 700, fontSize: "0.85rem", transition: "all 0.3s", boxShadow: viewMode === "doctor" ? "0 4px 12px rgba(0,0,0,0.1)" : "none" }}
            >
              Clinical
            </button>
          </div>
        </motion.div>

        {/* Risk tier hero */}
        <motion.div 
          variants={itemVariants} 
          className="card" 
          style={{ 
            padding: "3rem 2rem", marginBottom: "2rem", textAlign: "center",
            background: `linear-gradient(135deg, ${risk.bg} 0%, transparent 100%)`, 
            borderColor: risk.border,
            boxShadow: `0 30px 60px -12px ${risk.bg}`
          }}
        >
          <div style={{ position: "relative", display: "inline-block", marginBottom: 20 }}>
            <motion.div 
              animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ position: "absolute", inset: -15, borderRadius: "50%", background: risk.color, filter: "blur(20px)", zIndex: -1 }}
            />
            <RiskIcon size={64} color={risk.color} strokeWidth={1.5} />
          </div>
          
          <div style={{ fontSize: "0.8rem", letterSpacing: "0.2em", fontWeight: 800, color: risk.color, marginBottom: 12, textTransform: "uppercase" }}>
            Validated Result
          </div>
          <h1 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "clamp(2rem, 8vw, 4rem)", fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.05em", lineHeight: 0.9, marginBottom: "1rem" }}>
            {risk.label.split(" ")[0]}<br />
            <span style={{ color: risk.color }}>{risk.label.split(" ").slice(1).join(" ") || "RISK"}</span>
          </h1>
          
          <div style={{ display: "flex", justifyContent: "center", gap: "2rem", marginTop: "2rem" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Confidence</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)" }}>{((data?.risk_score || 0.5) * 100).toFixed(0)}%</div>
            </div>
            {traj && (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>Trajectory</div>
                <div style={{ fontSize: "1.25rem", fontWeight: 800, color: traj.color, display: "flex", alignItems: "center", gap: 6 }}>
                  <TrajIcon size={18} /> {traj.label}
                </div>
              </div>
            )}
          </div>
        </motion.div>


        <motion.div variants={itemVariants} className="grid-2-col" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "2rem", marginBottom: "2rem" }}>
          {/* Top conditions */}
          {viewMode === "doctor" && (
            <div className="card" style={{ padding: "2rem" }}>
              <h3 style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-primary)", fontWeight: 800, marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: 8 }}>
                <Activity size={16} color="var(--accent-blue)" /> Differential Diagnosis
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {(data?.top_conditions || []).map((cond, i) => (
                  <div key={i}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>{cond.name}</span>
                      <span style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--accent-blue)" }}>
                        {((cond.confidence || 0) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="progress-bar-track" style={{ height: 6, background: "var(--bg-subtle)" }}>
                      <motion.div className="progress-bar-fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${(cond.confidence || 0) * 100}%` }}
                        transition={{ duration: 1, delay: 0.5 + (i * 0.15), ease: [0.16, 1, 0.3, 1] }}
                        style={{ background: i === 0 ? "var(--accent-blue)" : "var(--text-muted)" }}
                      />
                    </div>
                    {cond.icd10 && (
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 4, letterSpacing: "0.02em" }}>CODING: {cond.icd10}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reasoning & action */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem", gridColumn: viewMode === "patient" ? "1 / -1" : "auto" }}>
            <div className="card" style={{ padding: "2rem", flex: 1, borderTop: `4px solid ${risk.color}` }}>
              <h3 style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-primary)", fontWeight: 800, marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: 8 }}>
                <Shield size={16} color={risk.color} /> {viewMode === "patient" ? "Assessment Summary" : "Inference Logic"}
              </h3>
              
              <div style={{ fontSize: "1.1rem", lineHeight: 1.8, color: "var(--text-secondary)", fontWeight: 400, whiteSpace: "pre-line" }}>
                {viewMode === "patient" ? (data?.patient_explanation || data?.recommended_action) : (data?.doctor_explanation || data?.recommended_action)}
              </div>
            </div>

            {viewMode === "doctor" && (data?.behavioral_flags || []).length > 0 && (
              <div className="card" style={{ padding: "2rem" }}>
                <h3 style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-primary)", fontWeight: 800, marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: 8 }}>
                  <MessageSquare size={16} color="var(--accent-cyan)" /> Nuance Capture
                </h3>
                <ul style={{ display: "flex", flexDirection: "column", gap: 12, listStyle: "none" }}>
                  {data.behavioral_flags.map((flag, i) => (
                    <li key={i} style={{ fontSize: "0.95rem", color: "var(--text-secondary)", paddingLeft: 20, position: "relative" }}>
                      <span style={{ position: "absolute", left: 0, top: 10, width: 6, height: 6, borderRadius: "50%", background: "var(--accent-cyan)" }} />
                      {flag}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </motion.div>


        {/* Reasoning chain */}
        {viewMode === "doctor" && (data?.reasoning_chain || []).length > 0 && (
          <motion.div variants={itemVariants} className="card" style={{ padding: "2rem", marginBottom: "2rem" }}>
            <h3 style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-primary)", fontWeight: 800, marginBottom: "1.5rem" }}>
              Analytic Traversal
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {data.reasoning_chain.map((step, i) => (
                <div key={i} style={{ display: "flex", gap: 16 }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--accent-blue)", fontVariantNumeric: "tabular-nums" }}>{(i + 1).toString().padStart(2, '0')}</div>
                  <div style={{ fontSize: "0.95rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>{step}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Mental Health Support (Ephemeral, passed via state) */}
        {viewMode === "patient" && mentalState?.distress_detected && (
          <motion.div variants={itemVariants} style={{ marginBottom: "2rem" }}>
            <div className="card" style={{ padding: "2rem", borderTop: "4px solid #a78bfa", background: "rgba(167, 139, 250, 0.03)" }}>
              <h3 style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#a78bfa", fontWeight: 800, marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: 8 }}>
                <Heart size={16} /> Mental Wellness Support
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>
                {mentalState.wellness_nudge || "We noticed you might be going through a tough time. Remember that your mental wellbeing is just as important as your physical health."}
              </p>
              <a href="https://icallhelpline.org" target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ color: "#a78bfa", borderColor: "rgba(167, 139, 250, 0.4)" }}>
                Find a counselor or helpline →
              </a>
            </div>
          </motion.div>
        )}

        {/* Do's and Don'ts */}
        {((data?.dos || []).length > 0 || (data?.donts || []).length > 0) && (
          <motion.div variants={itemVariants} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
            {(data?.dos || []).length > 0 && (
              <div className="card" style={{ padding: "2rem", borderTop: "4px solid var(--risk-low)" }}>
                <h3 style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--risk-low)", fontWeight: 800, marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: 8 }}>
                  <CheckCircle size={16} /> Recommended Actions
                </h3>
                <ul style={{ display: "flex", flexDirection: "column", gap: 12, listStyle: "none" }}>
                  {data.dos.map((item, i) => (
                    <li key={i} style={{ fontSize: "0.95rem", color: "var(--text-secondary)", display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <Check size={16} color="var(--risk-low)" style={{ flexShrink: 0, marginTop: 3 }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(data?.donts || []).length > 0 && (
              <div className="card" style={{ padding: "2rem", borderTop: "4px solid var(--risk-critical)" }}>
                <h3 style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--risk-critical)", fontWeight: 800, marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: 8 }}>
                  <XCircle size={16} /> Things to Avoid
                </h3>
                <ul style={{ display: "flex", flexDirection: "column", gap: 12, listStyle: "none" }}>
                  {data.donts.map((item, i) => (
                    <li key={i} style={{ fontSize: "0.95rem", color: "var(--text-secondary)", display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <XIcon size={16} color="var(--risk-critical)" style={{ flexShrink: 0, marginTop: 3 }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}

        {/* Home Remedies */}
        {(data?.home_remedies || []).length > 0 && (
          <motion.div variants={itemVariants} className="card" style={{ padding: "2rem", marginBottom: "2rem", borderTop: "4px solid var(--accent-blue)" }}>
            <h3 style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--accent-blue)", fontWeight: 800, marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: 8 }}>
              <Heart size={16} /> Home Remedies
            </h3>
            <ul style={{ display: "flex", flexDirection: "column", gap: 12, listStyle: "none" }}>
              {data.home_remedies.map((item, i) => (
                <li key={i} style={{ fontSize: "0.95rem", color: "var(--text-secondary)", display: "flex", alignItems: "flex-start", gap: 10, lineHeight: 1.5 }}>
                  <Leaf size={16} color="var(--accent-blue)" style={{ flexShrink: 0, marginTop: 3 }} />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Dietary Guidelines */}
        {data?.dietary_guidelines && (
          <motion.div variants={itemVariants} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
            {data.dietary_guidelines.eat && data.dietary_guidelines.eat.length > 0 && (
              <div className="card" style={{ padding: "1.5rem", borderTop: "4px solid var(--risk-low)" }}>
                <h4 style={{ fontSize: "0.8rem", textTransform: "uppercase", color: "var(--risk-low)", fontWeight: 800, marginBottom: "1rem", display: "flex", alignItems: "center", gap: 6 }}>
                  <Utensils size={14} /> Foods to Eat
                </h4>
                <ul style={{ display: "flex", flexDirection: "column", gap: 8, listStyle: "none" }}>
                  {data.dietary_guidelines.eat.map((item, i) => (
                    <li key={i} style={{ fontSize: "0.9rem", color: "var(--text-secondary)", display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <Check size={14} color="var(--risk-low)" style={{ flexShrink: 0, marginTop: 2 }} /> {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {data.dietary_guidelines.drink && data.dietary_guidelines.drink.length > 0 && (
              <div className="card" style={{ padding: "1.5rem", borderTop: "4px solid var(--accent-blue)" }}>
                <h4 style={{ fontSize: "0.8rem", textTransform: "uppercase", color: "var(--accent-blue)", fontWeight: 800, marginBottom: "1rem", display: "flex", alignItems: "center", gap: 6 }}>
                  <Zap size={14} /> Drinks Recommended
                </h4>
                <ul style={{ display: "flex", flexDirection: "column", gap: 8, listStyle: "none" }}>
                  {data.dietary_guidelines.drink.map((item, i) => (
                    <li key={i} style={{ fontSize: "0.9rem", color: "var(--text-secondary)", display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <Check size={14} color="var(--accent-blue)" style={{ flexShrink: 0, marginTop: 2 }} /> {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {data.dietary_guidelines.avoid && data.dietary_guidelines.avoid.length > 0 && (
              <div className="card" style={{ padding: "1.5rem", borderTop: "4px solid var(--risk-high)" }}>
                <h4 style={{ fontSize: "0.8rem", textTransform: "uppercase", color: "var(--risk-high)", fontWeight: 800, marginBottom: "1rem", display: "flex", alignItems: "center", gap: 6 }}>
                  <XIcon size={14} /> Foods to Avoid
                </h4>
                <ul style={{ display: "flex", flexDirection: "column", gap: 8, listStyle: "none" }}>
                  {data.dietary_guidelines.avoid.map((item, i) => (
                    <li key={i} style={{ fontSize: "0.9rem", color: "var(--text-secondary)", display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <XIcon size={14} color="var(--risk-high)" style={{ flexShrink: 0, marginTop: 2 }} /> {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}

        {/* Lifestyle Modifications */}
        {(data?.lifestyle_modifications || []).length > 0 && (
          <motion.div variants={itemVariants} className="card" style={{ padding: "2rem", marginBottom: "2rem", borderTop: "4px solid #8b5cf6" }}>
            <h3 style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "#8b5cf6", fontWeight: 800, marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: 8 }}>
              <TrendingUp size={16} /> Lifestyle Modifications
            </h3>
            <ul style={{ display: "flex", flexDirection: "column", gap: 12, listStyle: "none" }}>
              {data.lifestyle_modifications.map((item, i) => (
                <li key={i} style={{ fontSize: "0.95rem", color: "var(--text-secondary)", display: "flex", alignItems: "flex-start", gap: 10, lineHeight: 1.5 }}>
                  <ChevronRight size={16} color="#8b5cf6" style={{ flexShrink: 0, marginTop: 3 }} />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* Warning Signs */}
        {(data?.warning_signs || []).length > 0 && (
          <motion.div variants={itemVariants} className="card" style={{ padding: "2rem", marginBottom: "2rem", borderTop: "4px solid var(--risk-critical)", background: "rgba(239, 68, 68, 0.03)" }}>
            <h3 style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--risk-critical)", fontWeight: 800, marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: 8 }}>
              <AlertOctagon size={16} /> Warning Signs — Seek Medical Help If...
            </h3>
            <ul style={{ display: "flex", flexDirection: "column", gap: 10, listStyle: "none" }}>
              {data.warning_signs.map((item, i) => (
                <li key={i} style={{ fontSize: "0.95rem", color: "var(--risk-critical)", display: "flex", alignItems: "flex-start", gap: 10, fontWeight: 500 }}>
                  <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 3 }} />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
        <motion.div variants={itemVariants} style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <motion.button 
            whileHover={{ scale: 1.05, x: 5 }} whileTap={{ scale: 0.95 }}
            className="btn btn-primary" onClick={() => navigate("/interview")} style={{ gap: 12, padding: "1rem 2rem" }}
          >
            <Cat size={20} /> New Assessment
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            className="btn btn-secondary" onClick={() => navigate("/history")} style={{ gap: 12, padding: "1rem 2rem" }}
          >
            <Activity size={20} /> Audit History
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            className="btn btn-primary" onClick={() => navigate("/find-doctors")} style={{ gap: 12, padding: "1rem 2rem", background: "var(--bg-subtle)", color: "var(--accent-blue)", border: "1px solid var(--border-color)", boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}
          >
            <MapPin size={20} /> Contact Nearest Doctors
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            className="btn btn-secondary" 
            onClick={async () => {
              try {
                const res = await sessionApi.downloadReport(sessionId);
                const blob = new Blob([res.data], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `meowmeow_report_${sessionId.slice(0, 8)}.pdf`;
                a.click();
                URL.revokeObjectURL(url);
              } catch (e) {
                console.error('PDF download failed:', e);
              }
            }}
            style={{ gap: 12, padding: "1rem 2rem" }}
          >
            <FileText size={20} /> Download PDF Report
          </motion.button>
        </motion.div>

        {/* Disclaimer */}
        <motion.div variants={itemVariants} style={{ marginTop: "4rem", padding: "2rem", borderTop: "1px solid var(--border-color)", fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.6, textAlign: "center" }}>
          Meowmeow is a high-fidelity informational probabilistic engine. Always consult a qualified clinical professional for final diagnostics.
        </motion.div>
      </motion.div>

    </div>
  );
}
