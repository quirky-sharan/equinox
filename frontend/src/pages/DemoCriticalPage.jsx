import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, AlertTriangle, CheckCircle, XCircle,
  TrendingDown, Activity, AlertOctagon, Phone,
  X as XIcon, MapPin, Check,
} from "lucide-react";

/* ─── Critical Risk Banner (same as ResultPage) ───────────────── */
function CriticalAlertBanner({ scorePercent, onDismiss, onAction }) {
  return (
    <AnimatePresence>
      <motion.div
        key="critical-banner"
        initial={{ opacity: 0, y: 80, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 80, scale: 0.92 }}
        transition={{ type: "spring", stiffness: 260, damping: 22, delay: 1.2 }}
        style={{
          position: "fixed",
          bottom: 32,
          right: 32,
          zIndex: 9999,
          width: 360,
          background: "rgba(10, 4, 4, 0.97)",
          backdropFilter: "blur(20px)",
          borderRadius: 20,
          padding: "1.5rem",
          boxShadow: "0 0 0 1px rgba(239,68,68,0.6), 0 0 40px rgba(239,68,68,0.25), 0 25px 60px rgba(0,0,0,0.8)",
          border: "1px solid rgba(239,68,68,0.5)",
        }}
      >
        <motion.div
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute", top: 0, left: 0, right: 0, height: 3,
            background: "linear-gradient(90deg, #ef4444, #f97316, #ef4444)",
            borderRadius: "20px 20px 0 0",
          }}
        />
        <button onClick={onDismiss} style={{
          position: "absolute", top: 14, right: 14,
          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 8, color: "#9ca3af", cursor: "pointer",
          width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <XIcon size={14} />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: "1rem" }}>
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            style={{
              width: 44, height: 44, borderRadius: 12,
              background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}
          >
            <AlertOctagon size={22} color="#ef4444" strokeWidth={2} />
          </motion.div>
          <div>
            <div style={{ fontFamily: "var(--font-ui)", fontWeight: 800, fontSize: "0.95rem", color: "#fff" }}>
              Critical Risk Detected
            </div>
            <div style={{
              fontFamily: "var(--font-ui)", fontSize: "0.72rem", color: "#ef4444",
              fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
            }}>
              Severity: {scorePercent}% — Immediate Action Required
            </div>
          </div>
        </div>

        <p style={{
          fontFamily: "var(--font-body)", fontSize: "0.84rem", color: "#d1d5db",
          lineHeight: 1.65, margin: "0 0 1.25rem", fontWeight: 300,
        }}>
          Your assessment indicates a critical health risk. We recommend
          connecting with the nearest available doctor immediately.
        </p>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onAction}
          style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
            gap: 10, padding: "12px 20px", borderRadius: 100,
            background: "linear-gradient(135deg, #ef4444 0%, #f97316 100%)",
            color: "white", fontWeight: 800, fontSize: "0.9rem",
            border: "none", cursor: "pointer",
            boxShadow: "0 4px 24px rgba(239,68,68,0.45)",
          }}
        >
          <Phone size={16} strokeWidth={2.5} />
          Find Nearest Doctor & Call Now
        </motion.button>
      </motion.div>
    </AnimatePresence>
  );
}

/* ─── Mock Data ────────────────────────────────────────────────── */
const MOCK = {
  risk_tier: "critical",
  risk_score: 0.97,
  risk_word: "CRITICAL",
  risk_color: "var(--risk-critical, #ef4444)",
  trajectory: "Worsening",
  patient_explanation:
    "Based on the combination of persistent high-grade fever (103°F), severe chest pain radiating to the left arm, shortness of breath at rest, and elevated heart rate, the clinical engine has identified a critical cardiovascular risk profile requiring immediate medical intervention.",
  top_conditions: [
    { name: "Acute Coronary Syndrome", confidence: 0.92 },
    { name: "Pulmonary Embolism", confidence: 0.78 },
    { name: "Myocarditis", confidence: 0.61 },
  ],
  warning_signs: [
    "Sudden severe chest pain or pressure",
    "Difficulty breathing or rapid shallow breathing",
    "Loss of consciousness or fainting",
    "Irregular or very rapid heartbeat",
  ],
  dos: [
    "Call emergency services (112) immediately",
    "Chew an aspirin (325 mg) if available and not allergic",
    "Stay calm and sit upright — do not lie flat",
  ],
  donts: [
    "Do NOT drive yourself to the hospital",
    "Do NOT ignore these symptoms or wait for them to pass",
    "Do NOT consume caffeine or stimulants",
  ],
};

/* ─── Demo Page ────────────────────────────────────────────────── */
export default function DemoCriticalPage() {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);
  const scorePercent = Math.round(MOCK.risk_score * 100);

  return (
    <div className="page-container" style={{ maxWidth: 860 }}>
      {/* Top bar */}
      <motion.div
        initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4rem", flexWrap: "wrap", gap: "1rem" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: "var(--bg-subtle)", border: "1px solid var(--border-color)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Activity size={18} color="var(--text-secondary)" strokeWidth={1.5} />
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-ui)", fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)" }}>
              Inference Report
            </div>
            <div style={{ fontFamily: "var(--font-ui)", fontSize: "0.68rem", color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              DEMO · Critical Risk Preview
            </div>
          </div>
        </div>
        <div style={{
          background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
          borderRadius: "var(--radius-full)", padding: "6px 16px",
          fontFamily: "var(--font-ui)", fontSize: "0.72rem", fontWeight: 700,
          color: "#ef4444", letterSpacing: "0.06em", textTransform: "uppercase",
        }}>
          ⚠ Demo Mode
        </div>
      </motion.div>

      {/* Risk Hero */}
      <motion.div
        initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.8 }}
      >
        <div style={{
          padding: "3.5rem 2.5rem", marginBottom: "2rem",
          border: "1px solid var(--border-color)", borderTop: `4px solid ${MOCK.risk_color}`,
          borderRadius: "var(--radius-lg)", background: "var(--bg-card)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "2rem" }}>
            <div>
              <div style={{ fontFamily: "var(--font-ui)", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: MOCK.risk_color, marginBottom: "1rem" }}>
                Validated Result
              </div>
              <div style={{ overflow: "hidden", marginBottom: 4 }}>
                <motion.div initial={{ y: "100%" }} animate={{ y: "0%" }} transition={{ duration: 0.85, delay: 0.1 }}>
                  <h1 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: "clamp(3.5rem, 8vw, 6rem)", fontWeight: 600, letterSpacing: "-0.06em", color: MOCK.risk_color, lineHeight: 1.0, margin: 0 }}>
                    {MOCK.risk_word}
                  </h1>
                </motion.div>
              </div>
              <div style={{ overflow: "hidden" }}>
                <motion.div initial={{ y: "100%" }} animate={{ y: "0%" }} transition={{ duration: 0.85, delay: 0.2 }}>
                  <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.5rem, 4vw, 2.5rem)", fontWeight: 400, letterSpacing: "-0.03em", color: "var(--text-muted)", lineHeight: 1.1, margin: 0 }}>
                    RISK
                  </h2>
                </motion.div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", minWidth: 160 }}>
              <div>
                <div style={{ fontFamily: "var(--font-ui)", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>
                  Confidence
                </div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "2rem", fontWeight: 700, letterSpacing: "-0.05em", color: "var(--text-primary)", lineHeight: 1, marginBottom: 8 }}>
                  {scorePercent}%
                </div>
                <div style={{ height: 4, background: "var(--bg-inset)", borderRadius: 999, overflow: "hidden" }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${scorePercent}%` }} transition={{ duration: 1.2 }}
                    style={{ background: MOCK.risk_color, height: "100%", borderRadius: 999 }} />
                </div>
              </div>
              <div>
                <div style={{ fontFamily: "var(--font-ui)", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8 }}>
                  Trajectory
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-ui)", fontSize: "0.9rem", fontWeight: 700, color: MOCK.risk_color }}>
                  <TrendingDown size={16} strokeWidth={2} /> {MOCK.trajectory}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Assessment Summary */}
      <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.1 }}>
        <div className="card" style={{ padding: "2rem", borderTop: `3px solid ${MOCK.risk_color}`, marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1.5rem" }}>
            <Shield size={14} color={MOCK.risk_color} strokeWidth={1.5} />
            <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: MOCK.risk_color }}>
              Assessment Summary
            </span>
          </div>
          <div style={{ fontFamily: "var(--font-body)", fontSize: "1rem", lineHeight: 1.8, color: "var(--text-secondary)", fontWeight: 300, whiteSpace: "pre-line" }}>
            {MOCK.patient_explanation}
          </div>
        </div>
      </motion.div>

      {/* Do's and Don'ts */}
      <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.2 }}
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
        <div className="card" style={{ padding: "2rem", borderTop: "3px solid var(--risk-low, #22c55e)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1.5rem" }}>
            <CheckCircle size={14} color="var(--risk-low, #22c55e)" strokeWidth={1.5} />
            <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--risk-low, #22c55e)" }}>
              Recommended Actions
            </span>
          </div>
          <ul style={{ display: "flex", flexDirection: "column", gap: 12, listStyle: "none" }}>
            {MOCK.dos.map((item, i) => (
              <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, fontFamily: "var(--font-body)", fontSize: "0.95rem", color: "var(--text-secondary)", lineHeight: 1.65, fontWeight: 300 }}>
                <Check size={15} color="var(--risk-low, #22c55e)" style={{ flexShrink: 0, marginTop: 4 }} strokeWidth={1.5} />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="card" style={{ padding: "2rem", borderTop: "3px solid var(--risk-critical, #ef4444)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1.5rem" }}>
            <XCircle size={14} color="var(--risk-critical, #ef4444)" strokeWidth={1.5} />
            <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--risk-critical, #ef4444)" }}>
              Things to Avoid
            </span>
          </div>
          <ul style={{ display: "flex", flexDirection: "column", gap: 12, listStyle: "none" }}>
            {MOCK.donts.map((item, i) => (
              <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, fontFamily: "var(--font-body)", fontSize: "0.95rem", color: "var(--text-secondary)", lineHeight: 1.65, fontWeight: 300 }}>
                <XIcon size={15} color="var(--risk-critical, #ef4444)" style={{ flexShrink: 0, marginTop: 4 }} strokeWidth={1.5} />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </motion.div>

      {/* Warning Signs */}
      <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.3 }}
        style={{ marginBottom: "2rem" }}>
        <div className="card" style={{ padding: "2rem", borderTop: "3px solid var(--risk-critical, #ef4444)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1.5rem" }}>
            <AlertOctagon size={14} color="var(--risk-critical, #ef4444)" strokeWidth={1.5} />
            <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--risk-critical, #ef4444)" }}>
              Warning Signs — Seek Medical Help If...
            </span>
          </div>
          <ul style={{ display: "flex", flexDirection: "column", gap: 10, listStyle: "none" }}>
            {MOCK.warning_signs.map((item, i) => (
              <motion.li key={i} initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                style={{ display: "flex", alignItems: "flex-start", gap: 12, fontFamily: "var(--font-body)", fontSize: "0.95rem", color: "var(--risk-critical, #ef4444)", lineHeight: 1.65, fontWeight: 500 }}>
                <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 4 }} />
                {item}
              </motion.li>
            ))}
          </ul>
        </div>
      </motion.div>

      {/* Action buttons */}
      <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.35 }}>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", paddingTop: "1rem" }}>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="btn btn-secondary"
            onClick={() => navigate("/find-doctors", { state: { autoSelectNearest: true, triggerCall: true } })}
            style={{ gap: 8, color: "#ef4444", borderColor: "rgba(239,68,68,0.3)" }}>
            <MapPin size={16} strokeWidth={1.5} />
            Find Nearest Doctor
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="btn btn-secondary"
            onClick={() => navigate("/dashboard")}
            style={{ gap: 8 }}>
            Return to Dashboard
          </motion.button>
        </div>
      </motion.div>

      {/* Critical Alert Banner */}
      {!dismissed && (
        <CriticalAlertBanner
          scorePercent={scorePercent}
          onDismiss={() => setDismissed(true)}
          onAction={() => {
            setDismissed(true);
            navigate("/find-doctors", { state: { autoSelectNearest: true, triggerCall: true } });
          }}
        />
      )}
    </div>
  );
}
