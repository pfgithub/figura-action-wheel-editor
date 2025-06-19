import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import {
	SortableContext,
	useSortable,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useState } from "react";
import { ActionEffectEditor } from "@/components/editors/ActionEffectEditor";
import { AnimationConditionEditor } from "@/components/editors/AnimationConditionEditor";
import { MasterDetailManager } from "@/components/layout/MasterDetailManager";
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
	AnimationLayer,
	AnimationNode,
	AnimationRef,
	AnimationTransition,
	UUID,
} from "@/types";
import { generateUUID } from "@/utils/uuid";

const displayAnimationRef = (ref: AnimationRef) =>
	`${ref.model}.${ref.animation}`;

// --- Node Details Panel ---
interface AnimationNodeDetailsEditorProps {
	layer: AnimationLayer;
	node: AnimationNode;
	onNodeChange: (updatedNode: AnimationNode) => void;
}

function AnimationNodeDetailsEditor({
	layer,
	node,
	onNodeChange,
}: AnimationNodeDetailsEditorProps) {
	const { animations } = useAvatarStore();
	// This state holds the transition object to open the dialog for.
	// It can be an existing one from `node.transitions` or a brand new one.
	const [transitionForDialog, setTransitionForDialog] =
		useState<AnimationTransition | null>(null);

	// This state holds the temporary, editable copy of the transition within the dialog.
	const [localTransitionState, setLocalTransitionState] =
		useState<AnimationTransition | null>(null);

	// When transitionForDialog changes, we open the dialog and populate the local state.
	useEffect(() => {
		if (transitionForDialog) {
			// Deep copy to avoid mutating the original object until save
			setLocalTransitionState(JSON.parse(JSON.stringify(transitionForDialog)));
		}
	}, [transitionForDialog]);

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
			waitForFinish: true,
			effects: [],
		};
		setTransitionForDialog(newTransition);
	};

	const handleSaveTransition = () => {
		if (!localTransitionState) return;

		const isNew = !node.transitions.some(
			(t) => t.uuid === localTransitionState.uuid,
		);

		onNodeChange({
			...node,
			transitions: isNew
				? [...node.transitions, localTransitionState]
				: node.transitions.map((t) =>
						t.uuid === localTransitionState.uuid ? localTransitionState : t,
					),
		});

		setTransitionForDialog(null);
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
				<FormRow label="Animation">
					<Select
						value={node.animation ? JSON.stringify(node.animation) : ""}
						onChange={(e) =>
							onUpdate(
								"animation",
								e.target.value ? JSON.parse(e.target.value) : undefined,
							)
						}
						disabled={isNoneNode}
					>
						<option value="">(None)</option>
						{animations.map((anim) => (
							<option key={JSON.stringify(anim)} value={JSON.stringify(anim)}>
								{displayAnimationRef(anim)}
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
									onDelete={() => removeTransition(t.uuid)}
									onEditTransition={() => setTransitionForDialog(t)}
								/>
							))}
						</div>
					</SortableContext>
				</DndContext>

				<Button
					onClick={addTransition}
					className="w-full mt-2 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300"
					disabled={otherNodes.length === 0}
				>
					<PlusIcon className="mr-2 h-5 w-5" /> Add Transition
				</Button>
			</div>
			{transitionForDialog && localTransitionState && (
				<Dialog
					open
					onClose={() => setTransitionForDialog(null)}
					className="max-w-3xl"
				>
					<DialogHeader>
						{node.transitions.some((t) => t.uuid === transitionForDialog.uuid)
							? "Edit Transition"
							: "Add Transition"}
					</DialogHeader>
					<DialogContent>
						<div className="space-y-6">
							<div>
								<h4 className="text-lg font-semibold text-slate-300 border-b border-slate-700 pb-2 mb-4">
									Settings
								</h4>
								<FormRow label="Target Node">
									<Select
										value={localTransitionState.targetNode ?? ""}
										onChange={(e) =>
											setLocalTransitionState({
												...localTransitionState,
												targetNode: e.target.value as UUID,
											})
										}
										disabled={otherNodes.length === 0}
									>
										<option value="">-- Select a node --</option>
										{otherNodes.map((n) => (
											<option key={n.uuid} value={n.uuid}>
												{n.name}
											</option>
										))}
									</Select>
								</FormRow>
								<FormRow label="Wait for animation to finish">
									<label className="flex gap-4 items-center">
										<input
											type="checkbox"
											checked={localTransitionState.waitForFinish ?? true}
											onChange={(e) =>
												setLocalTransitionState({
													...localTransitionState,
													waitForFinish: e.target.checked,
												})
											}
											className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-violet-500 focus:ring-violet-500"
										/>
										<p className="text-xs text-slate-400 flex-1">
											If checked, this transition can only occur after the
											current animation has finished playing.
										</p>
									</label>
								</FormRow>
							</div>

							<div>
								<h4 className="text-lg font-semibold text-slate-300 border-b border-slate-700 pb-2 mb-4">
									Transition Effects
								</h4>
								<p className="text-xs text-slate-400 -mt-3 mb-3">
									Optionally run one or more actions when this transition
									occurs. Effects run in order.
								</p>
								<div className="bg-slate-900/50 p-4 rounded-lg ring-1 ring-slate-700">
									<ActionEffectEditor
										effects={localTransitionState.effects}
										updateEffects={(effects) =>
											setLocalTransitionState({
												...localTransitionState,
												effects,
											})
										}
									/>
								</div>
							</div>

							<div>
								<h4 className="text-lg font-semibold text-slate-300 border-b border-slate-700 pb-2 mb-4">
									Activation Condition
								</h4>
								<div className="bg-slate-900/50 p-4 rounded-lg ring-1 ring-slate-700">
									<AnimationConditionEditor
										condition={localTransitionState.activationCondition}
										updateCondition={(c) =>
											setLocalTransitionState({
												...localTransitionState,
												activationCondition: c,
											})
										}
									/>
								</div>
							</div>
						</div>
					</DialogContent>
					<DialogFooter>
						<Button
							onClick={() => setTransitionForDialog(null)}
							className="bg-slate-600 hover:bg-slate-500"
						>
							Cancel
						</Button>
						<Button
							onClick={handleSaveTransition}
							className="bg-violet-600 hover:bg-violet-500"
						>
							Save
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
	onDelete,
	onEditTransition,
}: {
	transition: AnimationTransition;
	otherNodes: AnimationNode[];
	onDelete: () => void;
	onEditTransition: () => void;
}) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition: cssTrans,
	} = useSortable({ id: transition.uuid });
	const style = {
		transform: CSS.Transform.toString(transform),
		transition: cssTrans,
	};
	const hasCondition = !!transition.activationCondition;
	const targetNodeName = otherNodes.find(
		(n) => n.uuid === transition.targetNode,
	)?.name;

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
					{targetNodeName ? (
						<span className="font-semibold text-slate-200">
							{targetNodeName}
						</span>
					) : (
						<span className="font-semibold text-rose-400">Invalid Target</span>
					)}
				</div>
				<Button onClick={onDelete} className="!p-1 h-7 w-7 bg-rose-800/50">
					<TrashIcon className="w-4 h-4" />
				</Button>
			</div>
			<div className="flex items-center gap-2 pl-9">
				<p className="text-xs text-slate-400 flex-grow">
					{hasCondition ? "Has activation condition" : "No condition"}
				</p>
				<Button
					onClick={onEditTransition}
					title={hasCondition ? "Edit transition..." : "Edit transition..."}
					className="bg-slate-700 hover:bg-slate-600 flex-shrink-0"
				>
					<EditIcon className="w-4 h-4 mr-2" />
					Edit
				</Button>
			</div>
		</div>
	);
}

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
			<path d="M10 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
			<polyline points="17 9 22 4" />
			<path d="M22 9h-5V4" />
		</svg>
		<h3 className="text-lg font-semibold">Select a node to edit</h3>
		<p className="text-sm">Choose a node from the list, or add a new one.</p>
	</div>
);

// --- Main Layer Editor ---
interface AnimationLayerEditorProps {
	layer: AnimationLayer;
}

export function AnimationLayerEditor({ layer }: AnimationLayerEditorProps) {
	const { updateAvatar, animations } = useAvatarStore();
	const [selectedNodeId, setSelectedNodeId] = useState<UUID | null>(null);
	const [isAddNodeOpen, setAddNodeOpen] = useState(false);
	const [newNodeAnim, setNewNodeAnim] = useState<AnimationRef | undefined>(
		undefined,
	);

	const updateNode = (updatedNode: AnimationNode) => {
		updateAvatar((draft) => {
			const l = draft.animationLayers?.[layer.uuid];
			if (l) l.nodes[updatedNode.uuid] = updatedNode;
		});
	};

	const handleAddNode = () => {
		if (!newNodeAnim) return;
		const uuid = generateUUID();
		const newName =
			newNodeAnim.animation || `Node ${Object.keys(layer.nodes).length}`;

		const newNode: AnimationNode = {
			uuid,
			name: newName,
			animation: newNodeAnim,
			transitions: [],
		};

		updateAvatar((draft) => {
			const l = draft.animationLayers?.[layer.uuid];
			if (l) {
				l.nodes[uuid] = newNode;
			}
		});
		setAddNodeOpen(false);
		setNewNodeAnim(undefined);
		setSelectedNodeId(uuid);
	};

	const handleDeleteNode = (nodeToDelete: AnimationNode) => {
		const nodeId = nodeToDelete.uuid;
		if (nodeId === layer.noneNode) return; // Safeguard
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

	const allNodes = Object.values(layer.nodes).sort((a, b) => {
		if (a.uuid === layer.noneNode) return -1;
		if (b.uuid === layer.noneNode) return 1;
		return a.name.localeCompare(b.name);
	});

	const selectedNode = allNodes.find((n) => n.uuid === selectedNodeId) ?? null;

	return (
		<>
			<MasterDetailManager<AnimationNode>
				items={allNodes}
				selectedId={selectedNodeId}
				onSelectId={setSelectedNodeId}
				title="Nodes"
				onAddItem={() => setAddNodeOpen(true)}
				onDeleteItem={
					selectedNode && selectedNode.uuid !== layer.noneNode
						? handleDeleteNode
						: undefined
				}
				addText="Add Node"
				deleteText="Delete Node"
				editorTitle={(node) =>
					node.uuid === layer.noneNode ? (
						<span className="text-xl font-bold text-slate-100">
							{node.name}
						</span>
					) : (
						<Input
							value={node.name}
							onChange={(e) => updateNode({ ...node, name: e.target.value })}
							className="bg-transparent border-none p-0 h-auto text-xl font-bold w-full focus:ring-0 focus:bg-slate-700"
						/>
					)
				}
				renderListItem={(node, isSelected) => (
					<button
						className={`w-full text-left p-3 rounded-lg transition-colors duration-150 flex items-center gap-3 ${isSelected ? "bg-violet-500/20 ring-2 ring-violet-500" : "bg-slate-800 hover:bg-slate-700"}`}
					>
						{node.uuid === layer.noneNode && (
							<span
								className="text-amber-400 font-bold"
								title="None Node (Default State)"
							>
								◆
							</span>
						)}
						<div className="flex-grow">
							<h3 className="font-semibold text-slate-100 truncate">
								{node.name}
							</h3>
							<p className="text-sm text-slate-400 truncate">
								{node.animation
									? displayAnimationRef(node.animation)
									: "(No animation)"}
							</p>
						</div>
					</button>
				)}
				renderEditor={(node) => (
					<AnimationNodeDetailsEditor
						key={node.uuid}
						layer={layer}
						node={node}
						onNodeChange={updateNode}
					/>
				)}
				renderEmptyState={EmptyState}
			/>

			{/* Add Node Dialog */}
			<Dialog open={isAddNodeOpen} onClose={() => setAddNodeOpen(false)}>
				<DialogHeader>Add Animation Node</DialogHeader>
				<DialogContent>
					<FormRow label="Animation">
						<Select
							value={newNodeAnim ? JSON.stringify(newNodeAnim) : ""}
							onChange={(e) =>
								setNewNodeAnim(
									e.target.value ? JSON.parse(e.target.value) : undefined,
								)
							}
						>
							<option value="">-- Select an animation --</option>
							{animations.map((anim) => (
								<option key={JSON.stringify(anim)} value={JSON.stringify(anim)}>
									{displayAnimationRef(anim)}
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
		</>
	);
}
