// src/components/editors/LayerGraph.tsx
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import type { Layer, UUID } from "@/types";

type Selection =
	| { type: "node"; id: UUID }
	| { type: "transition"; id: UUID }
	| null;

interface GraphNode {
	id: UUID;
	name: string;
	x: number;
	y: number;
	vx: number;
	vy: number;
}

interface GraphLink {
	id: UUID;
	source: UUID;
	target: UUID;
	isPaired: boolean;
}

interface LayerGraphProps {
	layer: Layer;
	selection: Selection;
	onSelect: (selection: Selection) => void;
}

const CONFIG = {
	nodeRadius: 32,
	arrowSize: 8,
	charge: -2500,
	linkDistance: 150,
	gravity: 0.1,
	damping: 0.8,
	linkCurvature: 0.2,
};

export function LayerGraph({ layer, selection, onSelect }: LayerGraphProps) {
	const svgRef = useRef<SVGSVGElement>(null);
	const [nodes, setNodes] = useState<Record<UUID, GraphNode>>({});
	const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
	const [draggedNode, setDraggedNode] = useState<UUID | null>(null);
	const animationFrameId = useRef<number | null>(null);

	// Memoize link data to avoid re-computation on every render
	const links: GraphLink[] = useMemo(() => {
		const transitionArray = Object.values(layer.transitions);
		const transitionSet = new Set(transitionArray.map((t) => `${t.fromNode}->${t.toNode}`));
		
		return transitionArray.map((t) => ({
			id: t.uuid,
			source: t.fromNode,
			target: t.toNode,
			isPaired: transitionSet.has(`${t.toNode}->${t.fromNode}`),
		}));
	}, [layer.transitions]);

	// Initialize nodes or update them when layer changes
	useEffect(() => {
		setNodes((currentNodes) => {
			const newNodes: Record<UUID, GraphNode> = {};
			const layerNodeIds = Object.keys(layer.nodes);

			for (const nodeId of layerNodeIds) {
				if (currentNodes[nodeId as UUID]) {
					// Preserve existing node position and velocity
					newNodes[nodeId as UUID] = {
						...currentNodes[nodeId as UUID],
						name: layer.nodes[nodeId as UUID].name,
					};
				} else {
					// Initialize new node
					newNodes[nodeId as UUID] = {
						id: nodeId as UUID,
						name: layer.nodes[nodeId as UUID].name,
						x: dimensions.width / 2 + (Math.random() - 0.5) * 50,
						y: dimensions.height / 2 + (Math.random() - 0.5) * 50,
						vx: 0,
						vy: 0,
					};
				}
			}
			return newNodes;
		});
	}, [layer.nodes, dimensions]);


	// Resize observer for the SVG container
	useEffect(() => {
        console.log("create reszeobserver");
		const resizeObserver = new ResizeObserver((entries) => {
            console.log("got callback");
            if (entries[0]) {
                const { width, height } = entries[0].contentRect;
                if(width === 0 || height === 0) return;
                console.log("have entries", width, height);
				setDimensions({ width, height });
			}
		});
        
		if (svgRef.current) {
            console.log("have current");
            resizeObserver.observe(svgRef.current);
		}

		return () => {
			if (svgRef.current) {
				resizeObserver.unobserve(svgRef.current);
			}
		};
	}, []);
	
	// Physics simulation loop
	const runSimulation = useCallback(() => {
		if (draggedNode) {
			animationFrameId.current = requestAnimationFrame(runSimulation);
			return;
		}

		setNodes((currentNodes) => {
			const updatedNodes: Record<UUID, GraphNode> = JSON.parse(JSON.stringify(currentNodes));
			const nodeArray = Object.values(updatedNodes);

			// Apply forces
			for (const nodeA of nodeArray) {
				// Gravity
				nodeA.vx += (dimensions.width / 2 - nodeA.x) * CONFIG.gravity * 0.01;
				nodeA.vy += (dimensions.height / 2 - nodeA.y) * CONFIG.gravity * 0.01;

				// Repulsion force
				for (const nodeB of nodeArray) {
					if (nodeA.id === nodeB.id) continue;
					const dx = nodeB.x - nodeA.x;
					const dy = nodeB.y - nodeA.y;
					let distance = Math.sqrt(dx * dx + dy * dy);
					if (distance < 1) distance = 1;
					const force = CONFIG.charge / (distance * distance);
					nodeA.vx += (dx / distance) * force;
					nodeA.vy += (dy / distance) * force;
				}
			}

			// Link force
			for (const link of links) {
				const source = updatedNodes[link.source];
				const target = updatedNodes[link.target];
				if (!source || !target) continue;

				const dx = target.x - source.x;
				const dy = target.y - source.y;
				const distance = Math.sqrt(dx * dx + dy * dy);
				if (distance > 0) {
					const displacement = distance - CONFIG.linkDistance;
					const force = displacement * 0.05; // Spring stiffness
					const fx = (dx / distance) * force;
					const fy = (dy / distance) * force;
					source.vx += fx;
					source.vy += fy;
					target.vx -= fx;
					target.vy -= fy;
				}
			}

			// Update positions
			for (const node of Object.values(updatedNodes)) {
				node.vx *= CONFIG.damping;
				node.vy *= CONFIG.damping;
				node.x += node.vx;
				node.y += node.vy;
			}
			return updatedNodes;
		});

		animationFrameId.current = requestAnimationFrame(runSimulation);
	}, [links, dimensions, draggedNode]);

	useEffect(() => {
		animationFrameId.current = requestAnimationFrame(runSimulation);
		return () => {
			if (animationFrameId.current) {
				cancelAnimationFrame(animationFrameId.current);
			}
		};
	}, [runSimulation]);

	const handleNodeMouseDown = (e: React.MouseEvent, nodeId: UUID) => {
		e.stopPropagation();
		setDraggedNode(nodeId);
		onSelect({ type: "node", id: nodeId });
	};

	const handleMouseMove = (e: React.MouseEvent) => {
		if (!draggedNode || !svgRef.current) return;
		const pt = svgRef.current.createSVGPoint();
		pt.x = e.clientX;
		pt.y = e.clientY;
		const svgPoint = pt.matrixTransform(svgRef.current.getScreenCTM()?.inverse());
		setNodes((ns) => ({
			...ns,
			[draggedNode]: { ...ns[draggedNode], x: svgPoint.x, y: svgPoint.y, vx: 0, vy: 0 },
		}));
	};

	const handleMouseUp = () => {
		setDraggedNode(null);
	};
	
	const getLinkPath = (link: GraphLink) => {
		const sourceNode = nodes[link.source];
		const targetNode = nodes[link.target];
		if (!sourceNode || !targetNode) return "";

		const dx = targetNode.x - sourceNode.x;
		const dy = targetNode.y - sourceNode.y;
		const dist = Math.sqrt(dx * dx + dy * dy);

		if (dist === 0) return "";

		const nx = dx / dist;
		const ny = dy / dist;

		const sourceX = sourceNode.x + nx * CONFIG.nodeRadius;
		const sourceY = sourceNode.y + ny * CONFIG.nodeRadius;
		const targetX = targetNode.x - nx * (CONFIG.nodeRadius + CONFIG.arrowSize);
		const targetY = targetNode.y - ny * (CONFIG.nodeRadius + CONFIG.arrowSize);
		
		if (link.isPaired) {
			const midX = (sourceNode.x + targetNode.x) / 2;
			const midY = (sourceNode.y + targetNode.y) / 2;
			const controlX = midX - ny * dist * CONFIG.linkCurvature;
			const controlY = midY + nx * dist * CONFIG.linkCurvature;
			return `M ${sourceX},${sourceY} Q ${controlX},${controlY} ${targetX},${targetY}`;
		}

		return `M ${sourceX},${sourceY} L ${targetX},${targetY}`;
	};
	
	if (dimensions.width === 0) {
		return <div ref={svgRef as any} className="w-full h-full" />;
	}

	return (
		<svg
			ref={svgRef}
			width="100%"
			height="100%"
			className="bg-slate-900/40 rounded-md"
			onMouseMove={handleMouseMove}
			onMouseUp={handleMouseUp}
			onMouseLeave={handleMouseUp}
			onClick={() => onSelect(null)}
		>
			<defs>
				<marker
					id="arrowhead"
					viewBox="0 0 10 10"
					refX="5"
					refY="5"
					markerWidth="6"
					markerHeight="6"
					orient="auto-start-reverse"
				>
					<path d="M 0 0 L 10 5 L 0 10 z" className="fill-slate-500" />
				</marker>
				<marker
					id="arrowhead-selected"
					viewBox="0 0 10 10"
					refX="5"
					refY="5"
					markerWidth="6"
					markerHeight="6"
					orient="auto-start-reverse"
				>
					<path d="M 0 0 L 10 5 L 0 10 z" className="fill-violet-400" />
				</marker>
			</defs>
			<g>
				{/* Links */}
				{links.map((link) => {
					const isSelected = selection?.type === "transition" && selection.id === link.id;
					return (
						<path
							key={link.id}
							d={getLinkPath(link)}
							className={`stroke-2 transition-all fill-none ${isSelected ? "stroke-violet-400" : "stroke-slate-500 hover:stroke-slate-400"}`}
							markerEnd={isSelected ? "url(#arrowhead-selected)" : "url(#arrowhead)"}
							onClick={(e) => {
								e.stopPropagation();
								onSelect({ type: "transition", id: link.id });
							}}
						/>
					);
				})}

				{/* Nodes */}
				{Object.values(nodes).map((node) => {
					const isSelected = selection?.type === "node" && selection.id === node.id;
					return (
						<g
							key={node.id}
							transform={`translate(${node.x}, ${node.y})`}
							className="cursor-pointer"
							onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
						>
							<circle
								r={CONFIG.nodeRadius}
								className={`transition-all ${isSelected ? "fill-violet-600/50 stroke-violet-500" : "fill-slate-700/80 stroke-slate-600"} stroke-2`}
							/>
							<text
								textAnchor="middle"
								dy=".3em"
								className="fill-slate-100 font-semibold select-none text-sm pointer-events-none"
							>
								{node.name}
							</text>
						</g>
					);
				})}
			</g>
		</svg>
	);
}