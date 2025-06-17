// src/components/editors/KeybindEditor.tsx
import React from "react";
import type { Keybind } from "@/types";
import { FormRow } from "@/components/ui/FormRow";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ActionEffectEditor } from "./ActionEffectEditor";
import { useKeybindsList } from "@/hooks/useKeybindsList";

interface KeybindEditorProps {
	keybind: Keybind;
	updateKeybind: (k: Keybind) => void;
}

export function KeybindEditor({ keybind, updateKeybind }: KeybindEditorProps) {
	const { keybinds: keybindsList, loading } = useKeybindsList();

	const handleUpdate = <K extends keyof Keybind>(key: K, value: Keybind[K]) => {
		updateKeybind({ ...keybind, [key]: value });
	};

	return (
		<div className="space-y-4">
			<FormRow label="Name">
				<Input
					type="text"
					value={keybind.name}
					onChange={(e) => handleUpdate("name", e.target.value)}
					placeholder="e.g., Toggle Crouch"
				/>
			</FormRow>

			<FormRow label="Key">
				<Select
					value={keybind.keyId}
					onChange={(e) => handleUpdate("keyId", e.target.value)}
					disabled={loading}
				>
					<option value="">-- Select a key --</option>
					{keybindsList?.map((k) => (
						<option key={k.id} value={k.id}>
							{k.name}
						</option>
					))}
				</Select>
			</FormRow>

			<hr className="border-slate-700/60 my-6" />

			<h4 className="text-lg font-semibold text-slate-300 border-b border-slate-700 pb-2 mb-4">
				Action Effect
			</h4>
			<ActionEffectEditor
				effect={keybind.effect}
				updateEffect={(effect) => handleUpdate("effect", effect)}
			/>
		</div>
	);
}
