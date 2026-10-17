import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  useEffect(() => {
    // Keep synchronized with actual root HTML class
    const syncTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    syncTheme();

    window.addEventListener('fastbell-theme-change', syncTheme);
    window.addEventListener('storage', syncTheme);
    return () => {
      window.removeEventListener('fastbell-theme-change', syncTheme);
      window.removeEventListener('storage', syncTheme);
    };
  }, []);

  const toggleTheme = () => {
    const nextDark = !document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', nextDark);
    if (nextDark) {
      localStorage.setItem('theme', 'dark');
    } else {
      localStorage.setItem('theme', 'light');
    }
    setIsDark(nextDark);
    window.dispatchEvent(new Event('fastbell-theme-change'));
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Dark mode' : 'Light mode'}
      onClick={toggleTheme}
      className={`relative inline-flex items-center w-[56px] h-[30px] p-[3px] rounded-full cursor-pointer select-none transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fb-blue)] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#10131A] ${
        isDark
          ? 'bg-[#161A24] border border-[#2A303F]'
          : 'bg-[#E4E8EF] border border-[#CBD5E1]'
      }`}
    >
      {/* Background track icons */}
      <div className="absolute inset-0 flex items-center justify-between px-[7px] pointer-events-none">
        <Sun
          size={12}
          strokeWidth={2.4}
          className={`transition-opacity duration-200 ${
            isDark ? 'text-amber-400/70 opacity-100' : 'opacity-0'
          }`}
        />
        <Moon
          size={12}
          strokeWidth={2.4}
          className={`transition-opacity duration-200 ${
            !isDark ? 'text-slate-400/80 opacity-100' : 'opacity-0'
          }`}
        />
      </div>

      {/* Circular sliding thumb */}
      <span
        className={`relative z-10 flex items-center justify-center w-[24px] h-[24px] rounded-full shadow-sm transform transition-all duration-200 ease-in-out ${
          isDark
            ? 'translate-x-[26px] bg-[#090B10] border border-[#2A303F] text-indigo-400'
            : 'translate-x-0 bg-white border border-slate-200/80 text-amber-500'
        }`}
      >
        {isDark ? (
          <Moon size={13} strokeWidth={2.4} className="fill-indigo-400/20" />
        ) : (
          <Sun size={13} strokeWidth={2.4} className="fill-amber-400/20" />
        )}
      </span>
    </button>
  );
}
