// src/components/editors/ActionEffectEditor.tsx
import React from 'react';
import type { ActionEffect, ActionWheel, Script, ScriptDataInstanceType, ScriptInstance, ToggleGroup, UUID } from '@/types';
import { FormRow } from '@/components/ui/FormRow';
import { Select } from '@/components/ui/Select';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { ToggleGroupControls } from '@/components/shared/ToggleGroupControls';

interface ActionEffectEditorProps {
    effect?: ActionEffect;
    updateEffect: (e: ActionEffect | undefined) => void;
    allToggleGroups: ToggleGroup[];
    allActionWheels: ActionWheel[];
    allScripts: Record<UUID, Script>;
}

export function ActionEffectEditor({ effect, updateEffect, allToggleGroups, allActionWheels, allScripts }: ActionEffectEditorProps) {
    const handleKindChange = (kind: ActionEffect['kind'] | undefined) => {
        if (kind === 'toggle') {
            updateEffect({ kind });
        } else if (kind === 'switchPage') {
            updateEffect({ kind: 'switchPage' });
        } else if (kind === 'switchPageScript') {
            updateEffect({ kind: 'switchPageScript' });
        } else {
            updateEffect(undefined);
        }
    };
    
    const allScriptInstances = React.useMemo(() => {
        const instances: { instance: ScriptInstance, script: Script, type: ScriptDataInstanceType }[] = [];
        Object.values(allScripts).forEach(script => {
            Object.entries(script.instances).forEach(([typeUuid, insts]) => {
                const type = script.data.instanceTypes[typeUuid as UUID];
                if (type?.defines?.actionWheels && Object.keys(type.defines.actionWheels).length > 0) {
                    insts.forEach(instance => instances.push({ instance, script, type }));
                }
            });
        });
        return instances;
    }, [allScripts]);

    const selectedToggleGroup = allToggleGroups.find(g => g.uuid === (effect?.kind === 'toggle' ? effect.toggleGroup : undefined));
    const selectedScriptInstanceData = allScriptInstances.find(i => i.instance.uuid === (effect?.kind === 'switchPageScript' ? effect.scriptInstance : undefined));
    const availableScriptWheels = selectedScriptInstanceData ? Object.values(selectedScriptInstanceData.type.defines.actionWheels) : [];

    return (
        <div className="space-y-4">
            <FormRow label="Effect Type">
                <SegmentedControl
                    value={effect?.kind}
                    onChange={handleKindChange}
                    options={[
                        { label: 'None', value: undefined },
                        { label: 'Toggle Option', value: 'toggle' },
                        { label: 'Switch Wheel', value: 'switchPage' },
                        { label: 'Script Wheel', value: 'switchPageScript' },
                    ]}
                />
            </FormRow>

            {effect?.kind === 'toggle' && (
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

            {effect?.kind === 'switchPage' && (
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
            
            {effect?.kind === 'switchPageScript' && (
                <>
                    <FormRow label="Script Instance">
                        <Select
                            value={effect.scriptInstance ?? ''}
                            onChange={(e) => updateEffect({ ...effect, scriptInstance: e.target.value ? e.target.value as UUID : undefined, scriptActionWheel: undefined })}
                            disabled={allScriptInstances.length === 0}
                        >
                            <option value="">{allScriptInstances.length > 0 ? '-- Select an instance --' : '-- No instances provide wheels --'}</option>
                            {allScriptInstances.map(({ instance, script }) => (
                                <option key={instance.uuid} value={instance.uuid}>{script.name} - {instance.name}</option>
                            ))}
                        </Select>
                    </FormRow>
                    <FormRow label="Target Wheel">
                        <Select
                            value={effect.scriptActionWheel ?? ''}
                            onChange={(e) => updateEffect({ ...effect, scriptActionWheel: e.target.value ? e.target.value as UUID : undefined })}
                            disabled={!effect.scriptInstance}
                        >
                            <option value="">{effect.scriptInstance ? '-- Select a wheel --' : '-- First select an instance --'}</option>
                            {availableScriptWheels.map(w => (
                                <option key={w.uuid} value={w.uuid}>{w.name}</option>
                            ))}
                        </Select>
                    </FormRow>
                </>
            )}
        </div>
    );
}