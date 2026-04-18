import React from 'react';

export function AnimatedFooter() {
  const text = "DIC - 2026 DESIGN & INNOVATION CLINIC , TEAM - 23";
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-slate-200">
      <footer className="h-10 flex items-center overflow-hidden">
        <div className="flex animate-ticker whitespace-nowrap">
          {/* Main Ticker Text */}
          <p className="inline-block px-12 text-[10px] md:text-sm font-bold tracking-[0.1em] text-slate-900 uppercase">
            {text}
          </p>
          {/* Duplicate for Seamless Loop */}
          <p className="inline-block px-12 text-[10px] md:text-sm font-bold tracking-[0.1em] text-slate-900 uppercase">
            {text}
          </p>
          <p className="inline-block px-12 text-[10px] md:text-sm font-bold tracking-[0.1em] text-slate-900 uppercase">
            {text}
          </p>
          <p className="inline-block px-12 text-[10px] md:text-sm font-bold tracking-[0.1em] text-slate-900 uppercase">
            {text}
          </p>
        </div>
      </footer>
    </div>
  );
}
