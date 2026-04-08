import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import api from '../api/client';
import { Star, CheckCircle, XCircle, TrendingUp, BarChart2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FeedbackAnalyticsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['feedbackAnalytics'],
    queryFn: () => api.get('/feedback/analytics/me').then(res => res.data),
  });

  if (isLoading) return (
    <div className="page-center h-screen flex flex-col items-center justify-center">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-12 h-12 rounded-xl border-2 border-white/10 border-t-[#FF3366] flex items-center justify-center mb-6">
        <Star size={20} color="#FF3366" />
      </motion.div>
      <p className="text-white/60 text-sm tracking-wide">Loading your feedback analytics...</p>
    </div>
  );

  if (error || !data) return (
    <div className="page-center text-red-400">Failed to load analytics: {error?.message}</div>
  );

  const { total_sessions, avg_rating, accuracy_rate, rating_distribution, history } = data;

  const maxCount = Math.max(...Object.values(rating_distribution));

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold text-white mb-2">Feedback Analytics</h1>
        <p className="text-white/60">Your contribution to improving the Pulse clinical AI.</p>
      </div>

      {total_sessions === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center text-white/60">
          <BarChart2 size={48} strokeWidth={1.5} className="mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-bold text-white mb-2">No feedback submitted yet</h3>
          <p className="mb-6">Complete an assessment and submit feedback to see your analytics here.</p>
          <Link to="/interview" className="btn btn-primary inline-flex">Take an Assessment</Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col justify-center shadow-lg relative overflow-hidden">
              <div className="absolute -right-6 -top-6 text-white/5">
                <Star size={120} />
              </div>
              <p className="text-white/50 text-sm font-semibold uppercase tracking-wider mb-2 relative z-10">Average Rating</p>
              <h2 className="text-4xl font-extrabold text-white relative z-10 flex items-baseline gap-2">
                {avg_rating} <span className="text-lg text-white/40 font-medium">/ 5</span>
              </h2>
            </div>
            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col justify-center shadow-lg relative overflow-hidden">
              <div className="absolute -right-6 -top-6 text-[#FF3366]/5">
                <TrendingUp size={120} />
              </div>
              <p className="text-white/50 text-sm font-semibold uppercase tracking-wider mb-2 relative z-10">Accuracy Rate</p>
              <h2 className="text-4xl font-extrabold text-[#FF3366] relative z-10 flex items-baseline gap-2">
                {accuracy_rate}%
              </h2>
            </div>
            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col justify-center shadow-lg">
              <p className="text-white/50 text-sm font-semibold uppercase tracking-wider mb-2">Sessions Rated</p>
              <h2 className="text-4xl font-extrabold text-white">{total_sessions}</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Rating Distribution */}
            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl lg:col-span-1 shadow-lg">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><BarChart2 size={18} /> Rating Distribution</h3>
              <div className="space-y-4">
                {[5, 4, 3, 2, 1].map(stars => {
                  const count = rating_distribution[stars] || 0;
                  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
                  return (
                    <div key={stars} className="flex items-center gap-4 text-sm font-medium">
                      <div className="w-12 text-right text-white/70 flex items-center justify-end gap-1">
                        {stars} <Star size={12} className="text-yellow-400 fill-yellow-400" />
                      </div>
                      <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden relative">
                        <motion.div 
                          initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1 }}
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-yellow-500 to-yellow-300 rounded-full shadow-lg"
                        />
                      </div>
                      <div className="w-8 text-white/50">{count}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* History Table */}
            <div className="bg-white/5 border border-white/10 rounded-2xl lg:col-span-2 shadow-lg overflow-hidden flex flex-col">
              <div className="p-6 border-b border-white/10">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">Feedback History</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/5 text-white/50 uppercase tracking-wider text-xs border-b border-white/10">
                    <tr>
                      <th className="font-semibold p-4">Date</th>
                      <th className="font-semibold p-4">Condition</th>
                      <th className="font-semibold p-4 text-center">Rating</th>
                      <th className="font-semibold p-4 text-center">Accurate?</th>
                      <th className="font-semibold p-4">Feedback Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {history.map((h, i) => (
                      <tr key={h.session_id + i} className="hover:bg-white/5 transition-colors">
                        <td className="p-4 whitespace-nowrap text-white/80">
                          {new Date(h.submitted_at).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}
                        </td>
                        <td className="p-4 font-medium text-white">{h.condition}</td>
                        <td className="p-4 text-center text-yellow-400">
                          {h.rating} ★
                        </td>
                        <td className="p-4 text-center">
                          {h.was_accurate 
                            ? <CheckCircle size={16} className="text-green-400 mx-auto" /> 
                            : <XCircle size={16} className="text-[#FF3366] mx-auto" />}
                        </td>
                        <td className="p-4 text-white/50 text-xs italic truncate max-w-[200px]" title={h.helpful_text || ''}>
                          {h.helpful_text ? `"${h.helpful_text.substring(0, 40)}${h.helpful_text.length > 40 ? '...' : ''}"` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
