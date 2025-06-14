import React, { useState, useEffect } from "react";
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
  // State for mobile tab view
  const [activeTab, setActiveTab] = useState('wheels'); // 'wheels' or 'settings'

  // Get temporal state and actions for undo/redo
  const { pastStates, futureStates, undo, redo } = useAvatarStore.temporal.getState()

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
    <div className="text-slate-100 h-screen flex flex-col bg-slate-900" style={{ fontFamily: "'Inter', sans-serif" }}>
      <header className="flex justify-between items-center p-2 px-4 border-b border-slate-800 flex-shrink-0 z-20 bg-slate-900/70 backdrop-blur-lg">
        <h1 className="text-2xl md:text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-500">
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

      <main className="flex-grow min-h-0">
        {/* --- DESKTOP VIEW --- */}
        {/* The original 2-column grid, hidden on small screens */}
        <div className="hidden lg:grid lg:grid-cols-2 h-full">
            {/* Left Column: Action Wheels Editor */}
            <div className="bg-slate-800/40 p-6 flex flex-col gap-4 overflow-y-auto border-r border-slate-800">
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
            <div className="bg-slate-800/40 p-6 flex flex-col gap-4 overflow-y-auto">
               <div className="border-b border-slate-700 pb-3">
                 <h2 className="text-2xl font-bold text-slate-100">Animation Settings</h2>
               </div>
               <AnimationSettingsManager
                    allToggleGroups={allToggleGroups}
               />
            </div>
        </div>

        {/* --- MOBILE VIEW --- */}
        {/* Tab-based layout, hidden on large screens */}
        <div className="lg:hidden flex flex-col h-full">
            {/* Tab Navigation */}
            <div className="flex-shrink-0 flex border-b border-slate-700">
                <button
                    onClick={() => setActiveTab('wheels')}
                    className={`flex-1 p-3 text-center text-sm font-semibold transition-colors duration-200 ${
                        activeTab === 'wheels'
                        ? 'bg-slate-700/80 text-white'
                        : 'bg-transparent text-slate-400 hover:bg-slate-800/60'
                    }`}
                >
                    Action Wheels
                </button>
                <button
                    onClick={() => setActiveTab('settings')}
                    className={`flex-1 p-3 text-center text-sm font-semibold transition-colors duration-200 ${
                        activeTab === 'settings'
                        ? 'bg-slate-700/80 text-white'
                        : 'bg-transparent text-slate-400 hover:bg-slate-800/60'
                    }`}
                >
                    Animation Settings
                </button>
            </div>

            {/* Tab Content */}
            <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-4">
              {activeTab === 'wheels' && (
                <ActionWheelsManager
                  allActionWheels={allActionWheels}
                  allToggleGroups={allToggleGroups}
                  addActionWheel={addActionWheel}
                  viewedWheelUuid={viewedWheelUuid}
                  setViewedWheelUuid={setViewedWheelUuid}
                />
              )}
              {activeTab === 'settings' && (
                <AnimationSettingsManager
                  allToggleGroups={allToggleGroups}
                />
              )}
            </div>
        </div>
      </main>
    </div>
  );
}

export default App;