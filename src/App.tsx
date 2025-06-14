import React from "react";
import type { UUID, ActionWheel, ToggleGroup } from "./types";
import { useAvatar } from "./hooks/useAvatar";
import { generateUUID } from "./utils/uuid";
import "./index.css";

// UI Components
import { Button } from "./components/ui/Button";
import { Section } from "./components/ui/Section";

// Editor Components
import { ToggleGroupEditor } from "./components/editors/ToggleGroupEditor";
import { AnimationSettingEditor } from "./components/editors/AnimationSettingEditor";
import { ActionWheelsManager } from "./components/managers/ActionWheelsManager";

export function App() {
  const { avatar, loading, error, isSaving, handleSave, updateAvatar } = useAvatar();

  const addToggleGroup = () => {
    updateAvatar((draft) => {
      const newGroup: ToggleGroup = {
        uuid: generateUUID(),
        name: "New Toggle Group",
        options: ["Default"],
      };
      draft.toggleGroups[newGroup.uuid] = newGroup;
    });
  };

  const deleteToggleGroup = (uuid: UUID) => {
    if (avatar) {
        let usage = "";
        for (const wheel of Object.values(avatar.actionWheels ?? {})) {
            for (const action of wheel.actions) {
                if (action.effect.kind === "toggle" && action.effect.toggleGroup === uuid) {
                    usage = `an action in "${wheel.title}"`;
                    break;
                }
            }
        }
        // A more robust check for animation conditions would go here
        if (usage) {
             alert(`Cannot delete. Toggle group is in use in ${usage}.`);
             return;
        }
    }

    if (window.confirm("Are you sure you want to delete this toggle group?")) {
      updateAvatar((draft) => {
        delete draft.toggleGroups[uuid];
      });
    }
  };

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
    <div className="container mx-auto p-4 md:p-8 text-white bg-gray-900 min-h-screen font-sans">
      <header className="flex justify-between items-center mb-8 sticky top-0 z-20 bg-gray-900/80 backdrop-blur-sm py-4 px-2 -mx-2">
        <h1 className="text-2xl md:text-4xl font-bold">Avatar Editor</h1>
        <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-base py-2 px-6">
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </header>

      <main>
        <Section 
            title="Toggle Groups"
            headerControls={<Button onClick={addToggleGroup} className="bg-blue-600 hover:bg-blue-700">+ Add Group</Button>}
        >
          {allToggleGroups.map((group) => (
            <ToggleGroupEditor
              key={group.uuid}
              group={group}
              updateGroup={(updatedGroup) => updateAvatar((draft) => { draft.toggleGroups[updatedGroup.uuid] = updatedGroup; })}
              deleteGroup={() => deleteToggleGroup(group.uuid)}
            />
          ))}
          {allToggleGroups.length === 0 && <p className="text-gray-400 text-center py-4">No toggle groups. Add one to get started.</p>}
        </Section>

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
          {avatar.animations.map((animId) => {
            const setting = avatar.animationSettings[animId];
            if (!setting) return (<div key={animId} className="text-red-400">Error: Missing setting for {animId}</div>);
            return (
              <AnimationSettingEditor
                key={animId}
                animId={animId}
                setting={setting}
                updateSetting={(updatedSetting) => updateAvatar((draft) => { draft.animationSettings[animId] = updatedSetting; })}
                allToggleGroups={allToggleGroups}
              />
            );
          })}
        </Section>
      </main>
    </div>
  );
}

export default App;