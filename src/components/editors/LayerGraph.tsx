// src/components/editors/LayerGraph.tsx
import React, { useCallback, useEffect } from "react";
import ReactFlow, {
	Background,
	Controls,
	MarkerType,
	useEdgesState,
	useNodesState,
	type Edge,
	type Node,
} from "reactflow";
import type { Layer, UUID } from "@/types";

type Selection =
	| { type: "node"; id: UUID }
	| { type: "transition"; id: UUID }
	| null;

interface LayerGraphProps {
	layer: Layer;
	selection: Selection;
	onSelect: (selection: Selection) => void;
	updateLayer: (updater: (draftLayer: Layer) => void) => void;
}

const proOptions = { hideAttribution: true };

export function LayerGraph({
	layer,
	selection,
	onSelect,
	updateLayer,
}: LayerGraphProps) {
	const [nodes, setNodes, onNodesChange] = useNodesState([]);
	const [edges, setEdges, onEdgesChange] = useEdgesState([]);

	const onNodeDragStop = useCallback(
		(_event: React.MouseEvent, node: Node) => {
			updateLayer((draft) => {
				const draftNode = draft.nodes[node.id];
				if (draftNode) {
					draftNode.position = node.position;
				}
			});
		},
		[updateLayer],
	);

	useEffect(() => {
		const newNodes = Object.values(layer.nodes).map((node, i) => ({
			id: node.uuid,
			type: "default",
			data: { label: node.name },
			position:
				node.position ?? {
					x: 50 + (i % 4) * 200,
					y: 50 + Math.floor(i / 4) * 120,
				},
		}));
		setNodes(newNodes);
	}, [layer.nodes, setNodes]);

	useEffect(() => {
		const transitionArray = Object.values(layer.transitions);
		const transitionSet = new Set(
			transitionArray.map((t) => `${t.fromNode}->${t.toNode}`),
		);

		const newEdges = transitionArray.map((t) => {
			const isPaired = transitionSet.has(`${t.toNode}->${t.fromNode}`);
			return {
				id: t.uuid,
				source: t.fromNode,
				target: t.toNode,
				type: isPaired ? "smoothstep" : "default",
				markerEnd: {
					type: MarkerType.ArrowClosed,
				},
			};
		});
		setEdges(newEdges);
	}, [layer.transitions, setEdges]);

	// Sync external selection with internal React Flow selection
	useEffect(() => {
		setNodes((nds) =>
			nds.map((n) => ({
				...n,
				selected: selection?.type === "node" && selection.id === n.id,
			})),
		);
		setEdges((eds) =>
			eds.map((e) => ({
				...e,
				selected: selection?.type === "transition" && selection.id === e.id,
			})),
		);
	}, [selection, setNodes, setEdges]);

	const onNodeClick = useCallback(
		(event: React.MouseEvent, node: Node) => {
			onSelect({ type: "node", id: node.id as UUID });
		},
		[onSelect],
	);

	const onEdgeClick = useCallback(
		(event: React.MouseEvent, edge: Edge) => {
			onSelect({ type: "transition", id: edge.id as UUID });
		},
		[onSelect],
	);

	const onPaneClick = useCallback(() => {
		onSelect(null);
	}, [onSelect]);

	const fitViewOptions = { padding: 0.1 };

	return (
		<ReactFlow
			nodes={nodes}
			edges={edges}
			onNodesChange={onNodesChange}
			onEdgesChange={onEdgesChange}
			onNodeClick={onNodeClick}
			onEdgeClick={onEdgeClick}
			onPaneClick={onPaneClick}
			onNodeDragStop={onNodeDragStop}
			fitView
			fitViewOptions={fitViewOptions}
			proOptions={proOptions}
			className="bg-slate-900/40"
			nodeDragThreshold={1}
		>
			<Controls />
			<Background />
		</ReactFlow>
	);
}