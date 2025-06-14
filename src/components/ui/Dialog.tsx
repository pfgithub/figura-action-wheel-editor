import React, { useEffect } from 'react';

export const Dialog = ({ children, open, onClose }: { children: React.ReactNode; open: boolean; onClose: () => void; }) => {
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        if (open) {
            window.addEventListener('keydown', handleEsc);
        }
        return () => {
            window.removeEventListener('keydown', handleEsc);
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div 
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 border border-gray-700"
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    );
};

export const DialogHeader = ({ children }: { children: React.ReactNode }) => (
    <div className="mb-4">
        <h2 className="text-xl font-bold text-white">{children}</h2>
    </div>
);

export const DialogContent = ({ children }: { children: React.ReactNode }) => (
    <div className="space-y-4 text-gray-300">{children}</div>
);

export const DialogFooter = ({ children }: { children: React.ReactNode }) => (
    <div className="mt-6 flex justify-end gap-2">{children}</div>
);