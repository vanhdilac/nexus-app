
import React, { useState } from 'react';
import { MessageSquare, Send, Star, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { User, Feedback } from '../types';
import { storageService } from '../services/storageService';

interface FeedbackViewProps {
  user: User;
}

export default function FeedbackView({ user }: FeedbackViewProps) {
  const [type, setType] = useState<Feedback['type']>('improvement');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(5);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const feedback: Feedback = {
      id: crypto.randomUUID(),
      userId: user.id,
      username: user.username,
      type,
      message,
      rating,
      createdAt: Date.now()
    };

    storageService.saveFeedback(feedback);
    setIsSubmitted(true);
    setMessage('');
  };

  if (isSubmitted) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto mt-20 text-center p-10 bg-white rounded-[3rem] border border-slate-100 shadow-xl"
      >
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="text-emerald-500" size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Thank You!</h2>
        <p className="text-slate-500 mb-8">Your feedback helps us make Nexus better for all FPT students.</p>
        <button 
          onClick={() => setIsSubmitted(false)}
          className="px-8 py-3 bg-[#f27024] text-white font-bold rounded-xl shadow-lg hover:bg-[#d9621e] transition-all"
        >
          Send More Feedback
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto p-8"
    >
      <header className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-orange-100 rounded-2xl">
            <MessageSquare className="text-[#f27024]" size={24} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Feedback</h1>
        </div>
        <p className="text-slate-500">We value your thoughts. Let us know how we can improve your experience.</p>
      </header>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8">
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Feedback Type</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(['bug', 'feature', 'improvement', 'other'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-tight transition-all border ${
                  type === t 
                    ? 'bg-[#f27024] text-white border-transparent shadow-md' 
                    : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Rating</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="transition-transform hover:scale-110 active:scale-95"
              >
                <Star 
                  size={32} 
                  className={star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'} 
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Message</label>
          <textarea
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us what's on your mind..."
            className="w-full h-40 p-5 rounded-2xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-[#f27024] focus:bg-white transition-all text-slate-700 font-medium"
          />
        </div>

        <button
          type="submit"
          className="w-full py-4 bg-[#f27024] text-white font-bold rounded-2xl shadow-xl shadow-orange-100 hover:bg-[#d9621e] transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
        >
          <Send size={16} />
          Submit Feedback
        </button>
      </form>
    </motion.div>
  );
}
