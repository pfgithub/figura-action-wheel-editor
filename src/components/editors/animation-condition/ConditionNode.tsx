import { useDraggable } from "@dnd-kit/core";
import { produce } from "immer";
import { useMemo } from "react";
import { ToggleGroupControls } from "@/components/shared/ToggleGroupControls";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { renderValues } from "@/data/renderSettings";
import { useAvatarStore } from "@/store/avatarStore";
import type {
	AnimationID,
	Condition,
	Script,
	ScriptDataInstanceType,
	ScriptInstance,
	UUID,
} from "@/types";
import { kindStyles } from "./helpers";
import { DropZone, GripVerticalIcon, Trash2Icon } from "./ui";

interface ConditionNodeProps {
	path: string;
	condition?: Condition;
	updateCondition: (newCondition?: Condition) => void;
	deleteNode: () => void;
}

export function ConditionNode({
	path,
	condition,
	updateCondition,
	deleteNode,
}: ConditionNodeProps) {
	const { avatar, animations } = useAvatarStore();

	if (!avatar) return null;
	const allToggleGroups = Object.values(avatar.toggleGroups);
	const allAnimations = animations;
	const allScripts = avatar.scripts;

	const {
		listeners: dragListeners,
		setNodeRef: setDraggableNodeRef,
		isDragging,
	} = useDraggable({
		id: path,
		data: { path, type: "condition" },
	});

	if (!condition) {
		return (
			<DropZone
				id={path}
				path={path}
				label={"Drag a condition from the panel to start"}
			/>
		);
	}

	const styles = kindStyles[condition.kind];

	const setNodeRef = (node: HTMLElement | null) => {
		setDraggableNodeRef(node);
	};

	const handleUpdate = (updater: (draft: Condition) => void) => {
		updateCondition(produce(condition, updater));
	};

	const renderHeader = () => (
		<div
			className={`flex items-center justify-between p-2 rounded-t-lg ${styles.bg.replace("30", "50").replace("50", "60")}`}
		>
			<div className="flex items-center gap-1">
				<span
					{...dragListeners}
					className={`p-1 ${"cursor-grab text-slate-500 hover:text-white"}`}
				>
					<GripVerticalIcon />
				</span>
				<span className={`font-bold ${styles.text}`}>{styles.label}</span>
			</div>
			<button
				onClick={deleteNode}
				className="p-1 text-rose-400 hover:text-white hover:bg-rose-500 rounded-full w-6 h-6 flex items-center justify-center"
			>
				<Trash2Icon />
			</button>
		</div>
	);

	const renderBody = () => {
		switch (condition.kind) {
			case "and":
			case "or":
				return (
					<div className="p-2 space-y-2">
						{condition.conditions.map((cond, i) => (
							<ConditionNode
								key={cond.id}
								path={`${path}.conditions.${i}`}
								condition={cond}
								updateCondition={(newCond) =>
									handleUpdate((draft) => {
										if (draft.kind === "and" || draft.kind === "or")
											draft.conditions[i] = newCond!;
									})
								}
								deleteNode={() =>
									handleUpdate((draft) => {
										if (draft.kind === "and" || draft.kind === "or")
											draft.conditions.splice(i, 1);
									})
								}
							/>
						))}
						<DropZone
							id={`${path}.add`}
							path={path}
							label="Add sub-condition"
						/>
					</div>
				);
			case "not":
				return (
					<div className="p-2">
						<ConditionNode
							path={`${path}.condition`}
							condition={condition.condition}
							updateCondition={(newCond) =>
								handleUpdate((draft) => {
									if (draft.kind === "not") draft.condition = newCond;
								})
							}
							deleteNode={() =>
								handleUpdate((draft) => {
									if (draft.kind === "not") draft.condition = undefined;
								})
							}
						/>
					</div>
				);
			case "toggleGroup": {
				const selectedGroup = allToggleGroups.find(
					(g) => g.uuid === condition.toggleGroup,
				);
				return (
					<div className="space-y-2 text-slate-300 p-3 text-sm">
						<div className="flex items-center gap-2">
							<span className="flex-shrink-0 pr-2">When</span>
							<div className="flex-grow">
								<ToggleGroupControls
									selectedGroupUUID={condition.toggleGroup}
									onGroupChange={(newUUID) => {
										handleUpdate((draft) => {
											if (draft.kind === "toggleGroup") {
												draft.toggleGroup = newUUID;
												draft.value = undefined;
											}
										});
									}}
								/>
							</div>
						</div>
						<div className="flex items-center gap-2">
							<span className="font-semibold flex-shrink-0 pr-6">is</span>
							<Select
								value={condition.value ?? ""}
								onChange={(e) =>
									handleUpdate((draft) => {
										if (draft.kind === "toggleGroup")
											draft.value = e.target.value
												? (e.target.value as UUID)
												: undefined;
									})
								}
								disabled={!selectedGroup}
								className="w-auto flex-grow bg-slate-800/80"
							>
								<option value="">
									<em>None</em>
								</option>
								{selectedGroup &&
									Object.entries(selectedGroup.options).map(
										([uuid, option]) => (
											<option key={uuid} value={uuid}>
												{option.name}
											</option>
										),
									)}
							</Select>
						</div>
					</div>
				);
			}
			case "animation": {
				const animationModes = ["PLAYING", "PAUSED", "STOPPED"];
				return (
					<div className="space-y-2 text-slate-300 p-3 text-sm">
						<div className="flex items-center gap-2">
							<span className="flex-shrink-0 pr-2">When animation</span>
							<div className="flex-grow">
								<Select
									value={condition.animation ?? ""}
									onChange={(e) =>
										handleUpdate((draft) => {
											if (draft.kind === "animation")
												draft.animation = e.target.value
													? (e.target.value as AnimationID)
													: undefined;
										})
									}
									className="w-auto flex-grow bg-slate-800/80"
								>
									<option value="">-- Select an animation --</option>
									{allAnimations.map((animId) => (
										<option key={animId} value={animId}>
											{animId}
										</option>
									))}
								</Select>
							</div>
						</div>
						<div className="flex items-center gap-2">
							<span className="font-semibold flex-shrink-0 pr-6">is</span>
							<Select
								value={condition.mode ?? "PLAYING"}
								onChange={(e) =>
									handleUpdate((draft) => {
										if (draft.kind === "animation")
											draft.mode = e.target.value as any;
									})
								}
								className="w-auto flex-grow bg-slate-800/80"
							>
								{animationModes.map((mode) => (
									<option key={mode} value={mode}>
										{mode}
									</option>
								))}
							</Select>
						</div>
					</div>
				);
			}
			case "render":
				return (
					<div className="flex items-center gap-2 text-slate-300 p-3 text-sm flex-wrap">
						<Select
							value={condition.render ?? ""}
							onChange={(e) =>
								handleUpdate((draft) => {
									if (draft.kind === "render")
										draft.render = e.target.value
											? (e.target.value as any)
											: undefined;
								})
							}
							className="w-auto flex-grow bg-slate-800/80"
						>
							<option value="">-- Select state --</option>
							{Array.from(renderValues.values()).map((v) => (
								<option key={v.id} value={v.id}>
									{v.name}
								</option>
							))}
						</Select>
					</div>
				);
			case "script": {
				const allScriptInstances = useMemo(() => {
					const instances: {
						instance: ScriptInstance;
						script: Script;
						type: ScriptDataInstanceType;
					}[] = [];
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
				}, []);

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
									if (draft.kind === "script") {
										draft.scriptInstance = e.target.value
											? (e.target.value as UUID)
											: undefined;
										draft.condition = undefined;
									}
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
									if (draft.kind === "script")
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
			default:
				return null;
		}
	};

	return (
		<div
			ref={setNodeRef}
			style={{ opacity: isDragging ? 0.4 : 1 }}
			className={`rounded-lg border transition-shadow ${styles.border} ${styles.bg}`}
		>
			{renderHeader()}
			{renderBody()}
		</div>
	);
}
