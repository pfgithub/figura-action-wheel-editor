import { Popover, Transition } from "@headlessui/react";
import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
} from "@/components/ui/Dialog";
import { FormRow } from "@/components/ui/FormRow";
import { Input } from "@/components/ui/Input";
import { PlusIcon } from "@/components/ui/icons";
import { Select } from "@/components/ui/Select";
import { useAvatarStore } from "@/store/avatarStore";
import type {
	AnimationRef,
	Layer,
	LayerNode,
	LayerTransition,
	UUID,
} from "@/types";
import { generateUUID } from "@/utils/uuid";

function AddNewNodeWithTransitionDialog({
	isOpen,
	onClose,
	layer,
	currentNodeId,
	updateLayer,
	setSelection,
}: {
	isOpen: boolean;
	onClose: () => void;
	layer: Layer;
	currentNodeId: UUID;
	updateLayer: (updater: (draftLayer: Layer) => void) => void;
	setSelection: (
		selection: { type: "node" | "transition"; id: UUID } | null,
	) => void;
}) {
	const { animations: allAnims } = useAvatarStore();
	const [newNodeName, setNewNodeName] = useState(
		`Node ${Object.keys(layer.nodes).length + 1}`,
	);
	const [selectedAnim, setSelectedAnim] = useState<string>(""); // JSON string of AnimationRef

	const transitionAnims = allAnims.filter((a) => a.loop !== "loop");
	const displayAnimationRef = (ref: AnimationRef) => {
		const loop = ref.loop ? ` (${ref.loop})` : "";
		return `${ref.model}.${ref.animation}${loop}`;
	};

	const handleSubmit = () => {
		if (!selectedAnim) {
			alert("Please select an animation for the transition.");
			return;
		}

		const animRef: AnimationRef = JSON.parse(selectedAnim);
		const newNode: LayerNode = {
			uuid: generateUUID(),
			name: newNodeName.trim(),
		};
		const transitionToNew: LayerTransition = {
			uuid: generateUUID(),
			fromNode: currentNodeId,
			toNode: newNode.uuid,
			animation: animRef,
			reverse: false,
			allowCancel: true,
			weight: 1.0,
		};
		const transitionFromNew: LayerTransition = {
			uuid: generateUUID(),
			fromNode: newNode.uuid,
			toNode: currentNodeId,
			animation: animRef,
			reverse: true,
			allowCancel: true,
			weight: 1.0,
		};

		updateLayer((draft) => {
			draft.nodes[newNode.uuid] = newNode;
			draft.transitions[transitionToNew.uuid] = transitionToNew;
			draft.transitions[transitionFromNew.uuid] = transitionFromNew;
		});

		setSelection({ type: "node", id: newNode.uuid });
		onClose();
	};

	return (
		<Dialog open={isOpen} onClose={onClose}>
			<DialogHeader>Add New Node with Transition</DialogHeader>
			<DialogContent>
				<div className="space-y-4">
					<FormRow label="New Node Name">
						<Input
							value={newNodeName}
							onChange={(e) => setNewNodeName(e.target.value)}
						/>
					</FormRow>
					<FormRow label="Transition Animation">
						<Select
							value={selectedAnim}
							onChange={(e) => setSelectedAnim(e.target.value)}
						>
							<option value="">-- Select Animation --</option>
							{transitionAnims.map((anim) => (
								<option key={JSON.stringify(anim)} value={JSON.stringify(anim)}>
									{displayAnimationRef(anim)}
								</option>
							))}
						</Select>
						<p className="text-xs text-slate-400 mt-1">
							'Loop' animations are not allowed for transitions.
						</p>
					</FormRow>
				</div>
			</DialogContent>
			<DialogFooter>
				<Button
					onClick={onClose}
					className="bg-slate-600 hover:bg-slate-500"
				>
					Cancel
				</Button>
				<Button
					onClick={handleSubmit}
					disabled={!selectedAnim || !newNodeName.trim()}
					className="bg-violet-600 hover:bg-violet-500"
				>
					Create
				</Button>
			</DialogFooter>
		</Dialog>
	);
}

interface LayerNodeEditorProps {
	node: LayerNode;
	layer: Layer;
	onUpdate: (updatedNode: LayerNode) => void;
	updateLayer: (updater: (draftLayer: Layer) => void) => void;
	setSelection: (
		selection: { type: "node" | "transition"; id: UUID } | null,
	) => void;
}

export function LayerNodeEditor({
	node,
	layer,
	onUpdate,
	updateLayer,
	setSelection,
}: LayerNodeEditorProps) {
	const { animations: allAnims } = useAvatarStore();
	const [isNewNodeDialogOpen, setIsNewNodeDialogOpen] = useState(false);

	const outgoingTransitions = Object.values(layer.transitions).filter(
		(t) => t.fromNode === node.uuid,
	);
	const otherNodes = Object.values(layer.nodes).filter(
		(n) => n.uuid !== node.uuid,
	);

	const displayAnimationRef = (ref: AnimationRef) => {
		const loop = ref.loop ? ` (${ref.loop})` : "";
		return `${ref.model}.${ref.animation}${loop}`;
	};

	const handleUpdate = <K extends keyof LayerNode>(
		key: K,
		value: LayerNode[K],
	) => {
		onUpdate({ ...node, [key]: value });
	};

	const handleAddTransitionToNode = (targetNodeId: UUID) => {
		const newTransition: LayerTransition = {
			uuid: generateUUID(),
			fromNode: node.uuid,
			toNode: targetNodeId,
			reverse: false,
			allowCancel: true,
			weight: 1.0,
		};
		updateLayer((draft) => {
			draft.transitions[newTransition.uuid] = newTransition;
		});
		setSelection({ type: "transition", id: newTransition.uuid });
	};

	return (
		<>
			<div className="space-y-4">
				<FormRow label="Name">
					<Input
						value={node.name}
						onChange={(e) => handleUpdate("name", e.target.value)}
					/>
				</FormRow>
				<FormRow label="Animation">
					<Select
						value={node.animation ? JSON.stringify(node.animation) : ""}
						onChange={(e) =>
							handleUpdate(
								"animation",
								e.target.value ? JSON.parse(e.target.value) : undefined,
							)
						}
					>
						<option value="">(None)</option>
						{allAnims.map((anim) => (
							<option key={JSON.stringify(anim)} value={JSON.stringify(anim)}>
								{displayAnimationRef(anim)}
							</option>
						))}
					</Select>
					<p className="text-xs text-slate-400 mt-1">
						'Once' animations are not allowed and will not work.
					</p>
				</FormRow>

				<div className="pt-4 mt-4 border-t border-slate-700/60">
					<div className="flex justify-between items-center mb-2">
						<h4 className="text-base font-semibold text-slate-300">
							Outgoing Transitions
						</h4>
						<Popover className="relative">
							{({ close }) => (
								<>
									<Popover.Button
										as={Button}
										className="bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 px-2 py-1 text-xs"
									>
										<PlusIcon className="w-4 h-4 mr-1" /> Add
									</Popover.Button>
									<Transition
										as={React.Fragment}
										enter="transition ease-out duration-200"
										enterFrom="opacity-0 translate-y-1"
										enterTo="opacity-100 translate-y-0"
										leave="transition ease-in duration-150"
										leaveFrom="opacity-100 translate-y-0"
										leaveTo="opacity-0 translate-y-1"
									>
										<Popover.Panel className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-slate-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
											<div className="py-1">
												<div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase">
													To Existing Node
												</div>
												{otherNodes.length > 0 ? (
													otherNodes.map((n) => (
														<button
															key={n.uuid}
															type="button"
															onClick={() => {
																handleAddTransitionToNode(n.uuid);
																close();
															}}
															className="block w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-violet-500/20"
														>
															{n.name}
														</button>
													))
												) : (
													<div className="px-4 py-2 text-sm text-slate-500">
														No other nodes.
													</div>
												)}
												<div className="my-1 border-t border-slate-700" />
												<button
													type="button"
													onClick={() => {
														setIsNewNodeDialogOpen(true);
														close();
													}}
													className="block w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-violet-500/20"
												>
													+ New Node with Animation...
												</button>
											</div>
										</Popover.Panel>
									</Transition>
								</>
							)}
						</Popover>
					</div>
					<div className="space-y-2 bg-slate-900/30 p-2 rounded-md max-h-48 overflow-y-auto">
						{outgoingTransitions.length > 0 ? (
							outgoingTransitions.map((t) => {
								const targetNode = layer.nodes[t.toNode];
								return (
									<button
										key={t.uuid}
										type="button"
										onClick={() =>
											setSelection({ type: "transition", id: t.uuid })
										}
										className="w-full text-left p-2 rounded-md bg-slate-700/50 hover:bg-slate-700/80 transition-colors"
									>
										→ {targetNode?.name ?? "Unknown Node"}
									</button>
								);
							})
						) : (
							<p className="text-sm text-slate-500 text-center p-4">
								No outgoing transitions.
							</p>
						)}
					</div>
				</div>
			</div>

			<AddNewNodeWithTransitionDialog
				isOpen={isNewNodeDialogOpen}
				onClose={() => setIsNewNodeDialogOpen(false)}
				layer={layer}
				currentNodeId={node.uuid}
				updateLayer={updateLayer}
				setSelection={setSelection}
			/>
		</>
	);
}