import React, { useState } from 'react';
import type { Avatar, ToggleGroup, UUID } from '../../types';
import type { UpdateAvatarFn } from '../../hooks/useAvatar';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { ToggleGroupDialog } from '../dialogs/ToggleGroupDialog';

interface ToggleGroupControlsProps {
    avatar: Avatar;
    updateAvatar: UpdateAvatarFn;
    allToggleGroups: ToggleGroup[];
    selectedGroupUUID: UUID;
    onGroupChange: (newUUID: UUID) => void;
}

export function ToggleGroupControls({ avatar, updateAvatar, allToggleGroups, selectedGroupUUID, onGroupChange }: ToggleGroupControlsProps) {
    const [isDialogOpen, setDialogOpen] = useState(false);
    const [groupToEdit, setGroupToEdit] = useState<ToggleGroup | null>(null);

    const openCreateDialog = () => {
        setGroupToEdit(null);
        setDialogOpen(true);
    };

    const openEditDialog = () => {
        const group = allToggleGroups.find(g => g.uuid === selectedGroupUUID);
        if (group) {
            setGroupToEdit(group);
            setDialogOpen(true);
        }
    };
    
    const handleSave = (uuid: UUID) => {
        onGroupChange(uuid);
        setDialogOpen(false);
    };

    return (
        <>
            <div className="flex items-center gap-2">
                <Select
                    value={selectedGroupUUID}
                    onChange={(e) => onGroupChange(e.target.value as UUID)}
                    disabled={allToggleGroups.length === 0}
                    className="flex-grow"
                >
                    {allToggleGroups.length === 0 && <option>No groups available</option>}
                    {allToggleGroups.map(g => <option key={g.uuid} value={g.uuid}>{g.name}</option>)}
                </Select>
                <Button onClick={openEditDialog} disabled={!selectedGroupUUID} className="bg-slate-600 hover:bg-slate-500 focus-visible:ring-slate-400 flex-shrink-0 px-3">Edit</Button>
                <Button onClick={openCreateDialog} className="bg-violet-600 hover:bg-violet-500 focus-visible:ring-violet-400 flex-shrink-0 px-3">New</Button>
            </div>
            {isDialogOpen && (
                <ToggleGroupDialog
                    groupToEdit={groupToEdit}
                    avatar={avatar}
                    updateAvatar={updateAvatar}
                    onClose={() => setDialogOpen(false)}
                    onSave={handleSave}
                />
            )}
        </>
    );
}