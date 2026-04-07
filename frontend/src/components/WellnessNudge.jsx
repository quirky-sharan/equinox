import { Heart } from "lucide-react";

/**
 * WellnessNudge — A subtle, grounding card shown when the LLM detects
 * emotional distress in the user's typing style. NOT a crisis intervention
 * (that's SupportPage). This is a warm, non-diagnostic gentle nudge.
 *
 * Props:
 *   mentalState: { distress_detected, tone, wellness_nudge }
 */
export default function WellnessNudge({ mentalState }) {
  if (
    !mentalState ||
    !mentalState.distress_detected ||
    !mentalState.wellness_nudge
  ) {
    return null;
  }

  return (
    <div className="wellness-nudge">
      <div className="wellness-nudge-icon">
        <Heart size={20} strokeWidth={1.5} />
      </div>
      <div className="wellness-nudge-body">
        <p className="wellness-nudge-text">{mentalState.wellness_nudge}</p>
        <a
          href="https://icallhelpline.org"
          target="_blank"
          rel="noopener noreferrer"
          className="wellness-nudge-link"
        >
          Find a counselor near you →
        </a>
      </div>
    </div>
  );
}
