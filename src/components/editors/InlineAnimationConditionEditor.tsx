// src/components/editors/InlineAnimationConditionEditor.tsx
import { useState } from "react";
import { AnimationConditionEditor } from "@/components/editors/AnimationConditionEditor";
import { Button } from "@/components/ui/Button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
} from "@/components/ui/Dialog";
import { EditIcon } from "@/components/ui/icons";
import type { Condition } from "@/types";
import { summarizeCondition } from "./animation-condition/helpers";

interface InlineAnimationConditionEditorProps {
	condition?: Condition;
	updateCondition: (c: Condition | undefined) => void;
}

export function InlineAnimationConditionEditor({
	condition,
	updateCondition,
}: InlineAnimationConditionEditorProps) {
	const [isOpen, setIsOpen] = useState(false);
	// Local state for editing within the modal
	const [localCondition, setLocalCondition] = useState<Condition | undefined>(
		condition,
	);

	const openModal = () => {
		// Deep copy of the condition to edit it locally
		setLocalCondition(
			condition ? JSON.parse(JSON.stringify(condition)) : undefined,
		);
		setIsOpen(true);
	};

	const handleSave = () => {
		updateCondition(localCondition);
		setIsOpen(false);
	};

	const handleCancel = () => {
		setIsOpen(false);
	};

	const summary = summarizeCondition(condition);

	return (
		<>
			<button
				type="button"
				className="w-full text-left p-2 rounded-md transition-colors bg-slate-800/50 border border-slate-700 hover:border-violet-500 hover:bg-slate-800/80 cursor-pointer flex justify-between items-center"
				onClick={openModal}
			>
				<span className="text-sm text-slate-300 truncate" title={summary}>
					{summary}
				</span>
				<div className="flex items-center gap-2 text-slate-400">
					<span>Edit</span>
					<EditIcon className="w-4 h-4" />
				</div>
			</button>

			<Dialog
				open={isOpen}
				onClose={handleCancel}
				dismissable={false}
				className="max-w-4xl max-h-[90vh] flex flex-col"
			>
				<DialogHeader>Edit Activation Condition</DialogHeader>
				<DialogContent className="flex-grow overflow-y-auto pr-4 -mr-4">
					<div className="bg-slate-900/50 p-4 rounded-lg ring-1 ring-slate-700 min-h-[300px]">
						<AnimationConditionEditor
							condition={localCondition}
							updateCondition={setLocalCondition}
						/>
					</div>
				</DialogContent>
				<DialogFooter>
					<Button
						onClick={handleCancel}
						className="bg-slate-600 hover:bg-slate-500"
					>
						Cancel
					</Button>
					<Button
						onClick={handleSave}
						className="bg-violet-600 hover:bg-violet-500"
					>
						Save Condition
					</Button>
				</DialogFooter>
			</Dialog>
		</>
	);
}