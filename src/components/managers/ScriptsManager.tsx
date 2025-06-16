import React, { useState } from 'react';
import type { Script, ToggleGroup, ActionWheel, UUID } from '@/types';
import { useAvatarStore } from '@/store/avatarStore';
import { scripts as availableScripts } from '@/data/scripts';
import { Button } from '@/components/ui/Button';
import { PlusIcon, TrashIcon } from '@/components/ui/icons';
import { Dialog, DialogHeader, DialogContent, DialogFooter } from '@/components/ui/Dialog';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { ScriptEditor } from '@/components/editors/ScriptEditor';

interface ScriptsManagerProps {
    allToggleGroups: ToggleGroup[];
    allActionWheels: ActionWheel[];
}

export function ScriptsManager({ allToggleGroups, allActionWheels }: ScriptsManagerProps) {
    const { avatar, updateAvatar } = useAvatarStore();
    const [isAddDialogOpen, setAddDialogOpen] = useState(false);
    const [selectedScriptId, setSelectedScriptId] = useState<UUID | null>(null);
    const [deletingScriptId, setDeletingScriptId] = useState<UUID | null>(null);
    
    if (!avatar) return null;

    const configuredScriptIds = Object.keys(avatar.scripts);
    const unconfiguredScripts = Object.values(availableScripts).filter(s => !configuredScriptIds.includes(s.uuid));

    const handleAddScript = (scriptData: (typeof availableScripts)[UUID]) => {
        const newScript: Script = {
            uuid: scriptData.uuid,
            name: scriptData.name,
            data: JSON.parse(JSON.stringify(scriptData)), // Deep copy of script data
            instances: {},
        };
        updateAvatar(draft => {
            draft.scripts[newScript.uuid] = newScript;
        });
        setAddDialogOpen(false);
        setSelectedScriptId(newScript.uuid);
    };

    const handleDeleteScript = () => {
        if (!deletingScriptId) return;
        updateAvatar(draft => {
            delete draft.scripts[deletingScriptId];
        });
        if (selectedScriptId === deletingScriptId) {
            setSelectedScriptId(null);
        }
        setDeletingScriptId(null);
    };

    const selectedScript = selectedScriptId ? avatar.scripts[selectedScriptId] : null;

    return (
        <div className="flex flex-col md:flex-row gap-6 h-full">
            {/* Left Panel: Script List */}
            <div className="md:w-1/3 lg:w-1/4 flex-shrink-0 flex flex-col gap-4">
                 <div className="flex justify-between items-center pb-3 border-b border-slate-700">
                    <h2 className="text-2xl font-bold text-slate-100">Scripts</h2>
                    <Button onClick={() => setAddDialogOpen(true)} className="bg-violet-600 hover:bg-violet-500">
                        <PlusIcon className="w-5 h-5 mr-2" />Add Script
                    </Button>
                </div>
                <div className="space-y-2 flex-grow overflow-y-auto -mr-2 pr-2">
                    {Object.values(avatar.scripts).map(script => (
                        <button
                            key={script.uuid}
                            onClick={() => setSelectedScriptId(script.uuid)}
                            className={`w-full text-left p-3 rounded-lg transition-colors duration-150 ${selectedScriptId === script.uuid ? 'bg-violet-500/20 ring-2 ring-violet-500' : 'bg-slate-800 hover:bg-slate-700'}`}
                        >
                            <h3 className="font-semibold text-slate-100">{script.name}</h3>
                        </button>
                    ))}
                    {Object.keys(avatar.scripts).length === 0 && (
                         <div className="text-center text-slate-500 pt-10">No scripts added.</div>
                    )}
                </div>
            </div>

            {/* Right Panel: Script Editor */}
            <div className="flex-grow bg-slate-800/50 rounded-lg p-4 ring-1 ring-slate-700 overflow-y-auto">
                {selectedScript ? (
                    <div>
                        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-700">
                            <h2 className="text-2xl font-bold text-slate-100">{selectedScript.name}</h2>
                            <Button onClick={() => setDeletingScriptId(selectedScript.uuid)} className="bg-rose-600 hover:bg-rose-500">
                                <TrashIcon className="w-5 h-5 sm:mr-2" />
                                <span className="hidden sm:inline">Delete Script</span>
                            </Button>
                        </div>
                         <ScriptEditor 
                            script={selectedScript} 
                            allToggleGroups={allToggleGroups}
                            allActionWheels={allActionWheels}
                        />
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500">
                         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-16 h-16 mb-4"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                        <h3 className="text-lg font-semibold">Select a script to edit</h3>
                        <p className="text-sm">Choose a script from the list, or add a new one.</p>
                    </div>
                )}
            </div>

            {/* Add Script Dialog */}
            <Dialog open={isAddDialogOpen} onClose={() => setAddDialogOpen(false)} className="max-w-xl">
                <DialogHeader>Add a Script</DialogHeader>
                <DialogContent>
                    <div className="space-y-2 max-h-96 overflow-y-auto -mr-2 pr-2">
                        {unconfiguredScripts.length > 0 ? unconfiguredScripts.map(scriptData => (
                            <div key={scriptData.uuid} className="rounded-lg border border-slate-700 p-3 flex justify-between items-center">
                                <h4 className="font-semibold text-slate-200">{scriptData.name}</h4>
                                <Button onClick={() => handleAddScript(scriptData)} className="bg-violet-600 hover:bg-violet-500"><PlusIcon className="w-4 h-4 mr-2" />Add</Button>
                            </div>
                        )) : (
                            <div className="text-center text-slate-400 p-8">All available scripts have been added.</div>
                        )}
                    </div>
                </DialogContent>
                <DialogFooter>
                    <Button onClick={() => setAddDialogOpen(false)} className="bg-slate-600 hover:bg-slate-500">Cancel</Button>
                </DialogFooter>
            </Dialog>

            <ConfirmationDialog 
                open={!!deletingScriptId}
                onCancel={() => setDeletingScriptId(null)}
                onConfirm={handleDeleteScript}
                title="Delete Script?"
                message={<>Are you sure you want to delete this script and all its instances? This action is permanent.</>}
                variant="danger"
                confirmText="Delete"
            />
        </div>
    );
}