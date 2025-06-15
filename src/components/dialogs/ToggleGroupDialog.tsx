// src/components/dialogs/ToggleGroupDialog.tsx
import React, { useState, useEffect } from 'react';
import type { Avatar, ToggleGroup, ToggleGroupOption, UUID, AnimationCondition, ConditionalSetting } from '../../types';
import { useAvatarStore } from '../../store/avatarStore';
import { generateUUID } from '../../utils/uuid';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Dialog, DialogHeader, DialogContent, DialogFooter } from '../ui/Dialog';
import { FormRow } from '../ui/FormRow';
import { ConfirmationDialog, UsageWarningDialog } from '../ui/ConfirmationDialog';
import { TrashIcon, PlusIcon } from '../ui/icons';

// --- Helper functions for robust usage checking ---

function getSettingName(setting: ConditionalSetting): string {
    switch (setting.kind) {
        case 'play_animation': return `the "Play Animation: ${setting.animation}" setting`;
        case 'hide_element': return `the "Hide Element: ${setting.element}" setting`;
        case 'hide_player': return `the "Hide Player" setting`;
    }
}

function checkAnimationCondition(condition: AnimationCondition | undefined, toggleGroupUUID: UUID, settingName: string): string[] {
    const usages: string[] = [];
    if (!condition) return usages;
    
    function traverse(cond: AnimationCondition) {
        if (!cond) return;
        switch (cond.kind) {
            case 'and':
            case 'or':
                cond.conditions.forEach(traverse);
                break;
            case 'not':
                if (cond.condition) traverse(cond.condition);
                break;
            case 'toggleGroup':
                if (cond.toggleGroup === toggleGroupUUID) {
                    usages.push(`the activation condition of ${settingName}`);
                }
                break;
            default:
                break;
        }
    }
    
    traverse(condition);
    return usages;
}

function findToggleGroupUsage(avatar: Avatar, toggleGroupUUID: UUID): string[] {
    const usages: string[] = [];

    // Check Action Wheels
    for (const wheel of Object.values(avatar.actionWheels ?? {})) {
        for (const action of wheel.actions) {
            if (action.effect?.kind === 'toggle' && action.effect.toggleGroup === toggleGroupUUID) {
                usages.push(`the action "${action.label}" in wheel "${wheel.title}"`);
            }
        }
    }

    // Check Animation Settings
    for (const setting of Object.values(avatar.conditionalSettings ?? {})) {
        usages.push(...checkAnimationCondition(setting.activationCondition, toggleGroupUUID, getSettingName(setting)));
    }
    
    return [...new Set(usages)];
}

interface ToggleGroupDialogProps {
    groupToEdit: ToggleGroup | null;
    onClose: () => void;
    onSave: (uuid: UUID) => void;
}

export function ToggleGroupDialog({ groupToEdit, onClose, onSave }: ToggleGroupDialogProps) {
    const { avatar, updateAvatar } = useAvatarStore();
    const [name, setName] = useState('');
    const [options, setOptions] = useState<{ uuid: UUID; name: string }[]>([]);
    const [nameError, setNameError] = useState('');
    const [optionsError, setOptionsError] = useState('');
    const [dialogState, setDialogState] = useState<'idle' | 'confirmingDelete' | 'showingUsage'>('idle');
    const [usages, setUsages] = useState<string[]>([]);
    
    
    useEffect(() => {
        if (groupToEdit) {
            setName(groupToEdit.name);
            setOptions(Object.entries(groupToEdit.options).map(([uuid, option]) => ({ uuid: uuid as UUID, name: option.name })));
        } else {
            setName('New Toggle Group');
            setOptions([{ uuid: generateUUID(), name: 'Option 1' }]);
        }
        setNameError('');
        setOptionsError('');
    }, [groupToEdit]);

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...options];
        newOptions[index] = { ...newOptions[index], name: value };
        setOptions(newOptions);
    };

    const addOption = () => {
        setOptions([...options, { uuid: generateUUID(), name: `Option ${options.length + 1}` }]);
    };

    const removeOption = (index: number) => {
        if (options.length > 1) {
            setOptions(options.filter((_, i) => i !== index));
        } else {
            setOptionsError("A group must have at least one option.");
        }
    };

    const validate = (): boolean => {
        let isValid = true;
        setNameError('');
        setOptionsError('');

        if (!name.trim()) {
            setNameError('Group name cannot be empty.');
            isValid = false;
        }

        if (options.some(opt => !opt.name.trim())) {
            setOptionsError('Option names cannot be empty.');
            isValid = false;
        } else if (new Set(options.map(o => o.name.trim())).size !== options.length) {
            setOptionsError('Option names must be unique.');
            isValid = false;
        }
        return isValid;
    };

    const handleSave = () => {
        if (!validate()) return;
        
        const newUUID = groupToEdit?.uuid ?? generateUUID();
        const optionsRecord: Record<UUID, ToggleGroupOption> = {};
        for (const opt of options) {
            optionsRecord[opt.uuid] = { name: opt.name.trim() };
        }

        const newGroup: ToggleGroup = {
            uuid: newUUID,
            name: name.trim(),
            options: optionsRecord,
        };

        updateAvatar(draft => {
            draft.toggleGroups[newGroup.uuid] = newGroup;
        });

        onSave(newGroup.uuid);
        onClose();
    };

    const handleDeleteRequest = () => {
        if (!groupToEdit || !avatar) return;
        const currentUsages = findToggleGroupUsage(avatar, groupToEdit.uuid);
        if (currentUsages.length > 0) {
            setUsages(currentUsages);
            setDialogState('showingUsage');
        } else {
            setDialogState('confirmingDelete');
        }
    };

    const confirmDelete = () => {
        if (!groupToEdit) return;
        updateAvatar(draft => { delete draft.toggleGroups[groupToEdit.uuid]; });
        setDialogState('idle');
        onClose();
    };

    return (
        <>
            <Dialog open={dialogState === 'idle'} onClose={onClose}>
                <DialogHeader>{groupToEdit ? 'Edit Toggle Group' : 'Create Toggle Group'}</DialogHeader>
                <DialogContent>
                    <FormRow label="Group Name">
                        <div>
                            <Input value={name} onChange={e => setName(e.target.value)} />
                            {nameError && <p className="text-red-500 text-xs mt-1">{nameError}</p>}
                        </div>
                    </FormRow>
                    <FormRow label="Options"><div/></FormRow>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2 -mt-2">
                        {options.map((option, i) => (
                            <div key={option.uuid} className="flex gap-2 items-center">
                                <Input value={option.name} onChange={e => handleOptionChange(i, e.target.value)} />
                                <Button onClick={() => removeOption(i)} disabled={options.length <= 1} className="bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 w-9 h-9 p-0 flex-shrink-0"><TrashIcon className="w-5 h-5"/></Button>
                            </div>
                        ))}
                    </div>
                    {optionsError && <p className="text-red-500 text-xs mt-1">{optionsError}</p>}
                    <Button onClick={addOption} className="bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 w-full mt-2"><PlusIcon className="w-5 h-5 mr-2" />Add Option</Button>
                </DialogContent>
                <DialogFooter>
                    {groupToEdit && <Button onClick={handleDeleteRequest} className="bg-rose-600 hover:bg-rose-500 mr-auto">Delete Group</Button>}
                    <Button onClick={onClose} className="bg-slate-600 hover:bg-slate-500">Cancel</Button>
                    <Button onClick={handleSave} className="bg-violet-600 hover:bg-violet-500">Save Group</Button>
                </DialogFooter>
            </Dialog>

            <UsageWarningDialog open={dialogState === 'showingUsage'} onClose={() => setDialogState('idle')} title="Cannot Delete Group" usages={usages} />
            <ConfirmationDialog open={dialogState === 'confirmingDelete'} onCancel={() => setDialogState('idle')} onConfirm={confirmDelete} title="Delete Toggle Group?" message={<>Are you sure you want to delete the <strong>"{groupToEdit?.name}"</strong> group? This action is permanent.</>} variant="danger" confirmText="Delete" />
        </>
    );
}