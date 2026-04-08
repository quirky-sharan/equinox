import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { sessionApi } from "../api/endpoints";
import {
  Shield, AlertTriangle, CheckCircle, XCircle,
  TrendingUp, TrendingDown, Minus, Activity, MessageSquare,
  ChevronRight, MapPin, FileText, Check, X as XIcon,
  Heart, Utensils, Leaf, Zap, AlertOctagon, ArrowRight,
} from "lucide-react";
import WellnessNudge from "../components/WellnessNudge";
import FeedbackModal from "../components/FeedbackModal";
import api from "../api/client";

/* ─── Config maps ───────────────────────────────────────────────── */
const RISK_CONFIG = {
  low: { color: "var(--risk-low)", icon: CheckCircle, label: "Low Risk", word: "LOW" },
  medium: { color: "var(--risk-medium)", icon: AlertTriangle, label: "Medium Risk", word: "MEDIUM" },
  high: { color: "var(--risk-high)", icon: AlertTriangle, label: "High Risk", word: "HIGH" },
  critical: { color: "var(--risk-critical)", icon: XCircle, label: "Critical", word: "CRITICAL" },
};

const TRAJECTORY_CONFIG = {
  stable: { icon: Minus, color: "var(--risk-low)", label: "Stable" },
  worsening: { icon: TrendingDown, color: "var(--risk-critical)", label: "Worsening" },
  improving: { icon: TrendingUp, color: "var(--accent-blue)", label: "Improving" },
  new_onset: { icon: Activity, color: "var(--risk-medium)", label: "New Onset" },
};

/* ─── Animated progress bar ─────────────────────────────────────── */
function ConfidenceBar({ value, color, delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <div ref={ref} className="progress-bar-track" style={{ height: 4, background: "var(--bg-inset)", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
      <motion.div
        className="progress-bar-fill"
        initial={{ width: 0 }}
        animate={inView ? { width: `${(value || 0) * 100}%` } : {}}
        transition={{ duration: 1.2, delay, ease: [0.16, 1, 0.3, 1] }}
        style={{ background: color || "var(--accent-blue)", height: "100%", borderRadius: "var(--radius-full)" }}
      />
    </div>
  );
}

/* ─── Section wrapper ─────────────────────────────────────────────── */
function Section({ children, delay = 0, style = {} }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      style={style}
    >
      {children}
    </motion.div>
  );
}

/* ─── Section header ──────────────────────────────────────────────── */
function SectionHeader({ icon: Icon, label, color = "var(--text-muted)" }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        marginBottom: "1.5rem",
      }}
    >
      <Icon size={14} color={color} strokeWidth={1.5} />
      <span
        style={{
          fontFamily: "var(--font-ui)",
          fontSize: "0.68rem",
          fontWeight: 700,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color,
        }}
      >
        {label}
      </span>
    </div>
  );
}

/* ─── List item ───────────────────────────────────────────────────── */
function ListItem({ icon: Icon, color, text, index }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <motion.li
      ref={ref}
      initial={{ opacity: 0, x: -8 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.06, ease: "easeOut" }}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        fontFamily: "var(--font-body)",
        fontSize: "0.95rem",
        color: "var(--text-secondary)",
        lineHeight: 1.65,
        fontWeight: 300,
      }}
    >
      <Icon
        size={15}
        color={color}
        style={{ flexShrink: 0, marginTop: 4 }}
        strokeWidth={1.5}
      />
      {text}
    </motion.li>
  );
}

/* ─── View mode pill ──────────────────────────────────────────────── */
function ModePill({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "7px 20px",
        borderRadius: "var(--radius-full)",
        border: "none",
        background: active ? "var(--bg-card)" : "transparent",
        color: active ? "var(--text-primary)" : "var(--text-muted)",
        cursor: "pointer",
        fontFamily: "var(--font-ui)",
        fontWeight: 700,
        fontSize: "0.82rem",
        letterSpacing: "0.02em",
        transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        boxShadow: active ? "var(--shadow-sm)" : "none",
        border: active ? "1px solid var(--border-color)" : "1px solid transparent",
      }}
    >
      {children}
    </button>
  );
}

/* ─── Main ──────────────────────────────────────────────────────── */
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

  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState(false);

  // Check if feedback already exists (don't auto-open modal)
  useQuery({
    queryKey: ["feedback", sessionId],
    queryFn: async () => {
      try {
        const res = await api.get(`/feedback/${sessionId}`);
        if (res.data) setFeedbackGiven(true);
        return res.data;
      } catch (e) {
        // No feedback yet — that's fine, user can give it from the button
        return null;
      }
    },
    enabled: !!data,
  });

  /* Loading */
  if (isLoading) {
    return (
      <div className="page-center" style={{ flexDirection: "column", gap: 20 }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: "1.5px solid var(--border-color)",
            borderTopColor: "var(--text-primary)",
          }}
        />
        <p
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "0.8rem",
            color: "var(--text-muted)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          Synthesizing clinical results
        </p>
      </div>
    );
  }

  /* Error */
  if (error) {
    return (
      <div className="page-center">
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "var(--risk-critical)", marginBottom: 16, fontFamily: "var(--font-body)" }}>
            The clinical engine failed to retrieve the result set.
          </p>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate("/dashboard")}>
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const risk = RISK_CONFIG[data?.risk_tier] || RISK_CONFIG.medium;
  const traj = TRAJECTORY_CONFIG[data?.trajectory] || TRAJECTORY_CONFIG.stable;
  const RiskIcon = risk.icon;
  const TrajIcon = traj.icon;

  const scorePercent = Math.round((data?.risk_score || 0.5) * 100);

  return (
    <div className="page-container" style={{ maxWidth: 860 }}>

      {/* ── TOP BAR ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "4rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        {/* Session ID + icon */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "var(--bg-subtle)",
              border: "1px solid var(--border-color)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Activity size={18} color="var(--text-secondary)" strokeWidth={1.5} />
          </div>
          <div>
            <div
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "var(--text-primary)",
                letterSpacing: "-0.01em",
              }}
            >
              Inference Report
            </div>
            <div
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "0.68rem",
                color: "var(--text-muted)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Session {sessionId?.slice(0, 8)}
            </div>
          </div>
        </div>

        {/* View mode toggle */}
        <div
          style={{
            display: "inline-flex",
            background: "var(--bg-subtle)",
            borderRadius: "var(--radius-full)",
            padding: 4,
            border: "1px solid var(--border-color)",
            gap: 2,
          }}
        >
          <ModePill active={viewMode === "patient"} onClick={() => setViewMode("patient")}>
            Patient
          </ModePill>
          <ModePill active={viewMode === "doctor"} onClick={() => setViewMode("doctor")}>
            Clinical
          </ModePill>
        </div>
      </motion.div>

      {/* ── RISK TIER HERO ────────────────────────────────────────── */}
      <Section>
        <div
          style={{
            padding: "3.5rem 2.5rem",
            marginBottom: "2rem",
            border: "1px solid var(--border-color)",
            borderTop: `4px solid ${risk.color}`,
            borderRadius: "var(--radius-lg)",
            background: "var(--bg-card)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: "2rem",
            }}
          >
            {/* Large typographic risk tier */}
            <div>
              <div
                style={{
                  fontFamily: "var(--font-ui)",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: risk.color,
                  marginBottom: "1rem",
                }}
              >
                Validated Result
              </div>

              <div style={{ overflow: "hidden", marginBottom: 4 }}>
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: "0%" }}
                  transition={{ duration: 0.85, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                >
                  <h1
                    style={{
                      fontFamily: "var(--font-display)",
                      fontStyle: "italic",
                      fontSize: "clamp(3.5rem, 8vw, 6rem)",
                      fontWeight: 600,
                      letterSpacing: "-0.06em",
                      color: risk.color,
                      lineHeight: 1.0,
                      margin: 0,
                    }}
                  >
                    {risk.word}
                  </h1>
                </motion.div>
              </div>
              <div style={{ overflow: "hidden" }}>
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: "0%" }}
                  transition={{ duration: 0.85, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                >
                  <h2
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
                      fontWeight: 400,
                      letterSpacing: "-0.03em",
                      color: "var(--text-muted)",
                      lineHeight: 1.1,
                      margin: 0,
                    }}
                  >
                    RISK
                  </h2>
                </motion.div>
              </div>
            </div>

            {/* Right side: metrics */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1.5rem",
                minWidth: 160,
              }}
            >
              {/* Confidence */}
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-ui)",
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                    marginBottom: 8,
                  }}
                >
                  Confidence
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "2rem",
                    fontWeight: 700,
                    letterSpacing: "-0.05em",
                    color: "var(--text-primary)",
                    lineHeight: 1,
                    marginBottom: 8,
                  }}
                >
                  {scorePercent}%
                </div>
                <ConfidenceBar value={data?.risk_score || 0.5} color={risk.color} />
              </div>

              {/* Trajectory */}
              {traj && (
                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-ui)",
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "var(--text-muted)",
                      marginBottom: 8,
                    }}
                  >
                    Trajectory
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontFamily: "var(--font-ui)",
                      fontSize: "0.9rem",
                      fontWeight: 700,
                      color: traj.color,
                    }}
                  >
                    <TrajIcon size={16} strokeWidth={2} />
                    {traj.label}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Section>

      {/* ── DIFFERENTIAL DIAGNOSIS (doctor only) ─────────────────── */}
      <AnimatePresence mode="wait">
        {viewMode === "doctor" && (data?.top_conditions || []).length > 0 && (
          <Section delay={0.05} style={{ marginBottom: "2rem" }}>
            <div
              className="card"
              style={{ padding: "2rem" }}
            >
              <SectionHeader icon={Activity} label="Differential Diagnosis" color="var(--accent-blue)" />
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {(data?.top_conditions || []).map((cond, i) => (
                  <div key={i}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                        marginBottom: 6,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-body)",
                          fontWeight: 600,
                          fontSize: "0.95rem",
                          color: "var(--text-primary)",
                        }}
                      >
                        {cond.name}
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-display)",
                          fontWeight: 700,
                          fontSize: "1rem",
                          color: i === 0 ? "var(--accent-blue)" : "var(--text-muted)",
                          letterSpacing: "-0.02em",
                        }}
                      >
                        {((cond.confidence || 0) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <ConfidenceBar
                      value={cond.confidence || 0}
                      color={i === 0 ? "var(--accent-blue)" : "var(--border-strong)"}
                      delay={0.3 + i * 0.1}
                    />
                    {cond.icd10 && (
                      <div
                        style={{
                          fontFamily: "var(--font-ui)",
                          fontSize: "0.68rem",
                          color: "var(--text-muted)",
                          marginTop: 6,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                        }}
                      >
                        ICD-10: {cond.icd10}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Section>
        )}
      </AnimatePresence>

      {/* ── ASSESSMENT SUMMARY / INFERENCE LOGIC ─────────────────── */}
      <Section delay={0.1} style={{ marginBottom: "2rem" }}>
        <div
          className="card"
          style={{ padding: "2rem", borderTop: `3px solid ${risk.color}` }}
        >
          <SectionHeader
            icon={Shield}
            label={viewMode === "patient" ? "Assessment Summary" : "Inference Logic"}
            color={risk.color}
          />
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "1rem",
              lineHeight: 1.8,
              color: "var(--text-secondary)",
              fontWeight: 300,
              whiteSpace: "pre-line",
            }}
          >
            {viewMode === "patient"
              ? data?.patient_explanation || data?.recommended_action
              : data?.doctor_explanation || data?.recommended_action}
          </div>
        </div>
      </Section>

      {/* ── REASONING CHAIN (doctor only) ────────────────────────── */}
      {viewMode === "doctor" && (data?.reasoning_chain || []).length > 0 && (
        <Section delay={0.15} style={{ marginBottom: "2rem" }}>
          <div className="card" style={{ padding: "2rem" }}>
            <SectionHeader icon={ChevronRight} label="Analytic Traversal" />
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {data.reasoning_chain.map((step, i) => (
                <div key={i} style={{ display: "flex", gap: "1.25rem" }}>
                  <div
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "1.1rem",
                      fontWeight: 700,
                      color: "var(--border-strong)",
                      fontVariantNumeric: "tabular-nums",
                      flexShrink: 0,
                      width: 24,
                      letterSpacing: "-0.03em",
                      lineHeight: 1.6,
                    }}
                  >
                    {(i + 1).toString().padStart(2, "0")}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "0.95rem",
                      color: "var(--text-secondary)",
                      lineHeight: 1.7,
                      fontWeight: 300,
                      paddingBottom: "1rem",
                      borderBottom: i < data.reasoning_chain.length - 1 ? "1px solid var(--border-color)" : "none",
                      flex: 1,
                    }}
                  >
                    {step}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>
      )}

      {/* ── NUANCE CAPTURE (doctor only) ─────────────────────────── */}
      {viewMode === "doctor" && (data?.behavioral_flags || []).length > 0 && (
        <Section delay={0.15} style={{ marginBottom: "2rem" }}>
          <div className="card" style={{ padding: "2rem" }}>
            <SectionHeader icon={MessageSquare} label="Behavioral Signal Capture" />
            <ul style={{ display: "flex", flexDirection: "column", gap: 10, listStyle: "none" }}>
              {data.behavioral_flags.map((flag, i) => (
                <ListItem key={i} icon={ChevronRight} color="var(--accent-blue)" text={flag} index={i} />
              ))}
            </ul>
          </div>
        </Section>
      )}

      {/* ── MENTAL WELLNESS (patient only) ───────────────────────── */}
      {viewMode === "patient" && mentalState?.distress_detected && (
        <Section delay={0.15} style={{ marginBottom: "2rem" }}>
          <div
            className="card"
            style={{ padding: "2rem", borderTop: "3px solid #7c3aed" }}
          >
            <SectionHeader icon={Heart} label="Mental Wellness Support" color="#7c3aed" />
            <p
              style={{
                fontFamily: "var(--font-body)",
                color: "var(--text-secondary)",
                fontSize: "1rem",
                lineHeight: 1.75,
                fontWeight: 300,
                marginBottom: "1.5rem",
              }}
            >
              {mentalState.wellness_nudge ||
                "We noticed you may be going through a difficult time. Your mental wellbeing matters as much as your physical health."}
            </p>
            <a
              href="https://icallhelpline.org"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
              style={{ color: "#7c3aed", borderColor: "rgba(124, 58, 237, 0.3)" }}
            >
              Find a counselor or helpline →
            </a>
          </div>
        </Section>
      )}

      {/* ── DO'S AND DON'TS ───────────────────────────────────────── */}
      {((data?.dos || []).length > 0 || (data?.donts || []).length > 0) && (
        <Section
          delay={0.2}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "1.5rem",
            marginBottom: "2rem",
          }}
        >
          {(data?.dos || []).length > 0 && (
            <div className="card" style={{ padding: "2rem", borderTop: "3px solid var(--risk-low)" }}>
              <SectionHeader icon={CheckCircle} label="Recommended Actions" color="var(--risk-low)" />
              <ul style={{ display: "flex", flexDirection: "column", gap: 12, listStyle: "none" }}>
                {data.dos.map((item, i) => (
                  <ListItem key={i} icon={Check} color="var(--risk-low)" text={item} index={i} />
                ))}
              </ul>
            </div>
          )}
          {(data?.donts || []).length > 0 && (
            <div className="card" style={{ padding: "2rem", borderTop: "3px solid var(--risk-critical)" }}>
              <SectionHeader icon={XCircle} label="Things to Avoid" color="var(--risk-critical)" />
              <ul style={{ display: "flex", flexDirection: "column", gap: 12, listStyle: "none" }}>
                {data.donts.map((item, i) => (
                  <ListItem key={i} icon={XIcon} color="var(--risk-critical)" text={item} index={i} />
                ))}
              </ul>
            </div>
          )}
        </Section>
      )}

      {/* ── HOME REMEDIES ─────────────────────────────────────────── */}
      {(data?.home_remedies || []).length > 0 && (
        <Section delay={0.2} style={{ marginBottom: "2rem" }}>
          <div className="card" style={{ padding: "2rem", borderTop: "3px solid var(--accent-blue)" }}>
            <SectionHeader icon={Leaf} label="Home Remedies" color="var(--accent-blue)" />
            <ul style={{ display: "flex", flexDirection: "column", gap: 10, listStyle: "none" }}>
              {data.home_remedies.map((item, i) => (
                <ListItem key={i} icon={Leaf} color="var(--accent-blue)" text={item} index={i} />
              ))}
            </ul>
          </div>
        </Section>
      )}

      {/* ── DIETARY GUIDELINES ────────────────────────────────────── */}
      {data?.dietary_guidelines && (
        <Section
          delay={0.25}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "1.25rem",
            marginBottom: "2rem",
          }}
        >
          {data.dietary_guidelines.eat?.length > 0 && (
            <div className="card" style={{ padding: "1.75rem", borderTop: "3px solid var(--risk-low)" }}>
              <SectionHeader icon={Utensils} label="Eat" color="var(--risk-low)" />
              <ul style={{ display: "flex", flexDirection: "column", gap: 8, listStyle: "none" }}>
                {data.dietary_guidelines.eat.map((item, i) => (
                  <ListItem key={i} icon={Check} color="var(--risk-low)" text={item} index={i} />
                ))}
              </ul>
            </div>
          )}
          {data.dietary_guidelines.drink?.length > 0 && (
            <div className="card" style={{ padding: "1.75rem", borderTop: "3px solid var(--accent-blue)" }}>
              <SectionHeader icon={Zap} label="Drink" color="var(--accent-blue)" />
              <ul style={{ display: "flex", flexDirection: "column", gap: 8, listStyle: "none" }}>
                {data.dietary_guidelines.drink.map((item, i) => (
                  <ListItem key={i} icon={Check} color="var(--accent-blue)" text={item} index={i} />
                ))}
              </ul>
            </div>
          )}
          {data.dietary_guidelines.avoid?.length > 0 && (
            <div className="card" style={{ padding: "1.75rem", borderTop: "3px solid var(--risk-high)" }}>
              <SectionHeader icon={XIcon} label="Avoid" color="var(--risk-high)" />
              <ul style={{ display: "flex", flexDirection: "column", gap: 8, listStyle: "none" }}>
                {data.dietary_guidelines.avoid.map((item, i) => (
                  <ListItem key={i} icon={XIcon} color="var(--risk-high)" text={item} index={i} />
                ))}
              </ul>
            </div>
          )}
        </Section>
      )}

      {/* ── LIFESTYLE MODIFICATIONS ───────────────────────────────── */}
      {(data?.lifestyle_modifications || []).length > 0 && (
        <Section delay={0.25} style={{ marginBottom: "2rem" }}>
          <div className="card" style={{ padding: "2rem", borderTop: "3px solid #7c3aed" }}>
            <SectionHeader icon={TrendingUp} label="Lifestyle Modifications" color="#7c3aed" />
            <ul style={{ display: "flex", flexDirection: "column", gap: 10, listStyle: "none" }}>
              {data.lifestyle_modifications.map((item, i) => (
                <ListItem key={i} icon={ChevronRight} color="#7c3aed" text={item} index={i} />
              ))}
            </ul>
          </div>
        </Section>
      )}

      {/* ── WARNING SIGNS ─────────────────────────────────────────── */}
      {(data?.warning_signs || []).length > 0 && (
        <Section delay={0.3} style={{ marginBottom: "2rem" }}>
          <div
            className="card"
            style={{ padding: "2rem", borderTop: "3px solid var(--risk-critical)" }}
          >
            <SectionHeader icon={AlertOctagon} label="Warning Signs — Seek Medical Help If..." color="var(--risk-critical)" />
            <ul style={{ display: "flex", flexDirection: "column", gap: 10, listStyle: "none" }}>
              {data.warning_signs.map((item, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    fontFamily: "var(--font-body)",
                    fontSize: "0.95rem",
                    color: "var(--risk-critical)",
                    lineHeight: 1.65,
                    fontWeight: 500,
                  }}
                >
                  <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 4 }} />
                  {item}
                </motion.li>
              ))}
            </ul>
          </div>
        </Section>
      )}

      {/* ── ACTION BUTTONS ────────────────────────────────────────── */}
      <Section delay={0.35}>
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            flexWrap: "wrap",
            paddingTop: "1rem",
          }}
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn btn-primary"
            onClick={() => navigate("/interview")}
            style={{ gap: 8 }}
          >
            <Activity size={16} strokeWidth={1.5} />
            New Assessment
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn btn-secondary"
            onClick={() => navigate("/history")}
            style={{ gap: 8 }}
          >
            Session History
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn btn-secondary"
            onClick={() => navigate("/find-doctors")}
            style={{ gap: 8, color: "var(--accent-blue)", borderColor: "rgba(26, 110, 247, 0.25)" }}
          >
            <MapPin size={16} strokeWidth={1.5} />
            Find Nearest Doctor
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn btn-secondary"
            onClick={async () => {
              try {
                const res = await sessionApi.downloadReport(sessionId);
                const blob = new Blob([res.data], { type: "application/pdf" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `pulse_report_${sessionId.slice(0, 8)}.pdf`;
                a.click();
                URL.revokeObjectURL(url);
              } catch (e) {
                console.error("PDF download failed:", e);
              }
            }}
            style={{ gap: 8 }}
          >
            <FileText size={16} strokeWidth={1.5} />
            Download PDF
          </motion.button>

          {!feedbackGiven && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn btn-secondary"
              onClick={() => setIsFeedbackModalOpen(true)}
              style={{ gap: 8, color: "#7c3aed", borderColor: "rgba(124, 58, 237, 0.25)" }}
            >
              <MessageSquare size={16} strokeWidth={1.5} />
              Give Feedback
            </motion.button>
          )}
        </div>
      </Section>

      {/* ── DISCLAIMER ────────────────────────────────────────────── */}
      <div
        style={{
          marginTop: "4rem",
          paddingTop: "2rem",
          borderTop: "1px solid var(--border-color)",
          fontFamily: "var(--font-body)",
          fontSize: "0.8rem",
          color: "var(--text-muted)",
          lineHeight: 1.7,
          textAlign: "center",
        }}
      >
        Pulse is a high-fidelity informational probabilistic engine. Always consult a
        qualified clinical professional for final diagnostics. This report is not a
        substitute for medical advice.
      </div>

      <FeedbackModal
        sessionId={sessionId}
        isOpen={isFeedbackModalOpen}
        onClose={() => { setIsFeedbackModalOpen(false); setFeedbackGiven(true); }}
      />
    </div>
  );
}