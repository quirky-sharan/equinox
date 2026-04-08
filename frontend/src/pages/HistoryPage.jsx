import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { sessionApi } from "../api/endpoints";
import { format } from "date-fns";
import { Clock, ChevronRight, Cat, Activity, Trash2, AlertTriangle } from "lucide-react";

const RISK_COLORS = {
  low: "var(--risk-low)", medium: "var(--risk-medium)",
  high: "var(--risk-high)", critical: "var(--risk-critical)"
};
const RISK_BG = {
  low: "rgba(16,185,129,0.1)", medium: "rgba(245,158,11,0.1)",
  high: "rgba(249,115,22,0.1)", critical: "rgba(239,68,68,0.1)"
};

export default function HistoryPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [sessionToDelete, setSessionToDelete] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["history"],
    queryFn: () => sessionApi.getHistory().then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => sessionApi.deleteSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["history"] });
      setSessionToDelete(null);
    },
    onError: (err) => {
      console.error("Failed to delete session", err);
      // Optional: show a toast/alert here
      setSessionToDelete(null);
    }
  });

  const sessions = data || [];

  return (
    <div className="page-container" style={{ maxWidth: 840 }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "3rem", flexWrap: "wrap", gap: 20 }}>
          <div>
            <h1 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: "2.5rem", fontWeight: 800, letterSpacing: "-0.04em", color: "var(--text-primary)" }}>
              History audit.
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "1rem", marginTop: 8 }}>
              Comprehensive longitudinal record of your clinical interactions.
            </p>
          </div>
          <motion.button 
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            className="btn btn-primary" onClick={() => navigate("/interview")} style={{ gap: 10, padding: "0.85rem 1.5rem" }}
          >
            <Cat size={18} /> New Assessment
          </motion.button>
        </div>


        {isLoading && (
          <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
            <div className="spinner spinner-lg" />
          </div>
        )}

        {!isLoading && sessions.length === 0 && (
          <div className="card" style={{ padding: "3rem", textAlign: "center" }}>
            <Activity size={48} color="var(--text-muted)" style={{ marginBottom: 16, opacity: 0.5 }} />
            <h2 style={{ fontWeight: 700, marginBottom: 8 }}>No assessments yet</h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: 20 }}>
              Start your first clinical interview to see your history here.
            </p>
            <button className="btn btn-primary" onClick={() => navigate("/interview")}>
              Start First Assessment
            </button>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <AnimatePresence mode="popLayout">
            {sessions.map((s, i) => (
              <motion.div key={s.session_id}
                layout
                className="card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, height: 0, overflow: 'hidden', padding: 0, marginBottom: 0 }}
                transition={{ duration: 0.3 }}
                style={{
                  padding: "1.25rem 2rem",
                  display: "flex", alignItems: "center", gap: "1.5rem",
                  cursor: s.status === "completed" ? "pointer" : "default",
                  border: "none", background: "var(--bg-subtle)"
                }}
                onClick={() => s.status === "completed" && navigate(`/result/${s.session_id}`)}
                whileHover={s.status === "completed" ? { background: "var(--bg-card)", x: 8 } : {}}
              >
              <div style={{
                width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                background: RISK_BG[s.risk_tier] || "var(--bg-card)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.2rem", fontWeight: 900,
                color: RISK_COLORS[s.risk_tier] || "var(--text-muted)",
                fontFamily: "'Plus Jakarta Sans',sans-serif"
              }}>
                {s.risk_tier ? s.risk_tier[0].toUpperCase() : "?"}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: "1.05rem", marginBottom: 4 }}>
                  {s.top_condition || "Interaction Segment"}
                </div>
                <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                  {s.created_at ? format(new Date(s.created_at), "MMMM d, yyyy") : "—"}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 800, letterSpacing: "0.1em", color: RISK_COLORS[s.risk_tier] || "var(--text-muted)", textTransform: "uppercase" }}>
                  {s.risk_tier || "UNRATED"}
                </span>
                <button 
                  onClick={(e) => { e.stopPropagation(); setSessionToDelete(s.session_id); }}
                  style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "8px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "var(--risk-critical)"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-muted)"}
                >
                  <Trash2 size={18} />
                </button>
                {s.status === "completed" && <ChevronRight size={18} color="var(--text-muted)" />}
              </div>
            </motion.div>
          ))}
          </AnimatePresence>
        </div>

      </motion.div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {sessionToDelete && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-[#1A1A24] border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative p-6"
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
            >
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "1rem" }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(239, 68, 68, 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <AlertTriangle size={24} color="var(--risk-critical)" />
                </div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>Delete Assessment?</h3>
                <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
                  This will permanently remove this assessment from your clinical history and analytics. This action cannot be undone.
                </p>
                <div style={{ display: "flex", gap: "1rem", width: "100%", marginTop: "1rem" }}>
                  <button 
                    onClick={() => setSessionToDelete(null)}
                    disabled={deleteMutation.isPending}
                    className="btn btn-secondary" style={{ flex: 1 }}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => deleteMutation.mutate(sessionToDelete)}
                    disabled={deleteMutation.isPending}
                    className="btn btn-primary" style={{ flex: 1, background: "var(--risk-critical)", borderColor: "var(--risk-critical)" }}
                  >
                    {deleteMutation.isPending ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
