import React, { useState, useEffect } from 'react';
import type { Avatar, ToggleGroup, UUID } from '../../types';
import type { UpdateAvatarFn } from '../../hooks/useAvatar';
import { generateUUID } from '../../utils/uuid';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Dialog, DialogHeader, DialogContent, DialogFooter } from '../ui/Dialog';
import { FormRow } from '../ui/FormRow';

interface ToggleGroupDialogProps {
    groupToEdit: ToggleGroup | null;
    avatar: Avatar;
    updateAvatar: UpdateAvatarFn;
    onClose: () => void;
    onSave: (uuid: UUID) => void;
}

export function ToggleGroupDialog({ groupToEdit, avatar, updateAvatar, onClose, onSave }: ToggleGroupDialogProps) {
    const [name, setName] = useState('');
    const [options, setOptions] = useState<string[]>([]);
    const [nameError, setNameError] = useState('');
    const [optionsError, setOptionsError] = useState('');

    useEffect(() => {
        if (groupToEdit) {
            setName(groupToEdit.name);
            setOptions(groupToEdit.options);
        } else {
            setName('New Toggle Group');
            setOptions(['Default']);
        }
        setNameError('');
        setOptionsError('');
    }, [groupToEdit]);

    const handleOptionChange = (index: number, value: string) => {
        const newOptions = [...options];
        newOptions[index] = value;
        setOptions(newOptions);
    };

    const addOption = () => {
        setOptions([...options, `Option ${options.length + 1}`]);
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

        if (options.some(opt => !opt.trim())) {
            setOptionsError('Option names cannot be empty.');
            isValid = false;
        } else if (new Set(options.map(o => o.trim())).size !== options.length) {
            setOptionsError('Option names must be unique.');
            isValid = false;
        }
        return isValid;
    };

    const handleSave = () => {
        if (!validate()) return;
        
        const newUUID = groupToEdit?.uuid ?? generateUUID();
        const newGroup: ToggleGroup = {
            uuid: newUUID,
            name: name.trim(),
            options: options.map(o => o.trim()),
        };

        updateAvatar(draft => {
            draft.toggleGroups[newGroup.uuid] = newGroup;
        });

        onSave(newGroup.uuid);
        onClose();
    };

    const handleDelete = () => {
        if (!groupToEdit) return;

        let usage = "";
        for (const wheel of Object.values(avatar.actionWheels ?? {})) {
            for (const action of wheel.actions) {
                if (action.effect?.kind === "toggle" && action.effect.toggleGroup === groupToEdit.uuid) {
                    usage = `an action in "${wheel.title}"`;
                    break;
                }
            }
            if(usage) break;
        }
        if (!usage) {
            // This is a simplified check. A robust solution would recursively traverse the condition tree.
            for (const setting of Object.values(avatar.animationSettings ?? {})) {
                if (JSON.stringify(setting.activationCondition).includes(groupToEdit.uuid)) {
                    usage = `the animation condition for "${setting.name}"`;
                    break;
                }
            }
        }

        if (usage) {
            alert(`Cannot delete. Toggle group is in use in ${usage}.`);
            return;
        }

        if (window.confirm(`Are you sure you want to delete the "${groupToEdit.name}" group?`)) {
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
                        <div key={i} className="flex gap-2 items-center">
                            <Input value={option} onChange={e => handleOptionChange(i, e.target.value)} aria-label={`Option ${i+1}`} />
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