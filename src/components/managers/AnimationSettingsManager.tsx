import React, { useState } from 'react';
import type { Avatar, AnimationID, ToggleGroup, AnimationSetting, AnimationCondition } from '../../types';
import type { UpdateAvatarFn } from '../../hooks/useAvatar';
import { Input } from '../ui/Input';
import { AnimationSettingEditor } from '../editors/AnimationSettingEditor';

interface AnimationSettingsManagerProps {
    avatar: Avatar;
    updateAvatar: UpdateAvatarFn;
    allToggleGroups: ToggleGroup[];
}

// Helper to summarize the condition for display in the UI
const summarizeCondition = (condition?: AnimationCondition): string => {
    if (!condition || condition.kind === 'empty') {
        return "Always Active";
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
                return 0;
        }
    }
    const count = countLeafConditions(condition);
    if (count === 0) return "Not configured";
    if (count === 1) return "1 Condition";
    return `${count} Conditions`;
};


export function AnimationSettingsManager({ avatar, updateAvatar, allToggleGroups }: AnimationSettingsManagerProps) {
    const [filter, setFilter] = useState('');
    const [expandedAnimId, setExpandedAnimId] = useState<AnimationID | null>(null);
    
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
                    className="w-full bg-gray-900"
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
                        <div key={animId} className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden transition-all duration-300">
                            <button 
                                onClick={() => toggleExpand(animId)}
                                className="w-full text-left p-4 flex justify-between items-center hover:bg-gray-700/50 transition-colors"
                                aria-expanded={isExpanded}
                                aria-controls={`anim-details-${animId}`}
                            >
                                <div className="flex-grow min-w-0 pr-4">
                                    <h4 className="font-semibold text-lg text-white truncate">{setting.name}</h4>
                                    <p className="text-sm text-gray-400 font-mono truncate">{animId}</p>
                                </div>
                                <div className="flex items-center gap-4 flex-shrink-0">
                                    <span className="hidden sm:inline-block text-sm text-gray-300 bg-gray-700 px-2 py-1 rounded-md">{summarizeCondition(setting.activationCondition)}</span>
                                    <svg className={`flex-shrink-0 w-6 h-6 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : 'rotate-0'}`} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                </div>
                            </button>
                            
                            {isExpanded && (
                                <div id={`anim-details-${animId}`} className="p-4 border-t border-gray-700 bg-gray-800/50">
                                    <AnimationSettingEditor
                                        animId={animId} 
                                        setting={setting}
                                        updateSetting={(s) => updateSetting(animId, s)}
                                        allToggleGroups={allToggleGroups}
                                        avatar={avatar}
                                        updateAvatar={updateAvatar}
                                    />
                                </div>
                            )}
                        </div>
                    );
                }) : (
                     <div className="flex items-center justify-center h-24 bg-gray-800/50 rounded-lg p-8 text-gray-400 border-2 border-dashed border-gray-700">
                        <p className="text-center">{hasAnimations ? "No animations match your search." : "There are no animations to configure."}</p>
                    </div>
                )}
            </div>
        </div>
    );
}