import React, { useState } from "react";
import type { Action, ActionEffect, ActionWheel, ToggleGroup, UUID } from "../../types";
import { useAvatarStore } from "../../store/avatarStore";
import { useMinecraftItems } from "../../hooks/useMinecraftItems";
import { MinecraftItemPickerDialog } from "../dialogs/MinecraftItemPickerDialog";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { FormRow } from "../ui/FormRow";
import { Card } from "../ui/Card";
import { ToggleGroupControls } from "../shared/ToggleGroupControls";

interface MinecraftItemPickerProps {
    value: string;
    onChange: (value: string) => void;
}

function MinecraftItemPicker({ value, onChange }: MinecraftItemPickerProps) {
    const { items, loading } = useMinecraftItems();
    const [isPickerOpen, setPickerOpen] = useState(false);

    const handleSelect = (itemId: string) => {
        onChange(itemId);
        setPickerOpen(false);
    };

    const selectedItem = items?.[value];

    return (
        <>
            <div className="flex items-center gap-2">
                <Button
                    type="button"
                    onClick={() => setPickerOpen(true)}
                    className="p-0 w-10 h-10 flex-shrink-0 flex items-center justify-center bg-slate-700/50 border border-slate-600 hover:bg-slate-600"
                    aria-label="Choose item"
                >
                    {loading ? (
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    ) : selectedItem ? (
                        <img src={selectedItem.imageUrl} alt={selectedItem.name} className="w-6 h-6 image-pixelated" />
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-slate-400"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="m3.27 6.96 8.73 5.05 8.73-5.05"/><path d="M12 22.08V12"/></svg>
                    )}
                </Button>
                <Input
                    type="text"
                    placeholder="minecraft:stone"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    className="flex-grow"
                />
            </div>
            
            <MinecraftItemPickerDialog
                open={isPickerOpen}
                onClose={() => setPickerOpen(false)}
                onSelect={handleSelect}
            />
        </>
    );
}

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
      updateEffect({ kind });
    } else if(kind === 'switchPage') {
      updateEffect({ kind: 'switchPage' });
    }
  };

  const selectedToggleGroup = allToggleGroups.find(g => g.uuid === (effect.kind === 'toggle' ? effect.toggleGroup : undefined));

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
                    <ToggleGroupControls
                        allToggleGroups={allToggleGroups}
                        selectedGroupUUID={effect.toggleGroup}
                        onGroupChange={(newUUID) => {
                            updateEffect({ ...effect, toggleGroup: newUUID, value: undefined });
                        }}
                    />
                </FormRow>
                <FormRow label="Value">
                    <Select
                        value={effect.value ?? ''}
                        onChange={(e) => updateEffect({ ...effect, value: e.target.value ? e.target.value as UUID : undefined })}
                        disabled={!selectedToggleGroup}
                    >
                        {!selectedToggleGroup && <option value="" disabled>-- Select a group --</option>}
                        {selectedToggleGroup && <option value="">-- Select an option --</option>}
                        {selectedToggleGroup && Object.entries(selectedToggleGroup.options).map(([uuid, option]) => <option key={uuid} value={uuid}>{option.name}</option>)}
                    </Select>
                </FormRow>
            </>
        )}

        {effect.kind === 'switchPage' && (
            <FormRow label="Target Wheel">
                <Select
                    value={effect.actionWheel ?? ''}
                    onChange={(e) => updateEffect({ ...effect, actionWheel: e.target.value ? e.target.value as UUID : undefined })}
                    disabled={allActionWheels.length === 0}
                >
                    <option value="">-- Select a wheel --</option>
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
  const addEffect = () => {
    const newEffect: ActionEffect = { kind: 'toggle' };
    updateAction({ ...action, effect: newEffect });
  };

  const removeEffect = () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { effect, ...restOfAction } = action;
    updateAction(restOfAction);
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
                <MinecraftItemPicker
                    value={action.icon}
                    onChange={value => updateAction({ ...action, icon: value })}
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
                {action.effect && (
                    <Button onClick={removeEffect} className="bg-rose-600 hover:bg-rose-500 focus-visible:ring-rose-400 text-xs px-2 py-1">Remove Effect</Button>
                )}
            </div>
            
            {action.effect ? (
                <ActionEffectEditor
                    effect={action.effect}
                    updateEffect={effect => updateAction({ ...action, effect })}
                    allToggleGroups={allToggleGroups}
                    allActionWheels={allActionWheels}
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