import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ColorPicker } from "@/components/ui/ColorPicker";
import { FormRow } from "@/components/ui/FormRow";
import { Input } from "@/components/ui/Input";
import { PlusIcon, TrashIcon } from "@/components/ui/icons";
import { Select } from "@/components/ui/Select";
import { useAvatarStore } from "@/store/avatarStore";
import type { AnimationRef, Customization, ModelPartRef } from "@/types";
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
			if (!values.find((v) => v.model === firstAnim.model && v.animation === firstAnim.animation)) {
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
								<option
									key={JSON.stringify(anim)}
									value={JSON.stringify(anim)}
								>
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

export function MetadataManager() {
	const { metadata, updateMetadata, modelElements } = useAvatarStore();
	const [partToAdd, setPartToAdd] = useState("");

	if (!metadata) return null;

	const handleUpdate = <K extends keyof typeof metadata>(
		field: K,
		value: (typeof metadata)[K],
	) => {
		updateMetadata((draft) => {
			if (value === "" || (Array.isArray(value) && value.length === 0)) {
				delete draft[field];
			} else {
				(draft as any)[field] = value;
			}
		});
	};

	const handleAddCustomization = () => {
		if (!partToAdd) return;
		updateMetadata((draft) => {
			draft.customizations ??= {};
			draft.customizations[partToAdd] = {};
		});
		setPartToAdd("");
	};

	const uncustomizedParts = modelElements.filter(
		(p) => !metadata.customizations?.[modelPartRefToId(p)],
	);

	return (
		<div className="space-y-6">
			<Section title="General Information">
				<FormRow label="Name">
					<Input
						value={metadata.name ?? ""}
						onChange={(e) => handleUpdate("name", e.target.value || undefined)}
						placeholder="e.g., Katt"
					/>
				</FormRow>
				<FormRow label="Description">
					<Input
						value={metadata.description ?? ""}
						onChange={(e) =>
							handleUpdate("description", e.target.value || undefined)
						}
						placeholder="A brief summary of the avatar"
					/>
				</FormRow>
				<FormRow label="Version">
					<Input
						value={metadata.version ?? ""}
						onChange={(e) =>
							handleUpdate("version", e.target.value || undefined)
						}
						placeholder="e.g., 0.1.0"
					/>
				</FormRow>
				<FormRow label="Nameplate Color">
					<ColorPicker
						color={hexToRgb(metadata.color ?? "a155da") ?? [90, 170, 255]}
						onChange={(rgb) => handleUpdate("color", rgbToHex(...rgb).slice(1))}
					/>
				</FormRow>
			</Section>

			<Section title="Authors">
				<StringArrayEditor
					label="Avatar Authors"
					values={metadata.authors ?? []}
					onChange={(v) => handleUpdate("authors", v)}
					placeholder="Author Name / Handle"
				/>
			</Section>

			<Section title="Auto-Execution">
				<StringArrayEditor
					label="Auto Scripts"
					values={metadata.autoScripts ?? []}
					onChange={(v) => handleUpdate("autoScripts", v)}
					placeholder="libs.RainbowNameplate"
				/>
				<AnimationRefArrayEditor
					label="Auto Animations"
					values={metadata.autoAnims ?? []}
					onChange={(v) => handleUpdate("autoAnims", v)}
				/>
			</Section>

			<Section title="Asset Management">
				<StringArrayEditor
					label="Ignored Textures"
					values={metadata.ignoredTextures ?? []}
					onChange={(v) => handleUpdate("ignoredTextures", v)}
					placeholder="player.diamond_layer_1"
				/>
			</Section>

			<Section title="Model Customizations">
				<div className="space-y-3">
					{Object.entries(metadata.customizations ?? {}).map(
						([partName, customization]) => (
							<CustomizationEditor
								key={partName}
								partName={partName}
								customization={customization}
								onUpdate={(newCust) =>
									updateMetadata((d) => (d.customizations![partName] = newCust))
								}
								onDelete={() =>
									updateMetadata((d) => delete d.customizations![partName])
								}
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
	);
}