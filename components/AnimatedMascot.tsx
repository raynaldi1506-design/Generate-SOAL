
import React from 'react';

const AnimatedMascot = () => {
  return (
    <div className="fixed bottom-6 right-6 z-40 no-print flex flex-col items-center animate-float">
      <div className="bg-white p-3 rounded-2xl shadow-2xl border-2 border-blue-500 relative">
        <div className="absolute -top-12 right-0 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full whitespace-nowrap shadow-lg after:content-[''] after:absolute after:top-full after:right-4 after:border-8 after:border-transparent after:border-t-blue-600">
          GANBATTE!
        </div>
        <div className="w-16 h-16 bg-blue-50 rounded-xl flex items-center justify-center overflow-hidden">
           <span className="text-3xl">📝</span>
        </div>
      </div>
      <div className="mt-2 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded shadow-sm uppercase tracking-tighter">
        SDN 14 AI ASSISTANT
      </div>
    </div>
  );
};

export default AnimatedMascot;
