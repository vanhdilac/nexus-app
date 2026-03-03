
import React from 'react';
import { MapPin, ExternalLink, ShieldCheck, Facebook, Instagram } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-20 pt-10 pb-20 md:pb-10">
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-10">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h3 className="font-extrabold text-slate-800 text-lg">FPT UNIVERSITY</h3>
            <span className="bg-[#f27024] text-white text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">DN CAMPUS</span>
          </div>
          <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
            The Nexus platform is designed specifically for FPT University Da Nang students to master their academic workload through AI-driven prioritization.
          </p>
        </div>
        
        <div className="space-y-4">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">CONTACT</h4>
          <ul className="space-y-3 mb-6">
            <li>
              <a href="#" className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-[#f27024] transition-colors">
                <MapPin size={14} /> FPT University, Da Nang
              </a>
            </li>
            <li>
              <a href="mailto:nexus.team.fpt@gmail.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-[#f27024] transition-colors">
                <ExternalLink size={14} /> Email: nexus.team.fpt@gmail.com
              </a>
            </li>
          </ul>

          <div className="pt-4 border-t border-slate-50">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Contact with us</h4>
            <div className="flex gap-3">
              <a 
                href="https://www.facebook.com/profile.php?id=61587456240595&mibextid=wwXIfr&rdid=xJ6mDJGmjYmMqyo1&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1JXeJSXCc7%2F%3Fmibextid%3DwwXIfr%26utm_source%3Dig%26utm_medium%3Dsocial%26utm_content%3Dlink_in_bio#" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-[#1877F2] hover:bg-white hover:shadow-md transition-all border border-slate-100 group"
                title="Facebook"
              >
                <Facebook size={20} className="group-hover:scale-110 transition-transform" />
              </a>
              <a 
                href="https://www.instagram.com/nexus.team.fpt/?hl=vi" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-[#E4405F] hover:bg-white hover:shadow-md transition-all border border-slate-100 group"
                title="Instagram"
              >
                <Instagram size={20} className="group-hover:scale-110 transition-transform" />
              </a>
              <a 
                href="https://www.tiktok.com/@nexus.team.fpt" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-black hover:bg-white hover:shadow-md transition-all border border-slate-100 group"
                title="TikTok"
              >
                <svg 
                  viewBox="0 0 24 24" 
                  width="20" 
                  height="20" 
                  fill="currentColor" 
                  className="group-hover:scale-110 transition-transform"
                >
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.9-.32-1.89-.39-2.82-.14-.84.21-1.63.67-2.18 1.33-.53.63-.82 1.43-.83 2.24-.03.88.24 1.76.78 2.45.6.78 1.54 1.25 2.52 1.29.98.05 1.95-.33 2.64-1.01.69-.7 1.05-1.67 1.05-2.65.02-3.4.01-6.8.01-10.2z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">System Security</h4>
          <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
            <ShieldCheck size={20} className="text-emerald-600" />
            <div>
              <p className="text-xs font-bold text-emerald-800">Local Privacy Encryption</p>
              <p className="text-[10px] text-emerald-600 font-medium">Data stays within your student account.</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto px-6 mt-12 pt-6 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          &copy; 2026 Nexus Team | Copyright belongs to team Nexus
        </p>
        
      </div>
    </footer>
  );
}
