// src/components/editors/LayerGraph.tsx
import type React from "react";
import { useCallback, useEffect } from "react";
import ReactFlow, {
	Background,
	Controls,
	type Edge,
	getBezierPath,
	MarkerType,
	type Node,
	Position,
	useEdgesState,
	useNodesState,
	useStore,
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

// --- Floating Edge Utils (from React Flow docs) ---

// this helper function returns the intersection point
// of the line between the center of the intersectionNode and the target node
function getNodeIntersection(intersectionNode: Node, targetNode: Node) {
	const {
		width: intersectionNodeWidth,
		height: intersectionNodeHeight,
		positionAbsolute: intersectionNodePosition,
	} = intersectionNode;
	const targetPosition = targetNode.positionAbsolute;

	const w = intersectionNodeWidth! / 2;
	const h = intersectionNodeHeight! / 2;

	const x2 = intersectionNodePosition!.x + w;
	const y2 = intersectionNodePosition!.y + h;
	const x1 = targetPosition!.x + targetNode.width! / 2;
	const y1 = targetPosition!.y + targetNode.height! / 2;

	const xx1 = (x1 - x2) / (2 * w) - (y1 - y2) / (2 * h);
	const yy1 = (x1 - x2) / (2 * w) + (y1 - y2) / (2 * h);
	const a = 1 / (Math.abs(xx1) + Math.abs(yy1));
	const xx3 = a * xx1;
	const yy3 = a * yy1;
	const x = w * (xx3 + yy3) + x2;
	const y = h * (-xx3 + yy3) + y2;

	return { x, y };
}

// returns the position (top,right,bottom,left) passed node compared to the intersection point
function getEdgePosition(
	node: Node,
	intersectionPoint: { x: number; y: number },
): Position {
	const n = { ...node.positionAbsolute, ...node };
	const nx = Math.round(n.x!);
	const ny = Math.round(n.y!);
	const px = Math.round(intersectionPoint.x);
	const py = Math.round(intersectionPoint.y);

	if (px <= nx + 1) {
		return Position.Left;
	}
	if (px >= nx + n.width! - 1) {
		return Position.Right;
	}
	if (py <= ny + 1) {
		return Position.Top;
	}
	if (py >= ny + n.height! - 1) {
		return Position.Bottom;
	}

	return Position.Top;
}

// returns the parameters (sx, sy, tx, ty, sourcePos, targetPos) you need to create an edge
function getEdgeParams(source: Node, target: Node) {
	const sourceIntersectionPoint = getNodeIntersection(source, target);
	const targetIntersectionPoint = getNodeIntersection(target, source);

	const sourcePos = getEdgePosition(source, sourceIntersectionPoint);
	const targetPos = getEdgePosition(target, targetIntersectionPoint);

	return {
		sx: sourceIntersectionPoint.x,
		sy: sourceIntersectionPoint.y,
		tx: targetIntersectionPoint.x,
		ty: targetIntersectionPoint.y,
		sourcePos,
		targetPos,
	};
}

const FloatingEdge = ({ id, source, target, markerEnd, style }: Edge) => {
	const sourceNode = useStore(
		useCallback((store) => store.nodeInternals.get(source), [source]),
	);
	const targetNode = useStore(
		useCallback((store) => store.nodeInternals.get(target), [target]),
	);

	if (!sourceNode || !targetNode) {
		return null;
	}

	const { sx, sy, tx, ty, sourcePos, targetPos } = getEdgeParams(
		sourceNode,
		targetNode,
	);

	const [edgePath] = getBezierPath({
		sourceX: sx,
		sourceY: sy,
		sourcePosition: sourcePos,
		targetX: tx,
		targetY: ty,
		targetPosition: targetPos,
	});

	return (
		<path
			id={id}
			className="react-flow__edge-path"
			d={edgePath}
			markerEnd={markerEnd}
			style={style}
		/>
	);
};

const edgeTypes = {
	floating: FloatingEdge,
};

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
			position: node.position ?? {
				x: 50 + (i % 4) * 200,
				y: 50 + Math.floor(i / 4) * 120,
			},
		}));
		setNodes(newNodes);
	}, [layer.nodes, setNodes]);

	useEffect(() => {
		const transitionArray = Object.values(layer.transitions);
		const newEdges = transitionArray.map((t) => ({
			id: t.uuid,
			source: t.fromNode,
			target: t.toNode,
			type: "floating",
			markerEnd: {
				type: MarkerType.ArrowClosed,
			},
		}));
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
			edgeTypes={edgeTypes}
		>
			<Controls />
			<Background />
		</ReactFlow>
	);
}
