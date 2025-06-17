import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { kindStyles, type PaletteItemKind } from './helpers';
import { GripVerticalIcon } from './ui';

function PaletteItem({ kind }: { kind: PaletteItemKind }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: `palette-${kind}`,
        data: { kind },
    });
    const style = kindStyles[kind];
    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className={`flex items-center gap-2 p-2 rounded-md cursor-grab ${style.bg} ${style.border} border-l-4 ${isDragging ? 'opacity-50' : ''}`}
        >
            <span className="text-xs text-slate-400"><GripVerticalIcon /></span>
            <span className={`font-semibold text-sm ${style.text}`}>{style.label}</span>
        </div>
    );
}

export function ConditionPalette() {
    const paletteItems: PaletteItemKind[] = ['and', 'or', 'not', 'toggleGroup', 'render', 'animation', 'script', 'custom'];
    return (
        <div className="w-64 flex-shrink-0 p-3 bg-slate-900/50 rounded-lg space-y-2 self-start">
            <h3 className="font-bold text-slate-300 mb-2">Conditions</h3>
            {paletteItems.map(kind => <PaletteItem key={kind} kind={kind} />)}
        </div>
    );
}