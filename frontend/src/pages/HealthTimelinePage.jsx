import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/client';
import { Activity, Trash2, ShieldAlert, HeartPulse, Clock, FileWarning } from 'lucide-react';
import { useState } from 'react';

const RISK_BADGES = {
  low: { border: "border-emerald-500/30", bg: "bg-emerald-500/10", text: "text-emerald-400" },
  medium: { border: "border-amber-500/30", bg: "bg-amber-500/10", text: "text-amber-400" },
  high: { border: "border-orange-500/30", bg: "bg-orange-500/10", text: "text-orange-400" },
  critical: { border: "border-red-500/30", bg: "bg-red-500/10", text: "text-red-400" },
};

export default function HealthTimelinePage() {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState(null);
  
  const { data: memories, isLoading, error } = useQuery({
    queryKey: ['healthTimeline'],
    queryFn: () => api.get('/memory/me').then(res => res.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/memory/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['healthTimeline'] });
      setDeletingId(null);
    }
  });

  const clearAllMutation = useMutation({
    mutationFn: () => api.delete('/memory/all/me'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['healthTimeline'] });
    }
  });

  if (isLoading) return (
    <div className="page-center h-screen flex flex-col items-center justify-center">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-12 h-12 rounded-xl border-2 border-white/10 border-t-purple-500 flex items-center justify-center mb-6">
        <Activity size={20} className="text-purple-500" />
      </motion.div>
      <p className="text-white/60 text-sm tracking-wide">Retrieving your health history...</p>
    </div>
  );

  if (error) return <div className="page-center text-red-400">Failed to load health timeline.</div>;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white mb-2 flex items-center gap-3">
            <HeartPulse size={30} className="text-purple-400" /> Health Timeline
          </h1>
          <p className="text-white/60">Pulse remembers your past assessments to personalize your future care.</p>
        </div>
        
        {memories?.length > 0 && (
          <button 
            onClick={() => {
              if (window.confirm("This permanently deletes your health memory. The AI will not remember your previous sessions. Are you sure?")) {
                clearAllMutation.mutate();
              }
            }}
            disabled={clearAllMutation.isPending}
            className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-sm font-semibold hover:bg-red-500/20 transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <Trash2 size={16} /> {clearAllMutation.isPending ? 'Clearing...' : 'Clear All History'}
          </button>
        )}
      </div>

      {!memories || memories.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center text-white/60 flex flex-col items-center justify-center min-h-[300px]">
          <Clock size={48} strokeWidth={1.5} className="mb-6 opacity-40 text-purple-400" />
          <h3 className="text-xl font-bold text-white mb-2">No history recorded</h3>
          <p className="max-w-md">Your health history will appear here after completing your first assessment.</p>
        </div>
      ) : (
        <div className="relative border-l-2 border-white/10 pl-6 ml-4 space-y-8">
          <AnimatePresence>
            {memories.map((entry, index) => {
              const risk = RISK_BADGES[entry.risk_tier?.toLowerCase()] || RISK_BADGES.medium;
              return (
                <motion.div 
                  key={entry.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative"
                >
                  {/* Timeline dot */}
                  <div className={`absolute -left-[35px] w-4 h-4 rounded-full border-4 border-[#1A1A24] bg-gradient-to-tr from-purple-500 to-accent-blue shadow-[0_0_10px_rgba(168,85,247,0.5)]`} />
                  
                  <div className="bg-white/5 hover:bg-white/[0.07] transition-colors border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
                    {/* Delete entry button */}
                    <button 
                      onClick={() => setDeletingId(entry.id)}
                      className="absolute top-4 right-4 text-white/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete entry"
                    >
                      <Trash2 size={16} />
                    </button>

                    {/* Delete Confirmation Overlay */}
                    <AnimatePresence>
                      {deletingId === entry.id && (
                        <motion.div 
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="absolute inset-0 bg-[#1A1A24]/90 backdrop-blur-sm z-10 flex flex-col justify-center items-center p-6 border border-red-500/30 rounded-2xl"
                        >
                          <ShieldAlert className="text-red-400 mb-3" size={32} />
                          <p className="text-white font-medium mb-1">Delete this memory?</p>
                          <p className="text-white/50 text-xs text-center mb-4">The AI will no longer know about this assessment.</p>
                          <div className="flex gap-3">
                            <button onClick={() => setDeletingId(null)} className="px-4 py-2 rounded-lg bg-white/10 text-white text-sm font-semibold hover:bg-white/20 transition-colors">Cancel</button>
                            <button onClick={() => deleteMutation.mutate(entry.id)} className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors shadow-[0_0_15px_rgba(239,68,68,0.3)]">Delete</button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    <div className="mb-4">
                      <div className="text-purple-400/80 text-xs font-bold tracking-widest uppercase mb-2 flex items-center gap-2">
                        <Clock size={12} /> {new Date(entry.created_at).toLocaleDateString(undefined, {weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'})}
                      </div>
                      <div className="flex items-start justify-between pe-8">
                        <h2 className="text-xl font-bold text-white leading-tight">{entry.condition}</h2>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${risk.border} ${risk.bg} ${risk.text}`}>
                        {entry.risk_tier?.toUpperCase()} RISK
                      </span>
                      {entry.see_doctor && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-blue-500/30 bg-blue-500/10 text-blue-400">
                          SEEK MEDICAL CARE ({entry.see_doctor_urgency?.toUpperCase()})
                        </span>
                      )}
                    </div>

                    <div className="bg-black/30 rounded-lg p-4 border border-white/5 mb-4">
                      <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <FileWarning size={14} /> Reported Symptoms
                      </h4>
                      <p className="text-sm text-white/70 italic line-clamp-3">"{entry.symptoms_summary}"</p>
                    </div>

                    {entry.key_findings && (entry.key_findings.dos?.length > 0) && (
                      <div>
                         <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Key Recommendations</h4>
                         <ul className="text-sm text-white/60 space-y-1 pl-4 list-disc marker:text-purple-500">
                           {entry.key_findings.dos.slice(0, 3).map((d, i) => (
                             <li key={i} className="line-clamp-1">{d}</li>
                           ))}
                         </ul>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
