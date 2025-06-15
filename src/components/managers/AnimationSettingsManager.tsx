import React, { useState, useMemo, useEffect } from 'react';
import type { AnimationID, ToggleGroup, AnimationSetting, AnimationCondition } from '../../types';
import { useAvatarStore } from '../../store/avatarStore';
import { AnimationSettingEditor } from '../editors/AnimationSettingEditor';
import { PlusIcon, TrashIcon, WarningIcon } from '../ui/icons';
import { ConfirmationDialog } from '../ui/ConfirmationDialog';
import { Dialog, DialogHeader, DialogContent, DialogFooter } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

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

// --- AddAnimationSettingDialog Component ---
// Note: This would normally be in its own file (e.g., src/components/dialogs/AddAnimationSettingDialog.tsx)
interface AddAnimationSettingDialogProps {
    open: boolean;
    onClose: () => void;
    unconfiguredAnimations: AnimationID[];
    existingSettings: AnimationID[];
    onAdd: (animIds: AnimationID[]) => void;
}

function AddAnimationSettingDialog({ open, onClose, unconfiguredAnimations, existingSettings, onAdd }: AddAnimationSettingDialogProps) {
    const [filter, setFilter] = useState('');
    const [customName, setCustomName] = useState('');

    useEffect(() => {
        if (open) {
            setFilter('');
            setCustomName('');
        }
    }, [open]);

    const filteredAnimations = useMemo(() => {
        if (!filter) return unconfiguredAnimations;
        return unconfiguredAnimations.filter(name => name.toLowerCase().includes(filter.toLowerCase()));
    }, [unconfiguredAnimations, filter]);

    const handleAddCustom = () => {
        const trimmed = customName.trim() as AnimationID;
        if (trimmed && !existingSettings.includes(trimmed)) {
            onAdd([trimmed]);
            onClose();
        }
    };
    
    const handleAddAll = () => {
        if (unconfiguredAnimations.length > 0) {
            onAdd(unconfiguredAnimations);
            onClose();
        }
    };

    const handleAddSingle = (animId: AnimationID) => {
        onAdd([animId]);
    };

    const isCustomAddDisabled = !customName.trim() || existingSettings.includes(customName.trim() as AnimationID);

    return (
        <Dialog open={open} onClose={onClose} className="max-w-2xl">
            <DialogHeader>Add Animation Setting</DialogHeader>
            <DialogContent>
                <div className="space-y-4">
                     <div>
                        <h3 className="text-base font-semibold text-slate-300 mb-2">Add Custom Setting</h3>
                        <div className="flex gap-2 p-3 bg-slate-900/50 rounded-lg">
                            <Input 
                                placeholder="Enter custom animation ID..."
                                value={customName}
                                onChange={e => setCustomName(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' && !isCustomAddDisabled) handleAddCustom(); }}
                            />
                            <Button onClick={handleAddCustom} disabled={isCustomAddDisabled} className="flex-shrink-0">
                                Add
                            </Button>
                        </div>
                        {existingSettings.includes(customName.trim() as AnimationID) && (
                            <p className="text-amber-400 text-xs mt-1 pl-1">This setting already exists.</p>
                        )}
                    </div>
                    
                    {unconfiguredAnimations.length > 0 && (
                        <div className="border-t border-slate-700/70 pt-4 mt-4 space-y-3">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                                <h3 className="text-base font-semibold text-slate-300">Available from Models</h3>
                                <Button onClick={handleAddAll} className="bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 text-sm py-1 px-3">
                                    Add all ({unconfiguredAnimations.length}) unconfigured
                                </Button>
                            </div>
                            <Input 
                                placeholder={`Search ${unconfiguredAnimations.length} available animations...`}
                                value={filter}
                                onChange={e => setFilter(e.target.value)}
                            />
                            <div className="max-h-64 overflow-y-auto -mr-3 pr-3 space-y-1">
                                {filteredAnimations.length > 0 ? filteredAnimations.map(animId => (
                                    <div key={animId} className="flex justify-between items-center p-2 rounded-md hover:bg-slate-700/50 transition-colors">
                                        <span className="font-mono text-sm text-slate-300 break-all">{animId}</span>
                                        <Button onClick={() => handleAddSingle(animId)} className="bg-violet-600/30 text-violet-300 hover:bg-violet-600/50 text-xs py-1 px-2 font-medium flex-shrink-0 ml-2">
                                            <PlusIcon className="w-4 h-4 mr-1"/>
                                            Add
                                        </Button>
                                    </div>
                                )) : (
                                    <p className="text-center text-slate-400 p-4">No available animations match your search.</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
            <DialogFooter>
                <Button onClick={onClose} className="bg-slate-600 hover:bg-slate-500">Done</Button>
            </DialogFooter>
        </Dialog>
    );
}


// --- AnimationSettingsManager Component ---

interface AnimationSettingsManagerProps {
    allToggleGroups: ToggleGroup[];
}

export function AnimationSettingsManager({ allToggleGroups }: AnimationSettingsManagerProps) {
    const avatar = useAvatarStore((state) => state.avatar);
    const updateAvatar = useAvatarStore((state) => state.updateAvatar);
    const animations = useAvatarStore((state) => state.animations);
    
    const [filter, setFilter] = useState('');
    const [isAddDialogOpen, setAddDialogOpen] = useState(false);
    const [expandedAnimId, setExpandedAnimId] = useState<AnimationID | null>(null);
    const [deletingAnimId, setDeletingAnimId] = useState<AnimationID | null>(null);
    
    if (!avatar) return null;

    const { animationSettings } = avatar;
    const allAnimationSettingIds = Object.keys(animationSettings) as AnimationID[];

    const lowerFilter = filter.toLowerCase();

    const filteredAnimationIds = allAnimationSettingIds.filter(animId => {
        if (!filter) return true;
        return animId.toLowerCase().includes(lowerFilter);
    }).sort((a,b) => a.localeCompare(b));

    const toggleExpand = (animId: AnimationID) => {
        setExpandedAnimId(prev => (prev === animId ? null : animId));
    };

    const handleAddSettings = (animIdsToAdd: AnimationID[]) => {
        updateAvatar(draft => {
            for (const animId of animIdsToAdd) {
                if (!draft.animationSettings[animId]) {
                    draft.animationSettings[animId] = {
                        animation: animId,
                    };
                }
            }
        });
        
        // If a single new item was added, expand it for immediate editing.
        if (animIdsToAdd.length === 1) {
            setFilter(''); // Clear search to ensure the new item is visible
            setExpandedAnimId(animIdsToAdd[0]);
        }
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

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-grow">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                         <svg className="w-5 h-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    </span>
                    <Input
                        className="w-full pl-10"
                        placeholder="Search configured settings..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        aria-label="Search configured animation settings"
                    />
                </div>
                <Button 
                    onClick={() => setAddDialogOpen(true)} 
                    className="bg-violet-600 hover:bg-violet-500 whitespace-nowrap justify-center"
                >
                    <PlusIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                    Add Animation Setting
                </Button>
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
                        {!hasSettings && <p className="text-sm text-center mt-1">Click the 'Add Animation Setting' button to get started.</p>}
                    </div>
                )}
            </div>

            <AddAnimationSettingDialog
                open={isAddDialogOpen}
                onClose={() => setAddDialogOpen(false)}
                unconfiguredAnimations={unconfiguredAnimations}
                existingSettings={allAnimationSettingIds}
                onAdd={handleAddSettings}
            />

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