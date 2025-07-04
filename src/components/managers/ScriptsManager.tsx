import { useState } from "react";
import { ScriptEditor } from "@/components/editors/ScriptEditor";
import { MasterDetailManager } from "@/components/layout/MasterDetailManager";
import { Button } from "@/components/ui/Button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
} from "@/components/ui/Dialog";
import { PlusIcon } from "@/components/ui/icons";
import { scripts as availableScripts } from "@/data/scripts";
import { useAvatarStore } from "@/store/avatarStore";
import type { Script, ScriptInstance, UUID } from "@/types";
import { generateUUID } from "@/utils/uuid";

const EmptyState = () => (
	<div className="flex flex-col items-center justify-center h-full text-slate-500">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className="w-16 h-16 mb-4"
		>
			<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
			<polyline points="14 2 14 8 20 8" />
			<line x1="16" y1="13" x2="8" y2="13" />
			<line x1="16" y1="17" x2="8" y2="17" />
			<polyline points="10 9 9 9 8 9" />
		</svg>
		<h3 className="text-lg font-semibold">Select a script to edit</h3>
		<p className="text-sm">Choose a script from the list, or add a new one.</p>
	</div>
);

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

export function ScriptsManager() {
	const { avatar, updateAvatar } = useAvatarStore();
	const [isAddDialogOpen, setAddDialogOpen] = useState(false);
	const [selectedId, setSelectedId] = useState<UUID | null>(null);

	if (!avatar) return null;

	const configuredScriptIds = Object.keys(avatar.scripts);
	const unconfiguredScripts = Object.values(availableScripts).filter(
		(s) => !configuredScriptIds.includes(s.uuid),
	);
	const allScripts = Object.values(avatar.scripts);

	const handleAddScript = (scriptData: (typeof availableScripts)[UUID]) => {
		const newScript: Script = {
			uuid: scriptData.uuid,
			name: scriptData.name,
			data: JSON.parse(JSON.stringify(scriptData)), // Deep copy
			instances: {},
		};

		// Automatically create instances for types with mode "one"
		for (const instanceType of Object.values(scriptData.instanceTypes)) {
			if (instanceType.mode === "one") {
				const paramValues: Record<string, any> = {};
				instanceType.parameters.forEach((param) => {
					paramValues[param.name] = getDefaultValueForType(param.type);
				});

				const newInstance: ScriptInstance = {
					uuid: generateUUID(),
					name: instanceType.name,
					parameterValue: paramValues,
				};

				newScript.instances[instanceType.uuid] = [newInstance];
			}
		}

		updateAvatar((draft) => {
			draft.scripts[newScript.uuid] = newScript;
		});
		setAddDialogOpen(false);
		setSelectedId(newScript.uuid);
	};

	const handleDelete = (itemToDelete: Script) => {
		if (!itemToDelete) return;
		updateAvatar((draft) => {
			delete draft.scripts[itemToDelete.uuid];
		});
		if (selectedId === itemToDelete.uuid) {
			setSelectedId(null);
		}
	};

	return (
		<>
			<MasterDetailManager<Script>
				items={allScripts}
				selectedId={selectedId}
				onSelectId={setSelectedId}
				title="Scripts"
				addText="Add Script"
				deleteText="Delete Script"
				onAddItem={() => setAddDialogOpen(true)}
				onDeleteItem={handleDelete}
				editorTitle={(script) => script.name}
				renderListItem={(script, isSelected) => (
					<button
						className={`w-full text-left p-3 rounded-lg transition-colors duration-150 ${isSelected ? "bg-violet-500/20 ring-2 ring-violet-500" : "bg-slate-800 hover:bg-slate-700"}`}
					>
						<h3 className="font-semibold text-slate-100">{script.name}</h3>
					</button>
				)}
				renderEditor={(script) => (
					<ScriptEditor key={script.uuid} script={script} />
				)}
				renderEmptyState={EmptyState}
			/>

			{/* Add Script Dialog */}
			<Dialog
				open={isAddDialogOpen}
				onClose={() => setAddDialogOpen(false)}
				className="max-w-xl"
			>
				<DialogHeader>Add a Script</DialogHeader>
				<DialogContent>
					<div className="space-y-2 max-h-96 overflow-y-auto -mr-2 pr-2">
						{unconfiguredScripts.length > 0 ? (
							unconfiguredScripts.map((scriptData) => (
								<div
									key={scriptData.uuid}
									className="rounded-lg border border-slate-700 p-3 flex justify-between items-center"
								>
									<h4 className="font-semibold text-slate-200">
										{scriptData.name}
									</h4>
									<Button
										onClick={() => handleAddScript(scriptData)}
										className="bg-violet-600 hover:bg-violet-500"
									>
										<PlusIcon className="w-4 h-4 mr-2" />
										Add
									</Button>
								</div>
							))
						) : (
							<div className="text-center text-slate-400 p-8">
								All available scripts have been added.
							</div>
						)}
					</div>
				</DialogContent>
				<DialogFooter>
					<Button
						onClick={() => setAddDialogOpen(false)}
						className="bg-slate-600 hover:bg-slate-500"
					>
						Cancel
					</Button>
				</DialogFooter>
			</Dialog>
		</>
	);
}
