// src/components/dialogs/ToggleGroupDialog.tsx
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
} from "@/components/ui/Dialog";
import { FormRow } from "@/components/ui/FormRow";
import { Input } from "@/components/ui/Input";
import { PlusIcon, TrashIcon } from "@/components/ui/icons";
import { useAvatarStore } from "@/store/avatarStore";
import type { ToggleGroup, ToggleGroupOption, UUID } from "@/types";
import { generateUUID } from "@/utils/uuid";

interface ToggleGroupDialogProps {
	groupToEdit: ToggleGroup | null;
	onClose: () => void;
	onSave: (uuid: UUID) => void;
}

export function ToggleGroupDialog({
	groupToEdit,
	onClose,
	onSave,
}: ToggleGroupDialogProps) {
	const { updateAvatar } = useAvatarStore();
	const [name, setName] = useState("");
	const [options, setOptions] = useState<{ uuid: UUID; name: string }[]>([]);
	const [saved, setSaved] = useState(true);
	const [nameError, setNameError] = useState("");
	const [optionsError, setOptionsError] = useState("");

	useEffect(() => {
		if (groupToEdit) {
			setName(groupToEdit.name);
			setOptions(
				Object.entries(groupToEdit.options).map(([uuid, option]) => ({
					uuid: uuid as UUID,
					name: option.name,
				})),
			);
			setSaved(groupToEdit.saved ?? true);
		} else {
			setName("New Toggle Group");
			setOptions([{ uuid: generateUUID(), name: "Option 1" }]);
			setSaved(true);
		}
		setNameError("");
		setOptionsError("");
	}, [groupToEdit]);

	const handleOptionChange = (index: number, value: string) => {
		const newOptions = [...options];
		newOptions[index] = { ...newOptions[index], name: value };
		setOptions(newOptions);
	};

	const addOption = () => {
		setOptions([
			...options,
			{ uuid: generateUUID(), name: `Option ${options.length + 1}` },
		]);
	};

	const removeOption = (index: number) => {
		if (options.length > 1) {
			setOptions(options.filter((_, i) => i !== index));
		} else {
			setOptionsError("A group must have at least one option.");
		}
	};

	const validate = (): boolean => {
		let isValid = true;
		setNameError("");
		setOptionsError("");

		if (!name.trim()) {
			setNameError("Group name cannot be empty.");
			isValid = false;
		}

		if (options.some((opt) => !opt.name.trim())) {
			setOptionsError("Option names cannot be empty.");
			isValid = false;
		} else if (
			new Set(options.map((o) => o.name.trim())).size !== options.length
		) {
			setOptionsError("Option names must be unique.");
			isValid = false;
		}
		return isValid;
	};

	const handleSave = () => {
		if (!validate()) return;

		const newUUID = groupToEdit?.uuid ?? generateUUID();
		const optionsRecord: Record<UUID, ToggleGroupOption> = {};
		for (const opt of options) {
			optionsRecord[opt.uuid] = { name: opt.name.trim() };
		}

		const newGroup: ToggleGroup = {
			uuid: newUUID,
			name: name.trim(),
			options: optionsRecord,
			saved,
		};

		updateAvatar((draft) => {
			draft.toggleGroups[newGroup.uuid] = newGroup;
		});

		onSave(newGroup.uuid);
		onClose();
	};

	const handleDelete = () => {
		if (!groupToEdit) return;
		updateAvatar((draft) => {
			delete draft.toggleGroups[groupToEdit.uuid];
		});
		onClose();
	};

	return (
		<Dialog open onClose={onClose}>
			<DialogHeader>
				{groupToEdit ? "Edit Toggle Group" : "Create Toggle Group"}
			</DialogHeader>
			<DialogContent>
				<FormRow label="Group Name">
					<div>
						<Input value={name} onChange={(e) => setName(e.target.value)} />
						{nameError && (
							<p className="text-red-500 text-xs mt-1">{nameError}</p>
						)}
					</div>
				</FormRow>
				<FormRow label="Saved">
					<label className="flex gap-4 items-center">
						<input
							type="checkbox"
							checked={saved}
							onChange={(e) => setSaved(e.target.checked)}
							className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-violet-500 focus:ring-violet-500"
						/>
						<p className="text-xs text-slate-400 mt-1.5 flex-1">
							Saved groups persist their value when the world is reloaded.
						</p>
					</label>
				</FormRow>
				<FormRow label="Options">
					<div />
				</FormRow>
				<div className="space-y-2 max-h-60 overflow-y-auto pr-2 -mt-2">
					{options.map((option, i) => (
						<div key={option.uuid} className="flex gap-2 items-center">
							<Input
								value={option.name}
								onChange={(e) => handleOptionChange(i, e.target.value)}
							/>
							<Button
								onClick={() => removeOption(i)}
								disabled={options.length <= 1}
								className="bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 w-9 h-9 p-0 flex-shrink-0"
							>
								<TrashIcon className="w-5 h-5" />
							</Button>
						</div>
					))}
				</div>
				{optionsError && (
					<p className="text-red-500 text-xs mt-1">{optionsError}</p>
				)}
				<Button
					onClick={addOption}
					className="bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 w-full mt-2"
				>
					<PlusIcon className="w-5 h-5 mr-2" />
					Add Option
				</Button>
			</DialogContent>
			<DialogFooter>
				{groupToEdit && (
					<Button
						onClick={handleDelete}
						className="bg-rose-600 hover:bg-rose-500 mr-auto"
					>
						Delete Group
					</Button>
				)}
				<Button onClick={onClose} className="bg-slate-600 hover:bg-slate-500">
					Cancel
				</Button>
				<Button
					onClick={handleSave}
					className="bg-violet-600 hover:bg-violet-500"
				>
					Save Group
				</Button>
			</DialogFooter>
		</Dialog>
	);
}