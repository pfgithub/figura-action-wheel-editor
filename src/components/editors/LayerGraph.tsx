// src/components/editors/LayerGraph.tsx
import dagre from "dagre";
import React, { useCallback, useEffect, useMemo } from "react";
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
}

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 170;
const nodeHeight = 40;

const getLayoutedElements = (
	nodes: Node[],
	edges: Edge[],
	direction = "TB",
) => {
	dagreGraph.setGraph({ rankdir: direction, nodesep: 50, ranksep: 70 });

	nodes.forEach((node) => {
		dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
	});

	edges.forEach((edge) => {
		dagreGraph.setEdge(edge.source, edge.target);
	});

	dagre.layout(dagreGraph);

	nodes.forEach((node) => {
		const nodeWithPosition = dagreGraph.node(node.id);
		// We are shifting the dagre node position (anchor=center) to the top left
		// so it matches the React Flow node anchor point (top left).
		node.position = {
			x: nodeWithPosition.x - nodeWidth / 2,
			y: nodeWithPosition.y - nodeHeight / 2,
		};
	});

	return { nodes, edges };
};

const proOptions = { hideAttribution: true };

export function LayerGraph({ layer, selection, onSelect }: LayerGraphProps) {
	const [nodes, setNodes, onNodesChange] = useNodesState([]);
	const [edges, setEdges, onEdgesChange] = useEdgesState([]);

	const initialNodes = useMemo<Node[]>(() => {
		return Object.values(layer.nodes).map((node) => ({
			id: node.uuid,
			type: "default",
			data: { label: node.name },
			position: { x: 0, y: 0 }, // Position will be set by dagre
		}));
	}, [layer.nodes]);

	const initialEdges = useMemo<Edge[]>(() => {
		const transitionArray = Object.values(layer.transitions);
		const transitionSet = new Set(
			transitionArray.map((t) => `${t.fromNode}->${t.toNode}`),
		);

		return transitionArray.map((t) => {
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
	}, [layer.transitions]);

	useEffect(() => {
		if (initialNodes.length > 0) {
			const { nodes: layoutedNodes, edges: layoutedEdges } =
				getLayoutedElements(initialNodes, initialEdges);
			setNodes([...layoutedNodes]);
			setEdges([...layoutedEdges]);
		} else {
			setNodes([]);
			setEdges([]);
		}
	}, [initialNodes, initialEdges, setNodes, setEdges]);

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