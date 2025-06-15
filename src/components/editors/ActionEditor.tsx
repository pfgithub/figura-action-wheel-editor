// src/components/editors/ActionEditor.tsx
import React, { useState, useRef, useEffect } from 'react';
import type { Action, ActionEffect, ActionWheel, ToggleGroup, IconTexture } from '@/types';
import { useAvatarStore } from '@/store/avatarStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FormRow } from '@/components/ui/FormRow';
import { MinecraftItemPicker } from '@/components/ui/MinecraftItemPicker';
import { ColorPicker } from '@/components/ui/ColorPicker';
import { ActionEffectEditor } from './ActionEffectEditor';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Select } from '@/components/ui/Select';
import { TrashIcon } from '@/components/ui/icons';

// A simple divider component for visual separation
const SectionDivider = () => <hr className="border-slate-700/60 my-6" />;

const TextureSelector = ({ icon, updateIcon }: { icon: IconTexture, updateIcon: (newIcon: IconTexture) => void }) => {
    const { textures } = useAvatarStore();
    const [selection, setSelection] = useState({ u: icon.u, v: icon.v, width: icon.width, height: icon.height });
    const [isSelecting, setIsSelecting] = useState<null | {x: number, y: number}>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedTexture = textures.find(t => t.name === icon.file);

    const getMousePos = (e: React.MouseEvent) => {
        if (!imgRef.current) return { x: 0, y: 0 };
        const rect = imgRef.current.getBoundingClientRect();
        return {
            x: Math.round((e.clientX - rect.left) / rect.width * (selectedTexture?.width ?? 16)),
            y: Math.round((e.clientY - rect.top) / rect.height * (selectedTexture?.height ?? 16)),
        };
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        const pos = getMousePos(e);
        setIsSelecting(pos);
        setSelection({ u: pos.x, v: pos.y, width: 0, height: 0 });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isSelecting) return;
        const pos0 = isSelecting;
        const pos1 = getMousePos(e);
        const xMin = Math.min(pos0.x, pos1.x);
        const xMax = Math.max(pos0.x, pos1.x);
        const yMin = Math.min(pos0.y, pos1.y);
        const yMax = Math.max(pos0.y, pos1.y);
        setSelection(prev => ({
            ...prev,
            u: xMin,
            v: yMin,
            width: Math.max(0, xMax - xMin),
            height: Math.max(0, yMax - yMin),
        }));
    };

    const handleMouseUp = () => {
        setIsSelecting(null);
        updateIcon({
            ...icon,
            u: selection.u,
            v: selection.v,
            width: selection.width,
            height: selection.height,
        });
    };

    useEffect(() => {
        setSelection({ u: icon.u, v: icon.v, width: icon.width, height: icon.height });
    }, [icon.u, icon.v, icon.width, icon.height]);

    if (!selectedTexture) {
        return <div className="text-slate-400 text-sm p-4 bg-slate-900/50 rounded-md">Please select a texture file.</div>;
    }

    const aspect = selectedTexture.width / selectedTexture.height;
    const displayWidth = 320;
    const displayHeight = displayWidth / aspect;
    const scaleFactor = displayWidth / selectedTexture.width;

    return (
        <div className="space-y-4">
            <div className="bg-slate-900/50 p-2 rounded-md ">
                <div
                    ref={containerRef}
                    className="relative overflow-hidden cursor-crosshair"
                    style={{ width: displayWidth, height: displayHeight }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                >
                    <img
                        ref={imgRef}
                        src={selectedTexture.url}
                        alt={selectedTexture.name}
                        className="w-full h-full object-contain select-none"
                        style={{ imageRendering: 'pixelated' }}
                        draggable="false"
                    />
                    <div
                        className="absolute border-2 border-dashed border-violet-400 bg-violet-500/20 pointer-events-none"
                        style={{
                            left: selection.u * scaleFactor,
                            top: selection.v * scaleFactor,
                            width: selection.width * scaleFactor,
                            height: selection.height * scaleFactor,
                        }}
                    />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <FormRow label="U"><Input type="number" value={icon.u} onChange={e => updateIcon({ ...icon, u: +e.target.value })} /></FormRow>
                <FormRow label="V"><Input type="number" value={icon.v} onChange={e => updateIcon({ ...icon, v: +e.target.value })} /></FormRow>
                <FormRow label="Width"><Input type="number" value={icon.width} onChange={e => updateIcon({ ...icon, width: +e.target.value })} /></FormRow>
                <FormRow label="Height"><Input type="number" value={icon.height} onChange={e => updateIcon({ ...icon, height: +e.target.value })} /></FormRow>
                <FormRow label="Scale"><Input type="number" value={icon.scale} onChange={e => updateIcon({ ...icon, scale: +e.target.value })} /></FormRow>
            </div>
        </div>
    );
};

interface ActionEditorProps {
    action: Action;
    updateAction: (a: Action) => void;
    deleteAction: () => void;
    allToggleGroups: ToggleGroup[];
    allActionWheels: ActionWheel[];
}

export function ActionEditor({ action, updateAction, deleteAction, allToggleGroups, allActionWheels }: ActionEditorProps) {
    const { textures } = useAvatarStore();

    const handleIconTypeChange = (newType: 'item' | 'texture') => {
        if (newType === action.icon.type) return;

        if (newType === 'item') {
            updateAction({ ...action, icon: { type: 'item', id: 'minecraft:air' } });
        } else {
            const firstTexture = textures[0];
            updateAction({
                ...action,
                icon: {
                    type: 'texture',
                    file: firstTexture?.name ?? '',
                    u: 0,
                    v: 0,
                    width: firstTexture?.width ?? 16,
                    height: firstTexture?.height ?? 16,
                    scale: 1,
                }
            });
        }
    };

    const handleTextureFileChange = (fileName: string) => {
        const texture = textures.find(t => t.name === fileName);
        if (action.icon.type === 'texture') {
            updateAction({
                ...action,
                icon: {
                    ...action.icon,
                    file: fileName,
                    u: 0,
                    v: 0,
                    width: texture?.width ?? 16,
                    height: texture?.height ?? 16,
                }
            });
        }
    };

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

                    <FormRow label="Icon Type">
                        <SegmentedControl
                            value={action.icon.type}
                            onChange={(val) => handleIconTypeChange(val as 'item' | 'texture')}
                            options={[
                                { label: 'Item', value: 'item' },
                                { label: 'Texture', value: 'texture' },
                            ]}
                        />
                    </FormRow>

                    {action.icon.type === 'item' && (
                         <FormRow label="Item Icon">
                            <MinecraftItemPicker
                                value={action.icon.id}
                                onChange={value => updateAction({ ...action, icon: { type: 'item', id: value }})}
                            />
                        </FormRow>
                    )}

                    {action.icon.type === 'texture' && (
                        <>
                            <FormRow label="Texture File">
                                <Select
                                    value={action.icon.file}
                                    onChange={e => handleTextureFileChange(e.target.value)}
                                    disabled={textures.length === 0}
                                >
                                    <option value="">{textures.length > 0 ? '-- Select a texture --' : '-- No textures uploaded --'}</option>
                                    {textures.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                                </Select>
                            </FormRow>
                             <FormRow label="Texture Icon">
                                <TextureSelector
                                    icon={action.icon}
                                    updateIcon={(newIcon) => updateAction({ ...action, icon: newIcon })}
                                />
                            </FormRow>
                        </>
                    )}

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