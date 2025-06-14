import React from "react";
import type { Action, ActionEffect, ActionWheel, ToggleGroup, UUID, Avatar } from "../../types";
import type { UpdateAvatarFn } from "../../hooks/useAvatar";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { FormRow } from "../ui/FormRow";
import { Card } from "../ui/Card";
import { ToggleGroupControls } from "../shared/ToggleGroupControls";

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


function ActionEffectEditor({ effect, updateEffect, allToggleGroups, allActionWheels, avatar, updateAvatar }: {
  effect: ActionEffect;
  updateEffect: (e: ActionEffect) => void;
  allToggleGroups: ToggleGroup[];
  allActionWheels: ActionWheel[];
  avatar: Avatar;
  updateAvatar: UpdateAvatarFn;
}) {
  const handleKindChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const kind = e.target.value as ActionEffect['kind'];
    if (kind === 'toggle') {
      const firstGroup = allToggleGroups[0];
      const firstOptionId = firstGroup ? Object.keys(firstGroup.options)[0] as UUID : undefined;
      updateEffect({ kind, toggleGroup: firstGroup?.uuid ?? '' as UUID, value: (firstOptionId ?? '') as UUID });
    } else if(kind === 'switchPage') {
      updateEffect({ kind: 'switchPage', actionWheel: allActionWheels[0]?.uuid ?? '' as UUID });
    } else {
      updateEffect({ kind: 'none' });
    }
  };

  const selectedToggleGroup = allToggleGroups.find(g => g.uuid === (effect.kind === 'toggle' ? effect.toggleGroup : ''));

  return (
    <div className="space-y-3">
        <FormRow label="Effect Type">
            <Select value={effect.kind} onChange={handleKindChange}>
                <option value="none">Choose an Effect Type</option>
                <option value="toggle">Toggle an Option</option>
                <option value="switchPage">Switch Action Wheel</option>
            </Select>
        </FormRow>

        {effect.kind === 'toggle' && (
            <>
                <FormRow label="Toggle Group">
                    <ToggleGroupControls
                        avatar={avatar}
                        updateAvatar={updateAvatar}
                        allToggleGroups={allToggleGroups}
                        selectedGroupUUID={effect.toggleGroup}
                        onGroupChange={(newUUID) => {
                            const newGroup = avatar.toggleGroups[newUUID];
                            const firstOptionId = newGroup ? Object.keys(newGroup.options)[0] as UUID : undefined;
                            updateEffect({ ...effect, toggleGroup: newUUID, value: (firstOptionId ?? '') as UUID });
                        }}
                    />
                </FormRow>
                <FormRow label="Value">
                    <Select
                        value={effect.value}
                        onChange={(e) => updateEffect({ ...effect, value: e.target.value as UUID })}
                        disabled={!selectedToggleGroup}
                    >
                        {selectedToggleGroup && Object.entries(selectedToggleGroup.options).map(([uuid, option]) => <option key={uuid} value={uuid}>{option.name}</option>)}
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
    avatar: Avatar;
    updateAvatar: UpdateAvatarFn;
}

export function ActionEditor({ action, updateAction, deleteAction, allToggleGroups, allActionWheels, avatar, updateAvatar }: ActionEditorProps) {

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rgb = hexToRgb(e.target.value);
    if (rgb) {
      updateAction({ ...action, color: rgb });
    }
  };
  
  const hexColor = rgbToHex(...action.color);
  const addEffect = () => {
    const firstToggleGroup = allToggleGroups[0];
    const firstOptionId = firstToggleGroup ? Object.keys(firstToggleGroup.options)[0] as UUID : undefined;
    // Default to 'toggle' if possible, otherwise 'switchPage'
    const newEffect: ActionEffect = firstToggleGroup && firstOptionId
      ? { kind: 'toggle', toggleGroup: firstToggleGroup.uuid, value: firstOptionId }
      : { kind: 'switchPage', actionWheel: allActionWheels[0]?.uuid ?? '' as UUID };
    updateAction({ ...action, effect: newEffect });
  };

  const removeEffect = () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { effect, ...restOfAction } = action;
    updateAction({ ...restOfAction, effect: { kind: "none"} });
  };

  return (
    <Card
        title={<>Edit Action: <span className="text-violet-400">{action.label}</span></>}
        controls={<Button onClick={deleteAction} className="bg-rose-600 hover:bg-rose-500 focus-visible:ring-rose-400">Delete Action</Button>}
    >
        <div className="space-y-4">
            <h4 className="text-lg font-semibold text-slate-300 border-b border-slate-700 pb-2">Appearance</h4>
            <FormRow label="Label">
                <Input
                    type="text"
                    placeholder="e.g., Crouch"
                    value={action.label}
                    onChange={e => updateAction({ ...action, label: e.target.value })}
                />
            </FormRow>
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
                <div className="flex items-center gap-3">
                    <Input
                        type="color"
                        value={hexColor}
                        onChange={handleColorChange}
                        className="p-1 h-10 w-10 rounded-md"
                    />
                    <span className="text-slate-400 font-mono text-sm tracking-wider">{hexColor.toUpperCase()}</span>
                </div>
            </FormRow>

            <div className="flex justify-between items-center pt-4 border-b border-slate-700 pb-2">
                <h4 className="text-lg font-semibold text-slate-300">Effect</h4>
                {action.effect.kind !== 'none' && (
                    <Button onClick={removeEffect} className="bg-rose-600 hover:bg-rose-500 focus-visible:ring-rose-400 text-xs px-2 py-1">Remove Effect</Button>
                )}
            </div>
            
            {action.effect.kind !== 'none' ? (
                <ActionEffectEditor
                    effect={action.effect}
                    updateEffect={effect => updateAction({ ...action, effect })}
                    allToggleGroups={allToggleGroups}
                    allActionWheels={allActionWheels}
                    avatar={avatar}
                    updateAvatar={updateAvatar}
                />
            ) : (
                <div className="text-center py-4">
                    <p className="text-slate-400 mb-3">This action has no effect.</p>
                    <Button onClick={addEffect} className="bg-violet-600 hover:bg-violet-500 focus-visible:ring-violet-400">+ Add Effect</Button>
                </div>
            )}
        </div>
    </Card>
  );
}