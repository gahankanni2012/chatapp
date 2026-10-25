import React, { useState, useEffect } from 'react';
import { Wifi, Signal, Battery } from 'lucide-react';

export function AndroidStatusBar() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-7 px-4 flex items-center justify-between text-xs font-medium text-slate-300 select-none bg-slate-950/80 backdrop-blur-sm shrink-0 z-40">
      {/* Left: Clock */}
      <span className="font-semibold text-[13px] tracking-tight text-white">{time || '12:00'}</span>

      {/* Center: Camera hole notch representation */}
      <div className="w-3.5 h-3.5 rounded-full bg-slate-900 border border-slate-800 shadow-inner" />

      {/* Right: Android Status Icons (5G, WiFi, Battery) */}
      <div className="flex items-center gap-2 text-slate-300">
        <span className="text-[10px] font-bold text-slate-400 tracking-tighter">5G</span>
        <Signal size={12} className="text-slate-300" />
        <Wifi size={13} className="text-slate-300" />
        <div className="flex items-center gap-0.5">
          <Battery size={15} className="text-slate-200 fill-slate-200" />
        </div>
      </div>
    </div>
  );
}
