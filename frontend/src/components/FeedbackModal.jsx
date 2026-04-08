import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/client';

export default function FeedbackModal({ sessionId, isOpen, onClose }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [wasAccurate, setWasAccurate] = useState(true);
  const [helpfulText, setHelpfulText] = useState('');
  const [notHelpfulText, setNotHelpfulText] = useState('');
  const [actualDiagnosis, setActualDiagnosis] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setIsSubmitting(true);
    try {
      await api.post('/feedback/submit', {
        session_id: sessionId,
        rating,
        was_accurate: wasAccurate,
        helpful_text: helpfulText,
        not_helpful_text: notHelpfulText,
        actual_diagnosis: actualDiagnosis
      });
      onClose(true); // pass true to indicate submitted
    } catch (err) {
      console.error("Failed to submit feedback", err);
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-[#1A1A24] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative"
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
        >
          {/* Header */}
          <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
            <h2 className="text-xl font-semibold text-white">Help us improve Pulse</h2>
            <button onClick={() => onClose(false)} className="text-white/50 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
            {/* Rating */}
            <div className="flex flex-col items-center space-y-2">
              <p className="text-white/80 font-medium">How would you rate this assessment?</p>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="focus:outline-none transition-transform hover:scale-110"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                  >
                    <svg
                      className={`w-10 h-10 transition-colors ${(hoverRating || rating) >= star ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>

            {/* Form Fields - Only show if rating is selected to keep initial UI clean */}
            <AnimatePresence>
              {rating > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-5"
                >
                  <label className="flex items-start space-x-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center mt-0.5">
                      <input
                        type="checkbox"
                        checked={wasAccurate}
                        onChange={(e) => setWasAccurate(e.target.checked)}
                        className="peer appearance-none w-5 h-5 border-2 border-white/20 rounded bg-white/5 checked:bg-[#FF3366] checked:border-[#FF3366] transition-all cursor-pointer focus:ring-2 focus:ring-[#FF3366]/50 focus:outline-none"
                      />
                      <svg className="absolute w-3.5 h-3.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                    <span className="text-white/80 group-hover:text-white transition-colors text-sm">The assessment matched my actual condition/diagnosis.</span>
                  </label>

                  {!wasAccurate && (
                    <motion.div initial={{opacity:0}} animate={{opacity:1}}>
                      <label className="block text-sm text-white/70 mb-1">What was the actual diagnosis? (optional)</label>
                      <input
                        type="text"
                        value={actualDiagnosis}
                        onChange={(e) => setActualDiagnosis(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-[#FF3366]/50 focus:ring-1 focus:ring-[#FF3366]/50 transition-all text-sm"
                        placeholder="e.g. Migraine instead of Tension Headache"
                      />
                    </motion.div>
                  )}

                  <div>
                    <label className="block text-sm text-white/70 mb-1">What was most helpful?</label>
                    <textarea
                      value={helpfulText}
                      onChange={(e) => setHelpfulText(e.target.value)}
                      maxLength={500}
                      rows={2}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-[#FF3366]/50 focus:ring-1 focus:ring-[#FF3366]/50 transition-all text-sm resize-none custom-scrollbar"
                      placeholder="What did the AI get right?"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-white/70 mb-1">What could be improved?</label>
                    <textarea
                      value={notHelpfulText}
                      onChange={(e) => setNotHelpfulText(e.target.value)}
                      maxLength={500}
                      rows={2}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-[#FF3366]/50 focus:ring-1 focus:ring-[#FF3366]/50 transition-all text-sm resize-none custom-scrollbar"
                      placeholder="Was something missing or inaccurate?"
                    />
                  </div>
                  
                  <div className="p-3 bg-white/5 rounded border border-white/10 text-xs text-white/50 leading-relaxed">
                    <span className="font-semibold text-white/70">Privacy Notice:</span> Your feedback helps improve the AI. Anonymized session data may be used for model training. You can delete your health history at any time.
                  </div>

                </motion.div>
              )}
            </AnimatePresence>

          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/10 bg-white/5 flex justify-end space-x-3">
            <button
              onClick={() => onClose(false)}
              className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors"
              disabled={isSubmitting}
            >
              Skip
            </button>
            <button
              onClick={handleSubmit}
              disabled={rating === 0 || isSubmitting}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                rating > 0 && !isSubmitting
                  ? 'bg-gradient-to-r from-[#FF3366] to-[#FF9933] text-white hover:opacity-90 shadow-lg shadow-[#FF3366]/20'
                  : 'bg-white/10 text-white/40 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
