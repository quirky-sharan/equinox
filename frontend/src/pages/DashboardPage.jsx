import { useNavigate } from "react-router-dom";
import { motion, useMotionValue, useTransform, animate, useInView } from "framer-motion";
import { useAuthStore } from "../store/authStore";
import { useSessionStore } from "../store/sessionStore";
import { useQuery } from "@tanstack/react-query";
import { sessionApi } from "../api/endpoints";
import {
  Activity, Clock, TrendingUp, ChevronRight, Shield, Zap, Eye,
  ArrowRight, MessageSquare, GitBranch, BarChart2, Mic
} from "lucide-react";
import { format } from "date-fns";
import { useEffect, useRef } from "react";

/* ─── Animated Counter ─────────────────────────────────────────── */
function AnimatedCounter({ value, duration = 2 }) {
  const ref = useRef(null);
  const mv = useMotionValue(0);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const controls = animate(mv, value, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = Math.round(v);
      },
    });
    return controls.stop;
  }, [inView, value, duration, mv]);

  return <span ref={ref}>{value}</span>;
}

/* ─── Greeting ──────────────────────────────────────────────────── */
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

/* ─── Stat Card ─────────────────────────────────────────────────── */
function StatCard({ label, value, sub, color, icon: Icon, delay = 0, isCounter = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className="card"
      style={{ padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "0.7rem",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
          }}
        >
          {label}
        </div>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "var(--radius-sm)",
            background: "var(--bg-subtle)",
            border: "1px solid var(--border-color)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={15} color={color || "var(--text-muted)"} strokeWidth={1.5} />
        </div>
      </div>

      <div>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "2.25rem",
            fontWeight: 700,
            letterSpacing: "-0.05em",
            color: color || "var(--text-primary)",
            lineHeight: 1,
            marginBottom: 6,
          }}
        >
          {isCounter ? <AnimatedCounter value={value} /> : value}
        </div>
        {sub && (
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "0.82rem",
              color: "var(--text-muted)",
            }}
          >
            {sub}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Feature Row Item ───────────────────────────────────────────── */
function FeatureRow({ icon: Icon, title, desc, index }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -16 }}
      animate={inView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      style={{
        display: "flex",
        gap: "1.25rem",
        alignItems: "flex-start",
        padding: "1.25rem 0",
        borderBottom: "1px solid var(--border-color)",
        cursor: "default",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: "var(--bg-subtle)",
          border: "1px solid var(--border-color)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginTop: 2,
        }}
      >
        <Icon size={16} color="var(--text-secondary)" strokeWidth={1.5} />
      </div>
      <div>
        <div
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "0.9rem",
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: 4,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.88rem",
            color: "var(--text-secondary)",
            lineHeight: 1.6,
            fontWeight: 300,
          }}
        >
          {desc}
        </div>
      </div>
    </motion.div>
  );
}

const RISK_COLORS = {
  low: "var(--risk-low)",
  medium: "var(--risk-medium)",
  high: "var(--risk-high)",
  critical: "var(--risk-critical)",
};

const FEATURES = [
  { icon: MessageSquare, title: "Adaptive Interview Engine", desc: "Dynamic clinical questions — not a static form. The system decides what to ask next based on your previous responses." },
  { icon: Eye, title: "Behavioral Pattern Analysis", desc: "Captures how you write, not just what you write. Hesitation, emphasis, and word choice are processed as clinical data." },
  { icon: Shield, title: "Bayesian Risk Inference", desc: "Calibrated probabilistic assessment across 14,000+ conditions. Every output includes a confidence-weighted audit trail." },
  { icon: Mic, title: "Natural Speech Input", desc: "Speak your symptoms naturally. The engine transcribes and interprets conversational descriptions with full accuracy." },
  { icon: GitBranch, title: "Differential Diagnosis", desc: "Generates ranked differentials with ICD-10 codes and confidence intervals — formatted for physician review." },
  { icon: TrendingUp, title: "Temporal Health Tracking", desc: "Compares sessions over time to detect escalating patterns before they reach clinical thresholds." },
];

/* ─── Main ──────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { data: historyData } = useQuery({
    queryKey: ["history"],
    queryFn: () => sessionApi.getHistory().then((r) => r.data),
  });

  const history = historyData || [];
  const lastSession = history[0];
  const firstName = user?.full_name?.split(" ")[0] || "there";

  // Preload next session
  useEffect(() => {
    useSessionStore.getState().preloadSession().catch(() => { });
  }, []);

  return (
    <div className="page-container" style={{ position: "relative" }}>

      {/* ── HERO GREETING ──────────────────────────────────────────── */}
      <div style={{ marginBottom: "5rem", marginTop: "2rem" }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "0.75rem",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--text-muted)",
              marginBottom: "1.25rem",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--risk-low)",
              }}
            />
            {greeting()}, {firstName}
          </div>
        </motion.div>

        <div style={{ overflow: "hidden", marginBottom: "0.25rem" }}>
          <motion.h1
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: "0%", opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(2.75rem, 6vw, 4.5rem)",
              fontWeight: 700,
              letterSpacing: "-0.05em",
              lineHeight: 1.0,
              color: "var(--text-primary)",
              margin: 0,
            }}
          >
            Clinical intelligence,
          </motion.h1>
        </div>
        <div style={{ overflow: "hidden", marginBottom: "2rem" }}>
          <motion.h1
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: "0%", opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
              fontSize: "clamp(2.75rem, 6vw, 4.5rem)",
              fontWeight: 400,
              letterSpacing: "-0.04em",
              lineHeight: 1.0,
              color: "var(--text-muted)",
              margin: 0,
            }}
          >
            personalized to you.
          </motion.h1>
        </div>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "1.05rem",
            color: "var(--text-secondary)",
            lineHeight: 1.75,
            maxWidth: 500,
            marginBottom: "2.5rem",
            fontWeight: 300,
          }}
        >
          Pulse transforms your conversational descriptions into high-fidelity
          clinical signals — giving you a clear picture of your health with
          physician-grade reasoning behind every inference.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.button
            className="btn btn-primary btn-lg"
            onClick={() => navigate("/interview")}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{ gap: 10 }}
          >
            <Activity size={18} strokeWidth={1.5} />
            Begin assessment
            <ArrowRight size={18} strokeWidth={2} />
          </motion.button>
        </motion.div>
      </div>

      {/* ── STATS ─────────────────────────────────────────────────── */}
      {history.length > 0 && (
        <div className="grid-3" style={{ marginBottom: "2.5rem" }}>
          <StatCard
            label="Total Assessments"
            value={history.length}
            sub="sessions completed"
            icon={BarChart2}
            delay={0}
            isCounter
          />
          <StatCard
            label="Last Risk Tier"
            value={lastSession?.risk_tier?.toUpperCase() || "—"}
            sub={lastSession?.top_condition || ""}
            icon={Shield}
            color={RISK_COLORS[lastSession?.risk_tier]}
            delay={0.1}
          />
          <StatCard
            label="Last Session"
            value={
              lastSession?.created_at
                ? format(new Date(lastSession.created_at), "MMM d")
                : "—"
            }
            sub={
              lastSession?.created_at
                ? format(new Date(lastSession.created_at), "yyyy")
                : ""
            }
            icon={Clock}
            delay={0.2}
          />
        </div>
      )}

      {/* ── LAST SESSION CTA ──────────────────────────────────────── */}
      {lastSession && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
            flexWrap: "wrap",
            padding: "1.5rem",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-lg)",
            background: "var(--bg-card)",
            marginBottom: "4rem",
            transition: "border-color 0.25s",
          }}
          whileHover={{ borderColor: "var(--border-strong)" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: "var(--bg-subtle)",
                border: "1px solid var(--border-color)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Activity size={18} color="var(--text-muted)" strokeWidth={1.5} />
            </div>
            <div>
              <div
                style={{
                  fontFamily: "var(--font-ui)",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                  marginBottom: 4,
                }}
              >
                Last Assessment
              </div>
              <div
                style={{
                  fontFamily: "var(--font-body)",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  color: "var(--text-primary)",
                }}
              >
                {lastSession.top_condition || "Assessment completed"}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "0.82rem",
                  color: "var(--text-muted)",
                  marginTop: 2,
                }}
              >
                {lastSession.created_at ? format(new Date(lastSession.created_at), "PPP") : ""}
              </div>
            </div>
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => navigate(`/result/${lastSession.session_id}`)}
            style={{ gap: 6, flexShrink: 0 }}
          >
            View results <ChevronRight size={14} />
          </button>
        </motion.div>
      )}

      {/* ── CAPABILITIES ──────────────────────────────────────────── */}
      <div style={{ marginBottom: "5rem" }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.7 }}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: "0.5rem",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "0.7rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--text-muted)",
                marginBottom: "0.75rem",
              }}
            >
              Platform capabilities
            </div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.5rem",
                fontWeight: 600,
                letterSpacing: "-0.03em",
                color: "var(--text-primary)",
              }}
            >
              What Pulse evaluates
            </div>
          </div>
        </motion.div>

        <div style={{ borderTop: "1px solid var(--border-color)", marginTop: "0.5rem" }}>
          {FEATURES.map((f, i) => (
            <FeatureRow key={i} index={i} {...f} />
          ))}
        </div>
      </div>

      {/* ── HISTORY PREVIEW ───────────────────────────────────────── */}
      {history.length > 1 && (
        <div style={{ marginBottom: "4rem" }}>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: "1.5rem",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.25rem",
                  fontWeight: 600,
                  letterSpacing: "-0.03em",
                  color: "var(--text-primary)",
                }}
              >
                Recent sessions
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => navigate("/history")}
                style={{ gap: 4, color: "var(--text-muted)", fontSize: "0.8rem" }}
              >
                View all <ChevronRight size={14} />
              </button>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-lg)",
                overflow: "hidden",
              }}
            >
              {history.slice(0, 4).map((session, i) => (
                <motion.button
                  key={session.session_id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.07 }}
                  onClick={() => navigate(`/result/${session.session_id}`)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "1rem",
                    padding: "1rem 1.5rem",
                    background: "var(--bg-card)",
                    border: "none",
                    borderBottom: i < history.slice(0, 4).length - 1 ? "1px solid var(--border-color)" : "none",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "background 0.15s",
                    width: "100%",
                  }}
                  whileHover={{ background: "var(--bg-card-hover)" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: RISK_COLORS[session.risk_tier] || "var(--text-muted)",
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <div
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "0.9rem",
                          fontWeight: 600,
                          color: "var(--text-primary)",
                        }}
                      >
                        {session.top_condition || "Completed assessment"}
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "0.78rem",
                          color: "var(--text-muted)",
                          marginTop: 2,
                        }}
                      >
                        {session.created_at ? format(new Date(session.created_at), "PPP") : ""}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
                    <div
                      style={{
                        fontFamily: "var(--font-ui)",
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        color: RISK_COLORS[session.risk_tier] || "var(--text-muted)",
                      }}
                    >
                      {session.risk_tier}
                    </div>
                    <ChevronRight size={14} color="var(--text-muted)" />
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* ── DISCLAIMER ────────────────────────────────────────────── */}
      <div
        style={{
          paddingTop: "2rem",
          borderTop: "1px solid var(--border-color)",
          fontFamily: "var(--font-body)",
          fontSize: "0.8rem",
          color: "var(--text-muted)",
          lineHeight: 1.6,
          textAlign: "center",
        }}
      >
        Pulse is an informational probabilistic engine. Always consult a qualified
        healthcare provider for final medical diagnostics.
      </div>
    </div>
  );
}