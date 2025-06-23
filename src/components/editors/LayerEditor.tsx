// src/components/editors/LayerEditor.tsx
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { PlusIcon, TrashIcon } from "@/components/ui/icons";
import { useAvatarStore } from "@/store/avatarStore";
import type { Layer, LayerNode, LayerTransition, UUID } from "@/types";
import { generateUUID } from "@/utils/uuid";
import { LayerConditionsEditor } from "./LayerConditionsEditor";
import { LayerGraph } from "./LayerGraph";
import { LayerNodeEditor } from "./LayerNodeEditor";
import { LayerTransitionEditor } from "./LayerTransitionEditor";

type Selection =
	| { type: "node"; id: UUID }
	| { type: "transition"; id: UUID }
	| null;

const SidebarHeader = ({
	title,
	onDelete,
}: {
	title: string;
	onDelete?: () => void;
}) => (
	<div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-700">
		<h3 className="text-xl font-bold text-slate-100 truncate">{title}</h3>
		{onDelete && (
			<Button
				onClick={onDelete}
				className="bg-rose-600 hover:bg-rose-500"
			>
				<TrashIcon className="w-5 h-5 sm:mr-2" />
				<span className="hidden sm:inline">Delete</span>
			</Button>
		)}
	</div>
);

export function LayerEditor({ layer }: { layer: Layer }) {
	const { updateAvatar } = useAvatarStore();
	const [selection, setSelection] = useState<Selection>(null);

	const nodes = Object.values(layer.nodes);

	const handleUpdateLayer = (updater: (draftLayer: Layer) => void) => {
		updateAvatar((draft) => {
			if (draft.layers?.[layer.uuid]) {
				updater(draft.layers[layer.uuid]);
			}
		});
	};

	const handleAddNode = () => {
		const newNode: LayerNode = {
			uuid: generateUUID(),
			name: `Node ${nodes.length + 1}`,
		};
		handleUpdateLayer((draft) => {
			draft.nodes[newNode.uuid] = newNode;
		});
		setSelection({ type: "node", id: newNode.uuid });
	};

	const handleAddTransition = () => {
		if (nodes.length < 2) {
			alert("You need at least two nodes to create a transition.");
			return;
		}
		const newTransition: LayerTransition = {
			uuid: generateUUID(),
			fromNode: nodes[0].uuid,
			toNode: nodes[1].uuid,
			reverse: false,
			allowCancel: true,
			weight: 1.0,
		};
		handleUpdateLayer((draft) => {
			draft.transitions[newTransition.uuid] = newTransition;
		});
		setSelection({ type: "transition", id: newTransition.uuid });
	};

	const handleDeleteSelection = () => {
		if (!selection) return;

		handleUpdateLayer((draft) => {
			if (selection.type === "node") {
				delete draft.nodes[selection.id];
				// Also delete transitions connected to this node
				Object.keys(draft.transitions).forEach((key) => {
					const t = draft.transitions[key as UUID];
					if (t.fromNode === selection.id || t.toNode === selection.id) {
						delete draft.transitions[key as UUID];
					}
				});
			} else if (selection.type === "transition") {
				delete draft.transitions[selection.id];
			}
		});
		setSelection(null);
	};

	const renderRightSidebar = () => {
		if (!selection) {
			return <LayerConditionsEditor layer={layer} />;
		}

		if (selection.type === "node") {
			const node = layer.nodes[selection.id];
			if (!node) return null; // Should not happen
			return (
				<div className="bg-slate-800/50 rounded-lg p-4 ring-1 ring-slate-700">
					<SidebarHeader title={`Edit Node`} onDelete={handleDeleteSelection} />
					<LayerNodeEditor
						node={node}
						layer={layer}
						onUpdate={(updatedNode) =>
							handleUpdateLayer((d) => {
								d.nodes[node.uuid] = updatedNode;
							})
						}
						updateLayer={handleUpdateLayer}
						setSelection={setSelection}
					/>
				</div>
			);
		}

		if (selection.type === "transition") {
			const transition = layer.transitions[selection.id];
			if (!transition) return null; // Should not happen
			return (
				<div className="bg-slate-800/50 rounded-lg p-4 ring-1 ring-slate-700">
					<SidebarHeader
						title="Edit Transition"
						onDelete={handleDeleteSelection}
					/>
					<LayerTransitionEditor
						transition={transition}
						layer={layer}
						onUpdate={(updatedTransition) =>
							handleUpdateLayer((d) => {
								d.transitions[transition.uuid] = updatedTransition;
							})
						}
					/>
				</div>
			);
		}

		return null;
	};

	return (
		<div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
			{/* Center Area */}
			<div className="md:col-span-2 bg-slate-800/50 rounded-lg p-4 ring-1 ring-slate-700 flex flex-col overflow-hidden">
				<div className="flex justify-between items-center mb-4 flex-shrink-0">
					<h3 className="text-xl font-bold">State Machine</h3>
					<div className="flex gap-2">
						<Button
							onClick={handleAddNode}
							className="bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300"
						>
							<PlusIcon className="w-5 h-5 mr-1" /> Add Node
						</Button>
						<Button
							onClick={handleAddTransition}
							className="bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300"
							disabled={nodes.length < 2}
						>
							<PlusIcon className="w-5 h-5 mr-1" /> Add Transition
						</Button>
					</div>
				</div>
				<div className="flex-grow relative -m-4 mt-0">
					<LayerGraph
						key={layer.uuid} // Re-mount graph on layer change
						layer={layer}
						selection={selection}
						onSelect={setSelection}
					/>
				</div>
			</div>

			{/* Right Sidebar */}
			<div className="md:col-span-1 overflow-y-auto">{renderRightSidebar()}</div>
		</div>
	);
}