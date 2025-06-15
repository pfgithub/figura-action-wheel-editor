import React, { useState, useMemo } from 'react';
import {
    DndContext,
    DragOverlay,
    useDraggable,
    useDroppable,
    pointerWithin,
    type DragEndEvent,
    type DragStartEvent,
} from '@dnd-kit/core';
import { produce, type WritableDraft } from 'immer';
import type { Condition, ToggleGroup, UUID, ConditionNot, ConditionAnd, ConditionOr } from '../../types';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { ToggleGroupControls } from '../shared/ToggleGroupControls';
import { generateUUID } from '@/utils/uuid';
import { renderValues } from '../data/renderSettings';

// ... (Icons and other helpers remain the same) ...
const GripVerticalIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>;
const Trash2Icon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>;
const kindStyles: { [key in PaletteItemKind]: { label: string; border: string; bg: string; text: string; } } = {
  and: { label: 'AND (All Of)', border: 'border-sky-500', bg: 'bg-sky-900/30', text: 'text-sky-300' },
  or: { label: 'OR (Any Of)', border: 'border-emerald-500', bg: 'bg-emerald-900/30', text: 'text-emerald-300' },
  not: { label: 'NOT', border: 'border-amber-500', bg: 'bg-amber-900/30', text: 'text-amber-300' },
  toggleGroup: { label: 'Group State', border: 'border-violet-500', bg: 'bg-violet-900/30', text: 'text-violet-300' },
  render: { label: 'Other State', border: 'border-rose-500', bg: 'bg-rose-900/30', text: 'text-rose-300' },
};
type PaletteItemKind = Condition['kind'];
function getParentAndFinalKey(path: string): { parentPath: string | null; finalKey: string | number } {
    const parts = path.split('.');
    if (parts.length === 1) return { parentPath: null, finalKey: parts[0] };
    const finalKeyStr = parts.pop()!;
    const finalKey = /^\d+$/.test(finalKeyStr) ? parseInt(finalKeyStr, 10) : finalKeyStr;
    return { parentPath: parts.join('.'), finalKey };
}
function getIn(obj: any, path: string): any {
    // This helper assumes 'obj' is the wrapper { root: ... } and 'path' starts with "root"
    if (!obj || !('root' in obj)) {
        // If the root condition is undefined, obj.root will be undefined, so we return that.
        // This handles the case of dragging onto the initial empty dropzone.
        if (path === 'root') return obj?.root;
        return undefined;
    }
    if (path === 'root') {
        return obj.root;
    }

    // Paths are like "root.conditions.0", so we skip the 'root' part
    const parts = path.split('.').slice(1);
    let current = obj.root;

    for (const part of parts) {
        if (current === undefined || current === null) {
            return undefined;
        }
        const key = /^\d+$/.test(part) ? parseInt(part, 10) : part;
        current = (current as any)[key];
    }
    return current;
}
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
function ConditionPalette() {
    const paletteItems: PaletteItemKind[] = ['and', 'or', 'not', 'toggleGroup', 'render'];
    return (
        <div className="w-64 flex-shrink-0 p-3 bg-slate-900/50 rounded-lg space-y-2 self-start">
            <h3 className="font-bold text-slate-300 mb-2">Conditions</h3>
            {paletteItems.map(kind => <PaletteItem key={kind} kind={kind} />)}
        </div>
    );
}
function DropZone({ id, path, label = "Drop condition here" }: { id: string, path: string, label?: string }) {
    const { setNodeRef, isOver } = useDroppable({
        id,
        data: { path, accepts: ['palette', 'condition'] },
    });
    return (
        <div
            ref={setNodeRef}
            className={`w-full text-center p-4 my-2 border-2 border-dashed rounded-lg transition-colors ${
                isOver ? 'bg-violet-500/30 border-violet-400' : 'bg-slate-800/50 border-slate-600'
            }`}
        >
            <p className="text-slate-400 text-sm">{label}</p>
        </div>
    );
}

interface ConditionNodeProps {
    path: string;
    condition?: Condition;
    allToggleGroups: ToggleGroup[];
    updateCondition: (newCondition?: Condition) => void;
    deleteNode: () => void;
}

function ConditionNode({ path, condition, updateCondition, deleteNode, allToggleGroups }: ConditionNodeProps) {
    if (!condition) {
        return <DropZone id={path} path={path} label={"Drag a condition from the panel to start"} />;
    }

    const styles = kindStyles[condition.kind];

    const {
        listeners: dragListeners,
        setNodeRef: setDraggableNodeRef,
        isDragging,
    } = useDraggable({
        id: path,
        data: { path, type: 'condition' },
    });

    const setNodeRef = (node: HTMLElement | null) => {
        setDraggableNodeRef(node);
    };

    const handleUpdate = (updater: (draft: Condition) => void) => {
        updateCondition(produce(condition, updater));
    };

    const renderHeader = () => (
        <div className={`flex items-center justify-between p-2 rounded-t-lg ${styles.bg.replace('30', '50')}`}>
            <div className="flex items-center gap-1">
                <span
                    {...dragListeners}
                    className={`p-1 ${'cursor-grab text-slate-500 hover:text-white'}`}
                >
                    <GripVerticalIcon />
                </span>
                <span className={`font-bold ${styles.text}`}>{styles.label}</span>
            </div>
            <button onClick={deleteNode} className="p-1 text-rose-400 hover:text-white hover:bg-rose-500 rounded-full w-6 h-6 flex items-center justify-center">
                <Trash2Icon />
            </button>
        </div>
    );

    const renderBody = () => {
        switch (condition.kind) {
            case 'and':
            case 'or':
                return (
                    <div className="p-2 space-y-2">
                        {condition.conditions.map((cond, i) => (
                            <ConditionNode
                                key={cond.id}
                                path={`${path}.conditions.${i}`}
                                condition={cond}
                                updateCondition={(newCond) => handleUpdate(draft => {
                                    if (draft.kind === 'and' || draft.kind === 'or') draft.conditions[i] = newCond!;
                                })}
                                deleteNode={() => handleUpdate(draft => {
                                    if (draft.kind === 'and' || draft.kind === 'or') draft.conditions.splice(i, 1);
                                })}
                                allToggleGroups={allToggleGroups}
                            />
                        ))}
                        <DropZone id={`${path}.add`} path={path} label="Add sub-condition" />
                    </div>
                );
            case 'not':
                return (
                    <div className="p-2">
                        <ConditionNode
                            path={`${path}.condition`}
                            condition={condition.condition}
                            updateCondition={(newCond) => handleUpdate(draft => {
                                if (draft.kind === 'not') draft.condition = newCond;
                            })}
                            deleteNode={() => handleUpdate(draft => {
                                if (draft.kind === 'not') draft.condition = undefined;
                            })}
                            allToggleGroups={allToggleGroups}
                        />
                    </div>
                );
            case 'toggleGroup': {
                const selectedGroup = allToggleGroups.find(g => g.uuid === condition.toggleGroup);
                return (
                    <div className="space-y-2 text-slate-300 p-3 text-sm">
                         <div className="flex items-center gap-2">
                            <span className="flex-shrink-0 pr-2">When</span>
                            <div className="flex-grow">
                                <ToggleGroupControls
                                    allToggleGroups={allToggleGroups}
                                    selectedGroupUUID={condition.toggleGroup}
                                    onGroupChange={(newUUID) => {
                                        handleUpdate(draft => {
                                            if (draft.kind === 'toggleGroup') {
                                                draft.toggleGroup = newUUID;
                                                draft.value = undefined;
                                            }
                                        });
                                    }}
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-semibold flex-shrink-0 pr-6">is</span>
                            <Select
                                value={condition.value ?? ''}
                                onChange={(e) => handleUpdate(draft => {
                                    if (draft.kind === 'toggleGroup') draft.value = e.target.value ? e.target.value as UUID : undefined;
                                })}
                                disabled={!selectedGroup}
                                className="w-auto flex-grow bg-slate-800/80"
                            >
                                <option value=""><em>None</em></option>
                                {selectedGroup && Object.entries(selectedGroup.options).map(([uuid, option]) => <option key={uuid} value={uuid}>{option.name}</option>)}
                            </Select>
                        </div>
                    </div>
                );
            }
            case 'render':
                 return (
                    <div className="flex items-center gap-2 text-slate-300 p-3 text-sm flex-wrap">
                        <Select
                        value={condition.render ?? ''}
                        onChange={(e) => handleUpdate(draft => {
                            if (draft.kind === 'render') draft.render = e.target.value ? e.target.value as any : undefined;
                        })}
                        className="w-auto flex-grow bg-slate-800/80"
                        >
                        <option value="">-- Select state --</option>
                        {Array.from(renderValues.values()).map(v =>
                            <option key={v.id} value={v.id}>{v.name}</option>
                        )}
                        </Select>
                    </div>
                );
            default:
                return null;
        }
    };
    
    return (
        <div
            ref={setNodeRef}
            style={{ opacity: isDragging ? 0.4 : 1 }}
            className={`rounded-lg border transition-shadow ${styles.border} ${styles.bg}`}
        >
            {renderHeader()}
            {renderBody()}
        </div>
    );
}

interface AnimationConditionEditorProps {
  condition?: Condition;
  updateCondition: (c: Condition | undefined) => void;
  allToggleGroups: ToggleGroup[];
}

export function AnimationConditionEditor({
  condition,
  updateCondition,
  allToggleGroups,
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

    const createNewConditionNode = (kind: PaletteItemKind): Condition => {
        const id = generateUUID();
        switch (kind) {
            case 'and':
                return { id, kind: 'and', conditions: [] };
            case 'or':
                return { id, kind: 'or', conditions: [] };
            case 'not':
                return { id, kind: 'not' };
            case 'toggleGroup':
                return { id, kind: 'toggleGroup' };
            case 'render':
                return { id, kind: 'render' };
        }
    };
    
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
                        allToggleGroups={allToggleGroups}
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