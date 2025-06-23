import {
	DndContext,
	type DragEndEvent,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	arrayMove,
	SortableContext,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import { AnimationConditionEditor } from "@/components/editors/AnimationConditionEditor";
import { Button } from "@/components/ui/Button";
import { FormRow } from "@/components/ui/FormRow";
import { PlusIcon, TrashIcon } from "@/components/ui/icons";
import { Select } from "@/components/ui/Select";
import { useAvatarStore } from "@/store/avatarStore";
import type { Layer, LayerCondition, UUID } from "@/types";
import { generateUUID } from "@/utils/uuid";

interface SortableConditionItemProps {
	condition: LayerCondition;
	layer: Layer;
	updateCondition: (newCondition: LayerCondition) => void;
	deleteCondition: () => void;
}

function GripVerticalIcon() {
	return (
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
			className="w-5 h-5"
		>
			<circle cx="9" cy="12" r="1" />
			<circle cx="9" cy="5" r="1" />
			<circle cx="9" cy="19" r="1" />
			<circle cx="15" cy="12" r="1" />
			<circle cx="15" cy="5" r="1" />
			<circle cx="15" cy="19" r="1" />
		</svg>
	);
}

function SortableConditionItem({
	condition,
	layer,
	updateCondition,
	deleteCondition,
}: SortableConditionItemProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: condition.uuid });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		zIndex: isDragging ? 10 : "auto",
	};
	const nodes = Object.values(layer.nodes);

	return (
		<div
			ref={setNodeRef}
			style={style}
			className="bg-slate-900/50 rounded-lg ring-1 ring-slate-700"
		>
			<div className="flex items-center p-2 border-b border-slate-700/50">
				<button
					{...attributes}
					{...listeners}
					type="button"
					className="cursor-grab text-slate-500 hover:text-white p-1"
				>
					<GripVerticalIcon />
				</button>
				<div className="flex-grow" />
				<Button
					onClick={deleteCondition}
					className="bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 w-8 h-8 p-0 flex-shrink-0"
				>
					<TrashIcon className="w-4 h-4" />
				</Button>
			</div>
			<div className="p-4 space-y-4">
				<FormRow label="Target Node">
					<Select
						value={condition.targetNode ?? ""}
						onChange={(e) =>
							updateCondition({ ...condition, targetNode: e.target.value as UUID })
						}
					>
						<option value="">-- Select Target --</option>
						{nodes.map((n) => (
							<option key={n.uuid} value={n.uuid}>
								{n.name}
							</option>
						))}
					</Select>
				</FormRow>
				<div>
					<label className="text-slate-400 text-sm font-medium mb-2 block">
						Activation Condition
					</label>
					<AnimationConditionEditor
						condition={condition.condition}
						updateCondition={(c) =>
							updateCondition({ ...condition, condition: c })
						}
					/>
				</div>
			</div>
		</div>
	);
}

export function LayerConditionsEditor({ layer }: { layer: Layer }) {
	const { updateAvatar } = useAvatarStore();

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8,
			},
		}),
	);

	const handleUpdateLayer = (updater: (draftLayer: Layer) => void) => {
		updateAvatar((draft) => {
			if (draft.layers?.[layer.uuid]) {
				updater(draft.layers[layer.uuid]);
			}
		});
	};

	const handleAddCondition = () => {
		const newCondition: LayerCondition = {
			uuid: generateUUID(),
		};
		handleUpdateLayer((draft) => {
			draft.conditions.push(newCondition);
		});
	};

	const handleUpdateCondition = (updatedCondition: LayerCondition) => {
		handleUpdateLayer((draft) => {
			const index = draft.conditions.findIndex(
				(c) => c.uuid === updatedCondition.uuid,
			);
			if (index !== -1) {
				draft.conditions[index] = updatedCondition;
			}
		});
	};

	const handleDeleteCondition = (conditionUuid: UUID) => {
		handleUpdateLayer((draft) => {
			draft.conditions = draft.conditions.filter((c) => c.uuid !== conditionUuid);
		});
	};

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		if (over && active.id !== over.id) {
			handleUpdateLayer((draft) => {
				const oldIndex = draft.conditions.findIndex((c) => c.uuid === active.id);
				const newIndex = draft.conditions.findIndex((c) => c.uuid === over.id);
				if (oldIndex !== -1 && newIndex !== -1) {
					draft.conditions = arrayMove(draft.conditions, oldIndex, newIndex);
				}
			});
		}
	};

	return (
		<div className="bg-slate-800/50 rounded-lg p-4 ring-1 ring-slate-700">
			<h3 className="text-xl font-bold mb-1">Conditions</h3>
			<p className="text-sm text-slate-400 mb-4">
				The first condition in this list that evaluates to true will determine the
				active node.
			</p>
			<div className="space-y-4">
				<DndContext sensors={sensors} onDragEnd={handleDragEnd}>
					<SortableContext
						items={layer.conditions.map((c) => c.uuid)}
						strategy={verticalListSortingStrategy}
					>
						{layer.conditions.map((condition) => (
							<SortableConditionItem
								key={condition.uuid}
								condition={condition}
								layer={layer}
								updateCondition={handleUpdateCondition}
								deleteCondition={() => handleDeleteCondition(condition.uuid)}
							/>
						))}
					</SortableContext>
				</DndContext>
				{layer.conditions.length === 0 && (
					<p className="text-slate-500 text-center py-4">No conditions set.</p>
				)}
				<Button
					onClick={handleAddCondition}
					className="w-full bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300"
				>
					<PlusIcon className="w-5 h-5 mr-2" /> Add Condition
				</Button>
			</div>
		</div>
	);
}