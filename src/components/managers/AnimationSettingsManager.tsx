import React, { useState, useMemo } from 'react';
import type { UUID, ToggleGroup, ConditionalSetting, PlayAnimationSetting, HideElementSetting, RenderSetting, RenderSettingID, AnimationID } from '../../types';
import { useAvatarStore } from '../../store/avatarStore';
import { AnimationSettingEditor } from '../editors/AnimationSettingEditor';
import { PlusIcon, TrashIcon, WarningIcon } from '../ui/icons';
import { ConfirmationDialog } from '../ui/ConfirmationDialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { generateUUID } from '@/utils/uuid';
import { SegmentedControl } from '../ui/SegmentedControl';
import { renderSettings } from '../../data/renderSettings';

type SettingView = 'play_animation' | 'hide_element' | 'render';

// Helper to summarize the condition for display in the UI
const summarizeCondition = (setting?: ConditionalSetting): string => {
    if (!setting?.activationCondition) {
        return "Always active";
    }
    const countLeafConditions = (c: any): number => {
        if (!c) return 0;
        switch (c.kind) {
            case 'and':
            case 'or':
                return c.conditions.reduce((sum: number, sub: any) => sum + countLeafConditions(sub), 0);
            case 'not':
                return c.condition ? countLeafConditions(c.condition) : 0;
            case 'toggleGroup':
            case 'render':
            case 'animation':
            case 'custom':
                return 1;
            default:
                return 0;
        }
    }
    const count = countLeafConditions(setting.activationCondition);
    if (count === 0) return "Not configured";
    if (count === 1) return "1 Condition";
    return `${count} Conditions`;
};

// --- AnimationSettingsManager Component ---

interface AnimationSettingsManagerProps {
    allToggleGroups: ToggleGroup[];
}

export function AnimationSettingsManager({ allToggleGroups }: AnimationSettingsManagerProps) {
    const { avatar, animations, modelElements, updateAvatar } = useAvatarStore();
    
    const [filter, setFilter] = useState('');
    const [expandedId, setExpandedId] = useState<UUID | null>(null);
    const [deletingId, setDeletingId] = useState<UUID | null>(null);
    const [view, setView] = useState<SettingView>('play_animation');
    
    if (!avatar) return null;

    const { conditionalSettings } = avatar;
    
    const lowerFilter = filter.toLowerCase();

    const filteredItems = useMemo(() => {
        const allSettings = Object.values(conditionalSettings);
        
        if (view === 'play_animation') {
            const configured = allSettings.filter((s): s is PlayAnimationSetting => s.kind === 'play_animation');
            const configuredAnims = new Set(configured.map(s => s.animation));
            const unconfigured = animations.filter(animId => !configuredAnims.has(animId));

            return {
                configured: configured.filter(s => s.animation.toLowerCase().includes(lowerFilter)),
                unconfigured: unconfigured.filter(id => id.toLowerCase().includes(lowerFilter)),
            };
        }
        if (view === 'hide_element') {
            const configured = allSettings.filter((s): s is HideElementSetting => s.kind === 'hide_element');
            const configuredElems = new Set(configured.map(s => s.element));
            const unconfigured = modelElements.filter(elemId => !configuredElems.has(elemId));

            return {
                configured: configured.filter(s => s.element.toLowerCase().includes(lowerFilter)),
                unconfigured: unconfigured.filter(id => id.toLowerCase().includes(lowerFilter)),
            };
        }
        if (view === 'render') {
            const configured = allSettings.filter((s): s is RenderSetting => s.kind === 'render');
            const configuredKinds = new Set(configured.map(s => s.render));
            const unconfigured = Array.from(renderSettings.keys()).filter(kind => !configuredKinds.has(kind));

            const nameMatches = (kind: RenderSettingID) => renderSettings.get(kind)?.name.toLowerCase().includes(lowerFilter);

            return { 
                configured: configured.filter(s => nameMatches(s.render as RenderSettingID)), 
                unconfigured: unconfigured.filter(nameMatches)
            };
        }
        return { configured: [], unconfigured: [] };

    }, [view, conditionalSettings, animations, modelElements, lowerFilter]);

    const toggleExpand = (uuid: UUID) => {
        setExpandedId(prev => (prev === uuid ? null : uuid));
    };

    const handleAddSetting = (id: string) => {
        const newUuid = generateUUID();
        let newSetting: ConditionalSetting;

        if (view === 'play_animation') {
            newSetting = { uuid: newUuid, kind: 'play_animation', animation: id as AnimationID };
        } else if (view === 'hide_element') {
            newSetting = { uuid: newUuid, kind: 'hide_element', element: id };
        } else { // render
            newSetting = { uuid: newUuid, kind: 'render', render: id as RenderSettingID };
        }

        updateAvatar(draft => {
            draft.conditionalSettings[newUuid] = newSetting;
        });
        setFilter('');
        setExpandedId(newUuid);
    };

    const handleDeleteRequest = (uuid: UUID) => {
        setDeletingId(uuid);
    };

    const handleDeleteConfirm = () => {
        if (!deletingId) return;
        updateAvatar(draft => {
            delete draft.conditionalSettings[deletingId];
        });
        if (expandedId === deletingId) {
            setExpandedId(null);
        }
        setDeletingId(null);
    };

    const updateSetting = (updatedSetting: ConditionalSetting) => {
        updateAvatar(draft => {
            draft.conditionalSettings[updatedSetting.uuid] = updatedSetting;
        });
    };
    
    const renderItem = (setting: ConditionalSetting) => {
        const isExpanded = expandedId === setting.uuid;
        const id = setting.uuid;
        let title: string, warning: string | null = null;

        switch(setting.kind) {
            case 'play_animation':
                title = setting.animation;
                if (!animations.includes(setting.animation)) warning = "Animation not found in loaded .bbmodel files.";
                break;
            case 'hide_element':
                title = setting.element;
                if (!modelElements.includes(setting.element)) warning = "Element not found in loaded .bbmodel files.";
                break;
            case 'render':
                const renderSetting = renderSettings.get(setting.render);
                if(!renderSetting) warning = "Invalid render setting";
                title = renderSetting?.name ?? setting.render;
                break;
        }

        return (
            <div key={id} className="bg-slate-800 rounded-lg ring-1 ring-slate-700 overflow-hidden transition-all duration-300">
                 <div 
                    role="button" tabIndex={0} onKeyDown={(e) => { if(e.key === 'Enter' || e.key === ' ') toggleExpand(id) }}
                    onClick={() => toggleExpand(id)}
                    className="w-full text-left p-4 flex justify-between items-center hover:bg-slate-700/40 transition-colors cursor-pointer"
                    aria-expanded={isExpanded}
                >
                    <div className="flex-grow min-w-0 pr-4 flex items-center gap-3">
                        {warning && ( <span title={warning}><WarningIcon className="w-5 h-5 text-amber-400 flex-shrink-0" /></span> )}
                        <h4 className="font-semibold text-lg text-slate-100 truncate" title={title}>{title}</h4>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="hidden sm:inline-block text-sm text-slate-300 bg-slate-700 px-3 py-1 rounded-full">{summarizeCondition(setting)}</span>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteRequest(id); }} className="p-2 rounded-md hover:bg-rose-600/40 text-rose-300 z-10 relative" title="Delete Setting">
                            <TrashIcon className="w-5 h-5"/>
                        </button>
                        <svg className={`flex-shrink-0 w-6 h-6 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : 'rotate-0'}`} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                </div>
                {isExpanded && (
                    <div className="p-4 border-t border-slate-700 bg-slate-800/50">
                        <AnimationSettingEditor 
                            setting={setting} 
                            updateSetting={updateSetting} 
                            allToggleGroups={allToggleGroups}
                            allAnimations={animations}
                        />
                    </div>
                )}
            </div>
        );
    }
    
    const renderUnconfiguredItem = (id: string, description: string) => (
        <div key={id} className="rounded-lg border-2 border-dashed border-slate-700 p-4 flex justify-between items-center text-slate-400 hover:border-violet-500 hover:bg-violet-900/10 transition-colors duration-200">
            <div className="flex-grow min-w-0 pr-4">
                <h4 className="font-semibold text-lg text-slate-300 truncate">{description}</h4>
                <p className="text-sm text-slate-500">{id}</p>
            </div>
            <Button onClick={() => handleAddSetting(id)} className="bg-violet-600 hover:bg-violet-500 flex-shrink-0"><PlusIcon className="w-5 h-5 mr-2" />Configure</Button>
        </div>
    );

    const hasAnyContent = filteredItems.configured.length > 0 || filteredItems.unconfigured.length > 0;
    
    const viewConfig = {
        play_animation: { placeholder: `Search ${animations.length} animations...`, emptyText: "No animations found in models." },
        hide_element: { placeholder: `Search ${modelElements.length} elements...`, emptyText: "No elements found in models." },
        render: { placeholder: "Search render settings...", emptyText: "All render settings configured." },
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
                <SegmentedControl
                    value={view}
                    onChange={(newView) => setView(newView as SettingView)}
                    options={[
                        { label: 'Play Animation', value: 'play_animation' },
                        { label: 'Hide Element', value: 'hide_element' },
                        { label: 'Render', value: 'render' },
                    ]}
                />
            </div>

            <Input
                className="w-full"
                placeholder={viewConfig[view].placeholder}
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
            />
            
            <div className="space-y-2">
                {filteredItems.configured.map(renderItem)}
                
                {filteredItems.unconfigured.length > 0 && filteredItems.configured.length > 0 && (
                     <hr className="border-slate-700 my-4"/>
                )}

                {view === 'play_animation' && filteredItems.unconfigured.map(id => renderUnconfiguredItem(id, id))}
                {view === 'hide_element' && filteredItems.unconfigured.map(id => renderUnconfiguredItem(id, id))}
                {view === 'render' && filteredItems.unconfigured.map(id => renderUnconfiguredItem(id, renderSettings.get(id)?.name ?? id))}
                
                {!hasAnyContent && (
                    <div className="flex flex-col items-center justify-center h-24 bg-slate-800/50 rounded-lg p-8 text-slate-500 ring-1 ring-slate-700">
                        <p className="text-center font-medium">{filter ? `No results for "${filter}"` : viewConfig[view].emptyText}</p>
                    </div>
                )}
            </div>

            <ConfirmationDialog 
                open={!!deletingId}
                onCancel={() => setDeletingId(null)}
                onConfirm={handleDeleteConfirm}
                title="Delete Setting?"
                message={<>Are you sure you want to delete this setting? This action cannot be undone.</>}
                variant="danger"
                confirmText="Delete"
            />
        </div>
    );
}