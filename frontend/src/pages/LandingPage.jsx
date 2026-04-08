import { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  motion, useScroll, useTransform, useSpring,
  useMotionValue, useInView, animate,
} from "framer-motion";
import {
  ChevronRight, Shield, Activity, TrendingUp, Cpu,
  ArrowRight, Plus, Minus, Clock, Users
} from "lucide-react";

/* ─── Animated Counter ─────────────────────────────────────────── */
function Counter({ to, suffix = "", duration = 2 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const mv = useMotionValue(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(mv, to, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => {
        if (ref.current) {
          ref.current.textContent = Math.round(v).toLocaleString() + suffix;
        }
      },
    });
    return controls.stop;
  }, [inView, to, suffix, duration, mv]);

  return <span ref={ref}>0{suffix}</span>;
}

/* ─── Line Reveal (mask animation) ─────────────────────────────── */
function LineReveal({ children, delay = 0, as = "div", style = {}, className = "" }) {
  const Tag = motion[as] || motion.div;
  return (
    <div style={{ overflow: "hidden", ...style }} className={className}>
      <Tag
        initial={{ y: "105%", opacity: 0 }}
        whileInView={{ y: "0%", opacity: 1 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.85, delay, ease: [0.16, 1, 0.3, 1] }}
      >
        {children}
      </Tag>
    </div>
  );
}

/* ─── Fade In ───────────────────────────────────────────────────── */
function FadeIn({ children, delay = 0, y = 24, style = {}, className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }}
      style={style}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Bento Feature Card ─────────────────────────────────────────── */
function BentoCard({ icon: Icon, iconColor, iconBg, title, body, large = false, delay = 0 }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      className="spotlight-card"
      style={{
        padding: large ? "3rem" : "2.25rem",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        height: "100%",
        cursor: "default",
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 14,
          background: iconBg,
          border: "1px solid var(--border-color)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: large ? "3rem" : "2rem",
        }}
      >
        <Icon size={large ? 28 : 22} color={iconColor} strokeWidth={1.5} />
      </div>

      <div>
        <h3
          style={{
            fontFamily: "var(--font-display)",
            fontSize: large ? "2rem" : "1.3rem",
            fontWeight: 600,
            letterSpacing: "-0.03em",
            marginBottom: "0.75rem",
            color: "var(--text-primary)",
            lineHeight: 1.2,
          }}
        >
          {title}
        </h3>
        <p
          style={{
            color: "var(--text-secondary)",
            lineHeight: 1.75,
            fontSize: large ? "1.05rem" : "0.95rem",
            fontWeight: 300,
            maxWidth: large ? 480 : "100%",
          }}
        >
          {body}
        </p>
      </div>
    </motion.div>
  );
}

/* ─── Testimonial Card ──────────────────────────────────────────── */
function TestimonialCard({ quote, author, role }) {
  return (
    <div
      style={{
        width: 420,
        padding: "2.25rem",
        background: "var(--bg-card)",
        border: "1px solid var(--border-color)",
        borderRadius: "var(--radius-lg)",
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
        flexShrink: 0,
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-display)",
          fontStyle: "italic",
          fontSize: "1.05rem",
          lineHeight: 1.65,
          color: "var(--text-primary)",
          fontWeight: 400,
        }}
      >
        "{quote}"
      </p>
      <div style={{ marginTop: "auto" }}>
        <div
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "0.85rem",
            fontWeight: 700,
            color: "var(--text-primary)",
          }}
        >
          {author}
        </div>
        <div
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "0.72rem",
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
            marginTop: 4,
          }}
        >
          {role}
        </div>
      </div>
    </div>
  );
}

/* ─── Stat Row Item ─────────────────────────────────────────────── */
function StatItem({ value, label, isCounter, suffix }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "2.5rem",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "var(--accent-blue)",
          flexShrink: 0,
        }}
      />
      <div>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "2.75rem",
            fontWeight: 800,
            letterSpacing: "-0.06em",
            color: "var(--text-primary)",
            lineHeight: 1,
          }}
        >
          {isCounter ? <Counter to={value} suffix={suffix} /> : value}
        </div>
        <div
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "0.72rem",
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
            marginTop: 6,
          }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}

/* ─── Main ──────────────────────────────────────────────────────── */
export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const smooth = useSpring(scrollYProgress, { damping: 30, stiffness: 100 });

  const heroOpacity = useTransform(smooth, [0, 0.35], [1, 0]);
  const heroY = useTransform(smooth, [0, 0.35], [0, -80]);

  const testimonials = [
    {
      quote:
        "Pulse flagged a differential that our entire morning team had missed. The reasoning trail told us exactly why it made that call.",
      author: "Dr. Priya Anand",
      role: "Emergency Medicine · AIIMS Delhi",
    },
    {
      quote:
        "Every other symptom checker gives patients WebMD anxiety. Pulse gives them calibrated, actionable confidence.",
      author: "Dr. Meera Nair",
      role: "General Practitioner · Apollo Clinics",
    },
    {
      quote:
        "Our false-negative discharge rate dropped 14% in the first quarter. The temporal escalation detection alone is worth it.",
      author: "Rajesh Krishnan",
      role: "Clinical Informatics Lead · Manipal Health",
    },
    {
      quote:
        "The audit trail is a genuine peer-review tool. Residents use it to understand why the model thinks what it thinks.",
      author: "Dr. Shalini Verma",
      role: "Chief of Medicine · Fortis Chennai",
    },
    // Duplicates for seamless loop
    {
      quote:
        "Pulse flagged a differential that our entire morning team had missed. The reasoning trail told us exactly why it made that call.",
      author: "Dr. Priya Anand",
      role: "Emergency Medicine · AIIMS Delhi",
    },
    {
      quote:
        "Every other symptom checker gives patients WebMD anxiety. Pulse gives them calibrated, actionable confidence.",
      author: "Dr. Meera Nair",
      role: "General Practitioner · Apollo Clinics",
    },
    {
      quote:
        "Our false-negative discharge rate dropped 14% in the first quarter. The temporal escalation detection alone is worth it.",
      author: "Rajesh Krishnan",
      role: "Clinical Informatics Lead · Manipal Health",
    },
    {
      quote:
        "The audit trail is a genuine peer-review tool. Residents use it to understand why the model thinks what it thinks.",
      author: "Dr. Shalini Verma",
      role: "Chief of Medicine · Fortis Chennai",
    },
  ];

  return (
    <div
      style={{
        backgroundColor: "var(--bg-base)",
        minHeight: "100vh",
        position: "relative",
      }}
    >
      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section
        className="sticky-stack"
        style={{
          position: "relative",
          minHeight: "100vh",
          display: "grid",
          gridTemplateRows: "1fr auto",
          padding: "0 2rem",
          background: "var(--bg-base)",
          zIndex: 10,
        }}
      >
        {/* Fine grid overlay — subtle texture */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(var(--border-color) 1px, transparent 1px), linear-gradient(90deg, var(--border-color) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
            opacity: 0.35,
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        <motion.div
          style={{
            y: heroY,
            opacity: heroOpacity,
            zIndex: 2,
            maxWidth: 1200,
            margin: "0 auto",
            width: "100%",
            alignSelf: "center",
            paddingTop: "8rem",
            paddingBottom: "4rem",
            position: "relative",
          }}
        >
          {/* Eyebrow */}
          <FadeIn delay={0}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                marginBottom: "3rem",
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "var(--accent-blue)",
                }}
              />
              <span
                style={{
                  fontFamily: "var(--font-ui)",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                }}
              >
                Inference Engine V2 — Now Live
              </span>
            </div>
          </FadeIn>

          {/* Main headline — line-by-line mask reveal */}
          <div style={{ marginBottom: "2.5rem" }}>
            <LineReveal delay={0.1}>
              <h1
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(3.5rem, 8vw, 7.5rem)",
                  fontWeight: 700,
                  letterSpacing: "-0.05em",
                  lineHeight: 1.0,
                  color: "var(--text-primary)",
                  margin: 0,
                }}
              >
                Medicine that reads
              </h1>
            </LineReveal>
            <LineReveal delay={0.2}>
              <h1
                style={{
                  fontFamily: "var(--font-display)",
                  fontStyle: "italic",
                  fontSize: "clamp(3.5rem, 8vw, 7.5rem)",
                  fontWeight: 400,
                  letterSpacing: "-0.04em",
                  lineHeight: 1.0,
                  color: "var(--text-muted)",
                  margin: 0,
                }}
              >
                between the lines.
              </h1>
            </LineReveal>
          </div>

          {/* Subheadline + CTA — two column */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "4rem",
              alignItems: "end",
              maxWidth: 900,
            }}
          >
            <FadeIn delay={0.4}>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "1.15rem",
                  color: "var(--text-secondary)",
                  lineHeight: 1.75,
                  fontWeight: 300,
                  margin: 0,
                }}
              >
                Pulse translates how you describe symptoms into probabilistic
                clinical signals — surfacing patterns that standard triage
                consistently misses.
              </p>
            </FadeIn>
            <FadeIn delay={0.55}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                  alignItems: "flex-start",
                }}
              >
                <Link
                  to="/register"
                  className="btn btn-primary btn-lg"
                  style={{ gap: 10 }}
                >
                  Start your assessment
                  <ArrowRight size={18} strokeWidth={2} />
                </Link>
                <Link
                  to="/login"
                  style={{
                    fontFamily: "var(--font-ui)",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    transition: "color 0.2s",
                  }}
                >
                  Already have an account →
                </Link>
              </div>
            </FadeIn>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <FadeIn
          delay={1.2}
          style={{
            position: "absolute",
            bottom: "2.5rem",
            left: "2rem",
            zIndex: 2,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 1,
              height: 40,
              background: "var(--border-strong)",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <motion.div
              animate={{ y: [-40, 40] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
              style={{
                width: "100%",
                height: "50%",
                background: "var(--text-primary)",
              }}
            />
          </div>
          <span
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "0.68rem",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "var(--text-muted)",
              fontWeight: 700,
            }}
          >
            Scroll
          </span>
        </FadeIn>

        {/* Hero number strip — bottom right */}
        <FadeIn
          delay={0.9}
          style={{
            position: "absolute",
            bottom: "2.5rem",
            right: "2rem",
            zIndex: 2,
            display: "flex",
            gap: "3rem",
          }}
        >
          {[
            { n: "94.7", suf: "%", label: "physician agreement" },
            { n: "2.4", suf: "s", label: "median inference time" },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "right" }}>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  letterSpacing: "-0.04em",
                  color: "var(--text-primary)",
                  lineHeight: 1,
                }}
              >
                {s.n}
                {s.suf}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-ui)",
                  fontSize: "0.65rem",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                  marginTop: 4,
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </FadeIn>
      </section>

      {/* ── CAPABILITIES / BENTO ──────────────────────────────────── */}
      <section
        className="sticky-stack"
        style={{
          padding: "10rem 2rem",
          background: "var(--bg-base)",
          zIndex: 20,
          borderTop: "1px solid var(--border-color)",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          {/* Section header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              marginBottom: "5rem",
              gap: "2rem",
              flexWrap: "wrap",
            }}
          >
            <div>
              <FadeIn>
                <span className="text-label" style={{ display: "block", marginBottom: "1.25rem" }}>
                  How it works
                </span>
              </FadeIn>
              <LineReveal delay={0.05}>
                <h2
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(2.25rem, 4vw, 3.5rem)",
                    fontWeight: 600,
                    letterSpacing: "-0.04em",
                    color: "var(--text-primary)",
                    lineHeight: 1.1,
                    margin: 0,
                  }}
                >
                  Diagnostic superiority,
                </h2>
              </LineReveal>
              <LineReveal delay={0.15}>
                <h2
                  style={{
                    fontFamily: "var(--font-display)",
                    fontStyle: "italic",
                    fontSize: "clamp(2.25rem, 4vw, 3.5rem)",
                    fontWeight: 400,
                    letterSpacing: "-0.04em",
                    color: "var(--text-muted)",
                    lineHeight: 1.1,
                    margin: 0,
                  }}
                >
                  engineered for scale.
                </h2>
              </LineReveal>
            </div>

            <FadeIn delay={0.2} style={{ maxWidth: 360 }}>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "1rem",
                  color: "var(--text-secondary)",
                  lineHeight: 1.75,
                  fontWeight: 300,
                }}
              >
                While conventional symptom checkers rely on static keyword
                matching, Pulse maintains a live probability model — updating
                with every response you give.
              </p>
            </FadeIn>
          </div>

          {/* Bento grid */}
          <div className="bento-grid">
            <div className="bento-span-2">
              <BentoCard
                icon={Cpu}
                iconColor="var(--accent-blue)"
                iconBg="rgba(26, 110, 247, 0.06)"
                title="Bayesian Probabilistic Inference"
                body="Our engine recalibrates the differential landscape in real time. Each symptom shifts conditional probabilities across 14,000+ conditions — not through keyword lookup, but through genuine Bayesian updating. The result is a living, responsive model of your clinical picture."
                large
                delay={0}
              />
            </div>
            <div>
              <BentoCard
                icon={TrendingUp}
                iconColor="var(--risk-high)"
                iconBg="rgba(196, 81, 10, 0.06)"
                title="Temporal Escalation Maps"
                body="Tracks how your symptoms evolve across visits — flagging rapid acceleration before it becomes a clinical emergency."
                delay={0.1}
              />
            </div>
            <div>
              <BentoCard
                icon={Activity}
                iconColor="var(--risk-low)"
                iconBg="rgba(29, 122, 79, 0.06)"
                title="Behavioral Capture"
                body="Detects hesitation, emphasis, and linguistic patterns. Sometimes what remains unsaid matters most."
                delay={0.15}
              />
            </div>
            <div className="bento-span-2">
              <BentoCard
                icon={Shield}
                iconColor="#7c3aed"
                iconBg="rgba(124, 58, 237, 0.06)"
                title="Transparent Audit Trails"
                body="Every inference is backed by a step-by-step reasoning chain — readable by any attending physician. We believe AI should be accountable, not opaque. Our audit trail bridges the gap between black-box outputs and genuine clinical trust."
                large
                delay={0.2}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS MARQUEE ──────────────────────────────────── */}
      <section
        className="sticky-stack"
        style={{
          padding: "8rem 0",
          overflow: "hidden",
          background: "var(--bg-subtle)",
          borderTop: "1px solid var(--border-color)",
          borderBottom: "1px solid var(--border-color)",
          zIndex: 30,
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto 3rem", padding: "0 2rem" }}>
          <FadeIn>
            <span className="text-label">Trusted by clinicians</span>
          </FadeIn>
        </div>

        {/* Fade masks — solid color, no gradients on bg */}
        <div style={{ position: "relative", overflow: "hidden" }}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: 120,
              background: `linear-gradient(to right, var(--bg-subtle), transparent)`,
              zIndex: 2,
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              bottom: 0,
              width: 120,
              background: `linear-gradient(to left, var(--bg-subtle), transparent)`,
              zIndex: 2,
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              display: "flex",
              gap: "1.5rem",
              width: "max-content",
              animation: "marquee 48s linear infinite",
              paddingLeft: "1.5rem",
            }}
          >
            {testimonials.map((t, i) => (
              <TestimonialCard key={i} {...t} />
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS BAR ─────────────────────────────────────────────── */}
      <section
        className="sticky-stack"
        style={{
          padding: "7rem 2rem",
          background: "var(--bg-base)",
          borderBottom: "1px solid var(--border-color)",
          zIndex: 35,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "3rem",
          }}
        >
          {[
            { val: 14200, suf: "+", label: "Clinical parameters per session", isCounter: true },
            { val: "94.7%", label: "Physician agreement rate", isCounter: false },
            { val: "< 2.4s", label: "Median inference latency", isCounter: false },
            { val: "Live", label: "Continuous audit & monitoring", isCounter: false },
          ].map((s, i) => (
            <FadeIn key={i} delay={i * 0.1}>
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(2rem, 4vw, 3rem)",
                    fontWeight: 700,
                    letterSpacing: "-0.05em",
                    color: "var(--text-primary)",
                    lineHeight: 1,
                    marginBottom: 10,
                  }}
                >
                  {s.isCounter ? <Counter to={s.val} suffix={s.suf} /> : s.val}
                </div>
                <div
                  style={{
                    width: 32,
                    height: 1,
                    background: "var(--border-strong)",
                    marginBottom: 10,
                  }}
                />
                <div
                  style={{
                    fontFamily: "var(--font-ui)",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "var(--text-muted)",
                  }}
                >
                  {s.label}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── FOUNDERS ──────────────────────────────────────────────── */}
      <section
        className="sticky-stack"
        id="founders"
        style={{
          padding: "10rem 2rem",
          background: "var(--bg-card)",
          borderBottom: "1px solid var(--border-color)",
          zIndex: 40,
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          {/* Header */}
          <div style={{ marginBottom: "6rem" }}>
            <FadeIn>
              <span className="text-label" style={{ display: "block", marginBottom: "1.25rem" }}>
                The team
              </span>
            </FadeIn>
            <LineReveal>
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(2.5rem, 5vw, 4rem)",
                  fontWeight: 600,
                  letterSpacing: "-0.04em",
                  color: "var(--text-primary)",
                  lineHeight: 1.1,
                  margin: 0,
                }}
              >
                The architects of precision.
              </h2>
            </LineReveal>
            <FadeIn delay={0.2} style={{ maxWidth: 560, marginTop: "1.5rem" }}>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "1.1rem",
                  color: "var(--text-secondary)",
                  lineHeight: 1.75,
                  fontWeight: 300,
                }}
              >
                A cross-disciplinary team of deep learning researchers, diagnostic
                physicians, and interaction designers — rebuilding the interface
                between patients and clinical understanding.
              </p>
            </FadeIn>
          </div>

          {/* Founder cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "3rem",
            }}
          >
            {[
              {
                name: "Dr. Arvi",
                role: "Chief Medical Officer",
                bio: "Former head of diagnostic heuristics at a leading tertiary hospital. Twelve years translating clinical intuition into algorithmic form — ensuring Pulse's outputs hold up under attending-physician scrutiny.",
                initials: "DA",
                accentColor: "var(--accent-blue)",
              },
              {
                name: "Arvi ML",
                role: "Lead AI Infrastructure",
                bio: "Architected the inference pipeline from scratch. Specializes in translating unstructured patient narratives into structured probabilistic knowledge graphs — and believes any model a first-year resident can't challenge shouldn't be deployed.",
                initials: "AM",
                accentColor: "#7c3aed",
              },
            ].map((f, i) => (
              <FadeIn key={i} delay={i * 0.15}>
                <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
                  {/* Portrait placeholder — editorial numbered style */}
                  <motion.div
                    whileHover={{ scale: 0.99 }}
                    style={{
                      width: "100%",
                      aspectRatio: "4/5",
                      background: "var(--bg-inset)",
                      borderRadius: "var(--radius-lg)",
                      overflow: "hidden",
                      border: "1px solid var(--border-color)",
                      position: "relative",
                      display: "flex",
                      alignItems: "flex-end",
                    }}
                  >
                    {/* Large monogram */}
                    <div
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -60%)",
                        fontFamily: "var(--font-display)",
                        fontStyle: "italic",
                        fontSize: "8rem",
                        fontWeight: 600,
                        color: "var(--border-strong)",
                        letterSpacing: "-0.1em",
                        lineHeight: 1,
                        userSelect: "none",
                      }}
                    >
                      {f.initials}
                    </div>

                    {/* Name overlay at bottom */}
                    <div
                      style={{
                        position: "relative",
                        zIndex: 1,
                        padding: "2rem",
                        width: "100%",
                        borderTop: "1px solid var(--border-color)",
                        background: "var(--bg-card)",
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: "1.5rem",
                          fontWeight: 600,
                          letterSpacing: "-0.03em",
                          color: "var(--text-primary)",
                          marginBottom: 4,
                        }}
                      >
                        {f.name}
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--font-ui)",
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          color: f.accentColor,
                        }}
                      >
                        {f.role}
                      </div>
                    </div>
                  </motion.div>

                  <p
                    style={{
                      fontFamily: "var(--font-body)",
                      color: "var(--text-secondary)",
                      lineHeight: 1.8,
                      fontSize: "1rem",
                      fontWeight: 300,
                    }}
                  >
                    {f.bio}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROCESS — numbered editorial list ─────────────────────── */}
      <section
        className="sticky-stack"
        style={{
          padding: "10rem 2rem",
          background: "var(--bg-base)",
          zIndex: 45,
          borderBottom: "1px solid var(--border-color)",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "6rem",
            alignItems: "start",
          }}
        >
          <div>
            <FadeIn>
              <span className="text-label" style={{ display: "block", marginBottom: "1.25rem" }}>
                The process
              </span>
            </FadeIn>
            <LineReveal>
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(2rem, 3.5vw, 3rem)",
                  fontWeight: 600,
                  letterSpacing: "-0.04em",
                  color: "var(--text-primary)",
                  lineHeight: 1.15,
                  margin: 0,
                }}
              >
                From conversation
                <br />
                to clinical clarity.
              </h2>
            </LineReveal>
          </div>

          <FadeIn delay={0.2}>
            <ol className="editorial-list">
              {[
                {
                  title: "Adaptive interview",
                  desc: "Pulse asks dynamic follow-up questions based on what you've already said — not a static form, but a structured clinical conversation.",
                },
                {
                  title: "Behavioral signal capture",
                  desc: "Every response is analyzed for emphasis, hesitation, and word choice. The model listens for what you don't say as much as what you do.",
                },
                {
                  title: "Probabilistic inference",
                  desc: "Bayesian updating across 14,000+ conditions produces a calibrated risk tier with a transparent confidence score.",
                },
                {
                  title: "Physician-grade output",
                  desc: "You receive a full audit trail, differential diagnosis, and actionable recommendations — formatted for both patient and clinician.",
                },
              ].map((step, i) => (
                <li key={i} style={{ gap: "1.5rem", padding: "1.5rem 0" }}>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontFamily: "var(--font-ui)",
                        fontSize: "0.9rem",
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        marginBottom: 6,
                      }}
                    >
                      {step.title}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "0.9rem",
                        color: "var(--text-secondary)",
                        lineHeight: 1.65,
                        fontWeight: 300,
                      }}
                    >
                      {step.desc}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </FadeIn>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────── */}
      <section
        className="sticky-stack"
        style={{
          padding: "14rem 2rem",
          textAlign: "center",
          background: "var(--bg-card)",
          borderTop: "1px solid var(--border-color)",
          zIndex: 50,
        }}
      >
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <FadeIn>
            <span className="text-label" style={{ display: "block", marginBottom: "2rem" }}>
              Ready to begin
            </span>
          </FadeIn>

          <LineReveal>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(3rem, 7vw, 6rem)",
                fontWeight: 600,
                letterSpacing: "-0.05em",
                color: "var(--text-primary)",
                lineHeight: 1.0,
                margin: 0,
              }}
            >
              Your health, understood
            </h2>
          </LineReveal>
          <LineReveal delay={0.1}>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontSize: "clamp(3rem, 7vw, 6rem)",
                fontWeight: 400,
                letterSpacing: "-0.04em",
                color: "var(--text-muted)",
                lineHeight: 1.0,
                margin: 0,
                marginBottom: "3rem",
              }}
            >
              with precision.
            </h2>
          </LineReveal>

          <FadeIn delay={0.3}>
            <div
              style={{
                display: "flex",
                gap: "1rem",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <Link
                to="/register"
                className="btn btn-primary btn-lg"
                style={{ gap: 10 }}
              >
                Start free assessment
                <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="btn btn-secondary btn-lg">
                Sign in
              </Link>
            </div>
          </FadeIn>

          <FadeIn delay={0.45} style={{ marginTop: "3rem" }}>
            <p
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "0.78rem",
                color: "var(--text-muted)",
                letterSpacing: "0.04em",
              }}
            >
              Pulse is an informational probabilistic engine — not a replacement
              for qualified medical care.
            </p>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}