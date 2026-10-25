import React, { useState } from 'react';
import { useDeviceMode, DeviceModePreference } from '../../hooks/useDeviceMode';
import { Smartphone, Laptop, RefreshCw, ChevronDown } from 'lucide-react';

interface DeviceModeToggleProps {
  className?: string;
  variant?: 'compact' | 'pill' | 'dropdown';
}

export function DeviceModeToggle({ className = '', variant = 'pill' }: DeviceModeToggleProps) {
  const { mode, preference, setPreference, toggleMode } = useDeviceMode();
  const [isOpen, setIsOpen] = useState(false);

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={toggleMode}
        className={`p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-all flex items-center gap-1.5 ${className}`}
        title={`Current: ${mode === 'laptop' ? 'Laptop' : 'Phone'} Mode. Click to switch.`}
      >
        {mode === 'laptop' ? (
          <Laptop size={16} className="text-indigo-400" />
        ) : (
          <Smartphone size={16} className="text-emerald-400" />
        )}
      </button>
    );
  }

  return (
    <div className={`relative inline-block ${className}`}>
      <div className="flex items-center gap-1 p-1 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-sm">
        <button
          type="button"
          onClick={() => setPreference('phone')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            mode === 'phone'
              ? 'bg-[#5e17eb] text-white shadow-sm shadow-[#5e17eb]/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Phone (Android) Mode"
        >
          <Smartphone size={14} />
          <span>Phone</span>
        </button>

        <button
          type="button"
          onClick={() => setPreference('laptop')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            mode === 'laptop'
              ? 'bg-[#5e17eb] text-white shadow-sm shadow-[#5e17eb]/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Laptop (Desktop Workstation) Mode"
        >
          <Laptop size={14} />
          <span>Laptop</span>
        </button>

        <button
          type="button"
          onClick={() => setPreference('auto')}
          className={`p-1.5 rounded-xl text-xs transition-all ${
            preference === 'auto'
              ? 'text-[#a78bfa] bg-[#5e17eb]/20 border border-[#5e17eb]/40'
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
          }`}
          title="Auto Detect based on Device Screen"
        >
          <RefreshCw size={13} className={preference === 'auto' ? 'animate-spin-slow' : ''} />
        </button>
      </div>
    </div>
  );
}
