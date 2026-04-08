import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../api/client";

/* ─── Shared style tokens ─────────────────────────────────────── */
const font = {
  display: "var(--font-display, 'Fraunces', Georgia, serif)",
  ui: "var(--font-ui, 'Syne', system-ui, sans-serif)",
  body: "var(--font-body, 'DM Sans', system-ui, sans-serif)",
};

/* ─── Animated underline field ───────────────────────────────── */
function Field({ label, delay = 0, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
      style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}
    >
      <span
        style={{
          fontFamily: font.ui,
          fontSize: "0.6rem",
          fontWeight: 700,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--text-muted)",
        }}
      >
        {label}
      </span>
      {children}
    </motion.div>
  );
}

const lineInput = {
  width: "100%",
  background: "transparent",
  border: "none",
  borderBottom: "1px solid var(--border-color)",
  padding: "0.55rem 0 0.65rem",
  outline: "none",
  color: "var(--text-primary)",
  fontFamily: "var(--font-body, 'DM Sans', sans-serif)",
  fontSize: "0.875rem",
  fontWeight: 300,
  lineHeight: 1.6,
  caretColor: "var(--text-primary)",
  transition: "border-color 0.2s",
};

const ratingLabels = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

/* ─── Star rating ────────────────────────────────────────────── */
function StarRating({ rating, hoverRating, setRating, setHoverRating }) {
  const active = hoverRating || rating;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <motion.button
          key={star}
          type="button"
          onMouseEnter={() => setHoverRating(star)}
          onMouseLeave={() => setHoverRating(0)}
          onClick={() => setRating(star)}
          whileHover={{ y: -5, scale: 1.1 }}
          whileTap={{ scale: 0.85 }}
          transition={{ type: "spring", stiffness: 500, damping: 20 }}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
          }}
        >
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill={active >= star ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={active >= star ? 0 : 1.5}
            style={{
              color:
                active >= star ? "var(--text-primary)" : "var(--border-strong)",
              transition: "color 0.15s, fill 0.15s",
            }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
        </motion.button>
      ))}
      <AnimatePresence mode="wait">
        {active > 0 && (
          <motion.span
            key={active}
            initial={{ opacity: 0, x: -4, filter: "blur(4px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, x: 4, filter: "blur(4px)" }}
            transition={{ duration: 0.18 }}
            style={{
              fontFamily: font.ui,
              fontSize: "0.7rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--text-muted)",
            }}
          >
            {ratingLabels[active]}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Success state ──────────────────────────────────────────── */
function SuccessState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      style={{
        padding: "3.5rem 0",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "1.5rem",
        textAlign: "center",
      }}
    >
      <motion.div
        initial={{ scale: 0, rotate: -90 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.1 }}
        style={{
          width: 60,
          height: 60,
          borderRadius: "50%",
          border: "1px solid var(--text-primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          width="24"
          height="24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          style={{ color: "var(--text-primary)", overflow: "visible" }}
        >
          <motion.path
            d="M5 13l4 4L19 7"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.55, delay: 0.35, ease: "easeOut" }}
          />
        </svg>
      </motion.div>

      <div>
        <motion.h3
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          style={{
            fontFamily: font.display,
            fontSize: "1.6rem",
            fontWeight: 600,
            letterSpacing: "-0.03em",
            color: "var(--text-primary)",
            margin: "0 0 0.4rem",
          }}
        >
          Received.
        </motion.h3>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65, duration: 0.4 }}
          style={{
            fontFamily: font.body,
            fontSize: "0.875rem",
            color: "var(--text-muted)",
            fontWeight: 300,
            lineHeight: 1.6,
          }}
        >
          Your feedback directly shapes the next version of Pulse.
        </motion.p>
      </div>
    </motion.div>
  );
}

/* ─── Main component ─────────────────────────────────────────── */
export default function FeedbackModal({ sessionId, isOpen, onClose }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [wasAccurate, setWasAccurate] = useState(true);
  const [helpfulText, setHelpfulText] = useState("");
  const [notHelpfulText, setNotHelpfulText] = useState("");
  const [actualDiagnosis, setActualDiagnosis] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0 || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await api.post("/feedback/submit", {
        session_id: sessionId,
        rating,
        was_accurate: wasAccurate,
        helpful_text: helpfulText,
        not_helpful_text: notHelpfulText,
        actual_diagnosis: actualDiagnosis,
      });
      setSubmitted(true);
      setTimeout(() => onClose(true), 1900);
    } catch (err) {
      console.error("Feedback submission failed:", err);
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="feedback-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        transition={{ duration: 0.28 }}
        onClick={() => onClose(false)}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 200,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "none",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
        }}
      >
        {/* Sheet */}
        <motion.div
          key="feedback-sheet"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "110%" }}
          transition={{ type: "spring", damping: 30, stiffness: 260 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "100%",
            maxWidth: 580,
            background: "var(--bg-base)",
            borderTop: "1px solid var(--border-color)",
            borderLeft: "1px solid var(--border-color)",
            borderRight: "1px solid var(--border-color)",
            borderRadius: "20px 20px 0 0",
            overflow: "hidden",
          }}
        >
          {/* Drag handle */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              paddingTop: "0.9rem",
              paddingBottom: "0.25rem",
            }}
          >
            <div
              style={{
                width: 36,
                height: 3,
                borderRadius: 99,
                background: "var(--border-strong)",
              }}
            />
          </div>

          {/* Header */}
          <div
            style={{
              padding: "1.25rem 2rem 1.5rem",
              borderBottom: "1px solid var(--border-color)",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
            }}
          >
            <div>
              <span
                style={{
                  fontFamily: font.ui,
                  fontSize: "0.6rem",
                  fontWeight: 700,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                  display: "block",
                  marginBottom: "0.45rem",
                }}
              >
                Assessment feedback
              </span>
              <h2
                style={{
                  fontFamily: font.display,
                  fontSize: "1.75rem",
                  fontWeight: 600,
                  letterSpacing: "-0.03em",
                  color: "var(--text-primary)",
                  margin: 0,
                  lineHeight: 1.1,
                }}
              >
                Help us improve Pulse
              </h2>
            </div>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onClose(false)}
              style={{
                background: "none",
                border: "1px solid var(--border-color)",
                borderRadius: "50%",
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "var(--text-muted)",
                flexShrink: 0,
                marginTop: "0.2rem",
                transition: "border-color 0.2s, color 0.2s",
              }}
            >
              <svg
                width="12"
                height="12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="2.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </motion.button>
          </div>

          {/* Body */}
          <div
            style={{
              padding: "1.75rem 2rem",
              maxHeight: "55vh",
              overflowY: "auto",
            }}
          >
            <AnimatePresence mode="wait">
              {submitted ? (
                <SuccessState key="success" />
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}
                >
                  {/* Stars */}
                  <div>
                    <span
                      style={{
                        fontFamily: font.ui,
                        fontSize: "0.6rem",
                        fontWeight: 700,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color: "var(--text-muted)",
                        display: "block",
                        marginBottom: "0.85rem",
                      }}
                    >
                      Rate this assessment
                    </span>
                    <StarRating
                      rating={rating}
                      hoverRating={hoverRating}
                      setRating={setRating}
                      setHoverRating={setHoverRating}
                    />
                  </div>

                  {/* Conditional fields */}
                  <AnimatePresence>
                    {rating > 0 && (
                      <motion.div
                        key="fields"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        style={{
                          overflow: "hidden",
                          display: "flex",
                          flexDirection: "column",
                          gap: "1.75rem",
                        }}
                      >
                        {/* Accuracy */}
                        <Field label="Assessment accuracy" delay={0.05}>
                          <label
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.7rem",
                              cursor: "pointer",
                              paddingTop: "0.3rem",
                            }}
                          >
                            <motion.div
                              animate={{
                                background: wasAccurate
                                  ? "var(--text-primary)"
                                  : "transparent",
                                borderColor: wasAccurate
                                  ? "var(--text-primary)"
                                  : "var(--border-strong)",
                              }}
                              onClick={() => setWasAccurate(!wasAccurate)}
                              style={{
                                width: 17,
                                height: 17,
                                border: "1.5px solid var(--border-strong)",
                                borderRadius: 4,
                                flexShrink: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                              }}
                            >
                              <AnimatePresence>
                                {wasAccurate && (
                                  <motion.svg
                                    key="check"
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    transition={{ type: "spring", stiffness: 500, damping: 18 }}
                                    width="9"
                                    height="9"
                                    fill="none"
                                    stroke="var(--bg-base)"
                                    viewBox="0 0 24 24"
                                    strokeWidth="3.5"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M5 13l4 4L19 7"
                                    />
                                  </motion.svg>
                                )}
                              </AnimatePresence>
                            </motion.div>
                            <span
                              style={{
                                fontFamily: font.body,
                                fontSize: "0.875rem",
                                color: "var(--text-secondary)",
                                fontWeight: 300,
                              }}
                            >
                              Matched my actual condition or diagnosis
                            </span>
                          </label>
                        </Field>

                        <AnimatePresence>
                          {!wasAccurate && (
                            <Field key="diagnosis" label="Actual diagnosis (optional)" delay={0}>
                              <motion.input
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                type="text"
                                value={actualDiagnosis}
                                onChange={(e) => setActualDiagnosis(e.target.value)}
                                placeholder="e.g. Migraine, not tension headache"
                                style={lineInput}
                                onFocus={(e) =>
                                (e.target.style.borderBottomColor =
                                  "var(--text-primary)")
                                }
                                onBlur={(e) =>
                                (e.target.style.borderBottomColor =
                                  "var(--border-color)")
                                }
                              />
                            </Field>
                          )}
                        </AnimatePresence>

                        <Field label="What was most helpful?" delay={0.08}>
                          <textarea
                            value={helpfulText}
                            onChange={(e) => setHelpfulText(e.target.value)}
                            maxLength={500}
                            rows={2}
                            placeholder="What did the AI get right?"
                            style={{ ...lineInput, resize: "none" }}
                            onFocus={(e) =>
                            (e.target.style.borderBottomColor =
                              "var(--text-primary)")
                            }
                            onBlur={(e) =>
                            (e.target.style.borderBottomColor =
                              "var(--border-color)")
                            }
                          />
                        </Field>

                        <Field label="What could be improved?" delay={0.13}>
                          <textarea
                            value={notHelpfulText}
                            onChange={(e) => setNotHelpfulText(e.target.value)}
                            maxLength={500}
                            rows={2}
                            placeholder="Was something missing or inaccurate?"
                            style={{ ...lineInput, resize: "none" }}
                            onFocus={(e) =>
                            (e.target.style.borderBottomColor =
                              "var(--text-primary)")
                            }
                            onBlur={(e) =>
                            (e.target.style.borderBottomColor =
                              "var(--border-color)")
                            }
                          />
                        </Field>

                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.22 }}
                          style={{
                            fontFamily: font.body,
                            fontSize: "0.72rem",
                            color: "var(--text-muted)",
                            lineHeight: 1.65,
                            borderTop: "1px solid var(--border-color)",
                            paddingTop: "1.1rem",
                            fontWeight: 300,
                          }}
                        >
                          <strong
                            style={{
                              color: "var(--text-secondary)",
                              fontWeight: 600,
                            }}
                          >
                            Privacy notice:
                          </strong>{" "}
                          Anonymized session data may be used for model improvement.
                          You can delete your health history at any time.
                        </motion.p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer actions */}
          {!submitted && (
            <div
              style={{
                padding: "1rem 2rem 1.75rem",
                borderTop: "1px solid var(--border-color)",
                display: "flex",
                justifyContent: "flex-end",
                gap: "0.6rem",
              }}
            >
              <motion.button
                whileHover={{ x: 2 }}
                onClick={() => onClose(false)}
                disabled={isSubmitting}
                style={{
                  background: "none",
                  border: "1px solid var(--border-color)",
                  padding: "0.6rem 1.4rem",
                  borderRadius: 8,
                  color: "var(--text-secondary)",
                  fontFamily: font.ui,
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  transition: "border-color 0.2s, color 0.2s",
                }}
              >
                Skip
              </motion.button>

              <motion.button
                whileHover={rating > 0 && !isSubmitting ? { scale: 1.03, y: -1 } : {}}
                whileTap={rating > 0 && !isSubmitting ? { scale: 0.96 } : {}}
                onClick={handleSubmit}
                disabled={rating === 0 || isSubmitting}
                style={{
                  background:
                    rating > 0 && !isSubmitting
                      ? "var(--text-primary)"
                      : "var(--border-color)",
                  border: "none",
                  padding: "0.6rem 1.6rem",
                  borderRadius: 8,
                  color:
                    rating > 0 && !isSubmitting
                      ? "var(--bg-base)"
                      : "var(--text-muted)",
                  fontFamily: font.ui,
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  cursor: rating > 0 && !isSubmitting ? "pointer" : "not-allowed",
                  transition: "background 0.2s, color 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                {isSubmitting ? (
                  <>
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                      style={{ display: "inline-block" }}
                    >
                      ◌
                    </motion.span>
                    Submitting
                  </>
                ) : (
                  "Submit feedback"
                )}
              </motion.button>
            </div>
          )}
          </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}