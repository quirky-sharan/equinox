import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, Phone, MessageCircle, ArrowLeft } from "lucide-react";
import { clearCrisisFlag } from "../utils/crisisDetector";

export default function SupportPage() {
  const navigate = useNavigate();

  const handleGoBack = () => {
    clearCrisisFlag();
    navigate("/dashboard");
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.3 },
    },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <div className="support-page">
      <motion.div
        className="support-content"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Warm icon */}
        <motion.div variants={itemVariants} className="support-heart">
          <Heart size={48} strokeWidth={1.2} />
        </motion.div>

        {/* Headline */}
        <motion.h1 variants={itemVariants} className="support-headline">
          We're glad you're here.
        </motion.h1>

        {/* Subtext */}
        <motion.p variants={itemVariants} className="support-subtext">
          Sometimes the hardest thing is just reaching out. You don't have to
          have it all figured out — and you don't have to go through this alone.
          <br />
          <br />
          Whatever you're feeling right now is valid. There are people who care,
          who are trained to listen, and who want to help. Talking can make
          things feel a little lighter.
        </motion.p>

        {/* Action Cards */}
        <div className="support-cards">
          {/* Talk to someone */}
          <motion.a
            variants={itemVariants}
            href="tel:9152987821"
            className="support-card support-card-call"
          >
            <div className="support-card-icon">
              <Phone size={24} />
            </div>
            <div className="support-card-body">
              <h3>Talk to someone now</h3>
              <p>
                <strong>iCall Helpline</strong> — 9152987821
                <br />
                <strong>Vandrevala Foundation</strong> — 1860-2662-345 (24/7)
              </p>
              <span className="support-card-cta">Tap to call →</span>
            </div>
          </motion.a>

          {/* Text-based support */}
          <motion.a
            variants={itemVariants}
            href="https://icallhelpline.org"
            target="_blank"
            rel="noopener noreferrer"
            className="support-card support-card-text"
          >
            <div className="support-card-icon">
              <MessageCircle size={24} />
            </div>
            <div className="support-card-body">
              <h3>Prefer texting?</h3>
              <p>
                Chat or email with a trained counselor at iCall. No
                judgment, just support.
              </p>
              <span className="support-card-cta">Visit icallhelpline.org →</span>
            </div>
          </motion.a>

          {/* Go back */}
          <motion.button
            variants={itemVariants}
            onClick={handleGoBack}
            className="support-card support-card-back"
          >
            <div className="support-card-icon">
              <ArrowLeft size={24} />
            </div>
            <div className="support-card-body">
              <h3>Go back when you're ready</h3>
              <p>
                There's no rush. Take your time. When you feel ready, you can
                return to the app.
              </p>
              <span className="support-card-cta">Return to home →</span>
            </div>
          </motion.button>
        </div>

        {/* Quiet footer */}
        <motion.p variants={itemVariants} className="support-footer">
          You are not alone. You matter. 💙
        </motion.p>
      </motion.div>
    </div>
  );
}
