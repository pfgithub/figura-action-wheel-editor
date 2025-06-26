// src/components/editors/InlineAnimationConditionEditor.tsx
import { useMemo, useState } from "react";
import { AnimationConditionEditor } from "@/components/editors/AnimationConditionEditor";
import { Button } from "@/components/ui/Button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
} from "@/components/ui/Dialog";
import { EditIcon } from "@/components/ui/icons";
import { renderValues } from "@/data/renderSettings";
import { useScriptInstanceMap } from "@/hooks/useScriptData";
import { useAvatarStore } from "@/store/avatarStore";
import type { AnimationRef, Condition } from "@/types";

const displayAnimationRef = (ref: AnimationRef) => {
	const loop = ref.loop ? ` (${ref.loop})` : "";
	return `${ref.model}.${ref.animation}${loop}`;
};

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

	const { avatar } = useAvatarStore();
	const scriptInstanceMap = useScriptInstanceMap();

	const preview = useMemo(() => {
		if (!condition) return "Always Active";
		if (!avatar) return "Loading preview...";

		const generate = (cond: Condition): string => {
			switch (cond.kind) {
				case "and":
					if (cond.conditions.length === 0) return "Always True (Empty AND)";
					if (cond.conditions.length === 1) return generate(cond.conditions[0]);
					return `(${cond.conditions.map(generate).join(" and ")})`;
				case "or":
					if (cond.conditions.length === 0) return "Always False (Empty OR)";
					if (cond.conditions.length === 1) return generate(cond.conditions[0]);
					return `(${cond.conditions.map(generate).join(" or ")})`;
				case "not":
					return `NOT (${cond.condition ? generate(cond.condition) : "Anything"})`;
				case "render": {
					const value = cond.render ? renderValues.get(cond.render) : null;
					return value?.name ?? "Unset State";
				}
				case "animation": {
					const animName = cond.animation
						? displayAnimationRef(cond.animation)
						: "Unset Animation";
					return `Animation '${animName}' is ${cond.mode}`;
				}
				case "script": {
					const instanceDetails = cond.scriptInstance
						? scriptInstanceMap.get(cond.scriptInstance)
						: null;
					if (!instanceDetails) return "Unset Script Condition";
					const conditionDef = cond.condition
						? instanceDetails.type.defines.conditions[cond.condition]
						: null;
					return `Script '${instanceDetails.instance.name}': '${conditionDef?.name ?? "Unset"}'`;
				}
				case "variable": {
					const variable = cond.variable
						? avatar.variables?.[cond.variable]
						: null;
					if (!variable) return "Unset Variable";
					if (cond.value === undefined)
						return `Variable '${variable.name}' has any value`;
					if (cond.value === null)
						return `Variable '${variable.name}' has no value`;
					const value = cond.value ? variable.values[cond.value] : null;
					return `Variable '${variable.name}' is '${value?.label ?? "Unset Value"}'`;
				}
				default:
					return "Unknown Condition";
			}
		};
		return generate(condition);
	}, [condition, avatar, scriptInstanceMap]);

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

	return (
		<>
			<button
				type="button"
				className="w-full text-left p-2 rounded-md transition-colors bg-slate-800/50 border border-slate-700 hover:border-violet-500 hover:bg-slate-800/80 cursor-pointer flex justify-between items-center"
				onClick={openModal}
			>
				<span className="text-sm text-slate-300 truncate" title={preview}>
					{preview}
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