import React, { useState, Fragment } from 'react';
import type { AnimationID, ToggleGroup, AnimationSetting, AnimationCondition } from '../../types';
import { useAvatarStore } from '../../store/avatarStore';
import { Input } from '../ui/Input';
import { AnimationSettingEditor } from '../editors/AnimationSettingEditor';
import { PlusIcon, TrashIcon, WarningIcon } from '../ui/icons';
import { ConfirmationDialog } from '../ui/ConfirmationDialog';
import { Combobox, Transition } from '@headlessui/react';

// Helper to summarize the condition for display in the UI
const summarizeCondition = (condition?: AnimationCondition): string => {
    if (!condition) {
        return "Not configured";
    }
    // A simple function to recursively count non-container conditions
    const countLeafConditions = (c: AnimationCondition): number => {
        switch (c.kind) {
            case 'and':
            case 'or':
                return c.conditions.reduce((sum, sub) => sum + countLeafConditions(sub), 0);
            case 'not':
                return c.condition ? countLeafConditions(c.condition) : 0;
            case 'toggleGroup':
            case 'player':
                return 1;
            default:
                // This will handle any future unknown kinds gracefully.
                return 0;
        }
    }
    const count = countLeafConditions(condition);
    if (count === 0) return "Not configured";
    if (count === 1) return "1 Condition";
    return `${count} Conditions`;
};

interface AnimationSettingsManagerProps {
    allToggleGroups: ToggleGroup[];
}


export function AnimationSettingsManager({ allToggleGroups }: AnimationSettingsManagerProps) {
    const avatar = useAvatarStore((state) => state.avatar);
    const updateAvatar = useAvatarStore((state) => state.updateAvatar);
    const animations = useAvatarStore((state) => state.animations);
    const [filter, setFilter] = useState('');
    const [expandedAnimId, setExpandedAnimId] = useState<AnimationID | null>(null);
    const [addAnimQuery, setAddAnimQuery] = useState('');
    const [deletingAnimId, setDeletingAnimId] = useState<AnimationID | null>(null);
    
    if (!avatar) return null;

    const { animationSettings } = avatar;
    const allAnimationSettingIds = Object.keys(animationSettings) as AnimationID[];

    const lowerFilter = filter.toLowerCase();

    const filteredAnimationIds = allAnimationSettingIds.filter(animId => {
        if (!filter) return true;
        return animId.toLowerCase().includes(lowerFilter);
    }).sort((a,b) => a.localeCompare(b)); // Sort for consistent order

    const toggleExpand = (animId: AnimationID) => {
        setExpandedAnimId(prev => (prev === animId ? null : animId));
    };

    const handleAddSetting = (newAnimId: string) => {
        const trimmedId = newAnimId.trim() as AnimationID;
        if (!trimmedId) {
            setAddAnimQuery('');
            return;
        }
        
        // Reset input immediately
        setAddAnimQuery('');

        // If setting already exists, just clear filter and expand it.
        if (allAnimationSettingIds.includes(trimmedId)) {
            setFilter('');
            setExpandedAnimId(trimmedId);
            return;
        }

        updateAvatar(draft => {
            draft.animationSettings[trimmedId] = {
                animation: trimmedId,
            };
        });
        setFilter(''); // Clear filter to show the new item
        setExpandedAnimId(trimmedId);
    };

    const handleDeleteRequest = (animId: AnimationID) => {
        setDeletingAnimId(animId);
    };

    const handleDeleteConfirm = () => {
        if (!deletingAnimId) return;
        updateAvatar(draft => {
            delete draft.animationSettings[deletingAnimId];
        });
        if (expandedAnimId === deletingAnimId) {
            setExpandedAnimId(null);
        }
        setDeletingAnimId(null);
    };

    const updateSetting = (animId: AnimationID, updatedSetting: AnimationSetting) => {
        updateAvatar(draft => {
            draft.animationSettings[animId] = updatedSetting;
        });
    };
    
    const hasSettings = allAnimationSettingIds.length > 0;
    
    const unconfiguredAnimations = animations
        .filter(animId => !allAnimationSettingIds.includes(animId))
        .sort((a, b) => a.localeCompare(b));

    const filteredAnimationsForAdder =
        addAnimQuery === ''
            ? unconfiguredAnimations
            : unconfiguredAnimations.filter((name) =>
                name.toLowerCase().includes(addAnimQuery.toLowerCase())
            );

    return (
        <div className="space-y-4">
            <div className="flex gap-2 items-center">
                <Input 
                    type="text"
                    placeholder="Search animations by ID..."
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    className="w-full bg-slate-900/50"
                    aria-label="Filter animations"
                />
                 <div className="relative flex-shrink-0" style={{ width: '260px' }}>
                    <Combobox value={addAnimQuery} onChange={handleAddSetting}>
                        <div className="relative w-full cursor-default overflow-hidden rounded-md bg-slate-800 text-left shadow-md focus-within:ring-2 focus-within:ring-violet-500 transition-all">
                            <Combobox.Input
                                className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-slate-100 placeholder-slate-400 bg-transparent focus:ring-0"
                                onChange={(event) => setAddAnimQuery(event.target.value)}
                                placeholder="Add or select animation..."
                            />
                            <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                                <PlusIcon className="h-5 w-5 text-slate-400 hover:text-slate-200" aria-hidden="true" />
                            </Combobox.Button>
                        </div>
                        <Transition
                            as={Fragment}
                            leave="transition ease-in duration-100"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                            afterLeave={() => setAddAnimQuery('')}
                        >
                            <Combobox.Options className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md bg-slate-700 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                {filteredAnimationsForAdder.length === 0 && addAnimQuery !== '' && (
                                    !allAnimationSettingIds.includes(addAnimQuery.trim() as AnimationID) ? (
                                        <Combobox.Option
                                            value={addAnimQuery}
                                            className={({active}) => `relative cursor-pointer select-none py-2 px-4 ${active ? 'bg-violet-600 text-white' : 'text-slate-300'}`}
                                        >
                                            Create "{addAnimQuery}"
                                        </Combobox.Option>
                                    ) : (
                                        addAnimQuery.trim() && <div className="relative cursor-default select-none py-2 px-4 text-slate-400">
                                            Setting already exists.
                                        </div>
                                    )
                                )}
                                {filteredAnimationsForAdder.map((animId) => (
                                    <Combobox.Option
                                        key={animId}
                                        className={({ active }) =>
                                            `relative cursor-pointer select-none py-2 pl-4 pr-4 ${
                                            active ? 'bg-violet-600 text-white' : 'text-slate-100'
                                            }`
                                        }
                                        value={animId}
                                    >
                                    {animId}
                                    </Combobox.Option>
                                ))}
                                 {filteredAnimationsForAdder.length === 0 && addAnimQuery === '' && (
                                    <div className="relative cursor-default select-none py-2 px-4 text-slate-400">
                                        No unconfigured animations found.
                                    </div>
                                )}
                            </Combobox.Options>
                        </Transition>
                    </Combobox>
                </div>
            </div>

            <div className="space-y-2">
                {filteredAnimationIds.length > 0 ? filteredAnimationIds.map(animId => {
                    const setting = animationSettings[animId];
                    const isExpanded = expandedAnimId === animId;
                    const isAnimationFound = animations.includes(animId);

                    return (
                        <div key={animId} className="bg-slate-800 rounded-lg ring-1 ring-slate-700 overflow-hidden transition-all duration-300">
                             <div 
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => { if(e.key === 'Enter' || e.key === ' ') toggleExpand(animId) }}
                                onClick={() => toggleExpand(animId)}
                                className="w-full text-left p-4 flex justify-between items-center hover:bg-slate-700/40 transition-colors cursor-pointer"
                                aria-expanded={isExpanded}
                                aria-controls={`anim-details-${animId}`}
                            >
                                <div className="flex-grow min-w-0 pr-4 flex items-center gap-3">
                                    {!isAnimationFound && (
                                        <span title="Animation not found in loaded .bbmodel files.">
                                            <WarningIcon className="w-5 h-5 text-amber-400 flex-shrink-0" />
                                        </span>
                                    )}
                                    <div className="min-w-0">
                                        <h4 className="font-semibold text-lg text-slate-100 truncate">{animId}</h4>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className="hidden sm:inline-block text-sm text-slate-300 bg-slate-700 px-3 py-1 rounded-full">{summarizeCondition(setting.activationCondition)}</span>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleDeleteRequest(animId); }} 
                                        className="p-2 rounded-md hover:bg-rose-600/40 text-rose-300 z-10 relative"
                                        title="Delete Setting"
                                    >
                                        <TrashIcon className="w-5 h-5"/>
                                    </button>
                                    <svg className={`flex-shrink-0 w-6 h-6 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : 'rotate-0'}`} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                </div>
                            </div>
                            
                            {isExpanded && (
                                <div id={`anim-details-${animId}`} className="p-4 border-t border-slate-700 bg-slate-800/50">
                                    <AnimationSettingEditor
                                        setting={setting}
                                        updateSetting={(s) => updateSetting(animId, s)}
                                        allToggleGroups={allToggleGroups}
                                    />
                                </div>
                            )}
                        </div>
                    );
                }) : (
                     <div className="flex flex-col items-center justify-center h-24 bg-slate-800/50 rounded-lg p-8 text-slate-500 ring-1 ring-slate-700">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 mb-2 text-slate-600"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                        <p className="text-center font-medium">{hasSettings ? "No animations match your search." : "There are no animation settings to configure."}</p>
                        {!hasSettings && <p className="text-sm text-center mt-1">Click 'Add Setting' to create one.</p>}
                    </div>
                )}
            </div>

            <ConfirmationDialog 
                open={!!deletingAnimId}
                onCancel={() => setDeletingAnimId(null)}
                onConfirm={handleDeleteConfirm}
                title="Delete Animation Setting?"
                message={<>Are you sure you want to delete the setting for <strong>"{deletingAnimId}"</strong>? This action cannot be undone.</>}
                variant="danger"
                confirmText="Delete"
            />
        </div>
    );
}