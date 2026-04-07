import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { sessionApi } from "../api/endpoints";
import { useBehavioralCapture } from "../hooks/useBehavioralCapture";
import { Mic, MicOff, Send, Volume2, VolumeX, Cat } from "lucide-react";
import PersonalizedAlerts from "../components/PersonalizedAlerts";
import WellnessNudge from "../components/WellnessNudge";
import { detectCrisis, isCrisisTriggered } from "../utils/crisisDetector";
import { useSessionStore } from "../store/sessionStore";

const ML_URL = import.meta.env.VITE_ML_URL || "http://localhost:8001";

export default function InterviewPage() {
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [currentCategory, setCurrentCategory] = useState("general");
  const [answer, setAnswer] = useState("");
  const [progress, setProgress] = useState(0);
  const [depth, setDepth] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  const [questionVisible, setQuestionVisible] = useState(true);
  const [currentOptions, setCurrentOptions] = useState(null);
  const [highlights, setHighlights] = useState([]);
  const [mentalState, setMentalState] = useState(null);

  // Check for crisis flag on mount — redirect immediately if already triggered
  useEffect(() => {
    if (isCrisisTriggered()) {
      navigate("/support", { replace: true });
    }
  }, [navigate]);

  const behavCapture = useBehavioralCapture();
  const recognitionRef = useRef(null);
  const textareaRef = useRef(null);
  const currentAudioRef = useRef(null);

  const playVoice = useCallback(async (text, enabled) => {
    if (!enabled) return;
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    try {
      const res = await fetch(`${ML_URL}/ml/speak`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });
      if (!res.ok) throw new Error("Voice synthesis failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      currentAudioRef.current = audio;
      audio.play();
      audio.onended = () => URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Neural TTS Error:", err);
    }
  }, []);

  // Consume preloaded session or start a new one on mount
  useEffect(() => {
    (async () => {
      try {
        // This will instantly return if already preloaded, passing through
        const data = await useSessionStore.getState().preloadSession();
        useSessionStore.getState().consumeSession(); // clear it so we don't reuse it next time
        
        setSessionId(data.session_id);
        setCurrentCategory(data.question_category);
        setCurrentQuestion(data.first_question);
        if (data.highlights && data.highlights.length > 0) {
          setHighlights(data.highlights);
        }
        if (data.mental_state) {
          setMentalState(data.mental_state);
        }
      } catch (e) {
        setError("Could not connect to server. Please ensure the backend is running.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // TTS re-speak on question change
  const prevQuestion = useRef("");
  useEffect(() => {
    if (currentQuestion && currentQuestion !== prevQuestion.current) {
      prevQuestion.current = currentQuestion;
      setTimeout(() => playVoice(currentQuestion, ttsEnabled), 700);
    }
  }, [currentQuestion, ttsEnabled, playVoice]);

  const handleSubmit = useCallback(async (overrideAnswer = null) => {
    // Determine the actual answer text to submit
    const textToSubmit = typeof overrideAnswer === "string" ? overrideAnswer : answer.trim();

    if (!textToSubmit || textToSubmit.length < 3 || submitting) return;
    setSubmitting(true);
    setError("");
    setAnswer(""); // Instantly clear text box for immediate user feedback

    try {
      const meta = behavCapture.getMetadata();
      const res = await sessionApi.submitAnswer({
        session_id: sessionId,
        question_text: currentQuestion,
        question_category: currentCategory,
        answer_text: textToSubmit,
        behavioral_metadata: meta,
      });

      setProgress(res.data.progress_pct);
      setDepth(res.data.current_depth);
      behavCapture.reset();

      // Update personalized highlights
      if (res.data.highlights && res.data.highlights.length > 0) {
        setHighlights(res.data.highlights);
      } else {
        setHighlights([]);
      }

      // Update mental state for WellnessNudge
      if (res.data.final_data?.mental_state) {
        setMentalState(res.data.final_data.mental_state);
      } else if (res.data.mental_state) {
        setMentalState(res.data.mental_state);
      } else {
        setMentalState(null);
      }

      if (res.data.interview_complete) {
        navigate(`/result/${sessionId}`);
        return;
      }

      // Animate question transition
      setQuestionVisible(false);
      setTimeout(() => {
        setCurrentQuestion(res.data.next_question);
        setCurrentCategory(res.data.next_question_category);
        setCurrentOptions(res.data.options || null);
        setTranscript("");
        setQuestionVisible(true);
        textareaRef.current?.focus();
      }, 400);
    } catch (e) {
      setError("Network issue: Unable to connect to the medical AI server. Please check your connection and try again.");
      setAnswer(textToSubmit); // Restore text so they can try again
    } finally {
      setSubmitting(false);
    }
  }, [answer, submitting, sessionId, currentQuestion, currentCategory, behavCapture, navigate]);

  // Keyboard shortcut: Enter to submit, Shift+Enter for new line
  const handleKeyDown = useCallback((e) => {
    behavCapture.onKeyDown(e);
    
    // Ignore synthetic Enter events from mobile autocomplete / IME composition
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Prevent default new line insertion
      handleSubmit();
    }
  }, [behavCapture, handleSubmit]);

  // Speech recognition
  const toggleListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setError("Speech recognition not supported in this browser."); return; }

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const rec = new SR();
    recognitionRef.current = rec;
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onresult = (e) => {
      const t = Array.from(e.results).map((r) => r[0].transcript).join("");
      setTranscript(t);
      if (e.results[e.results.length - 1].isFinal) {
        setAnswer((prev) => (prev ? prev + " " + t : t).trim());
        setTranscript("");
        setListening(false);
      }
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start();
    setListening(true);
  };

  const categoryLabel = {
    general: "General Wellbeing", location: "Location", onset: "Onset & Duration",
    severity: "Severity", modifiers: "Modifying Factors",
    fatigue: "Fatigue", pain: "Pain", respiratory: "Respiratory",
    digestive: "Digestive", neurological: "Neurological", mood: "Mood"
  }[currentCategory] || currentCategory;

  if (loading) {
    return (
      <div className="page-center" style={{ flexDirection: "column", gap: 24 }}>
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          style={{ width: 48, height: 48, borderRadius: "14px", border: "2px solid var(--border-color)", borderTopColor: "var(--accent-blue)", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <Cat size={20} color="var(--accent-blue)" />
        </motion.div>
        <p style={{ color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums", letterSpacing: "0.02em", fontSize: "0.9rem" }}>Initializing clinical session…</p>
      </div>
    );
  }


  return (
    <div className="page-center" style={{ alignItems: "stretch", padding: "1rem", position: "relative", overflow: "hidden" }}>
      {/* Dynamic background ambient glow */}
      <motion.div 
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.03, 0.05, 0.03]
        }}
        transition={{ duration: 8, repeat: Infinity }}
        style={{ position: "absolute", top: "20%", left: "50%", x: "-50%", width: "80%", height: "60%", background: "radial-gradient(circle, var(--accent-blue) 0%, transparent 70%)", zIndex: 0, pointerEvents: "none" }}
      />

      <div style={{ width: "100%", maxWidth: 740, margin: "0 auto", display: "flex", flexDirection: "column", gap: "2rem", zIndex: 1 }}>

        {/* Top Navigation / Status */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: "8px", background: "var(--bg-card)", border: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Cat size={16} color="var(--text-primary)" strokeWidth={1.5} />
            </div>
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>Session Active</div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Clinical Core V2.4</div>
            </div>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ textAlign: "right", marginRight: 8 }}>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Queue Position</div>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{depth + 1} of 12</div>
            </div>
            <button
              onClick={() => { 
                setTtsEnabled(!ttsEnabled); 
                if (currentAudioRef.current) currentAudioRef.current.pause(); 
              }}
              className="btn"
              title={ttsEnabled ? "Mute Voice Assistance" : "Enable Voice Assistance"}
              style={{ 
                height: 40, padding: "0 16px", borderRadius: "100px", cursor: "pointer",
                background: ttsEnabled ? "rgba(14, 165, 233, 0.1)" : "var(--bg-card)",
                border: `1px solid ${ttsEnabled ? "var(--accent-blue)" : "var(--border-color)"}`,
                color: ttsEnabled ? "var(--accent-blue)" : "var(--text-muted)",
                display: "flex", alignItems: "center", gap: 8,
                fontWeight: 700, fontSize: "0.8rem", transition: "all 0.2s"
              }}
            >
              {ttsEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              {ttsEnabled ? "Voice ON" : "Voice OFF"}
            </button>
          </div>
        </motion.div>

        {/* Progress System */}
        <div style={{ position: "relative" }}>
          <div className="progress-bar-track" style={{ height: 4, background: "var(--border-color)", opacity: 0.5 }}>
            <motion.div 
              className="progress-bar-fill" 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }} 
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              style={{ background: "var(--accent-blue)", boxShadow: "0 0 20px rgba(14, 165, 233, 0.3)" }}
            />
          </div>
        </div>

        {/* Main Content Area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2.5rem", justifyContent: "center", minHeight: "400px" }}>
          
          {/* Personalized Alerts — shown above question when profile conflicts exist */}
          <AnimatePresence>
            {highlights.length > 0 && !submitting && (
              <PersonalizedAlerts highlights={highlights} />
            )}
          </AnimatePresence>

          {/* Wellness Nudge — subtle distress-aware card, no animation, grounding */}
          {mentalState && mentalState.distress_detected && !submitting && (
            <WellnessNudge mentalState={mentalState} />
          )}

          {/* Category Signal */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <motion.span 
              key={currentCategory}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                padding: "6px 20px", borderRadius: "var(--radius-full)",
                background: "var(--bg-subtle)", border: "1px solid var(--border-color)",
                fontSize: "0.75rem", fontWeight: 700, color: "var(--accent-blue)",
                letterSpacing: "0.1em", textTransform: "uppercase"
              }}>
              {categoryLabel}
            </motion.span>
          </div>

          {/* Question Hub */}
          <div style={{ minHeight: "120px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <AnimatePresence mode="wait">
              {submitting ? (
                <motion.div
                  key="thinking"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                  style={{ textAlign: "center", minHeight: "20vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: "1rem" }}
                >
                  <motion.div 
                    animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }} 
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Cat size={48} color="var(--accent-blue)" />
                  </motion.div>
                  <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)", fontWeight: 800, color: "var(--accent-blue)", margin: 0 }}>
                    ClinicalMind is thinking...
                  </h2>
                  <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>Analyzing your symptoms securely</p>
                </motion.div>
              ) : questionVisible && (
                <motion.div
                  key="question"
                  initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -30, filter: "blur(10px)" }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  style={{ textAlign: "center" }}
                >
                  <motion.div 
                    initial={{ scale: 0 }} 
                    animate={{ scale: 1 }} 
                    transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
                    style={{ 
                      display: "inline-flex", alignItems: "center", gap: 8,
                      background: "rgba(14, 165, 233, 0.1)", color: "var(--accent-blue)",
                      padding: "6px 14px", borderRadius: "100px", fontSize: "0.85rem",
                      fontWeight: 700, letterSpacing: "0.05em", marginBottom: 24,
                      border: "1px solid rgba(14, 165, 233, 0.2)"
                    }}>
                    <Cat size={14} /> AI Clinical Engine
                  </motion.div>
                  
                  <h2 style={{ 
                    fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 800, 
                    lineHeight: 1.2, letterSpacing: "-0.02em",
                    background: "linear-gradient(to right, #ffffff, #a5b4fc)",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                    maxWidth: "900px", margin: "0 auto",
                  }}>
                    {currentQuestion}
                  </h2>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Interaction Sector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="card"
          style={{ padding: "2rem", background: "var(--glass-bg)", backdropFilter: "blur(20px)", border: "1px solid var(--border-color)", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.1)" }}
        >
          {transcript && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              style={{
                marginBottom: 16, padding: "12px 16px",
                background: "rgba(14, 165, 233, 0.05)", border: "1px solid rgba(14, 165, 233, 0.15)",
                borderRadius: "var(--radius-md)", fontSize: "0.9rem", color: "var(--accent-blue)",
                fontStyle: "italic", borderLeft: "4px solid var(--accent-blue)"
              }}>
              🎙️ {transcript}
            </motion.div>
          )}

          <textarea
            ref={textareaRef}
            placeholder="Describe your symptoms in detail…"
            value={answer}
            onChange={(e) => {
              const val = e.target.value;
              // Crisis detection — fires on every keystroke, even if erased
              if (detectCrisis(val)) {
                navigate("/support", { replace: true });
                return;
              }
              setAnswer(val);
              behavCapture.onChange(e);
            }}
            onKeyDown={handleKeyDown}
            onBeforeInput={behavCapture.onBeforeInput}
            rows={4}
            style={{ 
              width: "100%", resize: "none", marginBottom: "1.5rem", 
              fontSize: "1.1rem", lineHeight: 1.6, 
              color: "white", outline: "none",
              background: "rgba(255, 255, 255, 0.03)", 
              border: "1px solid rgba(255, 255, 255, 0.1)", 
              borderRadius: "16px", padding: "1.25rem",
              boxShadow: "inset 0 4px 6px -1px rgba(0, 0, 0, 0.1), inset 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
              transition: "border-color 0.2s, background 0.2s"
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "var(--accent-blue)";
              e.target.style.background = "rgba(14, 165, 233, 0.05)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "rgba(255, 255, 255, 0.1)";
              e.target.style.background = "rgba(255, 255, 255, 0.03)";
            }}
            autoFocus
          />

          {currentOptions && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: "2rem" }}>
              {currentOptions.map((opt, i) => (
                <motion.button
                  key={i}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setAnswer(opt.label); handleSubmit(opt.label); }}
                  style={{
                    padding: "10px 20px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)",
                    background: answer === opt.label ? "var(--accent-base)" : "var(--bg-card)",
                    color: answer === opt.label ? "var(--bg-base)" : "var(--text-primary)",
                    cursor: "none", fontWeight: 600, fontSize: "0.85rem", transition: "all 0.2s"
                  }}
                >
                  {opt.label}
                </motion.button>
              ))}
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="btn"
                onClick={toggleListening}
                style={{ 
                  height: 48, padding: "0 24px", borderRadius: "100px", cursor: "pointer",
                  background: listening ? "#ef4444" : "var(--accent-blue)", 
                  color: "#fff", border: "none",
                  display: "flex", alignItems: "center", gap: 10,
                  fontWeight: 800, fontSize: "0.95rem",
                  boxShadow: listening ? "0 0 20px rgba(239, 68, 68, 0.5)" : "0 10px 20px rgba(14, 165, 233, 0.3)"
                }}
                animate={listening ? { scale: [1, 1.05, 1] } : {}}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                {listening ? <MicOff size={20} color="#fff" /> : <Mic size={20} color="#fff" />}
                {listening ? "Stop Recording" : "Tap to Speak"}
              </motion.button>
              
              <AnimatePresence>
                {listening ? (
                  <motion.span 
                    initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                    style={{ fontSize: "0.85rem", color: "#ef4444", fontWeight: 700, letterSpacing: "0.05em" }}>
                    RECORDING ACTIVE
                  </motion.span>
                ) : (
                  behavCapture.hedgeCount > 0 && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      <span style={{ color: "var(--accent-blue)", fontWeight: 700 }}>{behavCapture.hedgeCount}</span> nuanced signals captured
                    </motion.span>
                  )
                )}
              </AnimatePresence>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {depth >= 4 && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn btn-secondary"
                  disabled={submitting}
                  onClick={() => navigate(`/result/${sessionId}`)}
                  style={{ gap: 8, padding: "0.75rem 1.25rem", border: "1px solid var(--accent-blue)", color: "var(--accent-blue)" }}
                >
                  <Cat size={16} /> Finish Early
                </motion.button>
              )}
              <motion.button
                className="btn btn-primary btn-lg"
                disabled={answer.trim().length < 3 || submitting}
                onClick={handleSubmit}
                whileHover={{ scale: 1.02, x: 5 }}
                whileTap={{ scale: 0.98 }}
                style={{ gap: 12, padding: "1rem 2rem" }}
              >
                {submitting ? <div className="spinner" style={{ width: 18, height: 18, borderTopColor: "var(--bg-base)" }} /> : <><Send size={18} /> Continue</>}
              </motion.button>
            </div>
          </div>
        </motion.div>


        {error && (
          <div style={{ textAlign: "center", color: "#f87171", fontSize: "0.95rem", padding: "12px 16px", background: "rgba(239,68,68,0.15)", borderRadius: "var(--radius-md)", border: "1px solid rgba(239,68,68,0.4)" }}>
            ⚠️ {error}
          </div>
        )}

        <p style={{ textAlign: "center", fontSize: "0.75rem", color: "var(--text-muted)" }}>
          Your responses are analyzed with clinical-grade NLP. Behavioral signals are captured passively to improve accuracy.
        </p>
      </div>
    </div>
  );
}
