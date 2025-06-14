// src/components/ui/SegmentedControl.tsx
import React from 'react';

interface SegmentedControlProps<T extends string> {
    options: { label: string; value: T }[];
    value: T;
    onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({ options, value, onChange }: SegmentedControlProps<T>) {
    return (
        <div className="inline-flex rounded-md shadow-sm bg-slate-800 p-1" role="group">
            {options.map((option, index) => (
                <button
                    key={option.value}
                    type="button"
                    onClick={() => onChange(option.value)}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-medium transition-colors focus:z-10 focus:outline-none focus:ring-2 focus:ring-violet-500
                    ${value === option.value
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'bg-transparent text-slate-300 hover:bg-slate-700'
                    }
                    ${index === 0 ? 'rounded-l-md' : ''}
                    ${index === options.length - 1 ? 'rounded-r-md' : ''}`}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
}