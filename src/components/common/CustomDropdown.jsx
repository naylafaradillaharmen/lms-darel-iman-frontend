import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export const CustomDropdown = ({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Pilih...',
  className = '',
  buttonClassName = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) =>
    typeof opt === 'object' ? opt.value === value : opt === value
  );

  const selectedLabel = selectedOption
    ? typeof selectedOption === 'object'
      ? selectedOption.label
      : selectedOption
    : placeholder;

  return (
    <div className={`relative inline-flex items-center gap-1.5 ${className}`} ref={dropdownRef}>
      {label && (
        <span className="text-xs font-bold text-dei-muted dark:text-dei-dark-muted whitespace-nowrap">
          {label}
        </span>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`px-3.5 py-2 rounded-xl border border-dei-line dark:border-dei-dark-line bg-dei-bg dark:bg-dei-dark-bg text-xs font-semibold text-dei-ink dark:text-dei-dark-ink flex items-center justify-between gap-2.5 hover:border-dei-emerald transition-all shadow-sm min-w-[140px] ${
          isOpen ? 'ring-2 ring-dei-emerald border-dei-emerald' : ''
        } ${buttonClassName}`}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-dei-muted transition-transform duration-200 flex-shrink-0 ${
            isOpen ? 'rotate-180 text-dei-emerald' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu Popover (Rounded Corners & Modern Styling like Image 4) */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 z-50 min-w-full w-max max-w-xs p-1.5 bg-white dark:bg-dei-dark-surface rounded-2xl border border-dei-line dark:border-dei-dark-line shadow-2xl space-y-0.5 animate-fadeIn">
          {options.map((option, idx) => {
            const optVal = typeof option === 'object' ? option.value : option;
            const optLabel = typeof option === 'object' ? option.label : option;
            const isSelected = optVal === value;

            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  onChange(optVal);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-dei-emerald text-white font-bold shadow-sm'
                    : 'text-dei-ink dark:text-dei-dark-ink hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                <span className="truncate">{optLabel}</span>
                {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0 text-white" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CustomDropdown;
