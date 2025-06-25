import { Combobox as HeadlessCombobox, Transition } from "@headlessui/react";
import { produce } from "immer";
import { Fragment, useState } from "react";
import { Combobox } from "@/components/ui/Combobox";
import { PlusIcon } from "@/components/ui/icons";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Select } from "@/components/ui/Select";
import { useScriptInstancesWithDefine } from "@/hooks/useScriptData";
import { useAvatarStore } from "@/store/avatarStore";
import type {
	ActionEffect,
	AnimationRef,
	ModelPartRef,
	UUID,
	Variable,
	VariableValue,
} from "@/types";
import { generateUUID } from "@/utils/uuid";
import { FormRow } from "../ui/FormRow";

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
	const [variableQuery, setVariableQuery] = useState("");
	const [valueQuery, setValueQuery] = useState("");

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
				const variables = Object.values(avatar.variables ?? {});
				const trimmedVarQuery = variableQuery.trim().toLowerCase();
				const filteredVariables =
					trimmedVarQuery === ""
						? variables
						: variables.filter((v) =>
								v.name.toLowerCase().includes(trimmedVarQuery),
							);

				const canCreateVariable =
					trimmedVarQuery.length > 0 &&
					!variables.some((v) => v.name.toLowerCase() === trimmedVarQuery);

				const handleCreateVariable = () => {
					if (!canCreateVariable) return;
					const newVar = {
						uuid: generateUUID(),
						name: variableQuery.trim(),
						values: {},
					};
					updateAvatar((draft) => {
						draft.variables ??= {};
						draft.variables[newVar.uuid] = newVar;
					});
					handleUpdate((d) => {
						if (d.kind === "toggleVariable") {
							d.variable = newVar.uuid;
							d.value = null; // reset value
						}
					});
					setVariableQuery("");
				};

				const selectedVariable = effect.variable
					? avatar.variables?.[effect.variable]
					: null;
				const selectedValue =
					selectedVariable && effect.value
						? selectedVariable.values[effect.value]
						: null;

				const variableValues = selectedVariable
					? Object.values(selectedVariable.values)
					: [];
				const trimmedValQuery = valueQuery.trim().toLowerCase();
				const filteredValues =
					trimmedValQuery === ""
						? variableValues
						: variableValues.filter((v) =>
								v.label.toLowerCase().includes(trimmedValQuery),
							);

				const canCreateValue =
					selectedVariable &&
					trimmedValQuery.length > 0 &&
					!variableValues.some((v) => v.label.toLowerCase() === trimmedValQuery);

				const handleCreateValue = () => {
					if (!canCreateValue) return;
					const newValue = { uuid: generateUUID(), label: valueQuery.trim() };
					updateAvatar((draft) => {
						const v = draft.variables?.[selectedVariable.uuid];
						if (v) {
							v.values[newValue.uuid] = newValue;
						}
					});
					handleUpdate((d) => {
						if (d.kind === "toggleVariable") {
							d.value = newValue.uuid;
						}
					});
					setValueQuery("");
				};

				return (
					<div className="space-y-4">
						<FormRow label="Variable">
							<HeadlessCombobox
								value={selectedVariable}
								onChange={(v: Variable | null) => {
									handleUpdate((d) => {
										if (d.kind === "toggleVariable") {
											d.variable = v?.uuid;
											d.value = null;
										}
									});
								}}
								nullable
								immediate
							>
								<div className="relative">
									<HeadlessCombobox.Input
										className="bg-slate-700/50 border border-slate-600 rounded-md px-3 py-2 w-full text-slate-100 placeholder:text-slate-400 focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
										onChange={(e) => setVariableQuery(e.target.value)}
										onKeyDown={(e) => e.key === "Enter" && handleCreateVariable()}
										displayValue={(v: Variable | null) => v?.name ?? ""}
										placeholder="Select or create a variable..."
									/>
									<HeadlessCombobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
										<svg
											className="h-5 w-5 text-gray-400"
											viewBox="0 0 20 20"
											fill="none"
											stroke="currentColor"
										>
											<path
												d="M7 7l3-3 3 3m0 6l-3 3-3-3"
												strokeWidth="1.5"
												strokeLinecap="round"
												strokeLinejoin="round"
											/>
										</svg>
									</HeadlessCombobox.Button>
									<Transition
										as={Fragment}
										leave="transition ease-in duration-100"
										leaveFrom="opacity-100"
										leaveTo="opacity-0"
										afterLeave={() => setVariableQuery("")}
									>
										<HeadlessCombobox.Options portal anchor="bottom" className="mt-1 max-h-60 w-(--input-width) overflow-auto rounded-md bg-slate-800 py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm z-10">
											{filteredVariables.map((v) => (
												<HeadlessCombobox.Option
													key={v.uuid}
													value={v}
													className={({ active }) =>
														`cursor-default select-none relative py-2 pl-4 pr-4 ${active ? "text-white bg-violet-600" : "text-gray-900"}`
													}
												>
													<span className="block truncate font-normal text-white">
														{v.name}
													</span>
												</HeadlessCombobox.Option>
											))}
											{canCreateVariable && (
												<HeadlessCombobox.Option
													value={{ uuid: "create", name: "" } as any}
													onClick={handleCreateVariable}
													className={({ active }) =>
														`relative cursor-pointer select-none py-2 pl-4 pr-4 ${active ? "bg-emerald-600/50" : ""} text-emerald-300`
													}
												>
													<span className="flex items-center">
														<PlusIcon className="w-4 h-4 mr-2" />
														Create "{variableQuery.trim()}"
													</span>
												</HeadlessCombobox.Option>
											)}
										</HeadlessCombobox.Options>
									</Transition>
								</div>
							</HeadlessCombobox>
						</FormRow>
						<FormRow label="Value">
							<HeadlessCombobox
								value={selectedValue}
								onChange={(v: VariableValue | null) => {
									handleUpdate((d) => {
										if (d.kind === "toggleVariable") {
											d.value = v?.uuid ?? null;
										}
									});
								}}
								disabled={!selectedVariable}
								nullable
								immediate
							>
								<div className="relative">
									<HeadlessCombobox.Input
										className="bg-slate-700/50 border border-slate-600 rounded-md px-3 py-2 w-full text-slate-100 placeholder:text-slate-400 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 disabled:bg-slate-800/50 disabled:cursor-not-allowed"
										onChange={(e) => setValueQuery(e.target.value)}
										onKeyDown={(e) => e.key === "Enter" && handleCreateValue()}
										displayValue={(v: VariableValue | null) => v?.label ?? ""}
										placeholder="Select or create a value..."
									/>
									<HeadlessCombobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
										<svg
											className="h-5 w-5 text-gray-400"
											viewBox="0 0 20 20"
											fill="none"
											stroke="currentColor"
										>
											<path
												d="M7 7l3-3 3 3m0 6l-3 3-3-3"
												strokeWidth="1.5"
												strokeLinecap="round"
												strokeLinejoin="round"
											/>
										</svg>
									</HeadlessCombobox.Button>
									<Transition
										as={Fragment}
										leave="transition ease-in duration-100"
										leaveFrom="opacity-100"
										leaveTo="opacity-0"
										afterLeave={() => setValueQuery("")}
									>
										<HeadlessCombobox.Options portal anchor="bottom" className="mt-1 max-h-60 w-(--input-width) overflow-auto rounded-md bg-slate-800 py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm z-10">
											<HeadlessCombobox.Option
												value={null}
												className={({ active }) =>
													`cursor-default select-none relative py-2 pl-4 pr-4 ${active ? "text-white bg-violet-600" : "text-gray-900"}`
												}
											>
												<span className="block truncate font-normal text-slate-400 italic">
													(None)
												</span>
											</HeadlessCombobox.Option>

											{filteredValues.map((v) => (
												<HeadlessCombobox.Option
													key={v.uuid}
													value={v}
													className={({ active }) =>
														`cursor-default select-none relative py-2 pl-4 pr-4 ${active ? "text-white bg-violet-600" : "text-gray-900"}`
													}
												>
													<span className="block truncate font-normal text-white">
														{v.label}
													</span>
												</HeadlessCombobox.Option>
											))}
											{canCreateValue && (
												<HeadlessCombobox.Option
													value={{ uuid: "create", label: "" } as any}
													onClick={handleCreateValue}
													className={({ active }) =>
														`relative cursor-pointer select-none py-2 pl-4 pr-4 ${active ? "bg-emerald-600/50" : ""} text-emerald-300`
													}
												>
													<span className="flex items-center">
														<PlusIcon className="w-4 h-4 mr-2" />
														Create "{valueQuery.trim()}"
													</span>
												</HeadlessCombobox.Option>
											)}
										</HeadlessCombobox.Options>
									</Transition>
								</div>
							</HeadlessCombobox>
						</FormRow>
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