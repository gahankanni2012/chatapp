import { useState, useEffect } from 'react';

export type DeviceModePreference = 'auto' | 'phone' | 'laptop';
export type DeviceMode = 'phone' | 'laptop';

export function useDeviceMode() {
  const [preference, setPreference] = useState<DeviceModePreference>(() => {
    try {
      const saved = localStorage.getItem('kirrak_device_mode');
      if (saved === 'phone' || saved === 'laptop' || saved === 'auto') {
        return saved;
      }
    } catch {}
    return 'auto';
  });

  const [windowWidth, setWindowWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const changePreference = (newPref: DeviceModePreference) => {
    setPreference(newPref);
    try {
      localStorage.setItem('kirrak_device_mode', newPref);
    } catch {}
  };

  // Determine effective device mode
  const isAutoLaptop = windowWidth >= 768;
  const effectiveMode: DeviceMode =
    preference === 'auto' ? (isAutoLaptop ? 'laptop' : 'phone') : preference;

  const toggleMode = () => {
    if (effectiveMode === 'phone') {
      changePreference('laptop');
    } else {
      changePreference('phone');
    }
  };

  return {
    mode: effectiveMode,
    preference,
    setPreference: changePreference,
    toggleMode,
    isLaptop: effectiveMode === 'laptop',
    isPhone: effectiveMode === 'phone',
  };
}
