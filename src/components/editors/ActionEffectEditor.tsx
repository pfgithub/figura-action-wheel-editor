import { produce } from "immer";
import { FormRow } from "@/components/ui/FormRow";
import { Select } from "@/components/ui/Select";
import { useScriptInstancesWithDefine } from "@/hooks/useScriptData";
import { useAvatarStore } from "@/store/avatarStore";
import type { ActionEffect, UUID } from "@/types";
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
};

const createNewEffect = (kind: ActionEffectKind): ActionEffect => {
	const id = generateUUID();
	switch (kind) {
		case "switchPage":
			return { id, kind };
		case "scriptAction":
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
	const { avatar } = useAvatarStore();
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