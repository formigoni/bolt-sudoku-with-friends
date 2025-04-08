import React from 'react';
import { X } from 'lucide-react';

interface VirtualKeyboardProps {
  onNumberClick: (number: number) => void;
  onClear: () => void;
  label: string;
  variant?: 'primary' | 'secondary';
}

export function VirtualKeyboard({ onNumberClick, onClear, label, variant = 'primary' }: VirtualKeyboardProps) {
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  
  const baseButtonClasses = "size-10 md:size-12 flex items-center justify-center rounded-lg font-semibold transition-colors duration-150";
  const variantClasses = {
    primary: "bg-indigo-600 hover:bg-indigo-700 text-white",
    secondary: "bg-gray-200 hover:bg-gray-300 text-gray-700"
  };

  return (
    <div className="w-full">
      <div className="text-sm text-gray-600 mb-2">{label}</div>
      <div className="grid grid-cols-5 gap-2">
        {numbers.map(number => (
          <button
            key={number}
            onClick={() => onNumberClick(number)}
            className={`${baseButtonClasses} ${variantClasses[variant]}`}
          >
            {number}
          </button>
        ))}
        <button
          onClick={onClear}
          className={`${baseButtonClasses} ${variantClasses[variant]} col-start-5`}
          title="Clear cell"
        >
          <X className="size-5" />
        </button>
      </div>
    </div>
  );
}