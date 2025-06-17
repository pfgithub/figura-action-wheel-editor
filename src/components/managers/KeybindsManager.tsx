// src/components/managers/KeybindsManager.tsx
import React, { useState } from "react";
import type { UUID, Keybind } from "@/types";
import { useAvatarStore } from "@/store/avatarStore";
import { useKeybindsList } from "@/hooks/useKeybindsList";
import { Button } from "@/components/ui/Button";
import { PlusIcon, TrashIcon } from "@/components/ui/icons";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { generateUUID } from "@/utils/uuid";
import { KeybindEditor } from "@/components/editors/KeybindEditor";

export function KeybindsManager() {
	const { avatar, updateAvatar } = useAvatarStore();
	const { keybinds: keybindsList } = useKeybindsList();
	const [selectedKeybindId, setSelectedKeybindId] = useState<UUID | null>(null);
	const [deletingKeybindId, setDeletingKeybindId] = useState<UUID | null>(null);

	if (!avatar) return null;

	const allKeybinds = Object.values(avatar.keybinds ?? {}).sort((a, b) =>
		a.name.localeCompare(b.name),
	);

	const keyIdToNameMap = React.useMemo(() => {
		const map = new Map<string, string>();
		if (keybindsList) {
			for (const item of keybindsList) {
				map.set(item.id, item.name);
			}
		}
		return map;
	}, [keybindsList]);

	const handleAddKeybind = () => {
		const newUuid = generateUUID();
		const newKeybind: Keybind = {
			uuid: newUuid,
			name: `New Keybind ${Object.keys(avatar.keybinds ?? {}).length + 1}`,
			keyId: "",
			// no effect by default
		};
		updateAvatar((draft) => {
			draft.keybinds ??= {};
			draft.keybinds[newUuid] = newKeybind;
		});
		setSelectedKeybindId(newUuid);
	};

	const handleDeleteKeybind = () => {
		if (!deletingKeybindId) return;
		updateAvatar((draft) => {
			if (draft.keybinds) {
				delete draft.keybinds[deletingKeybindId];
			}
		});
		if (selectedKeybindId === deletingKeybindId) {
			setSelectedKeybindId(null);
		}
		setDeletingKeybindId(null);
	};

	const updateKeybind = (updatedKeybind: Keybind) => {
		updateAvatar((draft) => {
			if (draft.keybinds) {
				draft.keybinds[updatedKeybind.uuid] = updatedKeybind;
			}
		});
	};

	const selectedKeybind = selectedKeybindId
		? avatar.keybinds?.[selectedKeybindId]
		: null;

	return (
		<div className="flex flex-col md:flex-row gap-6 h-full">
			{/* Left Panel: Keybind List */}
			<div className="md:w-1/3 lg:w-1/4 flex-shrink-0 flex flex-col gap-4">
				<div className="flex justify-between items-center pb-3 border-b border-slate-700">
					<h2 className="text-2xl font-bold text-slate-100">Keybinds</h2>
					<Button
						onClick={handleAddKeybind}
						className="bg-violet-600 hover:bg-violet-500"
					>
						<PlusIcon className="w-5 h-5 mr-2" />
						Add
					</Button>
				</div>
				<div className="space-y-2 flex-grow overflow-y-auto -mr-2 pr-2">
					{allKeybinds.map((keybind) => (
						<button
							key={keybind.uuid}
							onClick={() => setSelectedKeybindId(keybind.uuid)}
							className={`w-full text-left p-3 rounded-lg transition-colors duration-150 ${selectedKeybindId === keybind.uuid ? "bg-violet-500/20 ring-2 ring-violet-500" : "bg-slate-800 hover:bg-slate-700"}`}
						>
							<h3 className="font-semibold text-slate-100 truncate">
								{keybind.name}
							</h3>
							<p className="text-sm text-slate-400 truncate">
								{keyIdToNameMap.get(keybind.keyId) ||
									keybind.keyId ||
									"No key set"}
							</p>
						</button>
					))}
					{allKeybinds.length === 0 && (
						<div className="text-center text-slate-500 pt-10">
							No keybinds configured.
						</div>
					)}
				</div>
			</div>

			{/* Right Panel: Keybind Editor */}
			<div className="flex-grow bg-slate-800/50 rounded-lg p-4 ring-1 ring-slate-700 overflow-y-auto">
				{selectedKeybind ? (
					<div>
						<div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-700">
							<h2 className="text-2xl font-bold text-slate-100">
								{selectedKeybind.name}
							</h2>
							<Button
								onClick={() => setDeletingKeybindId(selectedKeybind.uuid)}
								className="bg-rose-600 hover:bg-rose-500"
							>
								<TrashIcon className="w-5 h-5 sm:mr-2" />
								<span className="hidden sm:inline">Delete</span>
							</Button>
						</div>
						<KeybindEditor
							keybind={selectedKeybind}
							updateKeybind={updateKeybind}
						/>
					</div>
				) : (
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
							<rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
							<path d="M12 8v8" />
							<path d="M8 12h8" />
						</svg>
						<h3 className="text-lg font-semibold">Select a keybind to edit</h3>
						<p className="text-sm">
							Choose a keybind from the list, or add a new one.
						</p>
					</div>
				)}
			</div>

			<ConfirmationDialog
				open={!!deletingKeybindId}
				onCancel={() => setDeletingKeybindId(null)}
				onConfirm={handleDeleteKeybind}
				title="Delete Keybind?"
				message={
					<>
						Are you sure you want to delete the{" "}
						<strong>
							"{deletingKeybindId && avatar.keybinds?.[deletingKeybindId]?.name}
							"
						</strong>{" "}
						keybind? This action is permanent.
					</>
				}
				variant="danger"
				confirmText="Delete"
			/>
		</div>
	);
}
