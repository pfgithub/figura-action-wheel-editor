import React, { useState } from "react";
import type { UUID, ActionWheel, ToggleGroup, Avatar } from "./types";
import { useAvatar } from "./hooks/useAvatar";
import { generateUUID } from "./utils/uuid";
import "./index.css";

// UI Components
import { Button } from "./components/ui/Button";
import { Section } from "./components/ui/Section";
import { ToggleGroupDialog } from "./components/dialogs/ToggleGroupDialog";

// Manager Components
import { ActionWheelsManager } from "./components/managers/ActionWheelsManager";
import { AnimationSettingsManager } from "./components/managers/AnimationSettingsManager";

// --- New Component for Toggle Group Management ---
interface ToggleGroupsManagerProps {
    avatar: Avatar;
    updateAvatar: (updater: (draft: Avatar) => void) => void;
}

function ToggleGroupsManager({ avatar, updateAvatar }: ToggleGroupsManagerProps) {
    const [isDialogOpen, setDialogOpen] = useState(false);
    const [groupToEdit, setGroupToEdit] = useState<ToggleGroup | null>(null);

    const allToggleGroups = Object.values(avatar.toggleGroups);

    const handleOpenDialog = (group: ToggleGroup | null) => {
        setGroupToEdit(group);
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setGroupToEdit(null);
    };

    return (
        <div>
             <div className="flex justify-end mb-4">
                 <Button onClick={() => handleOpenDialog(null)} className="bg-violet-600 hover:bg-violet-500 focus-visible:ring-violet-500">+ Add Group</Button>
            </div>
            {allToggleGroups.length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-24 bg-slate-800/50 rounded-lg p-8 text-slate-500 ring-1 ring-slate-700">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 mb-2 text-slate-600"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    <p className="text-center font-medium">No toggle groups found.</p>
                    <p className="text-sm">Add one to get started.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {allToggleGroups.map(group => (
                        <div key={group.uuid} className="bg-slate-800 p-4 rounded-lg flex flex-col sm:flex-row justify-between sm:items-center gap-3 ring-1 ring-slate-700/80 transition-all duration-200 hover:ring-violet-500 hover:shadow-md">
                            <div className="flex-grow min-w-0">
                                <p className="font-semibold text-white text-lg truncate" title={group.name}>{group.name}</p>

                                <p className="text-sm text-slate-400 truncate" title={Object.values(group.options).map(o => o.name).join(', ')}>
                                    {Object.keys(group.options).length} options: {Object.values(group.options).map(o => o.name).join(', ')}
                                </p>
                            </div>
                            <div className="flex gap-2 flex-shrink-0 self-end sm:self-center">
                                <Button onClick={() => handleOpenDialog(group)} className="bg-slate-600 hover:bg-slate-500 focus-visible:ring-slate-400">Edit</Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            {isDialogOpen && (
                <ToggleGroupDialog
                    groupToEdit={groupToEdit}
                    avatar={avatar}
                    updateAvatar={updateAvatar}
                    onClose={handleCloseDialog}
                    onSave={(_) => { handleCloseDialog(); }}
                />
            )}
        </div>
    );
}


export function App() {
  const { avatar, loading, error, isSaving, handleSave, updateAvatar } = useAvatar();

  const addActionWheel = () => {
    updateAvatar((draft) => {
      const newWheel: ActionWheel = {
        uuid: generateUUID(),
        title: `Wheel ${Object.keys(draft.actionWheels).length + 1}`,
        actions: [],
      };
      draft.actionWheels[newWheel.uuid] = newWheel;
      if (Object.keys(draft.actionWheels).length === 1) {
        draft.mainActionWheel = newWheel.uuid;
      }
    });
  };

  if (loading) return <div className="text-white text-center p-8">Loading...</div>;
  if (error) return <div className="text-red-400 text-center p-8">Error: {error}</div>;
  if (!avatar) return <div className="text-white text-center p-8">No data found.</div>;

  const allToggleGroups = Object.values(avatar.toggleGroups);
  const allActionWheels = Object.values(avatar.actionWheels);

  return (
    <div className="container mx-auto p-4 md:p-8 text-slate-100 min-h-screen" style={{ fontFamily: "'Inter', sans-serif" }}>
      <header className="flex justify-between items-center mb-8 sticky top-0 z-20 bg-slate-900/70 backdrop-blur-lg py-4 px-2 -mx-2 border-b border-slate-800">
        <h1 className="text-3xl md:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-500">
          Avatar Editor
        </h1>
        <Button onClick={handleSave} disabled={isSaving} className="bg-violet-600 hover:bg-violet-500 text-base py-2 px-6 focus-visible:ring-violet-400">
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </header>

      <main>
        <Section 
            title="Action Wheels"
            headerControls={<Button onClick={addActionWheel} className="bg-violet-600 hover:bg-violet-500 focus-visible:ring-violet-400">+ Add Wheel</Button>}
        >
          <ActionWheelsManager
            avatar={avatar}
            updateAvatar={updateAvatar}
            allActionWheels={allActionWheels}
            allToggleGroups={allToggleGroups}
          />
        </Section>

        <Section title="Animation Settings">
          <AnimationSettingsManager
            avatar={avatar}
            updateAvatar={updateAvatar}
            allToggleGroups={allToggleGroups}
          />
        </Section>

        <Section title="Toggle Groups">
          <ToggleGroupsManager
            avatar={avatar}
            updateAvatar={updateAvatar}
          />
        </Section>
      </main>
    </div>
  );
}

export default App;