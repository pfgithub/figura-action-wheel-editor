import { useMemo } from "react";
import { Select } from "@/components/ui/Select";
import { useAvatarStore } from "@/store/avatarStore";
import type {
	ConditionScript,
	Script,
	ScriptDataInstanceType,
	ScriptInstance,
	UUID,
} from "@/types";

interface ScriptConditionNodeProps {
	condition: ConditionScript;
	handleUpdate: (updater: (draft: ConditionScript) => void) => void;
}

export function ScriptConditionNode({
	condition,
	handleUpdate,
}: ScriptConditionNodeProps) {
	const { avatar } = useAvatarStore();
	const allScripts = avatar?.scripts ?? {};

	const allScriptInstances = useMemo(() => {
		const instances: {
			instance: ScriptInstance;
			script: Script;
			type: ScriptDataInstanceType;
		}[] = [];
		if (!avatar) return instances;
		Object.values(allScripts).forEach((script) => {
			Object.entries(script.instances).forEach(([typeUuid, insts]) => {
				const type = script.data.instanceTypes[typeUuid as UUID];
				if (
					type?.defines?.conditions &&
					Object.keys(type.defines.conditions).length > 0
				) {
					insts.forEach((instance) =>
						instances.push({ instance, script, type }),
					);
				}
			});
		});
		return instances;
	}, [avatar, allScripts]);

	const selectedInstanceData = allScriptInstances.find(
		(i) => i.instance.uuid === condition.scriptInstance,
	);
	const availableConditions = selectedInstanceData
		? Object.values(selectedInstanceData.type.defines.conditions)
		: [];

	return (
		<div className="space-y-2 text-slate-300 p-3 text-sm">
			<Select
				value={condition.scriptInstance ?? ""}
				onChange={(e) =>
					handleUpdate((draft) => {
						draft.scriptInstance = e.target.value
							? (e.target.value as UUID)
							: undefined;
						draft.condition = undefined;
					})
				}
				className="w-full bg-slate-800/80"
			>
				<option value="">
					{allScriptInstances.length > 0
						? "-- Select an instance --"
						: "-- No instances provide conditions --"}
				</option>
				{allScriptInstances.map(({ instance, script }) => (
					<option key={instance.uuid} value={instance.uuid}>
						{script.name} - {instance.name}
					</option>
				))}
			</Select>
			<Select
				value={condition.condition ?? ""}
				onChange={(e) =>
					handleUpdate((draft) => {
						draft.condition = e.target.value
							? (e.target.value as UUID)
							: undefined;
					})
				}
				disabled={!selectedInstanceData}
				className="w-full bg-slate-800/80"
			>
				<option value="">
					{selectedInstanceData
						? "-- Select a condition --"
						: "-- First select an instance --"}
				</option>
				{availableConditions.map((c) => (
					<option key={c.uuid} value={c.uuid}>
						{c.name}
					</option>
				))}
			</Select>
		</div>
	);
}
