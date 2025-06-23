import {
	DndContext,
	type DragEndEvent,
	DragOverlay,
	type DragStartEvent,
	PointerSensor,
	pointerWithin,
	useDraggable,
	useDroppable,
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
import { produce } from "immer";
import { useMemo, useState } from "react";
import { ToggleGroupControls } from "@/components/shared/ToggleGroupControls";
import { FormRow } from "@/components/ui/FormRow";
import { Select } from "@/components/ui/Select";
import { useScriptInstancesWithDefine } from "@/hooks/useScriptData";
import { useAvatarStore } from "@/store/avatarStore";
import type { ActionEffect, AnimationRef, UUID } from "@/types";
import { generateUUID } from "@/utils/uuid";

// --- Types & Data ---
type PaletteItemKind = ActionEffect["kind"];

const effectKindData: {
	[key in PaletteItemKind]: {
		label: string;
		border: string;
		bg: string;
		text: string;
	};
} = {
	toggle: {
		label: "Toggle Option",
		border: "border-sky-500",
		bg: "bg-sky-900/30",
		text: "text-sky-300",
	},
	switchPage: {
		label: "Switch Wheel",
		border: "border-emerald-500",
		bg: "bg-emerald-900/30",
		text: "text-emerald-300",
	},
	scriptAction: {
		label: "Script Action",
		border: "border-amber-500",
		bg: "bg-amber-900/30",
		text: "text-amber-300",
	},
	toggleAnimation: {
		label: "Toggle Animation",
		border: "border-rose-500",
		bg: "bg-rose-900/30",
		text: "text-rose-300",
	},
};

const createNewEffectNode = (kind: PaletteItemKind): ActionEffect => {
	const id = generateUUID();
	switch (kind) {
		case "toggle":
			return { id, kind };
		case "switchPage":
			return { id, kind };
		case "scriptAction":
			return { id, kind };
		case "toggleAnimation":
			return { id, kind };
	}
};

const displayAnimationRef = (ref: AnimationRef) =>
	`${ref.model}.${ref.animation}`;

// --- UI Components ---
const GripVerticalIcon = () => (
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
		className="w-4 h-4"
	>
		<circle cx="9" cy="12" r="1" />
		<circle cx="9" cy="5" r="1" />
		<circle cx="9" cy="19" r="1" />
		<circle cx="15" cy="12" r="1" />
		<circle cx="15" cy="5" r="1" />
		<circle cx="15" cy="19" r="1" />
	</svg>
);
const TrashIcon = () => (
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
		className="w-4 h-4"
	>
		<path d="M3 6h18" />
		<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
	</svg>
);

// --- Effect Palette ---
function PaletteItem({ kind }: { kind: PaletteItemKind }) {
	const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
		id: `palette-${kind}`,
		data: { kind },
	});
	const style = effectKindData[kind];
	return (
		<div
			ref={setNodeRef}
			{...listeners}
			{...attributes}
			className={`flex items-center gap-2 p-2 rounded-md cursor-grab ${style.bg} ${style.border} border-l-4 ${isDragging ? "opacity-50" : ""}`}
		>
			<span className="text-xs text-slate-400">
				<GripVerticalIcon />
			</span>
			<span className={`font-semibold text-sm ${style.text}`}>
				{style.label}
			</span>
		</div>
	);
}

function EffectPalette() {
	const paletteItems: PaletteItemKind[] = [
		"toggle",
		"switchPage",
		"scriptAction",
		"toggleAnimation",
	];
	return (
		<div className="w-64 flex-shrink-0 p-3 bg-slate-900/50 rounded-lg space-y-2 self-start">
			<h3 className="font-bold text-slate-300 mb-2">Effects</h3>
			{paletteItems.map((kind) => (
				<PaletteItem key={kind} kind={kind} />
			))}
		</div>
	);
}

// --- Specific Effect Forms ---
function EffectForm({
	effect,
	onUpdate,
}: {
	effect: ActionEffect;
	onUpdate: (updater: (draft: ActionEffect) => void) => void;
}) {
	const { avatar, animations } = useAvatarStore();
	const allScriptInstances = useScriptInstancesWithDefine("action");

	if (!avatar) return null;

	const allToggleGroups = Object.values(avatar.toggleGroups ?? {});
	const allActionWheels = Object.values(avatar.actionWheels ?? {});

	const selectedToggleGroup =
		effect.kind === "toggle"
			? allToggleGroups.find((g) => g.uuid === effect.toggleGroup)
			: null;
	const selectedScriptInstanceData =
		effect.kind === "scriptAction"
			? allScriptInstances.find(
					(i) => i.instance.uuid === effect.scriptInstance,
				)
			: null;
	const availableScriptWheels = selectedScriptInstanceData
		? Object.values(selectedScriptInstanceData.type.defines.action)
		: [];

	switch (effect.kind) {
		case "toggle":
			return (
				<>
					<FormRow label="Toggle Group">
						<ToggleGroupControls
							selectedGroupUUID={effect.toggleGroup}
							onGroupChange={(newUUID) => {
								onUpdate((d) => {
									if (d.kind === "toggle") {
										d.toggleGroup = newUUID;
										d.value = undefined;
									}
								});
							}}
						/>
					</FormRow>
					<FormRow label="Value">
						<Select
							value={effect.value ?? ""}
							onChange={(e) =>
								onUpdate((d) => {
									if (d.kind === "toggle")
										d.value = e.target.value
											? (e.target.value as UUID)
											: undefined;
								})
							}
							disabled={!effect.toggleGroup}
						>
							<option value="">
								{effect.toggleGroup
									? "-- Select an option --"
									: "-- First select a group --"}
							</option>
							{selectedToggleGroup &&
								Object.entries(selectedToggleGroup.options).map(
									([uuid, option]) => (
										<option key={uuid} value={uuid}>
											{option.name}
										</option>
									),
								)}
						</Select>
					</FormRow>
				</>
			);
		case "switchPage":
			return (
				<FormRow label="Target Wheel">
					<Select
						value={effect.actionWheel ?? ""}
						onChange={(e) =>
							onUpdate((d) => {
								if (d.kind === "switchPage")
									d.actionWheel = e.target.value
										? (e.target.value as UUID)
										: undefined;
							})
						}
						disabled={allActionWheels.length === 0}
					>
						<option value="">-- Select a wheel --</option>
						{allActionWheels.map((w) => (
							<option key={w.uuid} value={w.uuid}>
								{w.title}
							</option>
						))}
					</Select>
				</FormRow>
			);
		case "scriptAction":
			return (
				<>
					<FormRow label="Script Instance">
						<Select
							value={effect.scriptInstance ?? ""}
							onChange={(e) =>
								onUpdate((d) => {
									if (d.kind === "scriptAction") {
										d.scriptInstance = e.target.value
											? (e.target.value as UUID)
											: undefined;
										d.scriptAction = undefined;
									}
								})
							}
							disabled={allScriptInstances.length === 0}
						>
							<option value="">
								{allScriptInstances.length > 0
									? "-- Select an instance --"
									: "-- No instances provide wheels --"}
							</option>
							{allScriptInstances.map(({ instance, script }) => (
								<option key={instance.uuid} value={instance.uuid}>
									{script.name} - {instance.name}
								</option>
							))}
						</Select>
					</FormRow>
					<FormRow label="Target Action">
						<Select
							value={effect.scriptAction ?? ""}
							onChange={(e) =>
								onUpdate((d) => {
									if (d.kind === "scriptAction")
										d.scriptAction = e.target.value
											? (e.target.value as UUID)
											: undefined;
								})
							}
							disabled={!effect.scriptInstance}
						>
							<option value="">
								{effect.scriptInstance
									? "-- Select an action --"
									: "-- First select an instance --"}
							</option>
							{availableScriptWheels.map((w) => (
								<option key={w.uuid} value={w.uuid}>
									{w.name}
								</option>
							))}
						</Select>
					</FormRow>
				</>
			);
		case "toggleAnimation":
			return (
				<FormRow label="Animation">
					<Select
						value={effect.animation ? JSON.stringify(effect.animation) : ""}
						onChange={(e) =>
							onUpdate((d) => {
								if (d.kind === "toggleAnimation")
									d.animation = e.target.value
										? (JSON.parse(e.target.value) as AnimationRef)
										: undefined;
							})
						}
						disabled={animations.length === 0}
					>
						<option value="">
							{animations.length > 0
								? "-- Select an animation --"
								: "-- No animations found --"}
						</option>
						{animations.map((anim) => (
							<option key={JSON.stringify(anim)} value={JSON.stringify(anim)}>
								{displayAnimationRef(anim)}
							</option>
						))}
					</Select>
				</FormRow>
			);
		default:
			return null;
	}
}

// --- Draggable Effect Node ---
function EffectNode({
	effect,
	onUpdate,
	onDelete,
}: {
	effect: ActionEffect;
	onUpdate: (updatedEffect: ActionEffect) => void;
	onDelete: () => void;
}) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: effect.id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.4 : 1,
	};
	const kindStyle = effectKindData[effect.kind];

	const handleUpdate = (updater: (draft: ActionEffect) => void) => {
		onUpdate(produce(effect, updater));
	};

	return (
		<div ref={setNodeRef} style={style}>
			<div className={`rounded-lg border ${kindStyle.border} ${kindStyle.bg}`}>
				<div
					className={`flex items-center justify-between p-2 rounded-t-lg ${kindStyle.bg.replace("30", "50").replace("50", "60")}`}
				>
					<div className="flex items-center gap-1">
						<button
							{...attributes}
							{...listeners}
							className="p-1 cursor-grab text-slate-500 hover:text-white"
						>
							<GripVerticalIcon />
						</button>
						<span className={`font-bold ${kindStyle.text}`}>
							{kindStyle.label}
						</span>
					</div>
					<button
						onClick={onDelete}
						className="p-1 text-rose-400 hover:text-white hover:bg-rose-500 rounded-full w-6 h-6 flex items-center justify-center"
					>
						<TrashIcon />
					</button>
				</div>
				<div className="p-3 space-y-4">
					<EffectForm effect={effect} onUpdate={handleUpdate} />
				</div>
			</div>
		</div>
	);
}

// --- Main Editor ---
interface ActionEffectEditorProps {
	effects?: ActionEffect[];
	updateEffects: (e: ActionEffect[]) => void;
}

const DROP_ZONE_ID = "effect-drop-zone";

function ActionEffectEditorInner({
	activeId,
	effects = [],
	updateEffects,
}: ActionEffectEditorProps & { activeId: string | null }) {
	const activeItem = useMemo(
		() =>
			(activeId && effects.find((e) => e.id === activeId)) ||
			(activeId?.startsWith("palette-")
				? {
						id: activeId,
						kind: activeId.replace("palette-", "") as PaletteItemKind,
					}
				: null),
		[activeId, effects],
	);

	const { setNodeRef: setDropZoneRef, isOver: isDropZoneOver } = useDroppable({
		id: DROP_ZONE_ID,
	});

	return (
		<>
			<div className="flex gap-4 items-start">
				<EffectPalette />
				<div className="flex-grow min-h-[100px] space-y-2">
					<SortableContext
						items={effects.map((e) => e.id)}
						strategy={verticalListSortingStrategy}
					>
						{effects.map((effect, index) => (
							<EffectNode
								key={effect.id}
								effect={effect}
								onUpdate={(updated) => {
									const newEffects = [...effects];
									newEffects[index] = updated;
									updateEffects(newEffects);
								}}
								onDelete={() =>
									updateEffects(effects.filter((_, i) => i !== index))
								}
							/>
						))}
					</SortableContext>
					<div
						ref={setDropZoneRef}
						className={`w-full text-center p-4 my-2 border-2 border-dashed rounded-lg transition-colors ${
							isDropZoneOver
								? "bg-violet-500/30 border-violet-400"
								: "bg-slate-800/50 border-slate-600"
						}`}
					>
						<p className="text-slate-400 text-sm">
							{effects.length > 0
								? "Drag from panel to add"
								: "Drag an effect from the panel to start"}
						</p>
					</div>
				</div>
			</div>
			<DragOverlay>
				{activeItem ? (
					<div
						className={`p-2 rounded-lg border-2 ${effectKindData[activeItem.kind]?.border} ${effectKindData[activeItem.kind]?.bg} opacity-90 shadow-2xl`}
					>
						<span
							className={`font-bold ${effectKindData[activeItem.kind]?.text}`}
						>
							{effectKindData[activeItem.kind]?.label}
						</span>
					</div>
				) : null}
			</DragOverlay>
		</>
	);
}

export function ActionEffectEditor({
	effects = [],
	updateEffects,
}: ActionEffectEditorProps) {
	const [activeId, setActiveId] = useState<string | null>(null);

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
	);

	const handleDragStart = (event: DragStartEvent) => {
		setActiveId(event.active.id as string);
	};

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		setActiveId(null);

		console.log("dragEnd", event);

		if (!over) {
			return;
		}

		// Handle adding a new item from the palette
		if (active.id.toString().startsWith("palette-")) {
			const kind = active.data.current?.kind as PaletteItemKind;
			if (!kind) return;
			const newEffect = createNewEffectNode(kind);

			if (over.id === DROP_ZONE_ID) {
				// Dropped on the main drop zone, append to the end
				updateEffects([...effects, newEffect]);
			} else {
				// Dropped on an existing item, insert after it
				const overIndex = effects.findIndex((item) => item.id === over.id);
				if (overIndex !== -1) {
					const newEffects = [...effects];
					newEffects.splice(overIndex + 1, 0, newEffect);
					updateEffects(newEffects);
				} else {
					// Fallback: if 'over' item not found, just append
					updateEffects([...effects, newEffect]);
				}
			}
			return;
		}

		// Handle reordering an existing item
		if (active.id !== over.id) {
			const oldIndex = effects.findIndex((item) => item.id === active.id);
			const newIndex = effects.findIndex((item) => item.id === over.id);

			if (oldIndex > -1 && newIndex > -1) {
				updateEffects(arrayMove(effects, oldIndex, newIndex));
			}
		}
	};

	const handleDragCancel = () => {
		setActiveId(null);
	};
	return (
		<DndContext
			sensors={sensors}
			collisionDetection={pointerWithin}
			onDragStart={handleDragStart}
			onDragEnd={handleDragEnd}
			onDragCancel={handleDragCancel}
		>
			<ActionEffectEditorInner
				activeId={activeId}
				effects={effects}
				updateEffects={updateEffects}
			/>
		</DndContext>
	);
}
