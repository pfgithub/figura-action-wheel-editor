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
                 <Button onClick={() => handleOpenDialog(null)} className="bg-blue-600 hover:bg-blue-700">+ Add Group</Button>
            </div>
            {allToggleGroups.length === 0 ? (
                 <div className="flex items-center justify-center h-24 bg-gray-800/50 rounded-lg p-8 text-gray-400 border-2 border-dashed border-gray-700">
                    <p className="text-center">No toggle groups found. Add one to get started.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {allToggleGroups.map(group => (
                        <div key={group.uuid} className="bg-gray-900 p-4 rounded-lg flex flex-col sm:flex-row justify-between sm:items-center gap-3 border border-gray-700">
                            <div className="flex-grow min-w-0">
                                <p className="font-semibold text-white text-lg truncate" title={group.name}>{group.name}</p>
                                <p className="text-sm text-gray-400 truncate" title={Object.values(group.options).map(o => o.name).join(', ')}>
                                    {Object.keys(group.options).length} options: {Object.values(group.options).map(o => o.name).join(', ')}
                                </p>
                            </div>
                            <div className="flex gap-2 flex-shrink-0 self-end sm:self-center">
                                <Button onClick={() => handleOpenDialog(group)} className="bg-gray-600 hover:bg-gray-700">Edit</Button>
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
    <div className="container mx-auto p-4 md:p-8 text-white min-h-screen font-sans">
      <header className="flex justify-between items-center mb-8 sticky top-0 z-20 bg-gray-900/80 backdrop-blur-sm py-4 px-2 -mx-2">
        <h1 className="text-2xl md:text-4xl font-bold">Avatar Editor</h1>
        <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-base py-2 px-6">
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </header>

      <main>
        <Section 
            title="Action Wheels"
            headerControls={<Button onClick={addActionWheel} className="bg-blue-600 hover:bg-blue-700">+ Add Wheel</Button>}
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