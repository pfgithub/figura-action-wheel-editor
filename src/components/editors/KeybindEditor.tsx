import { FormRow } from "@/components/ui/FormRow";
import { Select } from "@/components/ui/Select";
import { useKeybindsList } from "@/hooks/useKeybindsList";
import type { Keybind } from "@/types";
import { ActionEffectEditor } from "./ActionEffectEditor";

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
			<p className="text-xs text-slate-400 -mt-3 mb-3">
				The effect is run when the keybind is pressed.
			</p>
			<ActionEffectEditor
				effect={keybind.effect}
				updateEffect={(effect) => handleUpdate("effect", effect)}
			/>
		</div>
	);
}