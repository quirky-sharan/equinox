import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ShieldAlert, User, Info } from "lucide-react";

/**
 * PersonalizedAlerts — Renders profile-specific health conflict highlights
 * above the chat question. Each alert is color-coded by severity.
 *
 * Props:
 *   highlights: Array<{ title, detail, severity, profile_field }>
 */
export default function PersonalizedAlerts({ highlights = [] }) {
  if (!highlights || highlights.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="personalized-alerts-container"
    >
      {/* Section header */}
      <div className="pa-header">
        <ShieldAlert size={16} />
        <span>Personalized Health Alerts</span>
      </div>

      {/* Alert items */}
      <div className="pa-list">
        <AnimatePresence>
          {highlights.map((h, i) => {
            const isCritical = h.severity === "critical";
            return (
              <motion.div
                key={`${h.title}-${i}`}
                initial={{ opacity: 0, x: -15, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ delay: i * 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className={`pa-alert ${isCritical ? "pa-critical" : "pa-warning"}`}
              >
                <div className="pa-alert-icon">
                  {isCritical ? (
                    <AlertTriangle size={18} />
                  ) : (
                    <Info size={18} />
                  )}
                </div>
                <div className="pa-alert-body">
                  <div className="pa-alert-title">{h.title}</div>
                  <div className="pa-alert-detail">{h.detail}</div>
                  {h.profile_field && (
                    <span className="pa-alert-tag">
                      <User size={10} /> {h.profile_field.replace(/_/g, " ")}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
