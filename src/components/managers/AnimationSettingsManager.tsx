import React, { useState } from 'react';
import type { AnimationID, ToggleGroup, AnimationSetting, AnimationCondition } from '../../types';
import { useAvatarStore } from '../../store/avatarStore';
import { Input } from '../ui/Input';
import { AnimationSettingEditor } from '../editors/AnimationSettingEditor';

interface AnimationSettingsManagerProps {
    allToggleGroups: ToggleGroup[];
}

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


export function AnimationSettingsManager({ allToggleGroups }: AnimationSettingsManagerProps) {
    const { avatar, updateAvatar } = useAvatarStore();
    const [filter, setFilter] = useState('');
    const [expandedAnimId, setExpandedAnimId] = useState<AnimationID | null>(null);
    
    if (!avatar) return null;

    const { animations, animationSettings } = avatar;
    const lowerFilter = filter.toLowerCase();

    const filteredAnimationIds = animations.filter(animId => {
        if (!filter) return true; // Show all if no filter
        const setting = animationSettings[animId];
        const settingName = setting ? setting.name.toLowerCase() : '';
        return animId.toLowerCase().includes(lowerFilter) || settingName.includes(lowerFilter);
    });

    const toggleExpand = (animId: AnimationID) => {
        setExpandedAnimId(prev => (prev === animId ? null : animId));
    };

    const updateSetting = (animId: AnimationID, updatedSetting: AnimationSetting) => {
        updateAvatar(draft => {
            draft.animationSettings[animId] = updatedSetting;
        });
    };
    
    const hasAnimations = animations.length > 0;

    return (
        <div className="space-y-4">
            {hasAnimations && (
                <Input 
                    type="text"
                    placeholder="Search animations by ID or display name..."
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    className="w-full bg-slate-900/50"
                    aria-label="Filter animations"
                />
            )}

            <div className="space-y-2">
                {filteredAnimationIds.length > 0 ? filteredAnimationIds.map(animId => {
                    const setting = animationSettings[animId];
                    const isExpanded = expandedAnimId === animId;

                    if (!setting) {
                        return <div key={animId} className="text-red-400 p-4 bg-red-900/50 rounded-lg border border-red-700">Error: Missing setting for animation ID: <strong>{animId}</strong></div>;
                    }

                    return (
                        <div key={animId} className="bg-slate-800 rounded-lg ring-1 ring-slate-700 overflow-hidden transition-all duration-300">
                            <button 
                                onClick={() => toggleExpand(animId)}
                                className="w-full text-left p-4 flex justify-between items-center hover:bg-slate-700/40 transition-colors"
                                aria-expanded={isExpanded}
                                aria-controls={`anim-details-${animId}`}
                            >
                                <div className="flex-grow min-w-0 pr-4">
                                    <h4 className="font-semibold text-lg text-slate-100 truncate">{setting.name}</h4>
                                    <p className="text-sm text-slate-400 font-mono truncate">{animId}</p>
                                </div>
                                <div className="flex items-center gap-4 flex-shrink-0">
                                    <span className="hidden sm:inline-block text-sm text-slate-300 bg-slate-700 px-3 py-1 rounded-full">{summarizeCondition(setting.activationCondition)}</span>
                                    <svg className={`flex-shrink-0 w-6 h-6 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : 'rotate-0'}`} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                </div>
                            </button>
                            
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
                        <p className="text-center font-medium">{hasAnimations ? "No animations match your search." : "There are no animations to configure."}</p>
                    </div>
                )}
            </div>
        </div>
    );
}