// src/components/editors/ActionEffectEditor.tsx
import React from 'react';
import type { ActionEffect, ActionWheel, ToggleGroup, UUID } from '../../types';
import { FormRow } from '../ui/FormRow';
import { Select } from '../ui/Select';
import { SegmentedControl } from '../ui/SegmentedControl';
import { ToggleGroupControls } from '../shared/ToggleGroupControls';

interface ActionEffectEditorProps {
    effect: ActionEffect;
    updateEffect: (e: ActionEffect) => void;
    allToggleGroups: ToggleGroup[];
    allActionWheels: ActionWheel[];
}

export function ActionEffectEditor({ effect, updateEffect, allToggleGroups, allActionWheels }: ActionEffectEditorProps) {
    const handleKindChange = (kind: ActionEffect['kind']) => {
        if (kind === 'toggle') {
            updateEffect({ kind });
        } else if (kind === 'switchPage') {
            updateEffect({ kind: 'switchPage' });
        }
    };

    const selectedToggleGroup = allToggleGroups.find(g => g.uuid === (effect.kind === 'toggle' ? effect.toggleGroup : undefined));

    return (
        <div className="space-y-4">
            <FormRow label="Effect Type">
                <SegmentedControl
                    value={effect.kind}
                    onChange={handleKindChange}
                    options={[
                        { label: 'Toggle Option', value: 'toggle' },
                        { label: 'Switch Wheel', value: 'switchPage' },
                    ]}
                />
            </FormRow>

            {effect.kind === 'toggle' && (
                <>
                    <FormRow label="Toggle Group">
                        <ToggleGroupControls
                            allToggleGroups={allToggleGroups}
                            selectedGroupUUID={effect.toggleGroup}
                            onGroupChange={(newUUID) => {
                                updateEffect({ ...effect, toggleGroup: newUUID, value: undefined });
                            }}
                        />
                    </FormRow>
                    <FormRow label="Value">
                        <Select
                            value={effect.value ?? ''}
                            onChange={(e) => updateEffect({ ...effect, value: e.target.value ? e.target.value as UUID : undefined })}
                            disabled={!effect.toggleGroup}
                        >
                            <option value="">{effect.toggleGroup ? '-- Select an option --' : '-- First select a group --'}</option>
                            {selectedToggleGroup && Object.entries(selectedToggleGroup.options).map(([uuid, option]) => <option key={uuid} value={uuid}>{option.name}</option>)}
                        </Select>
                    </FormRow>
                </>
            )}

            {effect.kind === 'switchPage' && (
                <FormRow label="Target Wheel">
                    <Select
                        value={effect.actionWheel ?? ''}
                        onChange={(e) => updateEffect({ ...effect, actionWheel: e.target.value ? e.target.value as UUID : undefined })}
                        disabled={allActionWheels.length === 0}
                    >
                        <option value="">-- Select a wheel --</option>
                        {allActionWheels.map(w => <option key={w.uuid} value={w.uuid}>{w.title}</option>)}
                    </Select>
                </FormRow>
            )}
        </div>
    );
}