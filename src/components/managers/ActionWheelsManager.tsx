import React, { useState } from 'react';
import type { UUID, Action, ActionWheel, ToggleGroup, Avatar } from '../../types';
import { UpdateAvatarFn } from '../../hooks/useAvatar';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ActionEditor } from '../editors/ActionEditor';

interface ActionWheelsManagerProps {
    avatar: Avatar;
    updateAvatar: UpdateAvatarFn;
    allToggleGroups: ToggleGroup[];
    allActionWheels: ActionWheel[];
}

export function ActionWheelsManager({ avatar, updateAvatar, allToggleGroups, allActionWheels }: ActionWheelsManagerProps) {
    const [selectedAction, setSelectedAction] = useState<[UUID, number] | null>(null);

    const setMainWheel = (uuid: UUID) => {
        updateAvatar(draft => {
            draft.mainActionWheel = uuid;
        });
    };

    const deleteActionWheel = (uuid: UUID) => {
        if (avatar.mainActionWheel === uuid) {
            alert("Cannot delete the main action wheel.");
            return;
        }
        if (window.confirm("Are you sure you want to delete this action wheel?")) {
            updateAvatar((draft) => {
                delete draft.actionWheels[uuid];
                if (selectedAction && selectedAction[0] === uuid) {
                    setSelectedAction(null);
                }
            });
        }
    };

    const updateWheelTitle = (uuid: UUID, title: string) => {
        updateAvatar(draft => {
            if (draft.actionWheels[uuid]) {
                draft.actionWheels[uuid].title = title;
            }
        });
    };

    const addAction = (wheelUuid: UUID) => {
        updateAvatar(draft => {
            const wheel = draft.actionWheels[wheelUuid];
            if (wheel) {
                const firstWheelId = Object.keys(draft.actionWheels)[0] as UUID | undefined;
                const newAction: Action = {
                    icon: '❓',
                    color: [255, 255, 255],
                    effect: { kind: 'switchPage', actionWheel: firstWheelId ?? ('' as UUID) },
                };
                wheel.actions.push(newAction);
                setSelectedAction([wheelUuid, wheel.actions.length - 1]);
            }
        });
    };

    const selectedActionData = (() => {
        if (!selectedAction) return null;
        const [wheelUuid, actionIndex] = selectedAction;
        const wheel = avatar.actionWheels[wheelUuid];
        const action = wheel?.actions[actionIndex];
        if (!wheel || !action) return null;
        return { wheel, action, wheelUuid, actionIndex };
    })();

    const updateSelectedAction = (newAction: Action) => {
        if (!selectedActionData) return;
        const { wheelUuid, actionIndex } = selectedActionData;
        updateAvatar(draft => {
            const wheel = draft.actionWheels[wheelUuid];
            if (wheel) {
                wheel.actions[actionIndex] = newAction;
            }
        });
    };
    
    const deleteSelectedAction = () => {
        if (!selectedActionData) return;
        const { wheelUuid, actionIndex } = selectedActionData;
        updateAvatar(draft => {
            const wheel = draft.actionWheels[wheelUuid];
            if (wheel) {
                wheel.actions.splice(actionIndex, 1);
            }
        });
        setSelectedAction(null);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-4">
                {allActionWheels.map(wheel => (
                    <div key={wheel.uuid} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                        <div className="flex justify-between items-center mb-3">
                            <Input 
                                type="text"
                                value={wheel.title}
                                onChange={e => updateWheelTitle(wheel.uuid, e.target.value)}
                                className="text-lg font-semibold bg-transparent border-0 p-0 focus:ring-0 w-full"
                            />
                            <div className="flex gap-2 flex-shrink-0 ml-2">
                                {avatar.mainActionWheel !== wheel.uuid && (
                                    <Button onClick={() => setMainWheel(wheel.uuid)} className="bg-yellow-600 hover:bg-yellow-700 text-xs">
                                        Set Main
                                    </Button>
                                )}
                                <Button onClick={() => deleteActionWheel(wheel.uuid)} className="bg-red-600 hover:bg-red-700 text-xs">
                                    Delete
                                </Button>
                            </div>
                        </div>
                        
                        {avatar.mainActionWheel === wheel.uuid && (
                            <span className="text-xs font-bold text-yellow-400 mb-2 block">MAIN WHEEL</span>
                        )}

                        <div className="space-y-2">
                           {wheel.actions.map((action, index) => {
                               const isSelected = selectedAction?.[0] === wheel.uuid && selectedAction?.[1] === index;
                               return (
                                   <button 
                                       key={index} 
                                       onClick={() => setSelectedAction([wheel.uuid, index])}
                                       className={`w-full text-left p-2 rounded flex items-center gap-3 transition-colors ${isSelected ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                                    >
                                        <span className="flex-shrink-0" style={{
                                            display: 'inline-block', width: '24px', height: '24px', borderRadius: '50%',
                                            backgroundColor: `rgb(${action.color.join(',')})`,
                                            textAlign: 'center', lineHeight: '24px', fontSize: '16px'
                                        }}>
                                            {action.icon}
                                        </span>
                                        <span className="truncate text-sm">
                                            {action.effect.kind === 'toggle' 
                                                ? `Toggle: ${allToggleGroups.find(g => g.uuid === action.effect.toggleGroup)?.name ?? 'N/A'}` 
                                                : `Switch: ${allActionWheels.find(w => w.uuid === action.effect.actionWheel)?.title ?? 'N/A'}`}
                                        </span>
                                   </button>
                               );
                           })}
                        </div>
                        <Button onClick={() => addAction(wheel.uuid)} className="bg-green-600 hover:bg-green-700 mt-3 w-full">
                            + Add Action
                        </Button>
                    </div>
                ))}
            </div>

            <div className="md:col-span-2">
                {selectedActionData ? (
                    <ActionEditor
                        key={`${selectedActionData.wheelUuid}-${selectedActionData.actionIndex}`}
                        action={selectedActionData.action}
                        updateAction={updateSelectedAction}
                        deleteAction={deleteSelectedAction}
                        allToggleGroups={allToggleGroups}
                        allActionWheels={allActionWheels}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full bg-gray-800/50 rounded-lg p-8 text-gray-400 border-2 border-dashed border-gray-700">
                        <p className="text-center">Select an action on the left to edit it.<br/>Or add a new action wheel to get started.</p>
                    </div>
                )}
            </div>
        </div>
    );
}