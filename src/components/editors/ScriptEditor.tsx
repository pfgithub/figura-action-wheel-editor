import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PlusIcon, TrashIcon } from "@/components/ui/icons";
import { useAvatarStore } from "@/store/avatarStore";
import type {
	Script,
	ScriptDataInstanceType,
	ScriptInstance,
	UUID,
} from "@/types";
import { generateUUID } from "@/utils/uuid";
import { ScriptParameterEditor } from "./ScriptParameterEditor";

interface ScriptEditorProps {
	script: Script;
}

function getDefaultValueForType(type: any): any {
	switch (type.kind) {
		case "string":
			return type.defaultValue ?? "";
		case "boolean":
			return type.defaultValue ?? false;
		case "vec3":
			return type.defaultValue ?? [0, 0, 0];
		case "list":
			return [];
		case "table": {
			const obj: Record<string, any> = {};
			for (const key in type.entries) {
				obj[key] = getDefaultValueForType(type.entries[key]);
			}
			return obj;
		}
		default:
			return type.defaultValue ?? undefined;
	}
}

export function ScriptEditor({ script }: ScriptEditorProps) {
	const { updateAvatar } = useAvatarStore();
	const [expandedInstance, setExpandedInstance] = useState<UUID | null>(null);

	const handleAddInstance = (instanceType: ScriptDataInstanceType) => {
		updateAvatar((draft) => {
			const scriptToUpdate = draft.scripts[script.uuid];
			if (!scriptToUpdate) return;

			const newInstance: ScriptInstance = {
				uuid: generateUUID(),
				name: `New ${instanceType.name}`,
				parameterValue: {},
			};

			const paramValues: Record<string, any> = {};
			instanceType.parameters.forEach((param) => {
				paramValues[param.name] = getDefaultValueForType(param.type);
			});
			newInstance.parameterValue = paramValues;

			const instancesForType =
				scriptToUpdate.instances[instanceType.uuid] ?? [];
			instancesForType.push(newInstance);
			scriptToUpdate.instances[instanceType.uuid] = instancesForType;
			setExpandedInstance(newInstance.uuid);
		});
	};

	const handleDeleteInstance = (typeUuid: UUID, instanceUuid: UUID) => {
		updateAvatar((draft) => {
			const scriptToUpdate = draft.scripts[script.uuid];
			const instancesForType = scriptToUpdate?.instances[typeUuid] ?? [];
			scriptToUpdate.instances[typeUuid] = instancesForType.filter(
				(inst) => inst.uuid !== instanceUuid,
			);
		});
		if (expandedInstance === instanceUuid) {
			setExpandedInstance(null);
		}
	};

	const updateInstance = (typeUuid: UUID, updatedInstance: ScriptInstance) => {
		updateAvatar((draft) => {
			const scriptToUpdate = draft.scripts[script.uuid];
			const instancesForType = scriptToUpdate?.instances[typeUuid] ?? [];
			const index = instancesForType.findIndex(
				(i) => i.uuid === updatedInstance.uuid,
			);
			if (index !== -1) {
				instancesForType[index] = updatedInstance;
			}
		});
	};

	return (
		<div className="space-y-6">
			{Object.values(script.data.instanceTypes).map((instanceType) => {
				const instances = script.instances[instanceType.uuid] ?? [];
				const canAdd =
					instanceType.mode === "many" ||
					(instanceType.mode === "zero_or_one" && instances.length === 0);
				const canDelete = instanceType.mode !== "one";

				const hasDefines =
					instanceType.defines &&
					(Object.keys(instanceType.defines.conditions).length > 0 ||
						Object.keys(instanceType.defines.settings).length > 0 ||
						Object.keys(instanceType.defines.action).length > 0);

				return (
					<div
						key={instanceType.uuid}
						className="bg-slate-800 p-4 rounded-lg ring-1 ring-slate-700"
					>
						<div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-700">
							<h3 className="text-xl font-bold text-slate-200">
								{instanceType.name}
							</h3>
							{canAdd && (
								<Button
									onClick={() => handleAddInstance(instanceType)}
									className="bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300"
								>
									<PlusIcon className="w-5 h-5 mr-2" /> Add Instance
								</Button>
							)}
						</div>

						{hasDefines && (
							<div className="mb-4 p-3 bg-slate-900/30 rounded-md text-sm space-y-2">
								<h4 className="font-semibold text-slate-300">
									This instance type provides:
								</h4>
								<ul className="list-disc list-inside text-slate-400 pl-2">
									{Object.keys(instanceType.defines.conditions).length > 0 && (
										<li>
											<strong>Conditions:</strong>{" "}
											{Object.values(instanceType.defines.conditions)
												.map((c) => c.name)
												.join(", ")}
										</li>
									)}
									{Object.keys(instanceType.defines.settings).length > 0 && (
										<li>
											<strong>Settings:</strong>{" "}
											{Object.values(instanceType.defines.settings)
												.map((s) => s.name)
												.join(", ")}
										</li>
									)}
									{Object.keys(instanceType.defines.action).length > 0 && (
										<li>
											<strong>Action Wheels:</strong>{" "}
											{Object.values(instanceType.defines.action)
												.map((w) => w.name)
												.join(", ")}
										</li>
									)}
								</ul>
							</div>
						)}

						<div className="space-y-3">
							{instances.length > 0 ? (
								instances.map((instance) => (
									<div
										key={instance.uuid}
										className="bg-slate-900/50 rounded-lg ring-1 ring-slate-700/50 overflow-hidden"
									>
										<div
											className={`flex justify-between items-center p-3 ${instanceType.parameters.length > 0 ? "cursor-pointer" : ""} hover:bg-slate-700/20`}
											onClick={() => {
												if (instanceType.parameters.length === 0) return;
												setExpandedInstance((prev) =>
													prev === instance.uuid ? null : instance.uuid,
												);
											}}
										>
											{instanceType.mode === "one" ? (
												<span className="text-base font-semibold">
													{instance.name}
												</span>
											) : (
												<Input
													value={instance.name}
													onClick={(e) => e.stopPropagation()}
													onChange={(e) =>
														updateInstance(instanceType.uuid, {
															...instance,
															name: e.target.value,
														})
													}
													className="bg-transparent border-none p-0 h-auto text-base font-semibold w-auto focus:ring-0"
												/>
											)}
											<div className="flex items-center gap-2">
												{canDelete && (
													<Button
														onClick={(e) => {
															e.stopPropagation();
															handleDeleteInstance(
																instanceType.uuid,
																instance.uuid,
															);
														}}
														className="bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 w-8 h-8 p-0 flex-shrink-0"
													>
														<TrashIcon className="w-4 h-4" />
													</Button>
												)}
												{instanceType.parameters.length > 0 && (
													<svg
														className={`flex-shrink-0 w-6 h-6 text-slate-400 transition-transform duration-200 ${expandedInstance === instance.uuid ? "rotate-180" : "rotate-0"}`}
														xmlns="http://www.w3.org/2000/svg"
														width="24"
														height="24"
														viewBox="0 0 24 24"
														fill="none"
														stroke="currentColor"
														strokeWidth="2"
														strokeLinecap="round"
														strokeLinejoin="round"
													>
														<path d="m6 9 6 6 6-6" />
													</svg>
												)}
											</div>
										</div>
										{expandedInstance === instance.uuid &&
											instanceType.parameters.length > 0 && (
												<div className="p-4 border-t border-slate-700/50">
													<ScriptParameterEditor
														parameters={instanceType.parameters}
														values={
															instance.parameterValue as Record<string, any>
														}
														onChange={(newValues) =>
															updateInstance(instanceType.uuid, {
																...instance,
																parameterValue: newValues,
															})
														}
													/>
												</div>
											)}
									</div>
								))
							) : (
								<div className="text-center text-slate-500 py-4">
									No instances configured.
								</div>
							)}
						</div>
					</div>
				);
			})}
		</div>
	);
}