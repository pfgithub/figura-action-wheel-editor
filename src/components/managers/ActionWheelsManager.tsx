import React, { useState, useEffect } from 'react';
import type { UUID, Action, Avatar, ToggleGroup, ActionWheel } from '../../types';
import { UpdateAvatarFn } from '../../hooks/useAvatar';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ActionEditor } from '../editors/ActionEditor';
import { ActionWheelVisualizer } from '../ui/ActionWheelVisualizer';

interface ActionWheelsManagerProps {
    avatar: Avatar;
    updateAvatar: UpdateAvatarFn;
    allToggleGroups: ToggleGroup[];
    allActionWheels: ActionWheel[];
}

const MAX_ACTIONS_PER_WHEEL = 8;

export function ActionWheelsManager({ avatar, updateAvatar, allToggleGroups, allActionWheels }: ActionWheelsManagerProps) {
    const [viewedWheelUuid, setViewedWheelUuid] = useState<UUID | null>(avatar?.mainActionWheel ?? allActionWheels[0]?.uuid ?? null);
    const [selectedActionIndex, setSelectedActionIndex] = useState<number | null>(null);

    // Reset selection when the viewed wheel changes
    useEffect(() => {
        setSelectedActionIndex(null);
    }, [viewedWheelUuid]);

    // If the currently viewed wheel is deleted or no longer exists, switch to a valid one.
    useEffect(() => {
        if (allActionWheels.length > 0 && (viewedWheelUuid === null || !allActionWheels.some(w => w.uuid === viewedWheelUuid))) {
            setViewedWheelUuid(avatar.mainActionWheel ?? allActionWheels[0]?.uuid ?? null);
        } else if (allActionWheels.length === 0) {
            setViewedWheelUuid(null);
        }
    }, [allActionWheels, viewedWheelUuid, avatar.mainActionWheel]);

    const setMainWheel = (uuid: UUID) => {
        updateAvatar(draft => {
            draft.mainActionWheel = uuid;
        });
    };

    const deleteActionWheel = (uuid: UUID) => {
        if (avatar.mainActionWheel === uuid) {
            alert("Cannot delete the main action wheel. Set another wheel as main first.");
            return;
        }

        let usage = "";
        for (const wheel of Object.values(avatar.actionWheels)) {
            if (wheel.uuid === uuid) continue;
            for (const action of wheel.actions) {
                if (action.effect.kind === "switchPage" && action.effect.actionWheel === uuid) {
                    usage = `an action in "${wheel.title}"`;
                    break;
                }
            }
            if (usage) break;
        }

        if (usage) {
            alert(`Cannot delete. This wheel is used as a target in ${usage}.`);
            return;
        }

        if (window.confirm(`Are you sure you want to delete the "${avatar.actionWheels[uuid].title}" wheel?`)) {
            updateAvatar((draft) => {
                delete draft.actionWheels[uuid];
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
            if (wheel && wheel.actions.length < MAX_ACTIONS_PER_WHEEL) {
                const firstToggleGroup = Object.values(draft.toggleGroups)[0];
                const newAction: Action = {
                    icon: '❓',
                    color: [80, 80, 80],
                    effect: firstToggleGroup
                        ? { kind: 'toggle', toggleGroup: firstToggleGroup.uuid, value: firstToggleGroup.options[0] ?? '' }
                        : { kind: 'switchPage', actionWheel: Object.keys(draft.actionWheels)[0] as UUID ?? ('' as UUID) },
                };
                wheel.actions.push(newAction);
                setSelectedActionIndex(wheel.actions.length - 1);
            } else if (wheel) {
                alert(`A wheel can have a maximum of ${MAX_ACTIONS_PER_WHEEL} actions.`);
            }
        });
    };

    const currentWheel = viewedWheelUuid ? avatar.actionWheels[viewedWheelUuid] : null;

    const selectedActionData = (() => {
        if (!currentWheel || selectedActionIndex === null) return null;
        const action = currentWheel.actions[selectedActionIndex];
        if (!action) return null;
        return { wheel: currentWheel, action, wheelUuid: currentWheel.uuid, actionIndex: selectedActionIndex };
    })();

    const updateSelectedAction = (newAction: Action) => {
        if (!selectedActionData) return;
        const { wheelUuid, actionIndex } = selectedActionData;
        updateAvatar(draft => {
            draft.actionWheels[wheelUuid].actions[actionIndex] = newAction;
        });
    };
    
    const deleteSelectedAction = () => {
        if (!selectedActionData) return;
        const { wheelUuid, actionIndex } = selectedActionData;
        updateAvatar(draft => {
            draft.actionWheels[wheelUuid].actions.splice(actionIndex, 1);
        });
        setSelectedActionIndex(null);
    };

    if (allActionWheels.length === 0 || !currentWheel) {
        return (
             <div className="flex items-center justify-center h-48 bg-gray-800/50 rounded-lg p-8 text-gray-400 border-2 border-dashed border-gray-700">
                <p className="text-center">No action wheels found. Add one to get started.</p>
            </div>
        );
    }

    return (
        <div>
            {/* Tabs for each wheel */}
            <div className="flex items-center border-b border-gray-700 mb-6 -mx-2 px-2 pb-2 space-x-1 overflow-x-auto">
                {allActionWheels.map(wheel => (
                    <button
                        key={wheel.uuid}
                        onClick={() => setViewedWheelUuid(wheel.uuid)}
                        className={`py-2 px-4 rounded-t-lg text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                            viewedWheelUuid === wheel.uuid
                                ? 'bg-gray-800 text-white'
                                : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
                        }`}
                    >
                        {avatar.mainActionWheel === wheel.uuid && <span className="mr-2 text-yellow-400" title="Main Wheel">★</span>}
                        {wheel.title}
                    </button>
                ))}
            </div>

            <div className="space-y-6">
                {/* Wheel Header Controls */}
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-gray-800 p-4 rounded-lg">
                    <Input
                        type="text"
                        aria-label="Wheel Title"
                        value={currentWheel.title}
                        onChange={e => updateWheelTitle(currentWheel.uuid, e.target.value)}
                        className="text-xl font-semibold bg-gray-700"
                    />
                    <div className="flex gap-2 flex-shrink-0">
                        {avatar.mainActionWheel !== currentWheel.uuid && (
                            <Button onClick={() => setMainWheel(currentWheel.uuid)} className="bg-yellow-600 hover:bg-yellow-700">
                                Set as Main
                            </Button>
                        )}
                        {allActionWheels.length > 1 && (
                            <Button onClick={() => deleteActionWheel(currentWheel.uuid)} className="bg-red-600 hover:bg-red-700">
                                Delete Wheel
                            </Button>
                        )}
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    <div className="flex justify-center items-center lg:sticky lg:top-24 py-4">
                        <ActionWheelVisualizer
                            key={currentWheel.uuid}
                            actions={currentWheel.actions}
                            onSelectAction={setSelectedActionIndex}
                            onAddAction={() => addAction(currentWheel.uuid)}
                            selectedActionIndex={selectedActionIndex}
                            wheelTitle={currentWheel.title}
                        />
                    </div>

                    <div>
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
                            <div className="flex items-center justify-center h-full bg-gray-800/50 rounded-lg p-8 text-gray-400 border-2 border-dashed border-gray-700 min-h-[400px]">
                                <p className="text-center">Select an action on the wheel to edit it,<br/>or click the '+' slot to add a new one.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}