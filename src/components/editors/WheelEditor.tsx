import { useState } from "react";
import { ActionEditor } from "@/components/editors/ActionEditor";
import { ActionWheelVisualizer } from "@/components/ui/ActionWheelVisualizer";
import { useAvatarStore } from "@/store/avatarStore";
import type { Action, ActionWheel, UUID } from "@/types";
import { generateUUID } from "@/utils/uuid";

const MAX_ACTIONS_PER_WHEEL = 8;

interface WheelEditorProps {
	wheel: ActionWheel;
}

const EditorEmptyState = () => (
	<div className="flex flex-col items-center justify-center h-full bg-slate-800/50 rounded-lg p-8 text-slate-500 ring-1 ring-slate-700 min-h-[400px]">
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
			className="w-12 h-12 mb-4 text-slate-600"
		>
			<path d="m21.1 16.3-4.2-4.2a2 2 0 0 0-2.8 0L3.7 22a2 2 0 0 1-2.8-2.8l10.4-10.4a2 2 0 0 0 0-2.8L7.1 1.7a2 2 0 0 1 2.8 0l11.2 11.2a2 2 0 0 1 0 2.8z" />
			<path d="m22 22-2.5-2.5" />
			<path d="m3.5 3.5 2.5 2.5" />
		</svg>
		<p className="font-medium">Select an action to edit</p>
		<p className="text-sm text-center">
			Click a slot on the wheel, or drag to reorder.
		</p>
	</div>
);

export function WheelEditor({ wheel }: WheelEditorProps) {
	const { avatar, updateAvatar } = useAvatarStore();
	const [selectedActionIndex, setSelectedActionIndex] = useState<number | null>(
		null,
	);

	if (!avatar) return null;

	const addAction = (wheelUuid: UUID) => {
		updateAvatar((draft) => {
			const targetWheel = draft.actionWheels[wheelUuid];
			if (targetWheel && targetWheel.actions.length < MAX_ACTIONS_PER_WHEEL) {
				const newAction: Action = {
					uuid: generateUUID(),
					icon: { type: "item", id: "minecraft:stone" },
					label: `Action ${targetWheel.actions.length + 1}`,
					color: [90, 90, 90],
				};
				targetWheel.actions.push(newAction);
				setSelectedActionIndex(targetWheel.actions.length - 1);
			} else if (targetWheel) {
				alert(
					`A wheel can have a maximum of ${MAX_ACTIONS_PER_WHEEL} actions.`,
				);
			}
		});
	};

	const selectedActionData = (() => {
		if (selectedActionIndex === null) return null;
		const action = wheel.actions[selectedActionIndex];
		if (!action) return null;
		return {
			wheel,
			action,
			wheelUuid: wheel.uuid,
			actionIndex: selectedActionIndex,
		};
	})();

	const updateSelectedAction = (newAction: Action) => {
		if (!selectedActionData) return;
		const { wheelUuid, actionIndex } = selectedActionData;
		updateAvatar((draft) => {
			draft.actionWheels[wheelUuid].actions[actionIndex] = newAction;
		});
	};

	const deleteSelectedAction = () => {
		if (!selectedActionData) return;
		const { wheelUuid, actionIndex } = selectedActionData;
		updateAvatar((draft) => {
			draft.actionWheels[wheelUuid].actions.splice(actionIndex, 1);
		});
		setSelectedActionIndex(null);
	};

	const moveSelectedAction = (targetWheelUuid: UUID) => {
		if (!selectedActionData) return;
		const {
			action,
			wheelUuid: sourceWheelUuid,
			actionIndex,
		} = selectedActionData;
		const targetWheel = avatar.actionWheels[targetWheelUuid];
		if (targetWheel && targetWheel.actions.length >= MAX_ACTIONS_PER_WHEEL) {
			alert(`Cannot move action. Wheel "${targetWheel.title}" is full.`);
			return;
		}
		updateAvatar((draft) => {
			draft.actionWheels[sourceWheelUuid].actions.splice(actionIndex, 1);
			draft.actionWheels[targetWheelUuid].actions.push(action);
		});
		setSelectedActionIndex(null);
	};

	const handleReorder = (
		oldIndex: number,
		newIndex: number,
		preDragSelection: number | null,
	) => {
		updateAvatar((draft) => {
			const targetWheel = draft.actionWheels[wheel.uuid];
			const [moved] = targetWheel.actions.splice(oldIndex, 1);
			targetWheel.actions.splice(newIndex, 0, moved);
		});
		if (preDragSelection === oldIndex) {
			setSelectedActionIndex(newIndex);
		} else {
			setSelectedActionIndex(preDragSelection);
		}
	};

	return (
		<div className="space-y-6 w-full">
			{/* Main Content */}
			<div className="grid lg:grid-cols-2 gap-8 items-start">
				<div className="flex flex-col gap-4 justify-center items-center py-4">
					<ActionWheelVisualizer
						key={wheel.uuid}
						actions={wheel.actions}
						onSelectAction={setSelectedActionIndex}
						onAddAction={() => addAction(wheel.uuid)}
						selectedActionIndex={selectedActionIndex}
						wheelTitle={wheel.title}
						onReorder={(oldIndex, newIndex) =>
							handleReorder(oldIndex, newIndex, selectedActionIndex)
						}
					/>
				</div>

				<div className="flex-1">
					{selectedActionData ? (
						<ActionEditor
							key={`${selectedActionData.wheelUuid}-${selectedActionData.action.uuid}`}
							action={selectedActionData.action}
							updateAction={updateSelectedAction}
							deleteAction={deleteSelectedAction}
							currentWheelUuid={selectedActionData.wheelUuid}
							onMoveAction={moveSelectedAction}
						/>
					) : (
						<EditorEmptyState />
					)}
				</div>
			</div>
		</div>
	);
}
