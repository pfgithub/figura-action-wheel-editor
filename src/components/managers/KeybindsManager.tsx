import React, { useState } from "react";
import { KeybindEditor } from "@/components/editors/KeybindEditor";
import { MasterDetailManager } from "@/components/layout/MasterDetailManager";
import { useKeybindsList } from "@/hooks/useKeybindsList";
import { useAvatarStore } from "@/store/avatarStore";
import type { Keybind, UUID } from "@/types";
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
			<rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
			<path d="M12 8v8" />
			<path d="M8 12h8" />
		</svg>
		<h3 className="text-lg font-semibold">Select a keybind to edit</h3>
		<p className="text-sm">Choose a keybind from the list, or add a new one.</p>
	</div>
);

export function KeybindsManager() {
	const { avatar, updateAvatar } = useAvatarStore();
	const { keybinds: keybindsList } = useKeybindsList();
	const [selectedId, setSelectedId] = useState<UUID | null>(null);

	const keyIdToNameMap = React.useMemo(() => {
		const map = new Map<string, string>();
		if (keybindsList) {
			for (const item of keybindsList) {
				map.set(item.id, item.name);
			}
		}
		return map;
	}, [keybindsList]);

	const allKeybinds = Object.values(avatar?.keybinds ?? {}).sort((a, b) =>
		a.name.localeCompare(b.name),
	);

	if (!avatar) return null;

	const handleAddKeybind = () => {
		const newUuid = generateUUID();
		const newKeybind: Keybind = {
			uuid: newUuid,
			name: `New Keybind ${Object.keys(avatar.keybinds ?? {}).length + 1}`,
			keyId: "",
		};
		updateAvatar((draft) => {
			draft.keybinds ??= {};
			draft.keybinds[newUuid] = newKeybind;
		});
		setSelectedId(newUuid);
	};

	const handleDelete = (itemToDelete: Keybind) => {
		if (!itemToDelete) return;
		updateAvatar((draft) => {
			if (draft.keybinds) {
				delete draft.keybinds[itemToDelete.uuid];
			}
		});
		if (selectedId === itemToDelete.uuid) {
			setSelectedId(null);
		}
	};

	const updateKeybind = (updatedKeybind: Keybind) => {
		updateAvatar((draft) => {
			if (draft.keybinds) {
				draft.keybinds[updatedKeybind.uuid] = updatedKeybind;
			}
		});
	};

	return (
		<MasterDetailManager<Keybind>
			items={allKeybinds}
			selectedId={selectedId}
			onSelectId={setSelectedId}
			title="Keybinds"
			onAddItem={handleAddKeybind}
			onDeleteItem={handleDelete}
			editorTitle={(keybind) => keybind.name}
			renderListItem={(keybind, isSelected) => (
				<button
					className={`w-full text-left p-3 rounded-lg transition-colors duration-150 ${
						isSelected
							? "bg-violet-500/20 ring-2 ring-violet-500"
							: "bg-slate-800 hover:bg-slate-700"
					}`}
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
			)}
			renderEditor={(keybind) => (
				<KeybindEditor
					key={keybind.uuid}
					keybind={keybind}
					updateKeybind={updateKeybind}
				/>
			)}
			renderEmptyState={() => <EmptyState />}
		/>
	);
}