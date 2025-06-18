// src/components/dialogs/MetadataEditorDialog.tsx
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ColorPicker } from "@/components/ui/ColorPicker";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
} from "@/components/ui/Dialog";
import { FormRow } from "@/components/ui/FormRow";
import { Input } from "@/components/ui/Input";
import { PlusIcon, TrashIcon } from "@/components/ui/icons";
import { Select } from "@/components/ui/Select";
import { useAvatarStore } from "@/store/avatarStore";
import type {
	AnimationRef,
	AvatarMetadata,
	Customization,
	ModelPartRef,
} from "@/types";
import { hexToRgb, rgbToHex } from "@/utils/color";

const RENDER_TYPES = [
	"DEFAULT",
	"TRANSLUCENT",
	"CUTOUT",
	"EMISSIVE",
	"GLINT",
	"END_PORTAL",
];
const PARENT_TYPES = [
	"None",
	"Head",
	"Body",
	"LeftArm",
	"RightArm",
	"LeftLeg",
	"RightLeg",
];

const modelPartRefToId = (ref: ModelPartRef) =>
	`models.${ref.model}.${ref.partPath.join(".")}`;
const displayModelPartRef = (ref: ModelPartRef) =>
	`${ref.model}.${ref.partPath.join(".")}`;
const displayAnimationRef = (ref: AnimationRef) =>
	`${ref.model}.${ref.animation}`;

const Section = ({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) => (
	<div className="bg-slate-800/50 p-4 md:p-6 rounded-lg ring-1 ring-slate-700">
		<h2 className="text-xl font-bold text-slate-100 mb-6 pb-3 border-b border-slate-700">
			{title}
		</h2>
		<div className="space-y-4">{children}</div>
	</div>
);

const StringArrayEditor = ({
	label,
	values,
	onChange,
	placeholder,
}: {
	label: string;
	values: string[];
	onChange: (newValues: string[]) => void;
	placeholder: string;
}) => {
	const addValue = () => onChange([...values, ""]);
	const removeValue = (index: number) =>
		onChange(values.filter((_, i) => i !== index));
	const updateValue = (index: number, value: string) => {
		const newValues = [...values];
		newValues[index] = value;
		onChange(newValues);
	};

	return (
		<div>
			<label className="text-slate-400 text-sm font-medium">{label}</label>
			<div className="mt-2 space-y-2">
				{values.map((value, index) => (
					<div key={index} className="flex gap-2 items-center">
						<Input
							value={value}
							onChange={(e) => updateValue(index, e.target.value)}
							placeholder={placeholder}
						/>
						<Button
							onClick={() => removeValue(index)}
							className="bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 w-9 h-9 p-0 flex-shrink-0"
						>
							<TrashIcon className="w-5 h-5" />
						</Button>
					</div>
				))}
				<Button
					onClick={addValue}
					className="bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 w-full mt-2"
				>
					<PlusIcon className="w-5 h-5 mr-2" />
					Add
				</Button>
			</div>
		</div>
	);
};

const AnimationRefArrayEditor = ({
	label,
	values,
	onChange,
}: {
	label: string;
	values: AnimationRef[];
	onChange: (newValues: AnimationRef[]) => void;
}) => {
	const { animations } = useAvatarStore();

	const addValue = () => {
		if (animations.length > 0) {
			const firstAnim = animations[0];
			if (
				!values.find(
					(v) =>
						v.model === firstAnim.model && v.animation === firstAnim.animation,
				)
			) {
				onChange([...values, firstAnim]);
			}
		}
	};
	const removeValue = (index: number) =>
		onChange(values.filter((_, i) => i !== index));

	const updateValue = (index: number, value: string) => {
		const newValues = [...values];
		newValues[index] = JSON.parse(value);
		onChange(newValues);
	};

	return (
		<div>
			<label className="text-slate-400 text-sm font-medium">{label}</label>
			<div className="mt-2 space-y-2">
				{values.map((value, index) => (
					<div key={index} className="flex gap-2 items-center">
						<Select
							value={JSON.stringify(value)}
							onChange={(e) => updateValue(index, e.target.value)}
							className="flex-grow"
						>
							{animations.map((anim) => (
								<option key={JSON.stringify(anim)} value={JSON.stringify(anim)}>
									{displayAnimationRef(anim)}
								</option>
							))}
						</Select>
						<Button
							onClick={() => removeValue(index)}
							className="bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 w-9 h-9 p-0 flex-shrink-0"
						>
							<TrashIcon className="w-5 h-5" />
						</Button>
					</div>
				))}
				<Button
					onClick={addValue}
					className="bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 w-full mt-2"
					disabled={animations.length === 0}
				>
					<PlusIcon className="w-5 h-5 mr-2" />
					Add
				</Button>
			</div>
		</div>
	);
};

const CustomizationEditor = ({
	partName,
	customization,
	onUpdate,
	onDelete,
}: {
	partName: string;
	customization: Customization;
	onUpdate: (newCustomization: Customization) => void;
	onDelete: () => void;
}) => {
	const { modelElements } = useAvatarStore();

	const handleFieldChange = (field: keyof Customization, value: any) => {
		const newCustomization: Customization = {
			...customization,
			[field]: value,
		};
		// Remove field if it's empty or false, to keep JSON clean
		if (value === "" || value === false || value === undefined) {
			delete (newCustomization as any)[field];
		}
		onUpdate(newCustomization);
	};

	return (
		<div className="bg-slate-900/50 p-4 rounded-lg ring-1 ring-slate-700/50">
			<div className="flex justify-between items-center mb-4">
				<h3 className="font-semibold text-violet-300 truncate">{partName}</h3>
				<Button
					onClick={onDelete}
					className="bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 w-8 h-8 p-0 flex-shrink-0"
				>
					<TrashIcon className="w-4 h-4" />
				</Button>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<FormRow label="Primary Render">
					<Select
						value={customization.primaryRenderType ?? ""}
						onChange={(e) =>
							handleFieldChange("primaryRenderType", e.target.value)
						}
					>
						<option value="">(Default)</option>
						{RENDER_TYPES.map((t) => (
							<option key={t} value={t}>
								{t}
							</option>
						))}
					</Select>
				</FormRow>
				<FormRow label="Secondary Render">
					<Select
						value={customization.secondaryRenderType ?? ""}
						onChange={(e) =>
							handleFieldChange("secondaryRenderType", e.target.value)
						}
					>
						<option value="">(Default)</option>
						{RENDER_TYPES.map((t) => (
							<option key={t} value={t}>
								{t}
							</option>
						))}
					</Select>
				</FormRow>
				<FormRow label="Parent Type">
					<Select
						value={customization.parentType ?? ""}
						onChange={(e) => handleFieldChange("parentType", e.target.value)}
					>
						<option value="">(Default)</option>
						{PARENT_TYPES.map((t) => (
							<option key={t} value={t}>
								{t}
							</option>
						))}
					</Select>
				</FormRow>
				<FormRow label="Move To">
					<Select
						value={
							customization.moveTo ? JSON.stringify(customization.moveTo) : ""
						}
						onChange={(e) =>
							handleFieldChange(
								"moveTo",
								e.target.value ? JSON.parse(e.target.value) : undefined,
							)
						}
					>
						<option value="">(None)</option>
						{modelElements.map((p) => (
							<option key={JSON.stringify(p)} value={JSON.stringify(p)}>
								{displayModelPartRef(p)}
							</option>
						))}
					</Select>
				</FormRow>
				<FormRow label="Visible">
					<input
						type="checkbox"
						checked={customization.visible ?? false}
						onChange={(e) => handleFieldChange("visible", e.target.checked)}
						className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-violet-500 focus:ring-violet-500"
					/>
				</FormRow>
				<FormRow label="Remove">
					<input
						type="checkbox"
						checked={customization.remove ?? false}
						onChange={(e) => handleFieldChange("remove", e.target.checked)}
						className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-violet-500 focus:ring-violet-500"
					/>
				</FormRow>
				<FormRow label="Smooth">
					<input
						type="checkbox"
						checked={customization.smooth ?? false}
						onChange={(e) => handleFieldChange("smooth", e.target.checked)}
						className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-violet-500 focus:ring-violet-500"
					/>
				</FormRow>
			</div>
		</div>
	);
};

export function MetadataEditorDialog({
	isOpen,
	onClose,
}: {
	isOpen: boolean;
	onClose: () => void;
}) {
	const {
		metadata: originalMetadata,
		updateMetadata,
		modelElements,
		saveMetadata,
	} = useAvatarStore();
	const [localMetadata, setLocalMetadata] = useState<AvatarMetadata | null>(
		null,
	);
	const [partToAdd, setPartToAdd] = useState("");

	useEffect(() => {
		if (isOpen) {
			// Create a deep copy for local editing
			setLocalMetadata(JSON.parse(JSON.stringify(originalMetadata ?? {})));
		}
	}, [isOpen, originalMetadata]);

	if (!isOpen || !localMetadata) {
		return null;
	}

	const handleUpdate = <K extends keyof AvatarMetadata>(
		field: K,
		value: AvatarMetadata[K],
	) => {
		setLocalMetadata((prev) => {
			if (!prev) return null;
			const newMeta = { ...prev };
			if (
				value === "" ||
				(Array.isArray(value) && value.length === 0) ||
				value === undefined
			) {
				delete (newMeta as any)[field];
			} else {
				(newMeta as any)[field] = value;
			}
			return newMeta;
		});
	};

	const handleAddCustomization = () => {
		if (!partToAdd) return;
		setLocalMetadata((prev) => {
			if (!prev) return null;
			const newMeta = JSON.parse(JSON.stringify(prev));
			newMeta.customizations ??= {};
			newMeta.customizations[partToAdd] = {};
			return newMeta;
		});
		setPartToAdd("");
	};

	const handleUpdateCustomization = (
		partName: string,
		newCust: Customization,
	) => {
		setLocalMetadata((prev) => {
			if (!prev) return null;
			const newMeta = JSON.parse(JSON.stringify(prev));
			newMeta.customizations ??= {};
			newMeta.customizations[partName] = newCust;
			return newMeta;
		});
	};

	const handleDeleteCustomization = (partName: string) => {
		setLocalMetadata((prev) => {
			if (!prev) return null;
			const newMeta = JSON.parse(JSON.stringify(prev));
			if (newMeta.customizations) {
				delete newMeta.customizations[partName];
				if (Object.keys(newMeta.customizations).length === 0) {
					delete newMeta.customizations;
				}
			}
			return newMeta;
		});
	};

	const handleSave = () => {
		updateMetadata((draft) => {
			// Clear the old metadata object and assign the new one
			Object.keys(draft).forEach(
				(key) => delete draft[key as keyof AvatarMetadata],
			);
			Object.assign(draft, localMetadata);
		});
		// Download the file
		saveMetadata();

		onClose();
	};

	const handleDiscard = () => {
		onClose();
	};

	const uncustomizedParts = modelElements.filter(
		(p) => !localMetadata.customizations?.[modelPartRefToId(p)],
	);

	return (
		<Dialog
			open={isOpen}
			onClose={handleDiscard}
			dismissable={false}
			className="max-w-4xl max-h-[90vh] flex flex-col"
		>
			<DialogHeader>Edit Avatar Metadata</DialogHeader>
			<div className="flex-grow overflow-y-auto pr-4 -mr-4 space-y-6">
				<Section title="General Information">
					<FormRow label="Name">
						<Input
							value={localMetadata.name ?? ""}
							onChange={(e) =>
								handleUpdate("name", e.target.value || undefined)
							}
							placeholder="e.g., Katt"
						/>
					</FormRow>
					<FormRow label="Description">
						<Input
							value={localMetadata.description ?? ""}
							onChange={(e) =>
								handleUpdate("description", e.target.value || undefined)
							}
							placeholder="A brief summary of the avatar"
						/>
					</FormRow>
					<FormRow label="Version">
						<Input
							value={localMetadata.version ?? ""}
							onChange={(e) =>
								handleUpdate("version", e.target.value || undefined)
							}
							placeholder="e.g., 0.1.0"
						/>
					</FormRow>
					<FormRow label="Nameplate Color">
						<ColorPicker
							color={
								hexToRgb(localMetadata.color ?? "a155da") ?? [90, 170, 255]
							}
							onChange={(rgb) =>
								handleUpdate("color", rgbToHex(...rgb).slice(1))
							}
						/>
					</FormRow>
				</Section>

				<Section title="Authors">
					<StringArrayEditor
						label="Avatar Authors"
						values={localMetadata.authors ?? []}
						onChange={(v) => handleUpdate("authors", v)}
						placeholder="Author Name / Handle"
					/>
				</Section>

				<Section title="Auto-Execution">
					<StringArrayEditor
						label="Auto Scripts"
						values={localMetadata.autoScripts ?? []}
						onChange={(v) => handleUpdate("autoScripts", v)}
						placeholder="libs.RainbowNameplate"
					/>
					<AnimationRefArrayEditor
						label="Auto Animations"
						values={localMetadata.autoAnims ?? []}
						onChange={(v) => handleUpdate("autoAnims", v)}
					/>
				</Section>

				<Section title="Asset Management">
					<StringArrayEditor
						label="Ignored Textures"
						values={localMetadata.ignoredTextures ?? []}
						onChange={(v) => handleUpdate("ignoredTextures", v)}
						placeholder="player.diamond_layer_1"
					/>
				</Section>

				<Section title="Model Customizations">
					<div className="space-y-3">
						{Object.entries(localMetadata.customizations ?? {}).map(
							([partName, customization]) => (
								<CustomizationEditor
									key={partName}
									partName={partName}
									customization={customization}
									onUpdate={(newCust) =>
										handleUpdateCustomization(partName, newCust)
									}
									onDelete={() => handleDeleteCustomization(partName)}
								/>
							),
						)}
					</div>
					<div className="flex gap-2 items-center mt-4">
						<Select
							value={partToAdd}
							onChange={(e) => setPartToAdd(e.target.value)}
							disabled={uncustomizedParts.length === 0}
						>
							<option value="">
								{uncustomizedParts.length > 0
									? "-- Select a part to customize --"
									: "-- All parts customized --"}
							</option>
							{uncustomizedParts.map((p) => (
								<option key={modelPartRefToId(p)} value={modelPartRefToId(p)}>
									{displayModelPartRef(p)}
								</option>
							))}
						</Select>
						<Button
							onClick={handleAddCustomization}
							disabled={!partToAdd}
							className="bg-violet-600 hover:bg-violet-500 flex-shrink-0"
						>
							<PlusIcon className="w-5 h-5 mr-2" /> Add
						</Button>
					</div>
				</Section>
			</div>
			<DialogFooter>
				<Button
					onClick={handleDiscard}
					className="bg-slate-600 hover:bg-slate-500"
				>
					Discard
				</Button>
				<Button
					onClick={handleSave}
					className="bg-violet-600 hover:bg-violet-500"
				>
					Save
				</Button>
			</DialogFooter>
		</Dialog>
	);
}
