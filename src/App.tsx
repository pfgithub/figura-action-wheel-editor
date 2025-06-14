import React, { useState, useEffect } from "react";
import { useStore } from "zustand";
import type { UUID, ActionWheel } from "./types";
import { useAvatarStore } from "./store/avatarStore";
import { generateUUID } from "./utils/uuid";
import "./index.css";

// UI Components
import { Button } from "./components/ui/Button";

// Manager Components
import { ActionWheelsManager } from "./components/managers/ActionWheelsManager";
import { AnimationSettingsManager } from "./components/managers/AnimationSettingsManager";

export function App() {
  const { avatar, loading, error, isSaving, fetchAvatar, saveAvatar, updateAvatar } = useAvatarStore();
  const [viewedWheelUuid, setViewedWheelUuid] = useState<UUID | null>(null);

  // Get temporal state and actions for undo/redo
  const { pastStates, futureStates, undo, redo, clear } = useAvatarStore.temporal.getState()

  // Effect to fetch initial data
  useEffect(() => {
    fetchAvatar();
  }, [fetchAvatar]);

  // Effect to keep viewedWheelUuid in sync with the available wheels
  useEffect(() => {
    if (avatar) {
      const currentWheels = Object.values(avatar.actionWheels);
      const isViewedWheelValid = viewedWheelUuid && avatar.actionWheels[viewedWheelUuid];

      if (!isViewedWheelValid) {
        // If view is invalid (null or points to a deleted wheel), reset it.
        setViewedWheelUuid(avatar.mainActionWheel ?? currentWheels[0]?.uuid ?? null);
      }
    }
  }, [avatar, viewedWheelUuid]);


  const addActionWheel = () => {
    const newWheelUuid = generateUUID();
    updateAvatar((draft) => {
      const newWheel: ActionWheel = {
        uuid: newWheelUuid,
        title: `Wheel ${Object.keys(draft.actionWheels).length + 1}`,
        actions: [],
      };
      draft.actionWheels[newWheel.uuid] = newWheel;
      if (Object.keys(draft.actionWheels).length === 1) {
        draft.mainActionWheel = newWheel.uuid;
      }
    });
    // Set the view to the newly created wheel
    setViewedWheelUuid(newWheelUuid);
  };

  if (loading) return <div className="text-white text-center p-8">Loading...</div>;
  if (error) return <div className="text-red-400 text-center p-8">Error: {error}</div>;
  if (!avatar) return <div className="text-white text-center p-8">No data found.</div>;

  const allToggleGroups = Object.values(avatar.toggleGroups);
  const allActionWheels = Object.values(avatar.actionWheels);

  return (
    <div className="p-4 md:p-8 text-slate-100 min-h-screen" style={{ fontFamily: "'Inter', sans-serif" }}>
      <header className="flex justify-between items-center mb-8 sticky top-0 z-20 bg-slate-900/70 backdrop-blur-lg py-4 px-2 -mx-2 border-b border-slate-800">
        <h1 className="text-3xl md:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-500">
          Avatar Editor
        </h1>
        <div className="flex items-center gap-2">
            <Button onClick={() => undo()} disabled={pastStates.length === 0} className="bg-slate-600 hover:bg-slate-500 focus-visible:ring-slate-400">Undo</Button>
            <Button onClick={() => redo()} disabled={futureStates.length === 0} className="bg-slate-600 hover:bg-slate-500 focus-visible:ring-slate-400">Redo</Button>
            <Button onClick={saveAvatar} disabled={isSaving || pastStates.length === 0} className="bg-violet-600 hover:bg-violet-500 text-base py-2 px-6 focus-visible:ring-violet-400">
              {isSaving ? "Saving..." : "Save"}
            </Button>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Action Wheels Editor */}
        <div className="bg-slate-800/40 p-6 rounded-xl ring-1 ring-slate-700/50 flex flex-col gap-4">
            <div className="border-b border-slate-700 pb-3">
                <h2 className="text-2xl font-bold text-slate-100">Action Wheels</h2>
            </div>
            <ActionWheelsManager
                allActionWheels={allActionWheels}
                allToggleGroups={allToggleGroups}
                addActionWheel={addActionWheel}
                viewedWheelUuid={viewedWheelUuid}
                setViewedWheelUuid={setViewedWheelUuid}
            />
        </div>

        {/* Right Column: Animation Settings */}
        <div className="bg-slate-800/40 p-6 rounded-xl ring-1 ring-slate-700/50 flex flex-col gap-4">
           <div className="border-b border-slate-700 pb-3">
             <h2 className="text-2xl font-bold text-slate-100">Animation Settings</h2>
           </div>
           <AnimationSettingsManager
                allToggleGroups={allToggleGroups}
           />
        </div>
      </main>
    </div>
  );
}

export default App;