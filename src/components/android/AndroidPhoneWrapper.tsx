import React, { useState } from 'react';
import { AndroidStatusBar } from './AndroidStatusBar';
import { Smartphone, Maximize2, Minimize2 } from 'lucide-react';

interface AndroidPhoneWrapperProps {
  children: React.ReactNode;
}

export function AndroidPhoneWrapper({ children }: AndroidPhoneWrapperProps) {
  const [isFramed, setIsFramed] = useState(true);

  return (
    <div className="w-screen h-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col items-center justify-center relative font-sans">
      {/* On desktop: show ambient backdrop and subtle toggle for testing */}
      <div className="hidden sm:flex absolute top-3 left-4 items-center gap-2 text-xs text-slate-400 select-none z-50">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-indigo-300 font-semibold shadow-sm">
          <Smartphone size={14} className="text-emerald-400" />
          <span>Android Phone Only</span>
        </div>
        <button
          type="button"
          onClick={() => setIsFramed(!isFramed)}
          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          title={isFramed ? 'Full Window Phone Mode' : 'Framed Android Device Mode'}
        >
          {isFramed ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
        </button>
      </div>

      {/* Main Container: On phone, it's 100% full screen. On desktop, framed as a realistic Android device */}
      <div
        className={`w-full h-full flex flex-col overflow-hidden bg-slate-950 transition-all duration-300 ${
          isFramed
            ? 'sm:w-[412px] sm:h-[880px] sm:max-h-[95vh] sm:rounded-[44px] sm:border-[10px] sm:border-slate-800 sm:shadow-2xl sm:shadow-indigo-950/40 relative sm:ring-1 sm:ring-white/10'
            : 'sm:w-[430px]'
        }`}
      >
        {/* Android Status Bar */}
        <AndroidStatusBar />

        {/* Phone Content Screen */}
        <div className="flex-1 flex flex-col h-[calc(100%-1.75rem)] overflow-hidden relative">
          {children}
        </div>
      </div>
    </div>
  );
}
