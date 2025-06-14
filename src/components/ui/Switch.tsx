// src/components/ui/Switch.tsx
import React from 'react';
import { Switch as HeadlessSwitch } from '@headlessui/react';

interface SwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
    srLabel: string; // Screen-reader label
}

export function Switch({ checked, onChange, label, srLabel }: SwitchProps) {
    return (
        <HeadlessSwitch.Group as="div" className="flex items-center gap-3">
            {label && <HeadlessSwitch.Label className="text-slate-300 cursor-pointer font-medium">{label}</HeadlessSwitch.Label>}
            <HeadlessSwitch
                checked={checked}
                onChange={onChange}
                className={`${
                    checked ? 'bg-violet-600' : 'bg-slate-700'
                } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-slate-900`}
            >
                <span className="sr-only">{srLabel}</span>
                <span
                    aria-hidden="true"
                    className={`${
                        checked ? 'translate-x-5' : 'translate-x-0'
                    } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                />
            </HeadlessSwitch>
        </HeadlessSwitch.Group>
    );
}