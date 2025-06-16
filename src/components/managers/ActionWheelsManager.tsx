import React, { useState, useEffect } from 'react';
import type { UUID, Action, ActionWheel, ToggleGroup } from '@/types';
import { useAvatarStore } from '@/store/avatarStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ActionEditor } from '@/components/editors/ActionEditor';
import { ActionWheelVisualizer } from '@/components/ui/ActionWheelVisualizer';
import { generateUUID } from '@/utils/uuid';

interface ActionWheelsManagerProps {
    allToggleGroups: ToggleGroup[];
    allActionWheels: ActionWheel[];
    addActionWheel: () => void;
    viewedWheelUuid: UUID | null;
    setViewedWheelUuid: (uuid: UUID | null) => void;
}

const MAX_ACTIONS_PER_WHEEL = 8;

export function ActionWheelsManager({
    allToggleGroups,
    allActionWheels,
    addActionWheel,
    viewedWheelUuid,
    setViewedWheelUuid
}: ActionWheelsManagerProps) {
    const { avatar, updateAvatar } = useAvatarStore();
    const [selectedActionIndex, setSelectedActionIndex] = useState<number | null>(null);

    // Reset selection when the viewed wheel changes
    useEffect(() => {
        setSelectedActionIndex(null);
    }, [viewedWheelUuid]);

    if (!avatar) return null; // Should not happen if App component handles loading state

    const setMainWheel = (uuid: UUID) => {
        updateAvatar(draft => {
            draft.mainActionWheel = uuid;
        });
    };

    const deleteActionWheel = (uuid: UUID) => {
        updateAvatar((draft) => {
            delete draft.actionWheels[uuid];
            if (draft.mainActionWheel === uuid) {
                draft.mainActionWheel = Object.values(draft.actionWheels)[0]?.uuid ?? undefined;
            }
            for (const wheel of Object.values(draft.actionWheels)) {
                if (wheel.uuid === uuid) continue;
                for (const action of wheel.actions) {
                    if (action.effect?.kind === "switchPage" && action.effect.actionWheel === uuid) {
                        action.effect.actionWheel = undefined;
                        break;
                    }
                }
            }
        });
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
                const newAction: Action = {
                    uuid: generateUUID(),
                    icon: { type: 'item', id: 'minecraft:air' },
                    label: `Action ${wheel.actions.length + 1}`,
                    color: [80, 80, 80],
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

    const renderTabBar = () => (
        <div className="flex items-center border-b border-slate-700 mb-6 -mx-2 px-2 pb-px space-x-1 overflow-x-auto">
            {allActionWheels.map(wheel => (
                <button
                    key={wheel.uuid}
                    onClick={() => setViewedWheelUuid(wheel.uuid)}
                    className={`py-2 px-4 rounded-t-lg text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 border-b-2 ${
                        viewedWheelUuid === wheel.uuid
                            ? 'border-violet-500 text-white'
                            : 'border-transparent text-slate-400 hover:text-white'
                    }`}
                >
                    {avatar.mainActionWheel === wheel.uuid && <span className="mr-2 text-amber-400" title="Main Wheel">★</span>}
                    {wheel.title}
                </button>
            ))}
             <Button
                onClick={addActionWheel}
                className="ml-2 flex-shrink-0 bg-violet-600 hover:bg-violet-500 focus-visible:ring-violet-400 text-sm px-3 py-1 rounded-md"
            >
                + Add
            </Button>
        </div>
    );

    if (allActionWheels.length === 0) {
        return (
            <div>
                {renderTabBar()}
                <div className="flex flex-col items-center justify-center h-48 bg-slate-800/50 rounded-lg p-8 text-slate-500 ring-1 ring-slate-700">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 mb-4 text-slate-600"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l2 2"/></svg>
                    <p className="text-center font-medium">No action wheels found.</p>
                    <p className="text-sm">Add one to get started.</p>
                </div>
            </div>
        );
    }

    if (!currentWheel) {
        // This can happen briefly while the viewed wheel is being updated.
        // It prevents a crash if currentWheel is null.
        return (
            <div>
                {renderTabBar()}
                 <div className="flex items-center justify-center h-48 text-slate-400">Loading wheel...</div>
            </div>
        );
    }


    return (
        <div>
            {renderTabBar()}

            <div className="space-y-6">
                {/* Wheel Header Controls */}
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-slate-800 p-4 rounded-lg ring-1 ring-slate-700">
                    <Input
                        type="text"
                        aria-label="Wheel Title"
                        value={currentWheel.title}
                        onChange={e => updateWheelTitle(currentWheel.uuid, e.target.value)}
                        className="text-xl font-semibold bg-slate-700/80 border-slate-600"
                    />
                    <div className="flex gap-2 flex-shrink-0">
                        {avatar.mainActionWheel !== currentWheel.uuid && (
                            <Button onClick={() => setMainWheel(currentWheel.uuid)} className="bg-amber-500 hover:bg-amber-400 focus-visible:ring-amber-300">
                                Set as Main
                            </Button>
                        )}
                        {allActionWheels.length > 1 && (
                            <Button onClick={() => deleteActionWheel(currentWheel.uuid)} className="bg-rose-600 hover:bg-rose-500 focus-visible:ring-rose-400">
                                Delete Wheel
                            </Button>
                        )}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex flex-col gap-8">
                    <div className="flex justify-center items-center py-4">
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
                             <div className="flex flex-col items-center justify-center h-full bg-slate-800/50 rounded-lg p-8 text-slate-500 ring-1 ring-slate-700 min-h-[400px]">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 mb-4 text-slate-600"><path d="m21.1 16.3-4.2-4.2a2 2 0 0 0-2.8 0L3.7 22a2 2 0 0 1-2.8-2.8l10.4-10.4a2 2 0 0 0 0-2.8L7.1 1.7a2 2 0 0 1 2.8 0l11.2 11.2a2 2 0 0 1 0 2.8z"/><path d="m22 22-2.5-2.5"/><path d="m3.5 3.5 2.5 2.5"/></svg>
                                <p className="text-center font-medium">Select an action to edit</p>
                                <p className="text-sm text-center">Click a slot on the wheel to edit its action,<br/>or click the '+' to add a new one.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}