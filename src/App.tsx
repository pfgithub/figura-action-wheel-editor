import React, { useState, useEffect, useCallback } from "react";
import type {
  Avatar,
  UUID,
  ActionWheel,
  Action,
  ActionEffect,
  ToggleGroup,
  AnimationSetting,
  AnimationCondition,
  AnimationID
} from "./types";
import "./index.css";

// HELPER FUNCTIONS & TYPES
const generateUUID = (): UUID => crypto.randomUUID() as UUID;

type UpdateAvatarFn = (updater: (draft: Avatar) => void) => void;

// --- UI HELPER COMPONENTS ---

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} className={`bg-gray-700 border border-gray-600 rounded px-2 py-1 w-full text-white ${props.className}`} />
);

const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...props} className={`bg-gray-700 border border-gray-600 rounded px-2 py-1 w-full text-white ${props.className}`} />
);

const Button = ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button {...props} className={`font-bold py-1 px-3 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed ${props.className}`}>
    {children}
  </button>
);

const Card = ({ children, title, controls }: { children: React.ReactNode; title: React.ReactNode; controls?: React.ReactNode }) => (
  <div className="bg-gray-800 p-4 rounded-lg mb-4 border border-gray-700">
    <div className="flex justify-between items-center mb-3">
      <h3 className="text-lg font-semibold">{title}</h3>
      {controls && <div className="flex gap-2">{controls}</div>}
    </div>
    <div className="space-y-3">{children}</div>
  </div>
);

const Section = ({ children, title }: { children: React.ReactNode; title: string }) => (
  <section className="bg-gray-800/50 p-6 rounded-xl mb-8">
    <h2 className="text-2xl font-bold mb-4 border-b border-gray-700 pb-2">{title}</h2>
    {children}
  </section>
);

const FormRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="grid grid-cols-3 gap-4 items-center">
    <label className="text-gray-400 text-sm font-bold col-span-1">{label}</label>
    <div className="col-span-2">{children}</div>
  </div>
);


// --- EDITING COMPONENTS ---

// Animation Condition (Recursive)
function AnimationConditionEditor({ condition, updateCondition, deleteCondition, allToggleGroups }: {
  condition: AnimationCondition;
  updateCondition: (c: AnimationCondition) => void;
  deleteCondition: () => void;
  allToggleGroups: ToggleGroup[];
}) {
  const handleKindChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const kind = e.target.value as AnimationCondition['kind'];
    let newCondition: AnimationCondition;
    if (kind === 'and' || kind === 'or') {
      newCondition = { kind, conditions: [] };
    } else if (kind === 'not') {
      newCondition = { kind };
    } else if (kind === 'toggleGroup') {
      newCondition = { kind, toggleGroup: allToggleGroups[0]?.uuid ?? '' as UUID, value: allToggleGroups[0]?.options[0] ?? '' };
    } else if (kind === 'player') { // player
      newCondition = { kind: 'player', player: 'walking' };
    } else { // empty
      newCondition = { kind: 'empty' };
    }
    updateCondition(newCondition);
  };

  const renderConditionBody = () => {
    switch (condition.kind) {
      case 'empty': return null;
      case 'and':
      case 'or':
        return (
          <div className="pl-4 border-l-2 border-gray-600 space-y-2">
            {condition.conditions.map((cond, i) => (
              <AnimationConditionEditor
                key={i}
                condition={cond}
                updateCondition={(newCond) => {
                  const newConditions = [...condition.conditions];
                  newConditions[i] = newCond;
                  updateCondition({ ...condition, conditions: newConditions });
                }}
                deleteCondition={() => {
                  const newConditions = condition.conditions.filter((_, idx) => idx !== i);
                  updateCondition({ ...condition, conditions: newConditions });
                }}
                allToggleGroups={allToggleGroups}
              />
            ))}
            <Button
              onClick={() => {
                const newConditions = [...condition.conditions, { kind: 'empty' } as AnimationCondition];
                updateCondition({ ...condition, conditions: newConditions });
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              + Add Condition
            </Button>
          </div>
        );
      case 'not':
        return (
          <div className="pl-4 border-l-2 border-gray-600">
            {
              condition.condition ?
              <AnimationConditionEditor
                condition={condition.condition}
                updateCondition={(newCond) => updateCondition({ ...condition, condition: newCond })}
                deleteCondition={() => updateCondition({ ...condition, condition: {kind: "empty"} })}
                allToggleGroups={allToggleGroups}
              /> : 
              <Button
                onClick={() => updateCondition({ ...condition, condition: {kind: "empty"} })}
                className="bg-green-600 hover:bg-green-700"
              >
                + Add Condition
              </Button>
            }
          </div>
        );
      case 'toggleGroup': {
        const selectedGroup = allToggleGroups.find(g => g.uuid === condition.toggleGroup);
        return (
          <div className="flex gap-2">
            <Select
              value={condition.toggleGroup}
              onChange={(e) => updateCondition({ ...condition, toggleGroup: e.target.value as UUID, value: '' })}
              disabled={allToggleGroups.length === 0}
            >
              {allToggleGroups.map(g => <option key={g.uuid} value={g.uuid}>{g.name}</option>)}
            </Select>
            <Select
              value={condition.value}
              onChange={(e) => updateCondition({ ...condition, value: e.target.value })}
              disabled={!selectedGroup}
            >
              {selectedGroup?.options.map(o => <option key={o} value={o}>{o}</option>)}
            </Select>
          </div>
        );
      }
      case 'player':
        return (
          <Select value={condition.player} onChange={(e) => updateCondition({ ...condition, player: e.target.value as any })}>
            {["crouching", "sprinting", "blocking", "fishing", "sleeping", "swimming", "flying", "walking"].map(p => <option key={p} value={p}>{p}</option>)}
          </Select>
        );
      default: return null;
    }
  };

  return (
    <div className="bg-gray-700/50 p-2 rounded border border-gray-600">
      <div className="flex gap-2 items-center mb-2">
        <Select value={condition.kind} onChange={handleKindChange} className="w-auto flex-grow">
          <option value="empty">Choose</option>
          <option value="and">AND</option>
          <option value="or">OR</option>
          <option value="not">NOT</option>
          <option value="toggleGroup">Toggle Group</option>
          <option value="player">Player State</option>
        </Select>
        <Button onClick={deleteCondition} className="bg-red-600 hover:bg-red-700">✕</Button>
      </div>
      {renderConditionBody()}
    </div>
  );
}

// Animation Setting
function AnimationSettingEditor({ animId, setting, updateSetting, allToggleGroups }: {
  animId: AnimationID;
  setting: AnimationSetting;
  updateSetting: (s: AnimationSetting) => void;
  allToggleGroups: ToggleGroup[];
}) {
  return (
    <Card title={animId}>
      <FormRow label="Display Name">
        <Input
          type="text"
          value={setting.name}
          onChange={(e) => updateSetting({ ...setting, name: e.target.value })}
        />
      </FormRow>
      <FormRow label="Activation Condition">
        <div />
      </FormRow>
      {
        setting.activationCondition ? 
        <AnimationConditionEditor
          condition={setting.activationCondition}
          updateCondition={(newCond) => updateSetting({ ...setting, activationCondition: newCond })}
          deleteCondition={() => updateSetting({ ...setting, activationCondition: undefined })}
          allToggleGroups={allToggleGroups}
        /> : 
        <Button
          onClick={() => updateSetting({ ...setting, activationCondition: {kind: "empty"} })}
          className="bg-green-600 hover:bg-green-700"
        >
          + Add Condition
        </Button>
      }
    </Card>
  );
}


// Action Effect
function ActionEffectEditor({ effect, updateEffect, allToggleGroups, allActionWheels }: {
  effect: ActionEffect;
  updateEffect: (e: ActionEffect) => void;
  allToggleGroups: ToggleGroup[];
  allActionWheels: ActionWheel[];
}) {
  const handleKindChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const kind = e.target.value as ActionEffect['kind'];
    if (kind === 'toggle') {
      updateEffect({ kind, toggleGroup: allToggleGroups[0]?.uuid ?? '' as UUID, value: allToggleGroups[0]?.options[0] ?? '' });
    } else { // switchPage
      updateEffect({ kind, actionWheel: allActionWheels[0]?.uuid ?? '' as UUID });
    }
  };

  return (
    <div className="flex gap-2">
      <Select value={effect.kind} onChange={handleKindChange}>
        <option value="toggle">Toggle</option>
        <option value="switchPage">Switch Page</option>
      </Select>
      {effect.kind === 'toggle' && (
        <>
          <Select
            value={effect.toggleGroup}
            onChange={(e) => updateEffect({ ...effect, toggleGroup: e.target.value as UUID, value: '' })}
            disabled={allToggleGroups.length === 0}
          >
            {allToggleGroups.map(g => <option key={g.uuid} value={g.uuid}>{g.name}</option>)}
          </Select>
          <Select
            value={effect.value}
            onChange={(e) => updateEffect({ ...effect, value: e.target.value })}
            disabled={!allToggleGroups.find(g => g.uuid === effect.toggleGroup)}
          >
            {allToggleGroups.find(g => g.uuid === effect.toggleGroup)?.options.map(o => <option key={o} value={o}>{o}</option>)}
          </Select>
        </>
      )}
      {effect.kind === 'switchPage' && (
        <Select
          value={effect.actionWheel}
          onChange={(e) => updateEffect({ ...effect, actionWheel: e.target.value as UUID })}
          disabled={allActionWheels.length === 0}
        >
          {allActionWheels.map(w => <option key={w.uuid} value={w.uuid}>{w.title}</option>)}
        </Select>
      )}
    </div>
  );
}

// Action
function ActionEditor({ action, updateAction, deleteAction, allToggleGroups, allActionWheels }: {
  action: Action;
  updateAction: (a: Action) => void;
  deleteAction: () => void;
  allToggleGroups: ToggleGroup[];
  allActionWheels: ActionWheel[];
}) {
  const colorStr = action.color.join(',');
  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parts = e.target.value.split(',').map(p => parseInt(p.trim(), 10)).filter(n => !isNaN(n) && n >= 0 && n <= 255);
    if (parts.length === 3) {
      updateAction({ ...action, color: parts as [number, number, number] });
    }
  };

  return (
    <div className="bg-gray-700/50 p-3 rounded border border-gray-600 grid grid-cols-1 md:grid-cols-3 gap-3">
      <div className="space-y-2 col-span-1">
        <Input type="text" placeholder="Icon (e.g., emoji)" value={action.icon} onChange={e => updateAction({ ...action, icon: e.target.value })} />
        <Input type="text" placeholder="Color (R,G,B)" defaultValue={colorStr} onChange={handleColorChange} />
      </div>
      <div className="col-span-2 space-y-2">
        <ActionEffectEditor
          effect={action.effect}
          updateEffect={effect => updateAction({ ...action, effect })}
          allToggleGroups={allToggleGroups}
          allActionWheels={allActionWheels}
        />
        <div className="text-right">
          <Button onClick={deleteAction} className="bg-red-600 hover:bg-red-700">Delete Action</Button>
        </div>
      </div>
    </div>
  );
}

// Action Wheel
function ActionWheelEditor({ wheel, updateWheel, deleteWheel, allToggleGroups, allActionWheels }: {
  wheel: ActionWheel;
  updateWheel: (w: ActionWheel) => void;
  deleteWheel: () => void;
  allToggleGroups: ToggleGroup[];
  allActionWheels: ActionWheel[];
}) {
  const addAction = () => {
    const newAction: Action = {
      icon: '❓',
      color: [255, 255, 255],
      effect: { kind: 'switchPage', actionWheel: allActionWheels[0]?.uuid ?? '' as UUID },
    };
    updateWheel({ ...wheel, actions: [...wheel.actions, newAction] });
  };

  return (
    <Card
      title={<Input type="text" value={wheel.title} onChange={e => updateWheel({ ...wheel, title: e.target.value })} className="text-lg" />}
      controls={<Button onClick={deleteWheel} className="bg-red-600 hover:bg-red-700">Delete Wheel</Button>}
    >
      <div className="space-y-2">
        {wheel.actions.map((action, i) => (
          <ActionEditor
            key={i}
            action={action}
            updateAction={(newAction) => {
              const newActions = [...wheel.actions];
              newActions[i] = newAction;
              updateWheel({ ...wheel, actions: newActions });
            }}
            deleteAction={() => {
              const newActions = wheel.actions.filter((_, idx) => idx !== i);
              updateWheel({ ...wheel, actions: newActions });
            }}
            allToggleGroups={allToggleGroups}
            allActionWheels={allActionWheels}
          />
        ))}
      </div>
      <Button onClick={addAction} className="bg-green-600 hover:bg-green-700">+ Add Action</Button>
    </Card>
  );
}

// Toggle Group
function ToggleGroupEditor({ group, updateGroup, deleteGroup }: {
  group: ToggleGroup;
  updateGroup: (g: ToggleGroup) => void;
  deleteGroup: () => void;
}) {
  return (
    <Card
      title={<Input type="text" value={group.name} onChange={e => updateGroup({ ...group, name: e.target.value })} className="text-lg" />}
      controls={<Button onClick={deleteGroup} className="bg-red-600 hover:bg-red-700">Delete Group</Button>}
    >
      <FormRow label="Options">
        <div />
      </FormRow>
      <div className="space-y-2">
        {group.options.map((option, i) => (
          <div key={i} className="flex gap-2">
            <Input
              type="text"
              value={option}
              onChange={(e) => {
                const newOptions = [...group.options];
                newOptions[i] = e.target.value;
                updateGroup({ ...group, options: newOptions });
              }}
            />
            <Button
              onClick={() => {
                const newOptions = group.options.filter((_, idx) => idx !== i);
                updateGroup({ ...group, options: newOptions });
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              -
            </Button>
          </div>
        ))}
      </div>
      <Button onClick={() => updateGroup({ ...group, options: [...group.options, `Option ${group.options.length + 1}`] })}
        className="bg-green-600 hover:bg-green-700">+ Add Option</Button>
    </Card>
  );
}

// --- MAIN APP COMPONENT ---

export function App() {
  const [avatar, setAvatar] = useState<Avatar | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch("/project.json")
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => { setAvatar(data); })
      .catch(err => { setError(err.message); })
      .finally(() => { setLoading(false); });
  }, []);

  const handleSave = useCallback(async () => {
    if (!avatar) return;
    setIsSaving(true);
    try {
      const response = await fetch('/project.json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(avatar, null, 2),
      });
      if (!response.ok) throw new Error(`Failed to save: ${response.statusText}`);
      alert('Saved successfully!');
    } catch (err: any) {
      alert(`Error saving: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  }, [avatar]);

  const updateAvatar: UpdateAvatarFn = (updater) => {
    setAvatar(prev => {
      if (!prev) return null;
      const newAvatar = JSON.parse(JSON.stringify(prev));
      updater(newAvatar);
      return newAvatar;
    });
  };

  const addToggleGroup = () => {
    updateAvatar(draft => {
      const newGroup: ToggleGroup = {
        uuid: generateUUID(),
        name: "New Toggle Group",
        options: ["Default"],
      };
      draft.toggleGroups[newGroup.uuid] = newGroup;
    });
  };

  const deleteToggleGroup = (uuid: UUID) => {
    const isUsed = JSON.stringify(avatar).includes(uuid);
    if (isUsed && Object.keys(avatar?.toggleGroups ?? {}).find(k => k === uuid)) {
        let usage = "";
        // Basic check, not exhaustive
        for (const wheel of Object.values(avatar?.actionWheels ?? {})) {
            for (const action of wheel.actions) {
                if (action.effect.kind === "toggle" && action.effect.toggleGroup === uuid) {
                    usage = `Action wheel "${wheel.title}"`;
                    break;
                }
            }
        }
        if (usage) {
             alert(`Cannot delete. Toggle group is in use in ${usage}.`);
             return;
        }
    }

    if (window.confirm("Are you sure you want to delete this toggle group?")) {
      updateAvatar(draft => {
        delete draft.toggleGroups[uuid];
      });
    }
  };

  const addActionWheel = () => {
    updateAvatar(draft => {
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
      updateAvatar(draft => {
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
            <Select
              value={avatar.mainActionWheel}
              onChange={e => updateAvatar(draft => { draft.mainActionWheel = e.target.value as UUID; })}
            >
              {allActionWheels.map(w => <option key={w.uuid} value={w.uuid}>{w.title}</option>)}
            </Select>
          </FormRow>
        </Section>

        <Section title="Toggle Groups">
          {allToggleGroups.map(group => (
            <ToggleGroupEditor
              key={group.uuid}
              group={group}
              updateGroup={updatedGroup => updateAvatar(draft => { draft.toggleGroups[updatedGroup.uuid] = updatedGroup; })}
              deleteGroup={() => deleteToggleGroup(group.uuid)}
            />
          ))}
          <Button onClick={addToggleGroup} className="bg-blue-600 hover:bg-blue-700 mt-4">+ Add Toggle Group</Button>
        </Section>

        <Section title="Action Wheels">
          {allActionWheels.map(wheel => (
            <ActionWheelEditor
              key={wheel.uuid}
              wheel={wheel}
              updateWheel={updatedWheel => updateAvatar(draft => { draft.actionWheels[updatedWheel.uuid] = updatedWheel; })}
              deleteWheel={() => deleteActionWheel(wheel.uuid)}
              allToggleGroups={allToggleGroups}
              allActionWheels={allActionWheels}
            />
          ))}
          <Button onClick={addActionWheel} className="bg-blue-600 hover:bg-blue-700 mt-4">+ Add Action Wheel</Button>
        </Section>

        <Section title="Animation Settings">
          {avatar.animations.map(animId => {
            const setting = avatar.animationSettings[animId];
            if (!setting) return <div key={animId} className="text-red-400">Error: Missing setting for {animId}</div>;
            return (
              <AnimationSettingEditor
                key={animId}
                animId={animId}
                setting={setting}
                updateSetting={updatedSetting => updateAvatar(draft => { draft.animationSettings[animId] = updatedSetting; })}
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