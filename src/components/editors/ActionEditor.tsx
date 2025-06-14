import React from "react";
import type { Action, ActionEffect, ActionWheel, ToggleGroup, UUID } from "../../types";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";

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
    } else {
      updateEffect({ kind: 'switchPage', actionWheel: allActionWheels[0]?.uuid ?? '' as UUID });
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

interface ActionEditorProps {
    action: Action;
    updateAction: (a: Action) => void;
    deleteAction: () => void;
    allToggleGroups: ToggleGroup[];
    allActionWheels: ActionWheel[];
}

export function ActionEditor({ action, updateAction, deleteAction, allToggleGroups, allActionWheels }: ActionEditorProps) {
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