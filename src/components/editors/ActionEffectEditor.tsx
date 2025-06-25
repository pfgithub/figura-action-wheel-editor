import { produce } from "immer";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
} from "@/components/ui/Dialog";
import { FormRow } from "@/components/ui/FormRow";
import { Input } from "@/components/ui/Input";
import { PlusIcon, TrashIcon } from "@/components/ui/icons";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Select } from "@/components/ui/Select";
import { useScriptInstancesWithDefine } from "@/hooks/useScriptData";
import { useAvatarStore } from "@/store/avatarStore";
import type {
	ActionEffect,
	AnimationRef,
	ModelPartRef,
	UUID,
} from "@/types";
import { generateUUID } from "@/utils/uuid";

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
	}
};

function ExclusiveTagsManagerDialog({
	isOpen,
	onClose,
}: {
	isOpen: boolean;
	onClose: () => void;
}) {
	const { avatar, updateAvatar } = useAvatarStore();
	const [newTagName, setNewTagName] = useState("");

	const exclusiveTags = Object.values(avatar?.exclusiveTags ?? {});

	const handleAddTag = () => {
		if (!newTagName.trim()) return;
		const newTag = { uuid: generateUUID(), name: newTagName.trim() };
		updateAvatar((draft) => {
			draft.exclusiveTags ??= {};
			draft.exclusiveTags[newTag.uuid] = newTag;
		});
		setNewTagName("");
	};

	const handleRenameTag = (tagId: UUID, newName: string) => {
		updateAvatar((draft) => {
			if (draft.exclusiveTags?.[tagId]) {
				draft.exclusiveTags[tagId].name = newName;
			}
		});
	};

	const handleDeleteTag = (tagId: UUID) => {
		// eslint-disable-next-line no-alert
		if (
			!window.confirm(
				"Are you sure you want to delete this tag? It will be removed from all actions that use it.",
			)
		)
			return;

		updateAvatar((draft) => {
			if (draft.exclusiveTags) {
				delete draft.exclusiveTags[tagId];
			}

			// Clean up in action wheels
			Object.values(draft.actionWheels).forEach((wheel) => {
				wheel.actions.forEach((action) => {
					if (
						action.effect?.kind === "toggle" &&
						action.effect.exclusiveTags?.includes(tagId)
					) {
						action.effect.exclusiveTags = action.effect.exclusiveTags.filter(
							(id) => id !== tagId,
						);
					}
				});
			});

			// Clean up in keybinds
			Object.values(draft.keybinds ?? {}).forEach((keybind) => {
				if (
					keybind.effect?.kind === "toggle" &&
					keybind.effect.exclusiveTags?.includes(tagId)
				) {
					keybind.effect.exclusiveTags = keybind.effect.exclusiveTags.filter(
						(id) => id !== tagId,
					);
				}
			});
		});
	};

	return (
		<Dialog open={isOpen} onClose={onClose} className="max-w-lg">
			<DialogHeader>Manage Exclusive Tags</DialogHeader>
			<DialogContent>
				<p className="text-sm text-slate-400 mb-4">
					Exclusive tags ensure that only one toggle action with a given tag can
					be active at a time.
				</p>
				<div className="space-y-2 max-h-72 overflow-y-auto -mr-2 pr-2">
					{exclusiveTags.length > 0 ? (
						exclusiveTags.map((tag) => (
							<div
								key={tag.uuid}
								className="flex items-center gap-2 p-1 rounded-md bg-slate-900/50"
							>
								<Input
									value={tag.name}
									onChange={(e) => handleRenameTag(tag.uuid, e.target.value)}
									className="border-none focus:ring-0 focus:bg-slate-700"
								/>
								<Button
									onClick={() => handleDeleteTag(tag.uuid)}
									className="bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 w-9 h-9 p-0 flex-shrink-0"
								>
									<TrashIcon className="w-5 h-5" />
								</Button>
							</div>
						))
					) : (
						<div className="text-center text-slate-500 py-8">
							No tags created yet.
						</div>
					)}
				</div>
				<div className="flex gap-2 pt-4 border-t border-slate-700">
					<Input
						placeholder="New tag name..."
						value={newTagName}
						onChange={(e) => setNewTagName(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								handleAddTag();
								e.preventDefault();
							}
						}}
					/>
					<Button
						onClick={handleAddTag}
						disabled={!newTagName.trim()}
						className="bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 w-10 h-10 p-0 flex-shrink-0"
					>
						<PlusIcon className="w-5 h-5" />
					</Button>
				</div>
			</DialogContent>
			<DialogFooter>
				<Button
					onClick={onClose}
					className="bg-slate-600 hover:bg-slate-500"
				>
					Close
				</Button>
			</DialogFooter>
		</Dialog>
	);
}

// --- Main Editor ---
interface ActionEffectEditorProps {
	effect?: ActionEffect;
	updateEffect: (e: ActionEffect | undefined) => void;
}

export function ActionEffectEditor({
	effect,
	updateEffect,
}: ActionEffectEditorProps) {
	const { avatar, animations, modelElements } = useAvatarStore();
	const allScriptInstances = useScriptInstancesWithDefine("action");
	const [isTagsManagerOpen, setTagsManagerOpen] = useState(false);

	const handleEffectTypeChange = (
		e: React.ChangeEvent<HTMLSelectElement>,
	) => {
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
				const appliedTagIds = new Set(effect.exclusiveTags ?? []);
				const availableTags = allTags.filter((t) => !appliedTagIds.has(t.uuid));

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
								<Button
									onClick={() => setTagsManagerOpen(true)}
									className="bg-slate-600/50 hover:bg-slate-600 text-xs py-1 px-2"
								>
									Manage Tags...
								</Button>
							</div>
							<p className="text-xs text-slate-500 mb-3">
								If another action with one of these tags is active, this toggle
								will be forced off.
							</p>

							<div className="space-y-2">
								<div className="flex flex-wrap gap-2 min-h-[2.25rem] p-2 bg-slate-900/40 rounded-md border border-slate-700/50">
									{(effect.exclusiveTags ?? []).map((tagId) => {
										const tag = avatar.exclusiveTags?.[tagId];
										if (!tag) return null;
										return (
											<div
												key={tag.uuid}
												className="flex items-center gap-1.5 bg-violet-500/20 text-violet-300 text-sm font-medium pl-2.5 pr-1 py-0.5 rounded-full"
											>
												<span>{tag.name}</span>
												<button
													type="button"
													onClick={() =>
														handleUpdate((d) => {
															if (
																d.kind === "toggle" &&
																d.exclusiveTags
															) {
																d.exclusiveTags =
																	d.exclusiveTags.filter(
																		(id) => id !== tagId,
																	);
															}
														})
													}
													className="bg-violet-500/20 hover:bg-violet-500/50 rounded-full w-5 h-5 flex items-center justify-center text-violet-200 hover:text-white"
												>
													×
												</button>
											</div>
										);
									})}
									{(!effect.exclusiveTags ||
										effect.exclusiveTags.length === 0) && (
										<span className="text-slate-500 text-sm italic px-1 py-0.5">
											No tags applied.
										</span>
									)}
								</div>
								<Select
									value=""
									onChange={(e) => {
										const tagId = e.target.value;
										if (!tagId) return;
										handleUpdate((d) => {
											if (d.kind === "toggle") {
												d.exclusiveTags = [
													...(d.exclusiveTags ?? []),
													tagId as UUID,
												];
											}
										});
									}}
									disabled={availableTags.length === 0}
								>
									<option value="">
										{availableTags.length > 0
											? "Add a tag..."
											: "All tags applied"}
									</option>
									{availableTags.map((tag) => (
										<option key={tag.uuid} value={tag.uuid}>
											{tag.name}
										</option>
									))}
								</Select>
							</div>
						</div>
					</div>
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
					{Object.entries(effectKindData).map(([kind, data]) => (
						<option key={kind} value={kind}>
							{data.label}
						</option>
					))}
				</Select>
			</FormRow>

			{renderEffectForm()}
			<ExclusiveTagsManagerDialog
				isOpen={isTagsManagerOpen}
				onClose={() => setTagsManagerOpen(false)}
			/>
		</div>
	);
}