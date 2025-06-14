import React from "react";
import type { Action, ActionEffect, ActionWheel, ToggleGroup, UUID } from "../../types";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { FormRow } from "../ui/FormRow";
import { Card } from "../ui/Card";

// Helper for color conversion
const rgbToHex = (r: number, g: number, b: number): string => {
    return "#" + [r, g, b].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
};

const hexToRgb = (hex: string): [number, number, number] | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : null;
};


function ActionEffectEditor({ effect, updateEffect, allToggleGroups, allActionWheels }: {
  effect: ActionEffect;
  updateEffect: (e: ActionEffect) => void;
  allToggleGroups: ToggleGroup[];
  allActionWheels: ActionWheel[];
}) {
  const handleKindChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const kind = e.target.value as ActionEffect['kind'];
    if (kind === 'toggle') {
      const firstGroup = allToggleGroups[0];
      updateEffect({ kind, toggleGroup: firstGroup?.uuid ?? '' as UUID, value: firstGroup?.options[0] ?? '' });
    } else {
      updateEffect({ kind: 'switchPage', actionWheel: allActionWheels[0]?.uuid ?? '' as UUID });
    }
  };

  const selectedToggleGroup = allToggleGroups.find(g => g.uuid === (effect.kind === 'toggle' ? effect.toggleGroup : ''));

  return (
    <div className="space-y-3">
        <FormRow label="Effect Type">
            <Select value={effect.kind} onChange={handleKindChange}>
                <option value="toggle">Toggle an Option</option>
                <option value="switchPage">Switch Action Wheel</option>
            </Select>
        </FormRow>

        {effect.kind === 'toggle' && (
            <>
                <FormRow label="Toggle Group">
                    <Select
                        value={effect.toggleGroup}
                        onChange={(e) => {
                            const newGroup = allToggleGroups.find(g => g.uuid === e.target.value);
                            updateEffect({ ...effect, toggleGroup: e.target.value as UUID, value: newGroup?.options[0] ?? '' });
                        }}
                        disabled={allToggleGroups.length === 0}
                    >
                        {allToggleGroups.map(g => <option key={g.uuid} value={g.uuid}>{g.name}</option>)}
                    </Select>
                </FormRow>
                <FormRow label="Value">
                    <Select
                        value={effect.value}
                        onChange={(e) => updateEffect({ ...effect, value: e.target.value })}
                        disabled={!selectedToggleGroup}
                    >
                        {selectedToggleGroup?.options.map(o => <option key={o} value={o}>{o}</option>)}
                    </Select>
                </FormRow>
            </>
        )}

        {effect.kind === 'switchPage' && (
            <FormRow label="Target Wheel">
                <Select
                    value={effect.actionWheel}
                    onChange={(e) => updateEffect({ ...effect, actionWheel: e.target.value as UUID })}
                    disabled={allActionWheels.length === 0}
                >
                    {allActionWheels.map(w => <option key={w.uuid} value={w.uuid}>{w.title}</option>)}
                </Select>
            </FormRow>
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

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rgb = hexToRgb(e.target.value);
    if (rgb) {
      updateAction({ ...action, color: rgb });
    }
  };
  
  const hexColor = rgbToHex(...action.color);

  return (
    <Card
        title={`Edit Action: ${action.icon}`}
        controls={<Button onClick={deleteAction} className="bg-red-600 hover:bg-red-700">Delete Action</Button>}
    >
        <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-300 border-b border-gray-600 pb-2">Appearance</h4>
            <FormRow label="Icon">
                <Input 
                    type="text" 
                    placeholder="e.g., ❓ or a texture path" 
                    value={action.icon} 
                    onChange={e => updateAction({ ...action, icon: e.target.value })} 
                    maxLength={2}
                />
            </FormRow>
            <FormRow label="Color">
                <div className="flex items-center gap-2">
                    <Input
                        type="color"
                        value={hexColor}
                        onChange={handleColorChange}
                        className="p-0 h-10 w-10"
                    />
                    <span className="text-gray-400 font-mono">{hexColor.toUpperCase()}</span>
                </div>
            </FormRow>

            <h4 className="text-lg font-semibold text-gray-300 border-b border-gray-600 pb-2 pt-4">Effect</h4>
            <ActionEffectEditor
                effect={action.effect}
                updateEffect={effect => updateAction({ ...action, effect })}
                allToggleGroups={allToggleGroups}
                allActionWheels={allActionWheels}
            />
        </div>
    </Card>
  );
}