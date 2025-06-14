import React, { useState, useEffect } from 'react';
import type { Avatar, ToggleGroup, ToggleGroupOption, UUID, AnimationCondition } from '../../types';
import type { UpdateAvatarFn } from '../../hooks/useAvatar';
import { generateUUID } from '../../utils/uuid';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Dialog, DialogHeader, DialogContent, DialogFooter } from '../ui/Dialog';
import { FormRow } from '../ui/FormRow';

// --- Helper functions for robust usage checking ---

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
                    usages.push(`the animation condition for "${settingName}"`);
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
            if (action.effect.kind === 'toggle' && action.effect.toggleGroup === toggleGroupUUID) {
                usages.push(`the action "${action.label}" in wheel "${wheel.title}"`);
            }
        }
    }

    // Check Animation Settings
    for (const setting of Object.values(avatar.animationSettings ?? {})) {
        usages.push(...checkAnimationCondition(setting.activationCondition, toggleGroupUUID, setting.name));
    }
    
    return [...new Set(usages)];
}


interface ToggleGroupDialogProps {
    groupToEdit: ToggleGroup | null;
    avatar: Avatar;
    updateAvatar: UpdateAvatarFn;
    onClose: () => void;
    onSave: (uuid: UUID) => void;
}

export function ToggleGroupDialog({ groupToEdit, avatar, updateAvatar, onClose, onSave }: ToggleGroupDialogProps) {
    const [name, setName] = useState('');
    const [options, setOptions] = useState<{ uuid: UUID; name: string }[]>([]);
    const [nameError, setNameError] = useState('');
    const [optionsError, setOptionsError] = useState('');

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

    const handleDelete = () => {
        if (!groupToEdit) return;

        const usages = findToggleGroupUsage(avatar, groupToEdit.uuid);

        if (usages.length > 0) {
            const usageList = usages.map(u => `• ${u}`).join('\n');
            alert(`Cannot delete. This toggle group is in use.\n\nRemove it from the following locations first:\n${usageList}`);
            return;
        }

        if (window.confirm(`Are you sure you want to delete the "${groupToEdit.name}" group? This action cannot be undone.`)) {
            updateAvatar(draft => {
                delete draft.toggleGroups[groupToEdit.uuid];
            });
            onClose();
        }
    };

    return (
        <Dialog open={true} onClose={onClose}>
            <DialogHeader>{groupToEdit ? 'Edit Toggle Group' : 'Create Toggle Group'}</DialogHeader>
            <DialogContent>
                <FormRow label="Group Name">
                    <div>
                        <Input value={name} onChange={e => setName(e.target.value)} aria-label="Group Name" />
                        {nameError && <p className="text-red-500 text-xs mt-1">{nameError}</p>}
                    </div>
                </FormRow>
                <FormRow label="Options"><div/></FormRow>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2 -mt-2">
                    {options.map((option, i) => (
                        <div key={option.uuid} className="flex gap-2 items-center">
                            <Input value={option.name} onChange={e => handleOptionChange(i, e.target.value)} aria-label={`Option ${i+1}`} />
                            <Button onClick={() => removeOption(i)} disabled={options.length <= 1} className="bg-red-600 hover:bg-red-700 w-8 h-8 flex-shrink-0 flex items-center justify-center p-0">-</Button>
                        </div>
                    ))}
                </div>
                 {optionsError && <p className="text-red-500 text-xs mt-1">{optionsError}</p>}
                <Button onClick={addOption} className="bg-green-600 hover:bg-green-700 w-full">+ Add Option</Button>
            </DialogContent>
            <DialogFooter>
                {groupToEdit && (
                    <Button onClick={handleDelete} className="bg-red-600 hover:bg-red-700 mr-auto">Delete Group</Button>
                )}
                <Button onClick={onClose} className="bg-gray-600 hover:bg-gray-700">Cancel</Button>
                <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">Save Group</Button>
            </DialogFooter>
        </Dialog>
    );
}