
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, Zap, CheckCircle2, X, ArrowRight, ArrowLeft, 
  LayoutGrid, Calendar, User, BarChart3, Info, Sparkles, Clock,
  Timer, Shield, Trophy, Users
} from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'en' | 'vi';
}

export default function OnboardingModal({ isOpen, onClose, language }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const t = {
    en: {
      welcome: {
        title: "Welcome to Nexus! 🚀",
        content: "Hello there! I'm Nexus - your smart \"study assistant\" here to help you conquer deadlines at FPTU using the **Eisenhower Matrix** combined with AI.",
        dashboard: "Dashboard - \"Command Center\"",
        dashboardDesc: "This is where you can quickly check your academic \"health\": total tasks, how many I've analyzed, and especially urgent tasks that need immediate attention.",
        tip: "Pro-tip",
        tipDesc: "\"Visit the Dashboard every morning so I can remind you what needs to be 'conquered' today!\""
      },
      tasks: {
        title: "Academic Tasks - Load Deadlines 📝",
        step1: "Click **Add Task** to get started.",
        step2: "Use the **Green Checkmark** to complete tasks. I'll strike through and fade them out for you.",
        step3: "**EXP System**: I'll grant EXP when you complete tasks. If you uncheck them, I'll deduct the EXP to keep things fair!",
        mail: "Nexus Mail 📧",
        mailDesc: "\"I'll automatically remind you to study 2 days before an exam and prepare your gear 1 day before via simulated email notifications!\""
      },
      matrix: {
        title: "The Matrix - AI Intelligence 🧠",
        desc: "I'll automatically \"sort\" your tasks into 4 strategic quadrants:",
        do: "Do First",
        doDesc: "Do it now, no excuses!",
        schedule: "Schedule",
        scheduleDesc: "Schedule it for later.",
        delegate: "Delegate",
        delegateDesc: "Ask for help or optimize.",
        eliminate: "Eliminate",
        eliminateDesc: "Delete it, don't worry about it.",
        tip: "Pro-tip",
        tipDesc: "\"Trust my analysis, but feel free to manually adjust things if they don't quite fit your style.\""
      },
      planner: {
        title: "Study Planner - AI Schedule 📅",
        desc: "The \"coolest\" feature: **AI Week Planner** and **Drag & Drop**.",
        ai: "AI Planner",
        aiDesc: "I automatically arrange tasks into your free slots throughout the week.",
        drag: "Drag & Drop",
        dragDesc: "You can drag and drop study sessions to quickly change times.",
        edit: "Quick Edit",
        editDesc: "Click any session to change time or mark as completed.",
        responsive: "Responsive",
        responsiveDesc: "\"On mobile, you can swipe horizontally across the calendar to see all 7 days of the week!\""
      },
      pomodoro: {
        title: "Pomodoro - Deep Focus ⏱️",
        desc: "Boost your productivity with the Pomodoro technique.",
        timer: "Focus Timer",
        timerDesc: "25 minutes of deep work followed by a 5-minute break.",
        custom: "Customizable",
        customDesc: "Adjust focus and break times to suit your personal rhythm.",
        tip: "Motto",
        tipDesc: "\"Focus on the process, not just the result. One session at a time!\""
      },
      ranked: {
        title: "Ranked - Competitive Study 🛡️",
        desc: "Turn your study sessions into a quest for glory.",
        rank: "Rank System",
        rankDesc: "Climb from Iron to Grandmaster by earning Rank EXP through completed tasks.",
        streak: "Daily Streak",
        streakDesc: "Keep your streak alive to earn bonus EXP and maintain your rank.",
        tip: "Challenge",
        tipDesc: "\"Can you reach the top and become a Nexus Grandmaster?\""
      },
      leaderboard: {
        title: "Leaderboard - Hall of Fame 🏆",
        desc: "See how you compare with other students at FPTU.",
        global: "Global Ranking",
        globalDesc: "View the top students based on their total EXP and current Rank.",
        stats: "Detailed Stats",
        statsDesc: "Check out other students' levels, ranks, and badges.",
        tip: "Community",
        tipDesc: "\"Friendly competition is the best way to stay motivated!\""
      },
      profile: {
        title: "Profile - Define Your Style 🎨",
        desc: "Don't forget to refresh your identity on the Profile page:",
        bio: "Update **Bio**: Write a few lines of your study motto.",
        theme: "Change **Theme Color**: Pick a color that represents your personality.",
        dark: "Chế độ **Dark Mode**: Protect your eyes during late-night study sessions.",
        ready: "Are you ready?",
        readyDesc: "Your journey to a 4.0 GPA starts here. I wish you an amazing experience with Nexus!",
        start: "Get Started",
        next: "Next"
      }
    },
    vi: {
      welcome: {
        title: "Chào mừng bạn đến với Nexus! 🚀",
        content: "Chào bạn! Tôi là Nexus - \"trợ lý học tập\" thông minh giúp bạn chinh phục mọi deadline tại FPTU bằng phương pháp **Eisenhower Matrix** kết hợp với AI.",
        dashboard: "Dashboard - \"Trung tâm điều khiển\"",
        dashboardDesc: "Đây là nơi bạn kiểm tra nhanh \"sức khỏe\" học tập: tổng số nhiệm vụ, số lượng đã phân tích, và đặc biệt là các nhiệm vụ khẩn cấp cần xử lý ngay.",
        tip: "Mẹo nhỏ",
        tipDesc: "\"Hãy ghé thăm Dashboard mỗi sáng để tôi nhắc bạn hôm nay cần 'chinh phục' những gì nhé!\""
      },
      tasks: {
        title: "Nhiệm vụ học tập - Quản lý Deadline 📝",
        step1: "Nhấn **Thêm nhiệm vụ** để bắt đầu.",
        step2: "Sử dụng **Dấu tích xanh** để hoàn thành. Tôi sẽ gạch ngang và làm mờ chúng cho bạn.",
        step3: "**Hệ thống EXP**: Bạn sẽ nhận được EXP khi hoàn thành nhiệm vụ. Nếu bỏ tích, tôi sẽ trừ lại EXP để đảm bảo công bằng!",
        mail: "Nexus Mail 📧",
        mailDesc: "\"Tôi sẽ tự động nhắc bạn học trước ngày thi 2 ngày và chuẩn bị đồ dùng trước 1 ngày qua thông báo giả lập email!\""
      },
      matrix: {
        title: "The Matrix - Trí tuệ AI 🧠",
        desc: "Tôi sẽ tự động \"phân loại\" các nhiệm vụ của bạn vào 4 ô chiến lược:",
        do: "Làm ngay",
        doDesc: "Làm ngay bây giờ, không trì hoãn!",
        schedule: "Lên lịch",
        scheduleDesc: "Lên kế hoạch thực hiện sau.",
        delegate: "Ủy quyền",
        delegateDesc: "Nhờ giúp đỡ hoặc tối ưu hóa.",
        eliminate: "Loại bỏ",
        eliminateDesc: "Xóa bỏ, đừng bận tâm về nó.",
        tip: "Mẹo nhỏ",
        tipDesc: "\"Hãy tin tưởng vào sự phân tích của tôi, nhưng bạn vẫn có thể tự điều chỉnh nếu thấy chưa phù hợp.\""
      },
      planner: {
        title: "Study Planner - Lịch học thông minh 📅",
        desc: "Tính năng \"xịn\" nhất: **AI Week Planner** và **Kéo thả linh hoạt**.",
        ai: "AI Planner",
        aiDesc: "Tự động sắp xếp các nhiệm vụ vào thời gian trống trong tuần của bạn.",
        drag: "Kéo thả",
        dragDesc: "Bạn có thể kéo thả các phiên học để thay đổi thời gian nhanh chóng.",
        edit: "Chỉnh sửa nhanh",
        editDesc: "Click vào bất kỳ phiên học nào để thay đổi thời gian hoặc đánh dấu hoàn thành.",
        responsive: "Đa nền tảng",
        responsiveDesc: "\"Trên điện thoại, bạn có thể vuốt ngang lịch để xem đủ 7 ngày trong tuần!\""
      },
      pomodoro: {
        title: "Pomodoro - Tập trung sâu ⏱️",
        desc: "Tăng cường năng suất với phương pháp Pomodoro.",
        timer: "Đồng hồ tập trung",
        timerDesc: "25 phút làm việc tập trung và 5 phút nghỉ giải lao.",
        custom: "Tùy chỉnh",
        customDesc: "Điều chỉnh thời gian tập trung và nghỉ ngơi phù hợp với nhịp độ cá nhân.",
        tip: "Châm ngôn",
        tipDesc: "\"Hãy tập trung vào quá trình, không chỉ kết quả. Từng phiên học một!\""
      },
      ranked: {
        title: "Ranked - Học tập cạnh tranh 🛡️",
        desc: "Biến các phiên học thành một cuộc hành trình chinh phục vinh quang.",
        rank: "Hệ thống Xếp hạng",
        rankDesc: "Leo từ Sắt lên Đại Cao Thủ bằng cách kiếm Rank EXP qua các nhiệm vụ hoàn thành.",
        streak: "Chuỗi ngày học",
        streakDesc: "Duy trì chuỗi ngày học để nhận EXP thưởng và giữ vững thứ hạng.",
        tip: "Thử thách",
        tipDesc: "\"Liệu bạn có thể chạm đến đỉnh cao và trở thành Đại Cao Thủ Nexus?\""
      },
      leaderboard: {
        title: "Bảng xếp hạng - Vinh danh 🏆",
        desc: "Xem vị trí của bạn so với các sinh viên khác tại FPTU.",
        global: "Xếp hạng toàn cầu",
        globalDesc: "Xem danh sách những sinh viên xuất sắc nhất dựa trên tổng EXP và Xếp hạng.",
        stats: "Thống kê chi tiết",
        statsDesc: "Kiểm tra cấp độ, thứ hạng và huy hiệu của các sinh viên khác.",
        tip: "Cộng đồng",
        tipDesc: "\"Cạnh tranh lành mạnh là cách tốt nhất để duy trì động lực!\""
      },
      profile: {
        title: "Cá nhân hóa - Khẳng định phong cách 🎨",
        desc: "Đừng quên làm mới bản thân tại trang Profile:",
        bio: "Cập nhật **Bio**: Viết vài dòng châm ngôn học tập của bạn.",
        theme: "Thay đổi **Màu chủ đạo**: Chọn màu sắc đại diện cho cá tính của bạn.",
        dark: "Chế độ **Dark Mode**: Bảo vệ mắt khi học tập vào ban đêm.",
        ready: "Bạn đã sẵn sàng chưa?",
        readyDesc: "Hành trình chinh phục GPA 4.0 bắt đầu từ đây. Chúc bạn có những trải nghiệm tuyệt vời cùng Nexus!",
        start: "Bắt đầu ngay",
        next: "Tiếp theo"
      }
    }
  };

  const content = t[language];

  const steps = [
    {
      title: content.welcome.title,
      icon: <Target className="text-accent" size={32} />,
      content: (
        <div className="space-y-6">
          <p className="text-slate-600 text-lg leading-relaxed">
            {content.welcome.content}
          </p>
          <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
            <h4 className="font-bold text-slate-800 text-lg mb-2 flex items-center gap-2">
              <BarChart3 size={20} className="text-accent" />
              {content.welcome.dashboard}
            </h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              {content.welcome.dashboardDesc}
            </p>
          </div>
          <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">{content.welcome.tip}</p>
            <p className="text-sm text-slate-700 italic font-medium">{content.welcome.tipDesc}</p>
          </div>
        </div>
      )
    },
    {
      title: content.tasks.title,
      icon: <Zap className="text-accent" size={32} />,
      content: (
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-orange-100 text-accent flex items-center justify-center text-sm font-bold shrink-0">1</div>
              <p className="text-base text-slate-700 font-medium" dangerouslySetInnerHTML={{ __html: content.tasks.step1 }} />
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-orange-100 text-accent flex items-center justify-center text-sm font-bold shrink-0">2</div>
              <p className="text-base text-slate-700 font-medium" dangerouslySetInnerHTML={{ __html: content.tasks.step2 }} />
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-orange-100 text-accent flex items-center justify-center text-sm font-bold shrink-0">3</div>
              <p className="text-base text-slate-700 font-medium" dangerouslySetInnerHTML={{ __html: content.tasks.step3 }} />
            </div>
          </div>
          <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">{content.tasks.mail}</p>
            <p className="text-sm text-slate-700 italic font-medium">{content.tasks.mailDesc}</p>
          </div>
        </div>
      )
    },
    {
      title: content.matrix.title,
      icon: <LayoutGrid className="text-accent" size={32} />,
      content: (
        <div className="space-y-6">
          <p className="text-base text-slate-600 font-medium">{content.matrix.desc}</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-rose-50 rounded-xl border border-rose-100">
              <p className="font-bold text-rose-600 text-sm">{content.matrix.do}</p>
              <p className="text-xs text-slate-500">{content.matrix.doDesc}</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <p className="font-bold text-blue-600 text-sm">{content.matrix.schedule}</p>
              <p className="text-xs text-slate-500">{content.matrix.scheduleDesc}</p>
            </div>
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
              <p className="font-bold text-amber-600 text-sm">{content.matrix.delegate}</p>
              <p className="text-xs text-slate-500">{content.matrix.delegateDesc}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <p className="font-bold text-slate-600 text-sm">{content.matrix.eliminate}</p>
              <p className="text-xs text-slate-500">{content.matrix.eliminateDesc}</p>
            </div>
          </div>
          <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2">{content.matrix.tip}</p>
            <p className="text-sm text-slate-700 italic font-medium">{content.matrix.tipDesc}</p>
          </div>
        </div>
      )
    },
    {
      title: content.planner.title,
      icon: <Calendar className="text-accent" size={32} />,
      content: (
        <div className="space-y-6">
          <p className="text-base text-slate-600 font-medium" dangerouslySetInnerHTML={{ __html: content.planner.desc }} />
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <Sparkles size={20} className="text-orange-400 mt-1 shrink-0" />
              <p className="text-sm text-slate-700 leading-relaxed"><strong>{content.planner.ai}</strong>: {content.planner.aiDesc}</p>
            </div>
            <div className="flex items-start gap-4">
              <Zap size={20} className="text-orange-400 mt-1 shrink-0" />
              <p className="text-sm text-slate-700 leading-relaxed"><strong>{content.planner.drag}</strong>: {content.planner.dragDesc}</p>
            </div>
            <div className="flex items-start gap-4">
              <Clock size={20} className="text-orange-400 mt-1 shrink-0" />
              <p className="text-sm text-slate-700 leading-relaxed"><strong>{content.planner.edit}</strong>: {content.planner.editDesc}</p>
            </div>
          </div>
          <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
            <p className="text-xs font-bold text-orange-600 uppercase tracking-widest mb-2">{content.planner.responsive}</p>
            <p className="text-sm text-slate-700 italic font-medium">{content.planner.responsiveDesc}</p>
          </div>
        </div>
      )
    },
    {
      title: content.pomodoro.title,
      icon: <Timer className="text-accent" size={32} />,
      content: (
        <div className="space-y-6">
          <p className="text-base text-slate-600 font-medium">{content.pomodoro.desc}</p>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <Clock size={20} className="text-orange-400 mt-1 shrink-0" />
              <p className="text-sm text-slate-700 leading-relaxed"><strong>{content.pomodoro.timer}</strong>: {content.pomodoro.timerDesc}</p>
            </div>
            <div className="flex items-start gap-4">
              <LayoutGrid size={20} className="text-orange-400 mt-1 shrink-0" />
              <p className="text-sm text-slate-700 leading-relaxed"><strong>{content.pomodoro.custom}</strong>: {content.pomodoro.customDesc}</p>
            </div>
          </div>
          <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
            <p className="text-xs font-bold text-red-600 uppercase tracking-widest mb-2">{content.pomodoro.tip}</p>
            <p className="text-sm text-slate-700 italic font-medium">{content.pomodoro.tipDesc}</p>
          </div>
        </div>
      )
    },
    {
      title: content.ranked.title,
      icon: <Shield className="text-accent" size={32} />,
      content: (
        <div className="space-y-6">
          <p className="text-base text-slate-600 font-medium">{content.ranked.desc}</p>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <Trophy size={20} className="text-orange-400 mt-1 shrink-0" />
              <p className="text-sm text-slate-700 leading-relaxed"><strong>{content.ranked.rank}</strong>: {content.ranked.rankDesc}</p>
            </div>
            <div className="flex items-start gap-4">
              <Zap size={20} className="text-orange-400 mt-1 shrink-0" />
              <p className="text-sm text-slate-700 leading-relaxed"><strong>{content.ranked.streak}</strong>: {content.ranked.streakDesc}</p>
            </div>
          </div>
          <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2">{content.ranked.tip}</p>
            <p className="text-sm text-slate-700 italic font-medium">{content.ranked.tipDesc}</p>
          </div>
        </div>
      )
    },
    {
      title: content.leaderboard.title,
      icon: <Users className="text-accent" size={32} />,
      content: (
        <div className="space-y-6">
          <p className="text-base text-slate-600 font-medium">{content.leaderboard.desc}</p>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <BarChart3 size={20} className="text-orange-400 mt-1 shrink-0" />
              <p className="text-sm text-slate-700 leading-relaxed"><strong>{content.leaderboard.global}</strong>: {content.leaderboard.globalDesc}</p>
            </div>
            <div className="flex items-start gap-4">
              <Info size={20} className="text-orange-400 mt-1 shrink-0" />
              <p className="text-sm text-slate-700 leading-relaxed"><strong>{content.leaderboard.stats}</strong>: {content.leaderboard.statsDesc}</p>
            </div>
          </div>
          <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100">
            <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-2">{content.leaderboard.tip}</p>
            <p className="text-sm text-slate-700 italic font-medium">{content.leaderboard.tipDesc}</p>
          </div>
        </div>
      )
    },
    {
      title: content.profile.title,
      icon: <User className="text-accent" size={32} />,
      content: (
        <div className="space-y-6">
          <p className="text-base text-slate-600 font-medium">{content.profile.desc}</p>
          <ul className="list-disc list-inside text-sm text-slate-600 space-y-2 ml-2 font-medium">
            <li dangerouslySetInnerHTML={{ __html: content.profile.bio }} />
            <li dangerouslySetInnerHTML={{ __html: content.profile.theme }} />
            <li dangerouslySetInnerHTML={{ __html: content.profile.dark }} />
          </ul>
          <div className="bg-slate-900 text-white p-8 rounded-2xl relative overflow-hidden mt-6">
            <div className="relative z-10">
              <h4 className="font-bold text-lg mb-2">{content.profile.ready}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {content.profile.readyDesc}
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
