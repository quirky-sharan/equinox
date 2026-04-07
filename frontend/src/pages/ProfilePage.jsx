import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuthStore } from "../store/authStore";
import { useQuery } from "@tanstack/react-query";
import { authApi, sessionApi } from "../api/endpoints";
import {
  User, Activity, Clock, Shield, ChevronRight, Edit3, Check,
  ShieldAlert, HeartPulse, Dna, Cigarette, Dumbbell, Wine,
  Moon, Coffee, Brain, Pill, Lock, Info, AlertTriangle
} from "lucide-react";
import { format } from "date-fns";

const BLOOD_GROUPS = ["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const SEX_OPTIONS = [
  { value: "", label: "Prefer not to say" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

export default function ProfilePage() {
  const { user, token, setAuth } = useAuthStore();
  const navigate = useNavigate();

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ["history"],
    queryFn: () => sessionApi.getHistory().then((r) => r.data),
  });

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [healthForm, setHealthForm] = useState({
    photo_url: user?.photo_url || "",
    age: user?.age ?? "",
    sex: user?.sex || "",
    weight: user?.weight || "",
    height: user?.height || "",
    blood_group: user?.blood_group || "",
    allergies: user?.allergies || "",
    medical_conditions: user?.medical_conditions || "",
    habits: user?.habits || "",
    family_history: user?.family_history || "",
  });

  const history = historyData || [];
  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || "?";

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
  };

  const handleUpdate = async () => {
    setLoading(true);
    setSaveSuccess(false);
    try {
      const payload = {
        ...healthForm,
        age: healthForm.age ? parseInt(healthForm.age) : null,
      };
      const res = await authApi.updateMe(payload);
      setAuth(res.data, token);
      setEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to update profile:", err);
      alert("Failed to save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setHealthForm({
      photo_url: user?.photo_url || "",
      age: user?.age ?? "",
      sex: user?.sex || "",
      weight: user?.weight || "",
      height: user?.height || "",
      blood_group: user?.blood_group || "",
      allergies: user?.allergies || "",
      medical_conditions: user?.medical_conditions || "",
      habits: user?.habits || "",
      family_history: user?.family_history || "",
    });
    setEditing(false);
  };

  const updateField = (field, value) =>
    setHealthForm((prev) => ({ ...prev, [field]: value }));

  /* ── Inline helpers ── */
  const FieldLabel = ({ icon: Icon, color, children }) => (
    <label
      className="form-label"
      style={{ display: "flex", alignItems: "center", gap: 6 }}
    >
      {Icon && <Icon size={14} color={color || "var(--accent-blue)"} />}
      {children}
    </label>
  );

  const SectionTitle = ({ icon: Icon, color, title, subtitle }) => (
    <div style={{ marginBottom: "1.25rem" }}>
      <h3
        style={{
          fontFamily: "'Plus Jakarta Sans',sans-serif",
          fontSize: "1.1rem",
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 4,
          color: "var(--text-primary)",
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "10px",
            background: `color-mix(in srgb, ${color || "var(--accent-blue)"} 10%, transparent)`,
            border: `1px solid color-mix(in srgb, ${color || "var(--accent-blue)"} 20%, transparent)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon size={16} color={color || "var(--accent-blue)"} strokeWidth={1.5} />
        </div>
        {title}
      </h3>
      {subtitle && (
        <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginLeft: 40 }}>
          {subtitle}
        </p>
      )}
    </div>
  );

  return (
    <div className="page-container" style={{ paddingBottom: "4rem" }}>
      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        {/* ── Privacy Disclaimer Banner ── */}
        <motion.div
          variants={itemVariants}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 14,
            padding: "1.25rem 1.5rem",
            marginBottom: "2rem",
            borderRadius: "var(--radius-lg)",
            background: "linear-gradient(135deg, rgba(14, 165, 233, 0.06) 0%, rgba(139, 92, 246, 0.04) 100%)",
            border: "1px solid rgba(14, 165, 233, 0.15)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "12px",
              background: "rgba(14, 165, 233, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              marginTop: 2,
            }}
          >
            <Lock size={20} color="var(--accent-blue)" strokeWidth={1.5} />
          </div>
          <div>
            <h3
              style={{
                fontFamily: "'Plus Jakarta Sans',sans-serif",
                fontSize: "0.95rem",
                fontWeight: 700,
                color: "var(--text-primary)",
                marginBottom: 6,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Shield size={14} color="var(--risk-low)" /> Your Privacy is Our Priority
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.65, margin: 0 }}>
              All medical, lifestyle, and personalized data stored on this page is used <strong>strictly</strong> to enhance{" "}
              <em>your individual diagnostic experience</em>. Your data will{" "}
              <strong style={{ color: "var(--accent-blue)" }}>never be used to train our AI models</strong>. We do not
              share, sell, or use your information for any purpose other than providing you with accurate, personalized
              health assessments. You can delete your data at any time.
            </p>
          </div>
        </motion.div>

        {/* ── Header Profile Card ── */}
        <motion.div
          variants={itemVariants}
          className="card"
          style={{
            padding: "2rem",
            marginBottom: "2.5rem",
            display: "flex",
            alignItems: "center",
            gap: "1.5rem",
            flexWrap: "wrap",
            border: "none",
            background: "var(--bg-subtle)",
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "var(--bg-base)",
              border: "1px solid var(--border-color)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              fontSize: "1.5rem",
              fontWeight: 800,
              color: "var(--text-primary)",
              flexShrink: 0,
            }}
          >
            {user?.photo_url ? (
              <img
                src={user.photo_url}
                alt="Profile"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                referrerPolicy="no-referrer"
              />
            ) : (
              initials
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1
              style={{
                fontFamily: "'Plus Jakarta Sans',sans-serif",
                fontSize: "clamp(1.5rem, 5vw, 2rem)",
                fontWeight: 800,
                margin: 0,
                color: "var(--text-primary)",
                letterSpacing: "-0.04em",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {user?.full_name || "Patient Profile"}
            </h1>
            <p
              style={{
                color: "var(--text-secondary)",
                marginTop: 6,
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: "0.95rem",
                flexWrap: "wrap",
              }}
            >
              <User size={16} /> {user?.email}
            </p>
          </div>
          <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
            {saveSuccess && (
              <motion.span
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                style={{ fontSize: "0.85rem", color: "var(--risk-low)", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}
              >
                <Check size={14} /> Saved!
              </motion.span>
            )}
            <div style={{ textAlign: "right" }}>
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  margin: 0,
                }}
              >
                Account Status
              </p>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  color: "var(--risk-low)",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  marginTop: 4,
                }}
              >
                <Shield size={14} /> Verified
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Edit / Save Controls ── */}
        <motion.div
          variants={itemVariants}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.5rem",
            flexWrap: "wrap",
            gap: "0.75rem",
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: "'Plus Jakarta Sans',sans-serif",
                fontSize: "1.35rem",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                color: "var(--text-primary)",
              }}
            >
              Health Profile
            </h2>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: 4 }}>
              The more complete your profile, the more accurate your assessments will be.
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            {editing && (
              <button
                onClick={handleCancel}
                className="btn btn-secondary btn-sm"
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                Cancel
              </button>
            )}
            <button
              onClick={() => (editing ? handleUpdate() : setEditing(true))}
              className={`btn ${editing ? "btn-primary" : "btn-secondary"} btn-sm`}
              disabled={loading}
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              {editing ? (
                <>
                  <Check size={14} /> Save All Changes
                  {loading && <div className="spinner" style={{ width: 12, height: 12 }} />}
                </>
              ) : (
                <>
                  <Edit3 size={14} /> Edit Profile
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* ── Profile Sections Grid ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
            gap: "2rem",
          }}
        >
          {/* ─── COLUMN 1: Identity + Medical ─── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {/* Basic Identity */}
            <motion.div variants={itemVariants} className="card" style={{ padding: "1.75rem" }}>
              <SectionTitle
                icon={User}
                color="var(--accent-blue)"
                title="Basic Information"
                subtitle="Helps us understand your demographic profile"
              />
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {editing && (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <FieldLabel icon={Info} color="var(--text-muted)">
                      Profile Picture URL
                    </FieldLabel>
                    <input
                      type="url"
                      className="form-input"
                      placeholder="https://example.com/my-photo.jpg"
                      value={healthForm.photo_url}
                      onChange={(e) => updateField("photo_url", e.target.value)}
                    />
                  </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <FieldLabel>Age</FieldLabel>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      className="form-input"
                      placeholder="e.g. 28"
                      value={healthForm.age}
                      onChange={(e) => updateField("age", e.target.value)}
                      disabled={!editing}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <FieldLabel>Sex</FieldLabel>
                    <select
                      className="form-input"
                      value={healthForm.sex}
                      onChange={(e) => updateField("sex", e.target.value)}
                      disabled={!editing}
                      style={{ cursor: editing ? "pointer" : "default" }}
                    >
                      {SEX_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <FieldLabel>Weight (kg)</FieldLabel>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. 72"
                      value={healthForm.weight}
                      onChange={(e) => updateField("weight", e.target.value)}
                      disabled={!editing}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <FieldLabel>Height (cm)</FieldLabel>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. 175"
                      value={healthForm.height}
                      onChange={(e) => updateField("height", e.target.value)}
                      disabled={!editing}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <FieldLabel>Blood Group</FieldLabel>
                    <select
                      className="form-input"
                      value={healthForm.blood_group}
                      onChange={(e) => updateField("blood_group", e.target.value)}
                      disabled={!editing}
                      style={{ cursor: editing ? "pointer" : "default" }}
                    >
                      {BLOOD_GROUPS.map((bg) => (
                        <option key={bg} value={bg}>
                          {bg || "Select…"}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Medical History */}
            <motion.div variants={itemVariants} className="card" style={{ padding: "1.75rem" }}>
              <SectionTitle
                icon={HeartPulse}
                color="var(--risk-critical)"
                title="Medical History"
                subtitle="Pre-existing conditions and allergies help us avoid misdiagnosis"
              />
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <FieldLabel icon={ShieldAlert} color="var(--risk-medium)">
                    Known Allergies
                  </FieldLabel>
                  <textarea
                    className="form-input"
                    rows={2}
                    placeholder="e.g. Penicillin, Peanuts, Dust mites, Latex (or 'None')"
                    value={healthForm.allergies}
                    onChange={(e) => updateField("allergies", e.target.value)}
                    disabled={!editing}
                    style={{ resize: "vertical" }}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <FieldLabel icon={Pill} color="var(--risk-critical)">
                    Pre-existing Medical Conditions
                  </FieldLabel>
                  <textarea
                    className="form-input"
                    rows={3}
                    placeholder="e.g. Type 2 Diabetes, Hypertension, Asthma, PCOD, Thyroid disorder (or 'None')"
                    value={healthForm.medical_conditions}
                    onChange={(e) => updateField("medical_conditions", e.target.value)}
                    disabled={!editing}
                    style={{ resize: "vertical" }}
                  />
                </div>
              </div>
            </motion.div>

            {/* Family / Hereditary */}
            <motion.div variants={itemVariants} className="card" style={{ padding: "1.75rem" }}>
              <SectionTitle
                icon={Dna}
                color="#8b5cf6"
                title="Hereditary & Family History"
                subtitle="Family medical patterns significantly affect diagnostic accuracy"
              />
              <div className="form-group" style={{ marginBottom: 0 }}>
                <FieldLabel icon={AlertTriangle} color="#8b5cf6">
                  Family Medical History
                </FieldLabel>
                <textarea
                  className="form-input"
                  rows={4}
                  placeholder={`Describe any conditions that run in your family, e.g.:\n• Father — Diabetes, Heart disease\n• Mother — Hypertension, Thyroid\n• Grandparent — Cancer (type)\n• Sibling — Asthma\n(or 'No known hereditary conditions')`}
                  value={healthForm.family_history}
                  onChange={(e) => updateField("family_history", e.target.value)}
                  disabled={!editing}
                  style={{ resize: "vertical", lineHeight: 1.6 }}
                />
              </div>
            </motion.div>
          </div>

          {/* ─── COLUMN 2: Lifestyle + Assessments ─── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {/* Lifestyle & Habits */}
            <motion.div variants={itemVariants} className="card" style={{ padding: "1.75rem" }}>
              <SectionTitle
                icon={Brain}
                color="var(--risk-medium)"
                title="Lifestyle & Habits"
                subtitle="Daily habits directly influence your diagnostic risk profile"
              />
              <div className="form-group" style={{ marginBottom: 0 }}>
                <FieldLabel icon={Coffee} color="var(--risk-medium)">
                  Describe Your Daily Habits & Lifestyle
                </FieldLabel>
                <textarea
                  className="form-input"
                  rows={6}
                  placeholder={`Tell us about your daily lifestyle — this helps us calibrate risk assessment:\n\n• Smoking: Never / Occasionally / Daily (how many?)\n• Alcohol: Never / Socially / Regularly\n• Exercise: Sedentary / Light / Moderate / Active\n• Sleep: Avg hours per night, quality\n• Diet: Vegetarian / Non-veg / Vegan, any restrictions\n• Caffeine: Cups of coffee/tea per day\n• Screen time: Avg hours per day\n• Stress level: Low / Moderate / High\n• Any medications you take regularly`}
                  value={healthForm.habits}
                  onChange={(e) => updateField("habits", e.target.value)}
                  disabled={!editing}
                  style={{ resize: "vertical", lineHeight: 1.6 }}
                />
              </div>
              {!editing && !healthForm.habits && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    marginTop: "1rem",
                    padding: "0.75rem 1rem",
                    borderRadius: "var(--radius-md)",
                    background: "rgba(245, 158, 11, 0.08)",
                    border: "1px solid rgba(245, 158, 11, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: "0.82rem",
                    color: "var(--risk-medium)",
                  }}
                >
                  <Info size={14} />
                  Completing this section significantly improves AI diagnostic accuracy.
                </motion.div>
              )}
            </motion.div>

            {/* Assessment History Mini-Panel */}
            <motion.div variants={itemVariants}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1rem",
                }}
              >
                <h2
                  style={{
                    fontFamily: "'Plus Jakarta Sans',sans-serif",
                    fontSize: "1.25rem",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Clock size={20} color="#8b5cf6" /> Recent Assessments
                </h2>
                <Link
                  to="/history"
                  className="btn btn-secondary btn-sm"
                  style={{ display: "flex", alignItems: "center", gap: 4 }}
                >
                  View All <ChevronRight size={14} />
                </Link>
              </div>

              <div className="card" style={{ padding: "0.5rem" }}>
                {historyLoading ? (
                  <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
                    Loading history...
                  </div>
                ) : history.length === 0 ? (
                  <div style={{ padding: "2rem", textAlign: "center" }}>
                    <p style={{ color: "var(--text-secondary)", marginBottom: "1rem" }}>
                      No assessments found.
                    </p>
                    <button className="btn btn-primary" onClick={() => navigate("/interview")}>
                      Take Assessment
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {history.slice(0, 5).map((record, i) => (
                      <motion.div
                        key={record.session_id}
                        onClick={() => navigate(`/result/${record.session_id}`)}
                        style={{
                          padding: "1rem 1.25rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          borderBottom: i < Math.min(history.length, 5) - 1 ? "1px solid var(--border-color)" : "none",
                          cursor: "pointer",
                          borderRadius: "var(--radius-md)",
                        }}
                        whileHover={{ background: "rgba(255,255,255,0.02)" }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--text-primary)" }}>
                            {record.top_condition || "Assessment"}
                          </div>
                          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: 4 }}>
                            {format(new Date(record.created_at), "MMM d, yyyy")}
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                          <div
                            style={{
                              padding: "4px 10px",
                              borderRadius: 20,
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              textTransform: "uppercase",
                              background: `color-mix(in srgb, var(--risk-${record.risk_tier}) 15%, transparent)`,
                              color: `var(--risk-${record.risk_tier})`,
                            }}
                          >
                            {record.risk_tier}
                          </div>
                          <ChevronRight size={16} color="var(--text-muted)" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Data Info Footer */}
            <motion.div
              variants={itemVariants}
              style={{
                padding: "1.25rem 1.5rem",
                borderRadius: "var(--radius-md)",
                background: "var(--bg-subtle)",
                border: "1px solid var(--border-color)",
                fontSize: "0.8rem",
                color: "var(--text-muted)",
                lineHeight: 1.7,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, fontWeight: 600, color: "var(--text-secondary)" }}>
                <Info size={14} /> How We Use This Data
              </div>
              <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
                <li>
                  <strong>Age, sex, and body metrics</strong> help calibrate risk thresholds and
                  reference ranges.
                </li>
                <li>
                  <strong>Allergies and conditions</strong> prevent misdiagnosis and flag
                  drug interactions.
                </li>
                <li>
                  <strong>Habits</strong> let us personalize do's, don'ts, and lifestyle
                  recommendations.
                </li>
                <li>
                  <strong>Family history</strong> enables detection of hereditary risk
                  patterns.
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
