import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface FastBellSelectOption {
  value: string;
  label: string;
}

export interface FastBellSelectProps {
  options: FastBellSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
}

export function FastBellSelect({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  disabled = false,
  className = '',
  id,
  name
}: FastBellSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(prev => !prev);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault();
      const currentIndex = options.findIndex(opt => opt.value === value);
      let nextIndex = currentIndex;
      
      if (e.key === 'ArrowDown') {
        nextIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
      } else {
        nextIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
      }
      
      onChange(options[nextIndex].value);
    }
  };

  return (
    <div 
      className={`relative w-full font-body ${className}`} 
      ref={containerRef}
      onKeyDown={handleKeyDown}
    >
      <input type="hidden" name={name ? `${name}_hidden` : undefined} value={value} disabled={disabled} />
      {name && (
        <select
          name={name}
          id={id || name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}
      
      <div
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`
          flex items-center justify-between w-full min-h-[44px] px-3 py-2 
          bg-transparent border-b border-[var(--fb-border)] cursor-pointer transition-colors outline-none
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-[var(--fb-ink)]'}
          ${isOpen ? '!border-[var(--fb-blue)]' : ''}
          ${!selectedOption ? 'text-[var(--fb-text-muted)]' : 'text-[var(--fb-ink)]'}
        `}
      >
        <span className="truncate pr-4 text-[15px] font-semibold tracking-tight">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown 
          strokeWidth={1.5}
          className={`w-4 h-4 text-[var(--fb-text-muted)] transition-transform duration-200 ${isOpen ? 'rotate-180 !text-[var(--fb-blue)]' : ''}`} 
        />
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-[var(--fb-surface)] border border-[var(--fb-border)] rounded-sm shadow-sm animate-in fade-in slide-in-from-top-1 duration-150 py-1 overflow-hidden">
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <div
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`
                    flex items-center justify-between px-4 py-3 cursor-pointer transition-colors
                    text-sm font-medium
                    ${isSelected 
                      ? 'bg-[var(--fb-blue-soft)] text-[var(--fb-blue)] font-semibold' 
                      : 'text-[var(--fb-ink)] hover:bg-[var(--fb-bg)]'
                    }
                  `}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected && (
                    <Check className="w-4 h-4 text-[var(--fb-blue)] flex-shrink-0 ml-2" strokeWidth={2.5} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
