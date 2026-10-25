import React from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, Smartphone } from 'lucide-react';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'compact' | 'full' | 'banner';
}

export function PWAInstallButton({ className = '', variant = 'compact' }: PWAInstallButtonProps) {
  const { isInstallable, isInstalled, install } = usePWAInstall();

  // If already installed as an Android app or not installable currently, omit
  if (isInstalled || !isInstallable) {
    return null;
  }

  if (variant === 'banner') {
    return (
      <div className={`p-3 bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/30 rounded-2xl flex items-center justify-between gap-3 ${className}`}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Smartphone size={18} />
          </div>
          <div>
            <div className="text-xs font-bold text-white">Install Android App</div>
            <div className="text-[11px] text-slate-400">Add to home screen for full phone experience</div>
          </div>
        </div>
        <button
          type="button"
          onClick={install}
          className="px-3.5 py-1.5 rounded-xl bg-[#5e17eb] hover:bg-[#4f12cb] active:bg-[#430fae] text-white text-xs font-bold shadow-md shadow-[#5e17eb]/30 flex items-center gap-1.5 transition-all shrink-0"
        >
          <Download size={14} />
          <span>Install</span>
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={install}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#5e17eb] hover:bg-[#4f12cb] active:bg-[#430fae] text-white text-xs font-bold shadow-md shadow-[#5e17eb]/30 transition-all ${className}`}
      title="Install KirraK MuchatlU Android App"
    >
      <Smartphone size={14} />
      <span>Install App</span>
    </button>
  );
}
