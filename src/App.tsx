import React from "react";
import type { UUID, ActionWheel, ToggleGroup } from "./types";
import { useAvatar } from "./hooks/useAvatar";
import { generateUUID } from "./utils/uuid";
import "./index.css";

// UI Components
import { Button } from "./components/ui/Button";
import { Select } from "./components/ui/Select";
import { Section } from "./components/ui/Section";
import { FormRow } from "./components/ui/FormRow";

// Editor Components
import { ToggleGroupEditor } from "./components/editors/ToggleGroupEditor";
import { ActionWheelEditor } from "./components/editors/ActionWheelEditor";
import { AnimationSettingEditor } from "./components/editors/AnimationSettingEditor";

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
        const isUsed = JSON.stringify(avatar).includes(uuid);
        if (isUsed && Object.keys(avatar.toggleGroups ?? {}).find(k => k === uuid)) {
            let usage = "";
            for (const wheel of Object.values(avatar.actionWheels ?? {})) {
                for (const action of wheel.actions) {
                    if (action.effect.kind === "toggle" && action.effect.toggleGroup === uuid) {
                        usage = `Action wheel "${wheel.title}"`;
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
        title: "New Action Wheel",
        actions: [],
      };
      draft.actionWheels[newWheel.uuid] = newWheel;
    });
  };

  const deleteActionWheel = (uuid: UUID) => {
    if (avatar?.mainActionWheel === uuid) {
      alert("Cannot delete the main action wheel.");
      return;
    }
    // A more robust check for usage in other wheels would be needed for a real app
    if (window.confirm("Are you sure you want to delete this action wheel?")) {
      updateAvatar((draft) => {
        delete draft.actionWheels[uuid];
      });
    }
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
        <Section title="General Settings">
          <FormRow label="Main Action Wheel">
            <Select value={avatar.mainActionWheel} onChange={(e) => updateAvatar((draft) => { draft.mainActionWheel = e.target.value as UUID; })}>
              {allActionWheels.map((w) => (<option key={w.uuid} value={w.uuid}>{w.title}</option>))}
            </Select>
          </FormRow>
        </Section>

        <Section title="Toggle Groups">
          {allToggleGroups.map((group) => (
            <ToggleGroupEditor
              key={group.uuid}
              group={group}
              updateGroup={(updatedGroup) => updateAvatar((draft) => { draft.toggleGroups[updatedGroup.uuid] = updatedGroup; })}
              deleteGroup={() => deleteToggleGroup(group.uuid)}
            />
          ))}
          <Button onClick={addToggleGroup} className="bg-blue-600 hover:bg-blue-700 mt-4">+ Add Toggle Group</Button>
        </Section>

        <Section title="Action Wheels">
          {allActionWheels.map((wheel) => (
            <ActionWheelEditor
              key={wheel.uuid}
              wheel={wheel}
              updateWheel={(updatedWheel) => updateAvatar((draft) => { draft.actionWheels[updatedWheel.uuid] = updatedWheel; })}
              deleteWheel={() => deleteActionWheel(wheel.uuid)}
              allToggleGroups={allToggleGroups}
              allActionWheels={allActionWheels}
            />
          ))}
          <Button onClick={addActionWheel} className="bg-blue-600 hover:bg-blue-700 mt-4">+ Add Action Wheel</Button>
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