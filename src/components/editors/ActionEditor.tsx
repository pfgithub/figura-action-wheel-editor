// src/components/editors/ActionEditor.tsx
import React from 'react';
import type { Action, ActionEffect, ActionWheel, ToggleGroup } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { FormRow } from '../ui/FormRow';
import { MinecraftItemPicker } from '../ui/MinecraftItemPicker';
import { ColorPicker } from '../ui/ColorPicker';
import { ActionEffectEditor } from './ActionEffectEditor';
import { TrashIcon } from '../ui/icons';

// A simple divider component for visual separation
const SectionDivider = () => <hr className="border-slate-700/60 my-6" />;

interface ActionEditorProps {
    action: Action;
    updateAction: (a: Action) => void;
    deleteAction: () => void;
    allToggleGroups: ToggleGroup[];
    allActionWheels: ActionWheel[];
}

export function ActionEditor({ action, updateAction, deleteAction, allToggleGroups, allActionWheels }: ActionEditorProps) {
    return (
        <div className="bg-slate-800 rounded-lg ring-1 ring-slate-700">
            <div className="p-2 sm:p-4">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-slate-100">Edit Action</h3>
                        <p className="text-violet-400 font-mono text-sm">{action.label || 'New Action'}</p>
                    </div>
                    <Button onClick={deleteAction} className="bg-rose-600 hover:bg-rose-500 flex-shrink-0">
                        <TrashIcon className="w-5 h-5 sm:mr-2" />
                        <span className="hidden sm:inline">Delete</span>
                    </Button>
                </div>

                <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-slate-300 border-b border-slate-700 pb-2 mb-4">Appearance</h4>
                    <FormRow label="Label">
                        <Input type="text" placeholder="e.g., Crouch" value={action.label} onChange={e => updateAction({ ...action, label: e.target.value })}/>
                    </FormRow>
                    <FormRow label="Icon">
                        <MinecraftItemPicker value={action.icon} onChange={value => updateAction({ ...action, icon: value })}/>
                    </FormRow>
                    <FormRow label="Color">
                        <ColorPicker color={action.color} onChange={rgb => updateAction({ ...action, color: rgb })}/>
                    </FormRow>

                    <SectionDivider />

                    <h4 className="text-lg font-semibold text-slate-300 border-b border-slate-700 pb-2 mb-4">Action Effect</h4>
                    
                    <ActionEffectEditor effect={action.effect} updateEffect={effect => updateAction({ ...action, effect })} allToggleGroups={allToggleGroups} allActionWheels={allActionWheels} />
                </div>
            </div>
        </div>
    );
}