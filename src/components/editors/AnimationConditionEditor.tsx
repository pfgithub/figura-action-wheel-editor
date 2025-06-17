// src/components/editors/AnimationConditionEditor.tsx
import React, { useState, useMemo } from 'react';
import {
    DndContext,
    DragOverlay,
    pointerWithin,
    type DragEndEvent,
    type DragStartEvent,
} from '@dnd-kit/core';
import { produce, type WritableDraft } from 'immer';
import type { Condition, ConditionNot, ConditionAnd, ConditionOr } from '@/types';

import { ConditionNode } from './animation-condition/ConditionNode';
import { ConditionPalette } from './animation-condition/ConditionPalette';
import { getIn, getParentAndFinalKey, createNewConditionNode, kindStyles, type PaletteItemKind } from './animation-condition/helpers';


interface AnimationConditionEditorProps {
  condition?: Condition;
  updateCondition: (c: Condition | undefined) => void;
}

export function AnimationConditionEditor({
  condition,
  updateCondition,
}: AnimationConditionEditorProps) {
    const [activeId, setActiveId] = useState<string | null>(null);
    const activeConditionData = useMemo(() => {
        if (!activeId) return null;
        if (activeId.startsWith('palette-')) {
            const kind = activeId.replace('palette-', '') as PaletteItemKind;
            return { kind, label: kindStyles[kind].label };
        }
        const activeCondition = getIn({root: condition}, activeId) as Condition | undefined;
        return activeCondition ? { kind: activeCondition.kind, label: kindStyles[activeCondition.kind]?.label } : null;
    }, [activeId, condition]);
    
    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveId(null);
        const { active, over } = event;

        if (!over || active.id === over.id) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        // Prevent dropping a component inside of itself or its children
        if (!activeId.startsWith('palette-') && overId.startsWith(activeId + '.')) {
            return;
        }

        const rootCondition = { root: condition };
        const updatedCondition = produce(rootCondition, (draft) => {
            const isPaletteDrag = activeId.startsWith('palette-');
            
            let nodeToInsert: Condition;

            // STEP 1: Determine the node being inserted
            if (isPaletteDrag) {
                const kind = active.data.current?.kind as PaletteItemKind;
                nodeToInsert = createNewConditionNode(kind);
            } else {
                const nodeToMove = getIn(draft, activeId);
                if (!nodeToMove) return; 
                nodeToInsert = JSON.parse(JSON.stringify(nodeToMove));
            }

            // STEP 2: Insert the node at the destination
            if (overId.endsWith('.add')) {
                const containerPath = over.data.current?.path as string;
                const container = getIn(draft, containerPath);
                if (container && 'conditions' in container && Array.isArray(container.conditions)) {
                    (container as WritableDraft<ConditionAnd | ConditionOr>).conditions.push(nodeToInsert);
                }
            } else { 
                const { parentPath: destParentPath, finalKey: destKey } = getParentAndFinalKey(overId);
                
                if (destParentPath === null) {
                    (draft as any)[destKey] = nodeToInsert;
                } else {
                    const destParent = getIn(draft, destParentPath);
                    if (destParent) {
                        (destParent as any)[destKey] = nodeToInsert;
                    }
                }
            }

            // STEP 3: If it was a move operation, remove the original node
            if (!isPaletteDrag) {
                const { parentPath, finalKey } = getParentAndFinalKey(activeId);
                
                if (parentPath !== null) {
                    const parentContainer = getIn(draft, parentPath);
                    if (Array.isArray(parentContainer)) {
                        parentContainer.splice(finalKey as number, 1);
                    } 
                    else if (parentContainer && typeof finalKey === 'string' && finalKey === 'condition') {
                         (parentContainer as WritableDraft<ConditionNot>).condition = undefined;
                    } else if (parentPath === 'root') {
                        // This case handles removing the root node if it's dragged somewhere else.
                         (draft as any)[finalKey] = undefined;
                    }
                }
            }
        });
        
        updateCondition(updatedCondition.root);
    };

    return (
        <DndContext
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            collisionDetection={pointerWithin}
        >
            <div className="flex gap-4 items-start">
                <ConditionPalette />
                <div className="flex-grow space-y-2">
                    <ConditionNode
                        path="root"
                        condition={condition}
                        updateCondition={updateCondition}
                        deleteNode={() => updateCondition(undefined)}
                    />
                </div>
            </div>
            <DragOverlay>
                {activeId && activeConditionData ? (
                    <div className="p-2 rounded-lg border-2 border-violet-500 bg-slate-800 opacity-90 shadow-2xl">
                        <span className="font-bold text-violet-300">
                           {activeConditionData.label}
                        </span>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}