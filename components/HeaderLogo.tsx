import React from 'react';
import { Shield } from 'lucide-react';

const HeaderLogo: React.FC = () => {
  return (
    <div className="flex items-center gap-6 group">
      <div className="p-1 bg-[#ff9c00] rounded-3xl shadow-[0_0_30px_rgba(255,156,0,0.3)] transition-transform duration-500 group-hover:scale-105">
         <div className="p-4 bg-[#0a0a0a] rounded-[1.4rem] border border-orange-500/20 flex items-center justify-center">
          <Shield className="text-[#ff9c00] w-12 h-12 group-hover:rotate-12 transition-transform duration-500" />
         </div>
      </div>
      <div>
        <h1 className="text-5xl md:text-6xl font-black text-white uppercase tracking-tighter leading-none">
          AORUS TALE <span className="text-[#ff9c00]">DASHBOARD</span>
        </h1>
        <p className="text-slate-500 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.4em] mt-2">
          Analytics System
        </p>
      </div>
    </div>
  );
};

export default HeaderLogo;
