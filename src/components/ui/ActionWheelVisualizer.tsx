import {
	DndContext,
	type DragEndEvent,
	DragOverlay,
	type DragStartEvent,
	PointerSensor,
	useDraggable,
	useDroppable,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { useEffect, useRef, useState } from "react";
import { useMinecraftItems } from "@/hooks/useMinecraftItems";
import { useAvatarStore } from "@/store/avatarStore";
import type { Action, IconItem, IconTexture } from "@/types";

interface ActionWheelVisualizerProps {
	actions: Action[];
	onSelectAction: (index: number | null) => void;
	onAddAction: () => void;
	selectedActionIndex: number | null;
	wheelTitle: string;
	onReorder: (
		oldIndex: number,
		newIndex: number,
		preDragSelection: number | null,
	) => void;
}

const WHEEL_RADIUS = 140; // in px
const BUTTON_SIZE = 64; // in px
const MAX_ACTIONS = 8;

/**
 * Generates an array of evenly spaced angles within a given arc.
 * @param count The number of angles to generate.
 * @param startAngle The starting angle of the arc in radians.
 * @param endAngle The ending angle of the arc in radians.
 * @returns An array of angles in radians.
 */
const getAnglesInArc = (
	count: number,
	startAngle: number,
	endAngle: number,
): number[] => {
	if (count === 0) {
		return [];
	}

	const angles: number[] = [];
	const totalArc = endAngle - startAngle;
	const angleStep = totalArc / count;
	startAngle += angleStep / 2;

	for (let i = 0; i < count; i++) {
		angles.push(startAngle + i * angleStep);
	}
	return angles;
};

/**
 * Calculates the angles for actions on a wheel based on the total number of actions.
 * - Actions are split between the right and left semi-circles.
 * - For an even number of actions `n`, there are `n/2` on the right and `n/2` on the left.
 * - For an odd number of actions `n`, there are `floor(n/2)` on the right and `ceil(n/2)` on the left (except for n=1).
 * @param numActions The total number of actions to position.
 * @returns An array of angles in radians.
 */
const getActionAngles = (numActions: number): number[] => {
	if (numActions <= 0) {
		return [];
	}

	// For safety, cap the number of actions if it exceeds the max.
	const effectiveNumActions = Math.min(numActions, MAX_ACTIONS);

	// 1. Determine the number of actions on the right and left sides.
	const numRight =
		effectiveNumActions === 1 ? 1 : Math.floor(effectiveNumActions / 2);
	const numLeft = effectiveNumActions - numRight;

	// 2. Define the arcs for the right and left sides.

	// Right side arc: from top to bottom (-90deg to +90deg)
	const rightArcStart = -Math.PI / 2;
	const rightArcEnd = Math.PI / 2;

	// Left side arc: from top to bottom (+90deg to +270deg)
	const leftArcStart = Math.PI / 2;
	const leftArcEnd = (3 * Math.PI) / 2;

	// 3. Generate the angles for each side.
	const rightAngles = getAnglesInArc(numRight, rightArcStart, rightArcEnd);
	const leftAngles = getAnglesInArc(numLeft, leftArcStart, leftArcEnd);

	// 4. Combine and return the angles. Right side actions are listed first.
	return [...rightAngles, ...leftAngles];
};

function RenderIcon({ icon }: { icon: IconItem | IconTexture }) {
	if (icon.type === "item") {
		return <RenderItemIcon icon={icon} />;
	}

	if (icon.type === "texture") {
		return <RenderTextureIcon icon={icon} />;
	}
	// Fallback for unknown icon type
	return (
		<span className="text-xs max-w-full break-words" style={{ lineHeight: 1 }}>
			...
		</span>
	);
}

function RenderItemIcon({ icon }: { icon: IconItem }) {
	const { items } = useMinecraftItems();

	const item = items?.[icon.id];
	if (item?.image) {
		return (
			<img
				src={`https://lfs.pfg.pw/source/${item.image.uuid}.png`}
				alt={""}
				className="w-8 h-8 image-pixelated"
			/>
		);
	}
	return (
		<span className="text-xs max-w-full break-words" style={{ lineHeight: 1 }}>
			{icon.id}
		</span>
	);
}

function RenderTextureIcon({ icon }: { icon: IconTexture }) {
	const { textures } = useAvatarStore();
	const textureAsset = textures.find((t) => t.name === icon.file);
	const { u, v, width, height, scale } = icon;
	const canvas = useRef<HTMLCanvasElement | null>(null);

	useEffect(() => {
		// Ensure the canvas element and texture asset are available
		if (!canvas.current || !textureAsset?.url) {
			return;
		}

		const context = canvas.current.getContext("2d");
		if (!context) {
			return;
		}

		// To prevent errors if the component unmounts while the image is loading
		let isCancelled = false;

		const image = new Image();
		// This is important for images served from other domains to avoid canvas tainting
		image.crossOrigin = "anonymous";
		image.src = textureAsset.url;

		image.onload = () => {
			if (isCancelled) {
				return;
			}

			// For pixel-perfect rendering, disable image smoothing
			context.imageSmoothingEnabled = false;

			// Clear the canvas before drawing
			if (!canvas.current) return;
			context.clearRect(0, 0, canvas.current?.width, canvas.current?.height);

			// Draw the specific part of the texture onto the canvas, scaled up
			context.drawImage(
				image, // The source image
				u, // Source X (sx)
				v, // Source Y (sy)
				width, // Source Width (sWidth)
				height, // Source Height (sHeight)
				0, // Destination X (dx)
				0, // Destination Y (dy)
				width * scale, // Destination Width (dWidth)
				height * scale, // Destination Height (dHeight)
			);
		};

		// Cleanup function to run if the component unmounts or dependencies change
		return () => {
			isCancelled = true;
		};
	}, [textureAsset, u, v, width, height, scale]); // Re-run effect if these change

	if (!textureAsset) {
		return <span className="text-xl text-rose-400">?</span>;
	}

	return (
		<canvas
			width={width * scale}
			height={height * scale}
			ref={canvas}
			role="img"
			aria-label={`Texture from ${icon.file}`}
		/>
	);
}

function ActionButton({
	action,
	index,
	isSelected,
	onSelectAction,
}: {
	action: Action;
	index: number;
	isSelected: boolean;
	onSelectAction: (index: number) => void;
}) {
	const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
		id: action.uuid, // Use UUID for stable ID
		data: { index },
	});

	const { isOver, setNodeRef: setDroppableNodeRef } = useDroppable({
		id: action.uuid,
		data: { index },
	});

	const ref = (node: HTMLElement | null) => {
		setNodeRef(node);
		setDroppableNodeRef(node);
	};

	return (
		<div
			ref={ref}
			{...listeners}
			{...attributes}
			className="w-full h-full cursor-grab"
		>
			<button
				onClick={(e) => {
					e.stopPropagation();
					onSelectAction(index);
				}}
				className={`w-full h-full flex items-center justify-center rounded-full text-white p-1 text-center leading-tight transition-all duration-200 ease-in-out transform focus:outline-none shadow-md hover:shadow-lg ${isSelected && !isDragging ? "ring-4 ring-violet-500 shadow-xl z-10" : "ring-2 ring-slate-600"}`}
				style={{
					backgroundColor: `rgb(${action.color.join(",")})`,
					opacity: isDragging ? 0.4 : 1,
				}}
				title={action.label}
			>
				<RenderIcon icon={action.icon} />
			</button>
			<span
				className="absolute top-full left-1/2 -translate-x-1/2 mt-2 text-xs font-semibold text-white truncate w-24 text-center pointer-events-none"
				style={{ opacity: isDragging ? 0 : 1 }}
				title={action.label}
			>
				{action.label}
			</span>
			{isOver && !isDragging && (
				<div className="absolute inset-0 rounded-full ring-4 ring-violet-400 ring-inset animate-pulse pointer-events-none" />
			)}
		</div>
	);
}

export function ActionWheelVisualizer({
	actions,
	onSelectAction,
	onAddAction,
	selectedActionIndex,
	wheelTitle,
	onReorder,
}: ActionWheelVisualizerProps) {
	const numActions = actions.length;
	const actionAngles = getActionAngles(numActions);

	const [activeAction, setActiveAction] = useState<Action | null>(null);
	const [preDragSelectedActionIndex, setPreDragSelectedActionIndex] = useState<
		number | null
	>(null);

	const handleDragStart = (event: DragStartEvent) => {
		const activeIndex = event.active.data.current?.index;
		if (typeof activeIndex === "number") {
			setActiveAction(actions[activeIndex]);
			setPreDragSelectedActionIndex(selectedActionIndex);
			onSelectAction(null);
		}
	};

	const handleDragEnd = (event: DragEndEvent) => {
		setActiveAction(null);
		const { active, over } = event;

		if (over && active.id !== over.id) {
			const oldIndex = active.data.current?.index;
			const newIndex = over.data.current?.index;

			if (typeof oldIndex === "number" && typeof newIndex === "number") {
				onReorder(oldIndex, newIndex, preDragSelectedActionIndex);
			}
		} else {
			// Dropped on itself or outside a valid drop zone, treat as a click.
			const clickedIndex = active.data.current?.index;
			if (typeof clickedIndex === "number") {
				onSelectAction(clickedIndex);
			} else {
				// Not a valid drop, restore selection
				onSelectAction(preDragSelectedActionIndex);
			}
		}
		setPreDragSelectedActionIndex(null);
	};

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8,
			},
		}),
	);

	return (
		<DndContext
			onDragStart={handleDragStart}
			onDragEnd={handleDragEnd}
			sensors={sensors}
		>
			<div
				className="relative flex items-center justify-center bg-slate-800/50 rounded-full ring-4 ring-slate-700"
				style={{
					width: `${WHEEL_RADIUS * 2 + BUTTON_SIZE}px`,
					height: `${WHEEL_RADIUS * 2 + BUTTON_SIZE}px`,
				}}
			>
				{/* Central Hub */}
				<div className="flex flex-col items-center justify-center text-center w-36">
					<h4
						className="font-bold text-lg text-white truncate"
						title={wheelTitle}
					>
						{wheelTitle}
					</h4>
					<p className="text-sm text-slate-400">
						{numActions} / {MAX_ACTIONS} Actions
					</p>
				</div>

				{/* Action Buttons */}
				{actions.map((action, index) => {
					const angle = actionAngles[index];
					const x = WHEEL_RADIUS * Math.cos(angle);
					const y = WHEEL_RADIUS * Math.sin(angle);

					return (
						<div
							key={action.uuid}
							className="absolute transition-transform"
							style={{
								width: `${BUTTON_SIZE}px`,
								height: `${BUTTON_SIZE}px`,
								top: `calc(50% - ${BUTTON_SIZE / 2}px)`,
								left: `calc(50% - ${BUTTON_SIZE / 2}px)`,
								transform: `translate(${x}px, ${y}px)`,
							}}
						>
							<ActionButton
								action={action}
								index={index}
								isSelected={selectedActionIndex === index}
								onSelectAction={onSelectAction}
							/>
						</div>
					);
				})}

				{/* Add Action Button in the next empty slot */}
				{numActions < MAX_ACTIONS && (
					<div
						className="absolute"
						style={{
							width: `${BUTTON_SIZE - 4}px`,
							height: `${BUTTON_SIZE - 4}px`,
							top: `calc(50% - ${(BUTTON_SIZE - 4) / 2}px)`,
							left: `calc(50% - ${(BUTTON_SIZE - 4) / 2}px)`,
							transform: `translate(${WHEEL_RADIUS}px, ${WHEEL_RADIUS}px)`,
							opacity: activeAction ? 0.2 : 1,
						}}
					>
						<button
							onClick={onAddAction}
							className="w-full h-full flex items-center justify-center rounded-full border-2 border-dashed border-slate-600 hover:border-violet-500 hover:bg-violet-900/50 text-slate-500 hover:text-white text-4xl font-light transition-all"
							title="Add new action"
							disabled={!!activeAction}
						>
							+
						</button>
					</div>
				)}
			</div>
			<DragOverlay dropAnimation={null}>
				{activeAction ? (
					<div
						style={{ width: `${BUTTON_SIZE}px`, height: `${BUTTON_SIZE}px` }}
					>
						<button
							className={`w-full h-full flex items-center justify-center rounded-full text-white p-1 text-center leading-tight ring-4 ring-violet-500 shadow-xl cursor-grabbing`}
							style={{
								backgroundColor: `rgb(${activeAction.color.join(",")})`,
							}}
							title={activeAction.label}
						>
							<RenderIcon icon={activeAction.icon} />
						</button>
					</div>
				) : null}
			</DragOverlay>
		</DndContext>
	);
}
