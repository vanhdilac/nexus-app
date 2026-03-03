
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
      title: "Chào mừng đến với Nexus! 🚀",
      icon: <Target className="text-[#f27024]" size={32} />,
      content: (
        <div className="space-y-6">
          <p className="text-slate-600 text-lg leading-relaxed">
            Hế lô bạn trẻ! Nexus là "trợ lý học tập" xịn xò giúp bạn dẹp tan nỗi lo deadline tại FPTU bằng phương pháp **Eisenhower Matrix** kết hợp với AI.
          </p>
          <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
            <h4 className="font-bold text-slate-800 text-lg mb-2 flex items-center gap-2">
              <BarChart3 size={20} className="text-[#f27024]" />
              Dashboard - "Tổng hành dinh"
            </h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              Nơi check nhanh "sức khỏe" học tập: Tổng task đang có, bao nhiêu cái đã được AI "soi", và đặc biệt là những task khẩn cấp cần xử ngay.
            </p>
          </div>
          <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">Pro-tip</p>
            <p className="text-sm text-slate-700 italic font-medium">"Ghé Dashboard mỗi sáng để biết hôm nay mình cần 'chiến' những gì nhé!"</p>
          </div>
        </div>
      )
    },
    {
      title: "Academic Tasks - Nạp Deadline 📝",
      icon: <Zap className="text-[#f27024]" size={32} />,
      content: (
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-orange-100 text-[#f27024] flex items-center justify-center text-sm font-bold shrink-0">1</div>
              <p className="text-base text-slate-700 font-medium">Bấm <strong>Add Task</strong> để bắt đầu.</p>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-orange-100 text-[#f27024] flex items-center justify-center text-sm font-bold shrink-0">2</div>
              <p className="text-base text-slate-700 font-medium">Sử dụng <strong>Icon Tick xanh</strong> mới để hoàn thành task. Task sẽ có hiệu ứng gạch ngang và mờ đi khi xong.</p>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-orange-100 text-[#f27024] flex items-center justify-center text-sm font-bold shrink-0">3</div>
              <p className="text-base text-slate-700 font-medium"><strong>EXP System</strong>: Nhận EXP khi hoàn thành. Nếu bạn bỏ tick, số EXP đó sẽ bị trừ đi chính xác để đảm bảo công bằng.</p>
            </div>
          </div>
          <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">Nexus Mail 📧</p>
            <p className="text-sm text-slate-700 italic font-medium">"Hệ thống sẽ tự động nhắc bạn ôn thi trước 2 ngày và chuẩn bị đồ dùng trước 1 ngày qua thông báo email mô phỏng!"</p>
          </div>
        </div>
      )
    },
    {
      title: "The Matrix - Ma Trận AI 🧠",
      icon: <LayoutGrid className="text-[#f27024]" size={32} />,
      content: (
        <div className="space-y-6">
          <p className="text-base text-slate-600 font-medium">AI sẽ tự động "ném" task của bạn vào 4 ô chiến thuật:</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-rose-50 rounded-xl border border-rose-100">
              <p className="font-bold text-rose-600 text-sm">Do First</p>
              <p className="text-xs text-slate-500">Làm ngay, không bàn cãi!</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <p className="font-bold text-blue-600 text-sm">Schedule</p>
              <p className="text-xs text-slate-500">Lên lịch để làm sau.</p>
            </div>
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
              <p className="font-bold text-amber-600 text-sm">Delegate</p>
              <p className="text-xs text-slate-500">Nhờ vả hoặc tối ưu lại.</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <p className="font-bold text-slate-600 text-sm">Eliminate</p>
              <p className="text-xs text-slate-500">Xóa bỏ, đừng bận tâm.</p>
            </div>
          </div>
          <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2">Pro-tip</p>
            <p className="text-sm text-slate-700 italic font-medium">"Tin tưởng AI, nhưng bạn vẫn có thể tự tay điều chỉnh nếu thấy chưa 'hợp gu' nhé."</p>
          </div>
        </div>
      )
    },
    {
      title: "Study Planner - Lịch Học AI 📅",
      icon: <Calendar className="text-[#f27024]" size={32} />,
      content: (
        <div className="space-y-6">
          <p className="text-base text-slate-600 font-medium">Tính năng "đỉnh" nhất: **AI Week Planner**.</p>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <Sparkles size={20} className="text-orange-400 mt-1 shrink-0" />
              <p className="text-sm text-slate-700 leading-relaxed">Tự động sắp xếp các task vào khung giờ trống trong tuần.</p>
            </div>
            <div className="flex items-start gap-4">
              <Clock size={20} className="text-orange-400 mt-1 shrink-0" />
              <p className="text-sm text-slate-700 leading-relaxed">Hiển thị rõ ràng khoảng thời gian <strong>Start - End</strong> (ví dụ: 09:00 - 10:30) cho mỗi phiên học.</p>
            </div>
          </div>
          <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
            <p className="text-xs font-bold text-orange-600 uppercase tracking-widest mb-2">Responsive</p>
            <p className="text-sm text-slate-700 italic font-medium">"Trên điện thoại, bạn có thể vuốt ngang bảng lịch để xem đầy đủ 7 ngày trong tuần!"</p>
          </div>
        </div>
      )
    },
    {
      title: "Profile - Khẳng định chất riêng 🎨",
      icon: <User className="text-[#f27024]" size={32} />,
      content: (
        <div className="space-y-6">
          <p className="text-base text-slate-600 font-medium">Đừng quên làm mới bản thân tại trang Profile:</p>
          <ul className="list-disc list-inside text-sm text-slate-600 space-y-2 ml-2 font-medium">
            <li>Cập nhật <strong>Bio</strong>: Viết vài dòng châm ngôn học tập.</li>
            <li>Đổi <strong>Theme Color</strong>: Chọn màu sắc đại diện cho cá tính của bạn.</li>
          </ul>
          <div className="bg-slate-900 text-white p-8 rounded-2xl relative overflow-hidden mt-6">
            <div className="relative z-10">
              <h4 className="font-bold text-lg mb-2">Sẵn sàng chưa?</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Hành trình chinh phục GPA 10.0 bắt đầu từ đây. Chúc bạn có những trải nghiệm tuyệt vời cùng Nexus!
              </p>
            </div>
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-[#f27024] rounded-full blur-3xl opacity-30"></div>
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
                    Bước {currentStep + 1} / {steps.length}
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
                      idx === currentStep ? 'w-6 bg-[#f27024]' : 'w-2 bg-slate-200'
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
                  className="px-8 py-4 bg-[#f27024] text-white font-bold rounded-2xl shadow-xl shadow-orange-100 hover:bg-[#d9621e] transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                >
                  {currentStep === steps.length - 1 ? 'Bắt đầu ngay' : 'Tiếp theo'}
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
