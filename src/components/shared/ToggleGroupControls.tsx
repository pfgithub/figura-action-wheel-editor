// src/components/shared/ToggleGroupControls.tsx
import React, { useState } from 'react';
import type { ToggleGroup, UUID } from '@/types';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { ToggleGroupDialog } from '@/components/dialogs/ToggleGroupDialog';
import { EditIcon, PlusIcon } from '@/components/ui/icons';

interface ToggleGroupControlsProps {
    allToggleGroups: ToggleGroup[];
    selectedGroupUUID: UUID | undefined;
    onGroupChange: (newUUID: UUID) => void;
}

export function ToggleGroupControls({ allToggleGroups, selectedGroupUUID, onGroupChange }: ToggleGroupControlsProps) {
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
                <div className="relative flex-grow">
                    <Select value={selectedGroupUUID ?? ''} onChange={(e) => onGroupChange(e.target.value as UUID)} disabled={allToggleGroups.length === 0} className="w-full !pr-10">
                        <option value="">-- Choose Group --</option>
                        {allToggleGroups.map(g => <option key={g.uuid} value={g.uuid}>{g.name}</option>)}
                    </Select>
                    {selectedGroupUUID && (
                        <Button onClick={openEditDialog} className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 bg-transparent hover:bg-slate-700">
                            <EditIcon className="w-4 h-4 text-slate-400" />
                        </Button>
                    )}
                </div>
                <Button onClick={openCreateDialog} className="bg-violet-600 hover:bg-violet-500 flex-shrink-0 w-10 h-10 p-0">
                    <PlusIcon className="w-5 h-5" />
                    <span className="sr-only">New Group</span>
                </Button>
            </div>
            {isDialogOpen && <ToggleGroupDialog groupToEdit={groupToEdit} onClose={() => setDialogOpen(false)} onSave={handleSave}/>}
        </>
    );
}