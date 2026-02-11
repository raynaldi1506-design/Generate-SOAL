
import React from 'react';

const Marquee = () => {
  return (
    <div className="w-full bg-slate-900 overflow-hidden py-3 no-print border-y-2 border-blue-500/30">
      <div className="animate-marquee whitespace-nowrap">
        <span className="text-white text-[16px] font-black mx-10 tracking-[0.4em] uppercase">
          ✦ BANK SOAL SDN 14 ANDOPAN • CREATED BY NASRIWANTO, S.PD ✦
        </span>
        <span className="text-white text-[16px] font-black mx-10 tracking-[0.4em] uppercase">
          ✦ BANK SOAL SDN 14 ANDOPAN • CREATED BY NASRIWANTO, S.PD ✦
        </span>
        <span className="text-white text-[16px] font-black mx-10 tracking-[0.4em] uppercase">
          ✦ BANK SOAL SDN 14 ANDOPAN • CREATED BY NASRIWANTO, S.PD ✦
        </span>
      </div>
    </div>
  );
};

export default Marquee;
