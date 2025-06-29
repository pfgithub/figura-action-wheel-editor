import { produce } from "immer";
import { Combobox } from "@/components/ui/Combobox";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Select } from "@/components/ui/Select";
import { useScriptInstancesWithDefine } from "@/hooks/useScriptData";
import { useAvatarStore } from "@/store/avatarStore";
import type { ActionEffect, AnimationRef, ModelPartRef, UUID } from "@/types";
import { generateUUID } from "@/utils/uuid";
import { FormRow } from "../ui/FormRow";
import { VariableSelector } from "./VariableSelector";

// --- Types & Data ---
type ActionEffectKind = ActionEffect["kind"];

const effectKindData: {
	[key in ActionEffectKind]: { label: string };
} = {
	switchPage: {
		label: "Switch Wheel",
	},
	scriptAction: {
		label: "Script Action",
	},
	toggle: {
		label: "Toggle",
	},
	toggleVariable: {
		label: "Toggle Variable",
	},
};

const createNewEffect = (kind: ActionEffectKind): ActionEffect => {
	const id = generateUUID();
	switch (kind) {
		case "switchPage":
			return { id, kind };
		case "scriptAction":
			return { id, kind };
		case "toggle":
			return {
				id,
				kind,
				targetType: "animation",
				isSaved: true,
				defaultOn: false,
			};
		case "toggleVariable":
			return { id, kind };
	}
};

// --- Main Editor ---
interface ActionEffectEditorProps {
	effect?: ActionEffect;
	updateEffect: (e: ActionEffect | undefined) => void;
}

export function ActionEffectEditor({
	effect,
	updateEffect,
}: ActionEffectEditorProps) {
	const { avatar, animations, modelElements, updateAvatar } = useAvatarStore();
	const allScriptInstances = useScriptInstancesWithDefine("action");

	const handleEffectTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const newKind = e.target.value;
		if (newKind === "") {
			updateEffect(undefined);
		} else {
			const newEffect = createNewEffect(newKind as ActionEffectKind);
			updateEffect(newEffect);
		}
	};

	const handleUpdate = (updater: (draft: ActionEffect) => void) => {
		if (!effect) return;
		updateEffect(produce(effect, updater));
	};

	const renderEffectForm = () => {
		if (!effect || !avatar) return null;

		const allActionWheels = Object.values(avatar.actionWheels ?? {});
		const displayModelPartRef = (ref: ModelPartRef) =>
			`${ref.model}.${ref.partPath.join(".")}`;
		const displayAnimationRef = (ref: AnimationRef) => {
			const loop = ref.loop ? ` (${ref.loop})` : "";
			return `${ref.model}.${ref.animation}${loop}`;
		};

		switch (effect.kind) {
			case "switchPage":
				return (
					<FormRow label="Target Wheel">
						<Select
							value={effect.actionWheel ?? ""}
							onChange={(e) =>
								handleUpdate((d) => {
									if (d.kind === "switchPage")
										d.actionWheel = e.target.value
											? (e.target.value as UUID)
											: undefined;
								})
							}
							disabled={allActionWheels.length === 0}
						>
							<option value="">-- Select a wheel --</option>
							{allActionWheels.map((w) => (
								<option key={w.uuid} value={w.uuid}>
									{w.title}
								</option>
							))}
						</Select>
					</FormRow>
				);
			case "scriptAction": {
				const selectedScriptInstanceData = allScriptInstances.find(
					(i) => i.instance.uuid === effect.scriptInstance,
				);
				const availableScriptActions = selectedScriptInstanceData
					? Object.values(selectedScriptInstanceData.type.defines.action)
					: [];

				return (
					<>
						<FormRow label="Script Instance">
							<Select
								value={effect.scriptInstance ?? ""}
								onChange={(e) =>
									handleUpdate((d) => {
										if (d.kind === "scriptAction") {
											d.scriptInstance = e.target.value
												? (e.target.value as UUID)
												: undefined;
											d.scriptAction = undefined; // Reset action on instance change
										}
									})
								}
								disabled={allScriptInstances.length === 0}
							>
								<option value="">
									{allScriptInstances.length > 0
										? "-- Select an instance --"
										: "-- No instances provide wheels --"}
								</option>
								{allScriptInstances.map(({ instance, script }) => (
									<option key={instance.uuid} value={instance.uuid}>
										{script.name} - {instance.name}
									</option>
								))}
							</Select>
						</FormRow>
						<FormRow label="Target Action">
							<Select
								value={effect.scriptAction ?? ""}
								onChange={(e) =>
									handleUpdate((d) => {
										if (d.kind === "scriptAction")
											d.scriptAction = e.target.value
												? (e.target.value as UUID)
												: undefined;
									})
								}
								disabled={!effect.scriptInstance}
							>
								<option value="">
									{effect.scriptInstance
										? "-- Select an action --"
										: "-- First select an instance --"}
								</option>
								{availableScriptActions.map((w) => (
									<option key={w.uuid} value={w.uuid}>
										{w.name}
									</option>
								))}
							</Select>
						</FormRow>
					</>
				);
			}
			case "toggle": {
				const allTags = Object.values(avatar.exclusiveTags ?? {});
				const tagOptions = allTags.map((t) => ({
					id: t.uuid,
					label: t.name,
				}));

				const handleCreateTag = (tagName: string) => {
					const newTag = { uuid: generateUUID(), name: tagName.trim() };
					// 1. Create the tag in the global store
					updateAvatar((draft) => {
						draft.exclusiveTags ??= {};
						draft.exclusiveTags[newTag.uuid] = newTag;
					});
					// 2. Add the new tag's ID to the current effect
					handleUpdate((d) => {
						if (d.kind === "toggle") {
							d.exclusiveTags = [...(d.exclusiveTags ?? []), newTag.uuid];
						}
					});
				};

				const handleTagsChange = (tagIds: string[]) => {
					handleUpdate((d) => {
						if (d.kind === "toggle") {
							d.exclusiveTags = tagIds as UUID[];
						}
					});
				};

				return (
					<div className="space-y-4">
						<FormRow label="Toggle Type">
							<SegmentedControl
								value={effect.targetType ?? "animation"}
								onChange={(val) =>
									handleUpdate((d) => {
										if (d.kind === "toggle") {
											d.targetType = val as "animation" | "modelPart";
											// Reset other target when type changes
											d.animation = undefined;
											d.modelPart = undefined;
										}
									})
								}
								options={[
									{ label: "Animation", value: "animation" },
									{ label: "Model Part", value: "modelPart" },
								]}
							/>
						</FormRow>
						{effect.targetType === "animation" ? (
							<FormRow label="Animation">
								<Select
									value={
										effect.animation ? JSON.stringify(effect.animation) : ""
									}
									onChange={(e) =>
										handleUpdate((d) => {
											if (d.kind === "toggle")
												d.animation = e.target.value
													? JSON.parse(e.target.value)
													: undefined;
										})
									}
								>
									<option value="">-- Select Animation --</option>
									{animations.map((anim) => (
										<option
											key={JSON.stringify(anim)}
											value={JSON.stringify(anim)}
										>
											{displayAnimationRef(anim)}
										</option>
									))}
								</Select>
							</FormRow>
						) : (
							<FormRow label="Model Part">
								<Select
									value={
										effect.modelPart ? JSON.stringify(effect.modelPart) : ""
									}
									onChange={(e) =>
										handleUpdate((d) => {
											if (d.kind === "toggle")
												d.modelPart = e.target.value
													? JSON.parse(e.target.value)
													: undefined;
										})
									}
								>
									<option value="">-- Select Model Part --</option>
									{modelElements.map((part) => (
										<option
											key={JSON.stringify(part)}
											value={JSON.stringify(part)}
										>
											{displayModelPartRef(part)}
										</option>
									))}
								</Select>
							</FormRow>
						)}
						<FormRow label="Saved">
							<input
								type="checkbox"
								checked={effect.isSaved ?? false}
								onChange={(e) =>
									handleUpdate((d) => {
										if (d.kind === "toggle") d.isSaved = e.target.checked;
									})
								}
								className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-violet-500 focus:ring-violet-500"
							/>
						</FormRow>
						<FormRow label="Default On">
							<input
								type="checkbox"
								checked={effect.defaultOn ?? false}
								onChange={(e) =>
									handleUpdate((d) => {
										if (d.kind === "toggle") d.defaultOn = e.target.checked;
									})
								}
								className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-violet-500 focus:ring-violet-500"
							/>
						</FormRow>
						{/* Exclusive Tags Section */}
						<div className="pt-4 mt-4 border-t border-slate-700/60">
							<div className="flex justify-between items-center mb-1">
								<label className="text-slate-400 text-sm font-medium">
									Exclusive Tags
								</label>
							</div>
							<p className="text-xs text-slate-500 mb-3">
								If another action with one of these tags is active, this toggle
								will be forced off.
							</p>
							<Combobox
								placeholder="Add tags or create new..."
								options={tagOptions}
								value={effect.exclusiveTags ?? []}
								onChange={handleTagsChange}
								onCreate={handleCreateTag}
							/>
						</div>
					</div>
				);
			}
			case "toggleVariable": {
				return (
					<VariableSelector
						selectedVariableId={effect.variable}
						selectedValueId={effect.value}
						onVariableChange={(variableId) => {
							handleUpdate((d) => {
								if (d.kind === "toggleVariable") {
									d.variable = variableId;
									d.value = null; // Reset value on variable change
								}
							});
						}}
						onValueChange={(valueId) => {
							handleUpdate((d) => {
								if (d.kind === "toggleVariable") {
									d.value = valueId;
								}
							});
						}}
					/>
				);
			}
			default:
				return null;
		}
	};

	return (
		<div className="space-y-4 bg-slate-900/30 p-4 rounded-lg">
			<FormRow label="Effect Type">
				<Select value={effect?.kind ?? ""} onChange={handleEffectTypeChange}>
					<option value="">(None)</option>
					{Object.entries(effectKindData)
						.sort(([, a], [, b]) => a.label.localeCompare(b.label))
						.map(([kind, data]) => (
							<option key={kind} value={kind}>
								{data.label}
							</option>
						))}
				</Select>
			</FormRow>

			{renderEffectForm()}
		</div>
	);
}
