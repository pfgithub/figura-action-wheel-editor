import React, { useState } from 'react';
import type { AnimationID, ToggleGroup, AnimationSetting, AnimationCondition } from '../../types';
import { useAvatarStore } from '../../store/avatarStore';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { AnimationSettingEditor } from '../editors/AnimationSettingEditor';
import { PlusIcon, TrashIcon, WarningIcon } from '../ui/icons';
import { ConfirmationDialog } from '../ui/ConfirmationDialog';
import { Dialog, DialogHeader, DialogContent, DialogFooter } from '../ui/Dialog';

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

// A new dialog component for adding animation settings.
interface AddAnimationSettingDialogProps {
    open: boolean;
    onClose: () => void;
    onAdd: (animId: AnimationID) => void;
    existingIds: AnimationID[];
}

function AddAnimationSettingDialog({ open, onClose, onAdd, existingIds }: AddAnimationSettingDialogProps) {
    const [animId, setAnimId] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = () => {
        const trimmedId = animId.trim() as AnimationID;
        if (!trimmedId) {
            setError('Animation ID cannot be empty.');
            return;
        }
        if (existingIds.includes(trimmedId)) {
            setError('This Animation ID already exists.');
            return;
        }
        
        onAdd(trimmedId);
        onClose();
    };
    
    React.useEffect(() => {
        if(open) {
            setAnimId('');
            setError('');
        }
    }, [open]);

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogHeader>Add Animation Setting</DialogHeader>
            <DialogContent>
                <p className="text-sm text-slate-400 mb-2">
                    Enter the ID for the new animation setting. The format is typically <code>model_name.bbmodel.animation_name</code>.
                </p>
                <Input 
                    value={animId}
                    onChange={e => setAnimId(e.target.value)}
                    placeholder="e.g., player.bbmodel.idle"
                    autoFocus
                />
                {error && <p className="text-rose-500 text-xs mt-1">{error}</p>}
            </DialogContent>
            <DialogFooter>
                <Button onClick={onClose} className="bg-slate-600 hover:bg-slate-500">Cancel</Button>
                <Button onClick={handleSubmit} className="bg-violet-600 hover:bg-violet-500">Add Setting</Button>
            </DialogFooter>
        </Dialog>
    );
}


interface AnimationSettingsManagerProps {
    allToggleGroups: ToggleGroup[];
}


export function AnimationSettingsManager({ allToggleGroups }: AnimationSettingsManagerProps) {
    const avatar = useAvatarStore((state) => state.avatar);
    const updateAvatar = useAvatarStore((state) => state.updateAvatar);
    const animations = useAvatarStore((state) => state.animations);
    const [filter, setFilter] = useState('');
    const [expandedAnimId, setExpandedAnimId] = useState<AnimationID | null>(null);
    const [isAddDialogOpen, setAddDialogOpen] = useState(false);
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

    const handleAddSetting = (newAnimId: AnimationID) => {
        updateAvatar(draft => {
            draft.animationSettings[newAnimId] = {
                animation: newAnimId,
            };
        });
        setAddDialogOpen(false);
        setFilter(''); // Clear filter to show the new item
        setExpandedAnimId(newAnimId);
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
                 <Button onClick={() => setAddDialogOpen(true)} className="bg-violet-600 hover:bg-violet-500 flex-shrink-0">
                    <PlusIcon className="w-5 h-5 sm:mr-2"/>
                    <span className="hidden sm:inline">Add Setting</span>
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
                        {!hasSettings && <p className="text-sm text-center mt-1">Click 'Add Setting' to create one.</p>}
                    </div>
                )}
            </div>

            <AddAnimationSettingDialog 
                open={isAddDialogOpen}
                onClose={() => setAddDialogOpen(false)}
                onAdd={handleAddSetting}
                existingIds={allAnimationSettingIds}
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