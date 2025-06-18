import { ToggleGroupControls } from "@/components/shared/ToggleGroupControls";
import { FormRow } from "@/components/ui/FormRow";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Select } from "@/components/ui/Select";
import { useScriptInstancesWithDefine } from "@/hooks/useScriptData";
import { useAvatarStore } from "@/store/avatarStore";
import type { ActionEffect, UUID } from "@/types";

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

	const handleKindChange = (kind: ActionEffect["kind"] | undefined) => {
		if (kind === "toggle") {
			updateEffect({ kind });
		} else if (kind === "switchPage") {
			updateEffect({ kind: "switchPage" });
		} else if (kind === "scriptAction") {
			updateEffect({ kind: "scriptAction" });
		} else {
			updateEffect(undefined);
		}
	};

	const allToggleGroups = Object.values(avatar?.toggleGroups ?? {});
	const allActionWheels = Object.values(avatar?.actionWheels ?? {});

	if (!avatar) return null;

	const selectedToggleGroup = allToggleGroups.find(
		(g) =>
			g.uuid === (effect?.kind === "toggle" ? effect.toggleGroup : undefined),
	);
	const selectedScriptInstanceData = allScriptInstances.find(
		(i) =>
			i.instance.uuid ===
			(effect?.kind === "scriptAction" ? effect.scriptInstance : undefined),
	);
	const availableScriptWheels = selectedScriptInstanceData
		? Object.values(selectedScriptInstanceData.type.defines.action)
		: [];

	return (
		<div className="space-y-4">
			<FormRow label="Effect Type">
				<SegmentedControl
					value={effect?.kind}
					onChange={handleKindChange}
					options={[
						{ label: "None", value: undefined },
						{ label: "Toggle Option", value: "toggle" },
						{ label: "Switch Wheel", value: "switchPage" },
						{ label: "Script Wheel", value: "scriptAction" },
					]}
				/>
			</FormRow>

			{effect?.kind === "toggle" && (
				<>
					<FormRow label="Toggle Group">
						<ToggleGroupControls
							selectedGroupUUID={effect.toggleGroup}
							onGroupChange={(newUUID) => {
								updateEffect({
									...effect,
									toggleGroup: newUUID,
									value: undefined,
								});
							}}
						/>
					</FormRow>
					<FormRow label="Value">
						<Select
							value={effect.value ?? ""}
							onChange={(e) =>
								updateEffect({
									...effect,
									value: e.target.value ? (e.target.value as UUID) : undefined,
								})
							}
							disabled={!effect.toggleGroup}
						>
							<option value="">
								{effect.toggleGroup
									? "-- Select an option --"
									: "-- First select a group --"}
							</option>
							{selectedToggleGroup &&
								Object.entries(selectedToggleGroup.options).map(
									([uuid, option]) => (
										<option key={uuid} value={uuid}>
											{option.name}
										</option>
									),
								)}
						</Select>
					</FormRow>
				</>
			)}

			{effect?.kind === "switchPage" && (
				<FormRow label="Target Wheel">
					<Select
						value={effect.actionWheel ?? ""}
						onChange={(e) =>
							updateEffect({
								...effect,
								actionWheel: e.target.value
									? (e.target.value as UUID)
									: undefined,
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
			)}

			{effect?.kind === "scriptAction" && (
				<>
					<FormRow label="Script Instance">
						<Select
							value={effect.scriptInstance ?? ""}
							onChange={(e) =>
								updateEffect({
									...effect,
									scriptInstance: e.target.value
										? (e.target.value as UUID)
										: undefined,
									scriptAction: undefined,
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
								updateEffect({
									...effect,
									scriptAction: e.target.value
										? (e.target.value as UUID)
										: undefined,
								})
							}
							disabled={!effect.scriptInstance}
						>
							<option value="">
								{effect.scriptInstance
									? "-- Select an action --"
									: "-- First select an instance --"}
							</option>
							{availableScriptWheels.map((w) => (
								<option key={w.uuid} value={w.uuid}>
									{w.name}
								</option>
							))}
						</Select>
					</FormRow>
				</>
			)}
		</div>
	);
}
