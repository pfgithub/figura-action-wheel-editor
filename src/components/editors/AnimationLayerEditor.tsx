import {
	DndContext,
	type DragEndEvent,
	type DragStartEvent,
	PointerSensor,
	useDraggable,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	SortableContext,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import { AnimationConditionEditor } from "@/components/editors/AnimationConditionEditor";
import { Button } from "@/components/ui/Button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
} from "@/components/ui/Dialog";
import { FormRow } from "@/components/ui/FormRow";
import { Input } from "@/components/ui/Input";
import { EditIcon, PlusIcon, TrashIcon } from "@/components/ui/icons";
import { Select } from "@/components/ui/Select";
import { useAvatarStore } from "@/store/avatarStore";
import type {
	AnimationID,
	AnimationLayer,
	AnimationNode,
	AnimationTransition,
	Condition,
	UUID,
} from "@/types";
import { generateUUID } from "@/utils/uuid";

// --- Node Details Panel ---
interface AnimationNodeDetailsEditorProps {
	layer: AnimationLayer;
	node: AnimationNode;
	onNodeChange: (updatedNode: AnimationNode) => void;
	onSetDefault: () => void;
}

function AnimationNodeDetailsEditor({
	layer,
	node,
	onNodeChange,
	onSetDefault,
}: AnimationNodeDetailsEditorProps) {
	const { updateAvatar, animations } = useAvatarStore();
	const [editingTransition, setEditingTransition] =
		useState<AnimationTransition | null>(null);

	const otherNodes = Object.values(layer.nodes).filter(
		(n) => n.uuid !== node.uuid,
	);
	const isNoneNode = node.uuid === layer.noneNode;

	const onUpdate = (field: keyof AnimationNode, value: any) => {
		onNodeChange({ ...node, [field]: value });
	};

	const addTransition = () => {
		const newTransition: AnimationTransition = {
			uuid: generateUUID(),
			targetNode: otherNodes[0]?.uuid,
		};
		onNodeChange({
			...node,
			transitions: [...node.transitions, newTransition],
		});
	};

	const updateTransition = (updated: AnimationTransition) => {
		onNodeChange({
			...node,
			transitions: node.transitions.map((t) =>
				t.uuid === updated.uuid ? updated : t,
			),
		});
	};

	const removeTransition = (uuid: UUID) => {
		onNodeChange({
			...node,
			transitions: node.transitions.filter((t) => t.uuid !== uuid),
		});
	};

	const handleTransitionReorder = ({ active, over }: DragEndEvent) => {
		if (over && active.id !== over.id) {
			const oldIndex = node.transitions.findIndex((t) => t.uuid === active.id);
			const newIndex = node.transitions.findIndex((t) => t.uuid === over.id);
			const newTransitions = [...node.transitions];
			const [moved] = newTransitions.splice(oldIndex, 1);
			newTransitions.splice(newIndex, 0, moved);
			onNodeChange({ ...node, transitions: newTransitions });
		}
	};

	return (
		<>
			<div className="space-y-4">
				<FormRow label="Node Name">
					<Input
						value={node.name}
						onChange={(e) => onUpdate("name", e.target.value)}
						disabled={isNoneNode}
					/>
				</FormRow>
				<FormRow label="Animation">
					<Select
						value={node.animation}
						onChange={(e) => onUpdate("animation", e.target.value)}
						disabled={isNoneNode}
					>
						<option value="">(None)</option>
						{animations.map((anim) => (
							<option key={anim} value={anim}>
								{anim}
							</option>
						))}
					</Select>
				</FormRow>

				<hr className="border-slate-700/60 my-6" />

				<h4 className="text-lg font-semibold text-slate-300">Transitions</h4>
				<p className="text-xs text-slate-400 -mt-2 mb-2">
					Transitions are checked in order. The first one whose condition is met
					will be taken. Drag to reorder.
				</p>

				<DndContext onDragEnd={handleTransitionReorder}>
					<SortableContext
						items={node.transitions.map((t) => t.uuid)}
						strategy={verticalListSortingStrategy}
					>
						<div className="space-y-2">
							{node.transitions.map((t) => (
								<TransitionEditor
									key={t.uuid}
									transition={t}
									otherNodes={otherNodes}
									onUpdate={updateTransition}
									onDelete={() => removeTransition(t.uuid)}
									onEditCondition={() => setEditingTransition(t)}
								/>
							))}
						</div>
					</SortableContext>
				</DndContext>

				<Button
					onClick={addTransition}
					className="w-full mt-2 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300"
				>
					<PlusIcon className="mr-2 h-5 w-5" /> Add Transition
				</Button>
			</div>
			{editingTransition && (
				<Dialog
					open
					onClose={() => setEditingTransition(null)}
					className="max-w-3xl"
				>
					<DialogHeader>Edit Transition Condition</DialogHeader>
					<DialogContent>
						<div className="bg-slate-900/50 p-4 rounded-lg ring-1 ring-slate-700">
							<AnimationConditionEditor
								condition={editingTransition.activationCondition}
								updateCondition={(c) =>
									updateTransition({ ...editingTransition, activationCondition: c })
								}
							/>
						</div>
					</DialogContent>
					<DialogFooter>
						<Button
							onClick={() => setEditingTransition(null)}
							className="bg-slate-600 hover:bg-slate-500"
						>
							Done
						</Button>
					</DialogFooter>
				</Dialog>
			)}
		</>
	);
}
// Sortable Transition Item
function TransitionEditor({
	transition,
	otherNodes,
	onUpdate,
	onDelete,
	onEditCondition,
}: {
	transition: AnimationTransition;
	otherNodes: AnimationNode[];
	onUpdate: (t: AnimationTransition) => void;
	onDelete: () => void;
	onEditCondition: () => void;
}) {
	const { attributes, listeners, setNodeRef, transform, transition: cssTrans } =
		useSortable({ id: transition.uuid });
	const style = {
		transform: CSS.Transform.toString(transform),
		transition: cssTrans,
	};
	return (
		<div
			ref={setNodeRef}
			style={style}
			className="bg-slate-900/50 p-3 rounded-lg ring-1 ring-slate-700 space-y-2"
		>
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<button {...attributes} {...listeners} className="cursor-grab p-1">
						<svg viewBox="0 0 20 20" width="16" fill="currentColor">
							<path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
						</svg>
					</button>
					<span className="text-slate-400 text-sm">Target:</span>
				</div>
				<Button onClick={onDelete} className="!p-1 h-7 w-7 bg-rose-800/50">
					<TrashIcon className="w-4 h-4" />
				</Button>
			</div>
			<div className="flex items-center gap-2 pl-2">
				<Select
					value={transition.targetNode ?? ""}
					onChange={(e) =>
						onUpdate({ ...transition, targetNode: e.target.value as UUID })
					}
					className="flex-grow"
				>
					{otherNodes.length === 0 && (
						<option>-- No other nodes --</option>
					)}
					{otherNodes.map((n) => (
						<option key={n.uuid} value={n.uuid}>
							{n.name}
						</option>
					))}
				</Select>
				<Button
					onClick={onEditCondition}
					className="!p-1 h-8 w-8 bg-slate-700 hover:bg-slate-600 flex-shrink-0"
				>
					<EditIcon className="w-4 h-4" />
				</Button>
			</div>
		</div>
	);
}

// --- Draggable Node Component ---
function DraggableNode({
	node,
	isNone,
	isSelected,
	onSelect,
}: {
	node: AnimationNode;
	isNone: boolean;
	isSelected: boolean;
	onSelect: () => void;
}) {
	const { attributes, listeners, setNodeRef } = useDraggable({
		id: node.uuid,
	});

	let className = `p-3 rounded-lg shadow-lg cursor-grab w-48 transition-colors duration-200 `;
	if (isSelected) {
		className += "bg-violet-600 ring-2 ring-violet-300";
	} else if (isNone) {
		className += "bg-slate-600 hover:bg-slate-500 ring-1 ring-slate-400";
	} else {
		className += "bg-slate-700 hover:bg-slate-600";
	}

	return (
		<div
			ref={setNodeRef}
			style={{
				position: "absolute",
				left: node.position.x,
				top: node.position.y,
				touchAction: "none",
			}}
			className={className}
			onClick={onSelect}
			{...attributes}
			{...listeners}
		>
			<div className="flex items-start gap-2">
				<div className="flex-1">
					<h4 className="font-bold text-white truncate">{node.name}</h4>
					<p className="text-xs text-slate-300 truncate">
						{node.animation || "(No animation)"}
					</p>
				</div>
			</div>
		</div>
	);
}

// --- Main Layer Editor ---
interface AnimationLayerEditorProps {
	layer: AnimationLayer;
}

export function AnimationLayerEditor({ layer }: AnimationLayerEditorProps) {
	const { avatar, updateAvatar, animations } = useAvatarStore();
	const [selectedNodeId, setSelectedNodeId] = useState<UUID | null>(null);
	const [isAddNodeOpen, setAddNodeOpen] = useState(false);
	const [newNodeAnim, setNewNodeAnim] = useState<AnimationID | "">("");

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
	);

	const updateNode = (updatedNode: AnimationNode) => {
		updateAvatar((draft) => {
			const l = draft.animationLayers?.[layer.uuid];
			if (l) l.nodes[updatedNode.uuid] = updatedNode;
		});
	};

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, delta } = event;
		const nodeId = active.id as UUID;
		updateAvatar((draft) => {
			const node = draft.animationLayers?.[layer.uuid]?.nodes[nodeId];
			if (node) {
				node.position.x += delta.x;
				node.position.y += delta.y;
			}
		});
	};

	const handleAddNode = () => {
		if (!newNodeAnim) return;
		const uuid = generateUUID();
		const newName =
			newNodeAnim.split(".").pop() || `Node ${Object.keys(layer.nodes).length}`;

		const newNode: AnimationNode = {
			uuid,
			name: newName,
			animation: newNodeAnim,
			position: { x: 50, y: 50 },
			transitions: [],
		};

		updateAvatar((draft) => {
			const l = draft.animationLayers?.[layer.uuid];
			if (l) {
				l.nodes[uuid] = newNode;
			}
		});
		setAddNodeOpen(false);
		setNewNodeAnim("");
		setSelectedNodeId(uuid);
	};

	const handleDeleteNode = (nodeId: UUID) => {
		if (nodeId === layer.noneNode) return;
		updateAvatar((draft) => {
			const l = draft.animationLayers?.[layer.uuid];
			if (l) {
				delete l.nodes[nodeId];
				// Clear transitions pointing to this node
				Object.values(l.nodes).forEach((n) => {
					n.transitions = n.transitions.filter((t) => t.targetNode !== nodeId);
				});
			}
		});
		if (selectedNodeId === nodeId) setSelectedNodeId(null);
	};

	const selectedNode = layer.nodes[selectedNodeId!] ?? null;
	const nodeMap = new Map(Object.values(layer.nodes).map((n) => [n.uuid, n]));

	return (
		<div className="flex h-full gap-4">
			{/* Node Canvas */}
			<DndContext onDragEnd={handleDragEnd} sensors={sensors}>
				<div className="flex-grow bg-slate-900/50 rounded-lg ring-1 ring-slate-700 relative overflow-hidden">
					<div className="p-2 absolute top-0 left-0 z-10">
						<Button
							onClick={() => setAddNodeOpen(true)}
							className="bg-violet-600 hover:bg-violet-500"
						>
							<PlusIcon className="mr-2 h-5 w-5" /> Add Node
						</Button>
					</div>

					<svg className="absolute w-full h-full pointer-events-none">
						<defs>
							<marker
								id="arrowhead"
								markerWidth="10"
								markerHeight="7"
								refX="0"
								refY="3.5"
								orient="auto"
							>
								<polygon points="0 0, 10 3.5, 0 7" fill="#6b7280" />
							</marker>
							<marker
								id="arrowhead-default"
								markerWidth="10"
								markerHeight="7"
								refX="0"
								refY="3.5"
								orient="auto"
							>
								<polygon points="0 0, 10 3.5, 0 7" fill="#f59e0b" />
							</marker>
						</defs>
						{Object.values(layer.nodes).flatMap((node) =>
							node.transitions.map((trans) => {
								const targetNode = nodeMap.get(trans.targetNode);
								if (!targetNode) return null;
								const start = {
									x: node.position.x + 192,
									y: node.position.y + 30,
								};
								const end = {
									x: targetNode.position.x,
									y: targetNode.position.y + 30,
								};
								return (
									<line
										key={trans.uuid}
										x1={start.x}
										y1={start.y}
										x2={end.x}
										y2={end.y}
										stroke="#6b7280"
										strokeWidth="2"
										markerEnd="url(#arrowhead)"
									/>
								);
							}),
						)}
					</svg>

					{Object.values(layer.nodes).map((node) => (
						<DraggableNode
							key={node.uuid}
							node={node}
							isSelected={selectedNodeId === node.uuid}
							isNone={layer.noneNode === node.uuid}
							onSelect={() => setSelectedNodeId(node.uuid)}
						/>
					))}
				</div>
			</DndContext>

			{/* Details Panel */}
			<div className="w-96 flex-shrink-0 bg-slate-800 p-4 rounded-lg ring-1 ring-slate-700 overflow-y-auto">
				{selectedNode ? (
					<div>
						<div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-700">
							<h3 className="text-xl font-bold text-slate-100">Node Details</h3>
							<Button
								onClick={() => handleDeleteNode(selectedNode.uuid)}
								disabled={selectedNode.uuid === layer.noneNode}
								className="bg-rose-600 hover:bg-rose-500"
							>
								<TrashIcon className="w-5 h-5 sm:mr-2" />
								<span className="hidden sm:inline">Delete Node</span>
							</Button>
						</div>
						<AnimationNodeDetailsEditor
							layer={layer}
							node={selectedNode}
							onNodeChange={updateNode}
						/>
					</div>
				) : (
					<div className="text-center text-slate-500 pt-10">
						<h3 className="text-lg font-semibold">Select a node to edit</h3>
						<p className="text-sm">
							Click a node on the canvas to see its details.
						</p>
					</div>
				)}
			</div>

			{/* Add Node Dialog */}
			<Dialog open={isAddNodeOpen} onClose={() => setAddNodeOpen(false)}>
				<DialogHeader>Add Animation Node</DialogHeader>
				<DialogContent>
					<FormRow label="Animation">
						<Select
							value={newNodeAnim}
							onChange={(e) => setNewNodeAnim(e.target.value as AnimationID)}
						>
							<option value="">-- Select an animation --</option>
							{animations.map((anim) => (
								<option key={anim} value={anim}>
									{anim}
								</option>
							))}
						</Select>
					</FormRow>
				</DialogContent>
				<DialogFooter>
					<Button
						onClick={() => setAddNodeOpen(false)}
						className="bg-slate-600"
					>
						Cancel
					</Button>
					<Button
						onClick={handleAddNode}
						disabled={!newNodeAnim}
						className="bg-violet-600"
					>
						Add Node
					</Button>
				</DialogFooter>
			</Dialog>
		</div>
	);
}