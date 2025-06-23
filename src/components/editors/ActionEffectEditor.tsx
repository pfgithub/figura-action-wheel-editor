import { produce } from "immer";
import { Button } from "@/components/ui/Button";
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

// A simple UUID list editor for exclusive tags
const UUIDArrayEditor = ({
	label,
	values,
	onChange,
}: {
	label: string;
	values: UUID[];
	onChange: (newValues: UUID[]) => void;
}) => {
	const addValue = () => onChange([...(values ?? []), generateUUID()]);
	const removeValue = (index: number) =>
		onChange((values ?? []).filter((_, i) => i !== index));

	return (
		<FormRow label={label}>
			<div className="space-y-2">
				{(values ?? []).map((value, index) => (
					<div key={value} className="flex gap-2 items-center">
						<Input
							value={value}
							readOnly
							className="bg-slate-800/80 font-mono text-xs"
						/>
						<Button
							onClick={() => removeValue(index)}
							className="bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 w-9 h-9 p-0 flex-shrink-0"
							aria-label="Remove Tag"
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
					Add Exclusive Tag
				</Button>
			</div>
		</FormRow>
	);
};

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
				exclusiveTags: [],
			};
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
	const { avatar, animations, modelElements } = useAvatarStore();
	const allScriptInstances = useScriptInstancesWithDefine("action");

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
		const displayAnimationRef = (ref: AnimationRef) =>
			`${ref.model}.${ref.animation}`;

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
			case "toggle":
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
						<UUIDArrayEditor
							label="Exclusive Tags"
							values={effect.exclusiveTags ?? []}
							onChange={(newTags) =>
								handleUpdate((d) => {
									if (d.kind === "toggle") d.exclusiveTags = newTags;
								})
							}
						/>
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
					</div>
				);
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
		</div>
	);
}