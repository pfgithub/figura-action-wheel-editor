import React from "react";
import type { UUID, ActionWheel, ToggleGroup } from "./types";
import { useAvatar } from "./hooks/useAvatar";
import { generateUUID } from "./utils/uuid";
import "./index.css";

// UI Components
import { Button } from "./components/ui/Button";
import { Section } from "./components/ui/Section";

// Manager Components
import { ActionWheelsManager } from "./components/managers/ActionWheelsManager";
import { AnimationSettingsManager } from "./components/managers/AnimationSettingsManager";

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
    <div className="container mx-auto p-4 md:p-8 text-white bg-gray-900 min-h-screen font-sans">
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
      </main>
    </div>
  );
}

export default App;