
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, Zap, CheckCircle2, X, ArrowRight, ArrowLeft, 
  LayoutGrid, Calendar, User, BarChart3, Info, Sparkles, Clock 
} from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Welcome to Nexus! 🚀",
      icon: <Target className="text-accent" size={32} />,
      content: (
        <div className="space-y-6">
          <p className="text-slate-600 text-lg leading-relaxed">
            Hello there! I'm Nexus - your smart "study assistant" here to help you conquer deadlines at FPTU using the **Eisenhower Matrix** combined with AI.
          </p>
          <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
            <h4 className="font-bold text-slate-800 text-lg mb-2 flex items-center gap-2">
              <BarChart3 size={20} className="text-accent" />
              Dashboard - "Command Center"
            </h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              This is where you can quickly check your academic "health": total tasks, how many I've analyzed, and especially urgent tasks that need immediate attention.
            </p>
          </div>
          <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">Pro-tip</p>
            <p className="text-sm text-slate-700 italic font-medium">"Visit the Dashboard every morning so I can remind you what needs to be 'conquered' today!"</p>
          </div>
        </div>
      )
    },
    {
      title: "Academic Tasks - Load Deadlines 📝",
      icon: <Zap className="text-accent" size={32} />,
      content: (
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-orange-100 text-accent flex items-center justify-center text-sm font-bold shrink-0">1</div>
              <p className="text-base text-slate-700 font-medium">Click <strong>Add Task</strong> to get started.</p>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-orange-100 text-accent flex items-center justify-center text-sm font-bold shrink-0">2</div>
              <p className="text-base text-slate-700 font-medium">Use the <strong>Green Checkmark</strong> to complete tasks. I'll strike through and fade them out for you.</p>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-orange-100 text-accent flex items-center justify-center text-sm font-bold shrink-0">3</div>
              <p className="text-base text-slate-700 font-medium"><strong>EXP System</strong>: I'll grant EXP when you complete tasks. If you uncheck them, I'll deduct the EXP to keep things fair!</p>
            </div>
          </div>
          <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">Nexus Mail 📧</p>
            <p className="text-sm text-slate-700 italic font-medium">"I'll automatically remind you to study 2 days before an exam and prepare your gear 1 day before via simulated email notifications!"</p>
          </div>
        </div>
      )
    },
    {
      title: "The Matrix - AI Intelligence 🧠",
      icon: <LayoutGrid className="text-accent" size={32} />,
      content: (
        <div className="space-y-6">
          <p className="text-base text-slate-600 font-medium">I'll automatically "sort" your tasks into 4 strategic quadrants:</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-rose-50 rounded-xl border border-rose-100">
              <p className="font-bold text-rose-600 text-sm">Do First</p>
              <p className="text-xs text-slate-500">Do it now, no excuses!</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <p className="font-bold text-blue-600 text-sm">Schedule</p>
              <p className="text-xs text-slate-500">Schedule it for later.</p>
            </div>
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
              <p className="font-bold text-amber-600 text-sm">Delegate</p>
              <p className="text-xs text-slate-500">Ask for help or optimize.</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <p className="font-bold text-slate-600 text-sm">Eliminate</p>
              <p className="text-xs text-slate-500">Delete it, don't worry about it.</p>
            </div>
          </div>
          <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2">Pro-tip</p>
            <p className="text-sm text-slate-700 italic font-medium">"Trust my analysis, but feel free to manually adjust things if they don't quite fit your style."</p>
          </div>
        </div>
      )
    },
    {
      title: "Study Planner - AI Schedule 📅",
      icon: <Calendar className="text-accent" size={32} />,
      content: (
        <div className="space-y-6">
          <p className="text-base text-slate-600 font-medium">The "coolest" feature: **AI Week Planner**.</p>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <Sparkles size={20} className="text-orange-400 mt-1 shrink-0" />
              <p className="text-sm text-slate-700 leading-relaxed">I automatically arrange tasks into your free slots throughout the week.</p>
            </div>
            <div className="flex items-start gap-4">
              <Clock size={20} className="text-orange-400 mt-1 shrink-0" />
              <p className="text-sm text-slate-700 leading-relaxed">I clearly display <strong>Start - End</strong> times (e.g., 09:00 - 10:30) for each of your study sessions.</p>
            </div>
          </div>
          <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
            <p className="text-xs font-bold text-orange-600 uppercase tracking-widest mb-2">Responsive</p>
            <p className="text-sm text-slate-700 italic font-medium">"On mobile, you can swipe horizontally across the calendar to see all 7 days of the week!"</p>
          </div>
        </div>
      )
    },
    {
      title: "Profile - Define Your Style 🎨",
      icon: <User className="text-accent" size={32} />,
      content: (
        <div className="space-y-6">
          <p className="text-base text-slate-600 font-medium">Don't forget to refresh your identity on the Profile page:</p>
          <ul className="list-disc list-inside text-sm text-slate-600 space-y-2 ml-2 font-medium">
            <li>Update <strong>Bio</strong>: Write a few lines of your study motto.</li>
            <li>Change <strong>Theme Color</strong>: Pick a color that represents your personality.</li>
          </ul>
          <div className="bg-slate-900 text-white p-8 rounded-2xl relative overflow-hidden mt-6">
            <div className="relative z-10">
              <h4 className="font-bold text-lg mb-2">Are you ready?</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your journey to a 4.0 GPA starts here. I wish you an amazing experience with Nexus!
              </p>
            </div>
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-accent rounded-full blur-3xl opacity-30"></div>
          </div>
        </div>
      )
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-start justify-center p-4 pt-[8vh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-[800px] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-[75vh]"
          >
            {/* Header */}
            <div className="p-8 pb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-50 rounded-xl">
                  {steps[currentStep].icon}
                </div>
                <div className="flex flex-col">
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">
                    {steps[currentStep].title}
                  </h2>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">
                    Step {currentStep + 1} / {steps.length}
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="px-8 py-4 flex-1 overflow-y-auto custom-scrollbar">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {steps[currentStep].content}
              </motion.div>
            </div>

            {/* Footer */}
            <div className="p-8 pt-4 flex items-center justify-between gap-4">
              <div className="flex gap-1">
                {steps.map((_, idx) => (
                  <div 
                    key={idx} 
                    className={`h-1 rounded-full transition-all duration-300 ${
                      idx === currentStep ? 'w-6 bg-accent' : 'w-2 bg-slate-200'
                    }`}
                  />
                ))}
              </div>
              
              <div className="flex gap-3">
                {currentStep > 0 && (
                  <button
                    onClick={prevStep}
                    className="p-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all flex items-center justify-center"
                  >
                    <ArrowLeft size={18} />
                  </button>
                )}
                <button
                  onClick={nextStep}
                  className="px-8 py-4 bg-accent text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 hover:bg-orange-600 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                >
                  {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
