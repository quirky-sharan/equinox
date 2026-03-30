import { useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, useMotionValue, useSpring, useMotionTemplate } from "framer-motion";
import { ChevronRight, Shield, Activity, TrendingUp, Cpu, Cat } from "lucide-react";

// 3D Tilt Card Component for Vision Section
function TiltCard({ children }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  // Use springs to smooth out the mouse movement translation to rotation
  const springX = useSpring(x, { stiffness: 300, damping: 30 });
  const springY = useSpring(y, { stiffness: 300, damping: 30 });
  
  const rotateX = useTransform(springY, [-0.5, 0.5], ["15deg", "-15deg"]);
  const rotateY = useTransform(springX, [-0.5, 0.5], ["-15deg", "15deg"]);
  
  const glowX = useSpring(useTransform(x, [-0.5, 0.5], ["0%", "100%"]), { stiffness: 400, damping: 30 });
  const glowY = useSpring(useTransform(y, [-0.5, 0.5], ["0%", "100%"]), { stiffness: 400, damping: 30 });

  
  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set(mouseX / width - 0.5);
    y.set(mouseY / height - 0.5);
  };
  
  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        perspective: 1000,
        position: "relative",
      }}
      className="card"
    >
      {/* Interactive Glow */}
      <motion.div
        style={{
          position: "absolute",
          inset: 0,
          background: useMotionTemplate`radial-gradient(circle at ${glowX} ${glowY}, rgba(255,255,255,0.06) 0%, transparent 60%)`,
          zIndex: 1,
          pointerEvents: "none",
          borderRadius: "inherit"
        }}
      />
      
      <div style={{ transform: "translateZ(30px)", position: "relative", zIndex: 2, padding: "3rem 2rem", background: "var(--glass-bg)", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", height: "100%", borderRadius: "inherit" }}>
        {children}
      </div>
    </motion.div>
  );
}

// Split Text Component for staggered animation without breaking words
function SplitText({ text, delayOffset = 0 }) {
  const words = text.split(" ");
  
  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.05 * i + delayOffset },
    }),
  };

  const child = {
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: { type: "spring", damping: 12, stiffness: 100 },
    },
    hidden: {
      opacity: 0,
      y: 50,
      rotateX: 90,
      transition: { type: "spring", damping: 12, stiffness: 100 },
    },
  };

  return (
    <motion.span variants={container} initial="hidden" animate="visible" style={{ display: "inline-block", perspective: "1000px" }}>
      {words.map((word, index) => (
        <span key={index} style={{ display: "inline-block", paddingRight: "0.25em", overflow: "hidden" }}>
          <motion.span variants={child} style={{ display: "inline-block" }}>
            {word}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}


export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, { damping: 30, stiffness: 100, mass: 0.5 });
  
  const yHeroText = useTransform(smoothProgress, [0, 1], [0, 400]);
  const opacityHero = useTransform(smoothProgress, [0, 0.4], [1, 0]);
  
  const scaleHeroBg = useTransform(smoothProgress, [0, 1], [1, 1.5]);
  const yBackground1 = useTransform(smoothProgress, [0, 1], [0, 600]);
  const yBackground2 = useTransform(smoothProgress, [0, 1], [0, -400]);
  const parallaxStats = useTransform(smoothProgress, [0.4, 0.8], ["0%", "-50%"]);

  return (
    <div style={{ backgroundColor: "var(--bg-base)", minHeight: "100vh", overflow: "hidden", position: "relative" }}>

      {/* Hero Section */}
      <section style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "4rem 2rem", perspective: 1000 }}>
        
        {/* Parallax Background Elements specific to Hero */}
        <motion.div style={{ scale: scaleHeroBg, y: yBackground1, position: "absolute", top: "10%", left: "5%", width: 200, height: 200, border: "1px solid var(--border-color)", borderRadius: "50%", opacity: 0.2, zIndex: 0 }} />
        <motion.div style={{ scale: scaleHeroBg, y: yBackground2, position: "absolute", bottom: "20%", right: "15%", width: 300, height: 300, border: "2px solid rgba(14, 165, 233, 0.1)", borderRadius: "30%", transform: "rotate(45deg)", opacity: 0.3, zIndex: 0 }} />

        <motion.div 
          style={{ y: yHeroText, opacity: opacityHero, zIndex: 2, maxWidth: 1000, textAlign: "center", position: "relative" }}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, type: "spring" }}
            style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "8px 24px", background: "rgba(14, 165, 233, 0.05)", borderRadius: "var(--radius-full)", border: "1px solid rgba(14, 165, 233, 0.2)", color: "var(--accent-blue)", fontSize: "0.85rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "3rem", backdropFilter: "blur(10px)" }}
          >
            <Activity size={16} /> Inference Engine V2 Now Live
          </motion.div>
          
          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "clamp(3.5rem, 9vw, 8rem)", fontWeight: 900, lineHeight: 1.1, letterSpacing: "-0.05em", color: "var(--text-primary)", marginBottom: "2rem", textShadow: "0 20px 40px rgba(0,0,0,0.1)" }}>
            <SplitText text="The future of" delayOffset={0} /> <br/>
            <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>
              <SplitText text="clinical intelligence." delayOffset={0.4} />
            </span>
          </h1>
          
          <motion.p 
            initial={{ opacity: 0, filter: "blur(10px)", y: 20 }}
            animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
            transition={{ duration: 1, delay: 1.5 }}
            style={{ fontSize: "clamp(1rem, 2vw, 1.4rem)", color: "var(--text-secondary)", maxWidth: 700, margin: "0 auto 4rem", lineHeight: 1.6, fontWeight: 300 }}
          >
            Meowmeow transcends conventional diagnostics. Using Bayesian probabilistic inference and sub-conscious behavioral capture to map your clinical trajectory.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.8 }}
            style={{ display: "flex", gap: "1.5rem", justifyContent: "center", flexWrap: "wrap" }}
          >
            <Link to="/register" className="btn btn-primary btn-lg" style={{ position: "relative", overflow: "hidden", padding: "1.25rem 3rem", fontSize: "1.1rem", borderRadius: "100px", boxShadow: "0 20px 40px rgba(14, 165, 233, 0.2)" }}>
              <motion.div 
                animate={{ x: ["-100%", "200%"] }} 
                transition={{ duration: 3, repeat: Infinity, ease: "linear", delay: 1 }}
                style={{ position: "absolute", top: 0, left: 0, width: "50%", height: "100%", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)", transform: "skewX(-20deg)" }}
              />
              Start Assessment <ChevronRight size={20} />
            </Link>
            <Link to="/login" className="btn btn-secondary btn-lg" style={{ padding: "1.25rem 3rem", fontSize: "1.1rem", borderRadius: "100px", background: "rgba(255,255,255,0.03)", backdropFilter: "blur(10px)" }}>
              Clinical Sign In
            </Link>
          </motion.div>
        </motion.div>
        
        {/* Scroll Indicator */}
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.5, duration: 1 }}
          style={{ position: "absolute", bottom: "2rem", left: "50%", x: "-50%", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}
        >
          <span style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--text-muted)", fontWeight: 700 }}>Scroll</span>
          <div style={{ width: 1, height: 40, background: "var(--border-color)", overflow: "hidden", position: "relative" }}>
            <motion.div animate={{ y: [-40, 40] }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} style={{ width: "100%", height: "50%", background: "var(--text-primary)" }} />
          </div>
        </motion.div>
      </section>

      {/* Vision & Capabilities */}
      <section id="vision" style={{ padding: "12rem 2rem", position: "relative", zIndex: 2 }}>
        <div style={{ maxWidth: 1300, margin: "0 auto" }}>
          
          <motion.div 
            initial={{ opacity: 0, y: 60, filter: "blur(10px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            style={{ textAlign: "center", marginBottom: "8rem" }}
          >
            <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "clamp(2.5rem, 5vw, 4.5rem)", fontWeight: 800, letterSpacing: "-0.04em", marginBottom: "2rem", color: "var(--text-primary)", lineHeight: 1.1 }}>
              Diagnostic superiority.<br/>
              <span style={{ color: "transparent", WebkitTextStroke: "1px var(--text-muted)" }}>Engineered for scale.</span>
            </h2>
            <p style={{ fontSize: "1.25rem", color: "var(--text-secondary)", maxWidth: 800, margin: "0 auto", lineHeight: 1.7, fontWeight: 300 }}>
              While traditional symptom checkers rely on rigid decision trees, Meowmeow actively learns. Our multidimensional tensor architecture detects nuances in typing speed, hesitation, and word choice simultaneously.
            </p>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "3rem" }}>
            {[
              { icon: Cpu, title: "Bayesian Reasoning", desc: "Our engine recalibrates probabilities in real-time. Each symptom entered dynamically shifts the differential landscape across 14,000+ clinical conditions." },
              { icon: TrendingUp, title: "Temporal Context", desc: "We track the velocity of symptom progression autonomously, instantly flagging rapid deteriorations before they reach critical thresholds." },
              { icon: Shield, title: "Clinical Audit Trail", desc: "Every inference is backed by a fully transparent, step-by-step reasoning chain bridging the gap between \"black box\" AI and physician trust." }
            ].map((feat, i) => (
              <TiltCard key={i}>
                <div style={{ width: 80, height: 80, borderRadius: "24px", background: "var(--bg-card)", border: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "2rem", boxShadow: "0 20px 40px rgba(0,0,0,0.05)" }}>
                  <feat.icon size={36} color="var(--accent-blue)" strokeWidth={1.5} />
                </div>
                <h3 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "1rem", color: "var(--text-primary)", letterSpacing: "-0.02em" }}>{feat.title}</h3>
                <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, fontSize: "1.05rem", fontWeight: 300 }}>{feat.desc}</p>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* Extreme Parallax Stat Bar */}
      <section style={{ padding: "8rem 0", background: "var(--bg-card)", borderTop: "1px solid var(--border-color)", borderBottom: "1px solid var(--border-color)", overflow: "hidden" }}>
        <motion.div 
          style={{ x: parallaxStats, display: "flex", width: "max-content", gap: "6rem", padding: "0 4rem" }}
        >

          {Array(4).fill([
            { label: "Clinical Parameters", value: "14.2M+" },
            { label: "Inference Latency", value: "<12ms" },
            { label: "Confidence Tiers", value: "99.8%" },
            { label: "Continuous Audit", value: "Live" }
          ]).flat().map((stat, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
              <Cat size={24} color="var(--text-muted)" />
              <div>
                <div style={{ fontSize: "3rem", fontWeight: 900, fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "-0.05em", color: "var(--text-primary)", lineHeight: 1 }}>{stat.value}</div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.15em", marginTop: 8, fontWeight: 700 }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Founders Section with glass masks and scaling image placeholders */}
      <section id="founders" style={{ padding: "12rem 2rem", position: "relative", zIndex: 1, background: "var(--bg-base)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <motion.div 
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            style={{ textAlign: "center", marginBottom: "8rem" }}
          >
            <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "clamp(2.5rem, 5vw, 4.5rem)", fontWeight: 800, letterSpacing: "-0.04em", marginBottom: "2rem", color: "var(--text-primary)" }}>
              The architects of perception.
            </h2>
            <p style={{ fontSize: "1.25rem", color: "var(--text-secondary)", maxWidth: 700, margin: "0 auto", lineHeight: 1.7, fontWeight: 300 }}>
              A cross-disciplinary syndicate of deep learning researchers, diagnostic physicians, and interaction purists rebuilding digital medicine.
            </p>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "4rem", alignItems: "start" }}>
            
            {/* Founder 1 */}
            <motion.div 
              initial={{ opacity: 0, filter: "blur(20px)", scale: 0.9 }}
              whileInView={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              style={{ display: "flex", flexDirection: "column", gap: "2rem" }}
            >
              <motion.div 
                whileHover={{ scale: 0.98 }}
                style={{ width: "100%", aspectRatio: "4/5", background: "var(--bg-card)", borderRadius: "var(--radius-lg)", overflow: "hidden", position: "relative", border: "1px solid var(--border-color)", boxShadow: "0 30px 60px -20px rgba(0,0,0,0.1)" }}
              >
                 <motion.div 
                   whileHover={{ scale: 1.1, rotate: 2 }} 
                   transition={{ duration: 0.8, ease: "easeOut" }}
                   style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "radial-gradient(circle, var(--bg-subtle) 0%, var(--bg-base) 100%)" }}
                 >
                   <Cat size={200} color="var(--border-color)" strokeWidth={0.2} />
                 </motion.div>
                 <div style={{ position: "absolute", bottom: 0, left: 0, width: "100%", padding: "4rem 2rem 2rem", background: "linear-gradient(to top, var(--bg-card), transparent)", zIndex: 1 }}>
                    <h3 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em", marginBottom: 4 }}>Dr. Purrfect</h3>
                    <p style={{ color: "var(--accent-blue)", fontWeight: 700, fontSize: "0.95rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>Chief Medical Officer</p>
                 </div>
              </motion.div>
              <div>
                <p style={{ color: "var(--text-secondary)", lineHeight: 1.8, fontSize: "1.1rem", fontWeight: 300 }}>
                  Former head of diagnostic heuristics at leading research hospitals. Bringing 15 years of clinical nuance into algorithmic form, ensuring our models exhibit physician-level intuition.
                </p>
              </div>
            </motion.div>

            {/* Founder 2 */}
            <motion.div 
              initial={{ opacity: 0, filter: "blur(20px)", scale: 0.9 }}
              whileInView={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              style={{ display: "flex", flexDirection: "column", gap: "2rem" }}
            >
              <motion.div 
                whileHover={{ scale: 0.98 }}
                style={{ width: "100%", aspectRatio: "4/5", background: "var(--bg-card)", borderRadius: "var(--radius-lg)", overflow: "hidden", position: "relative", border: "1px solid var(--border-color)", boxShadow: "0 30px 60px -20px rgba(0,0,0,0.1)" }}
              >
                 <motion.div 
                   whileHover={{ scale: 1.1, rotate: -2 }} 
                   transition={{ duration: 0.8, ease: "easeOut" }}
                   style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "radial-gradient(circle, var(--bg-subtle) 0%, var(--bg-base) 100%)" }}
                 >
                   <Cat size={200} color="var(--border-color)" strokeWidth={0.2} />
                 </motion.div>
                 <div style={{ position: "absolute", bottom: 0, left: 0, width: "100%", padding: "4rem 2rem 2rem", background: "linear-gradient(to top, var(--bg-card), transparent)", zIndex: 1 }}>
                    <h3 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em", marginBottom: 4 }}>Whiskers</h3>
                    <p style={{ color: "var(--accent-purple)", fontWeight: 700, fontSize: "0.95rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>Lead AI Infrastructure</p>
                 </div>
              </motion.div>
              <div>
                <p style={{ color: "var(--text-secondary)", lineHeight: 1.8, fontSize: "1.1rem", fontWeight: 300 }}>
                  Architect of the underlying Bayesian inference topology. Specialized in translating unstructured patient narratives into mathematically rigorous, structured knowledge graphs.
                </p>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Massive CTA Section */}
      <section style={{ padding: "15rem 2rem", position: "relative", textAlign: "center", borderTop: "1px solid var(--border-color)", background: "var(--bg-card)" }}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <Cat size={64} style={{ margin: "0 auto 2rem", strokeWidth: 1, stroke: "var(--text-primary)" }} />
          <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "clamp(3rem, 6vw, 5rem)", fontWeight: 900, letterSpacing: "-0.05em", color: "var(--text-primary)", marginBottom: "1.5rem" }}>
            Ready to deploy?
          </h2>
          <p style={{ fontSize: "1.3rem", color: "var(--text-secondary)", maxWidth: 600, margin: "0 auto 4rem", lineHeight: 1.6, fontWeight: 300 }}>
            Join the beta and experience the bleeding edge of diagnostic computing.
          </p>
          <Link to="/register" className="btn btn-primary btn-lg" style={{ padding: "1.5rem 4rem", fontSize: "1.2rem", borderRadius: "100px", boxShadow: "0 20px 50px -10px rgba(14, 165, 233, 0.3)" }}>
            Begin Free Trial
          </Link>
        </motion.div>
      </section>

    </div>
  );
}
