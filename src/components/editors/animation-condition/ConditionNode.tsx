import { useDraggable } from "@dnd-kit/core";
import { produce } from "immer";
import type { Condition } from "@/types";
import { kindStyles } from "./helpers";
import { AndConditionNode } from "./nodes/AndConditionNode";
import { AnimationConditionNode } from "./nodes/AnimationConditionNode";
import { NotConditionNode } from "./nodes/NotConditionNode";
import { OrConditionNode } from "./nodes/OrConditionNode";
import { RenderConditionNode } from "./nodes/RenderConditionNode";
import { ScriptConditionNode } from "./nodes/ScriptConditionNode";
import { VariableConditionNode } from "./nodes/VariableConditionNode";
import { DropZone, GripVerticalIcon, Trash2Icon } from "./ui";

interface ConditionNodeProps {
	path: string;
	condition?: Condition;
	updateCondition: (newCondition?: Condition) => void;
	deleteNode: () => void;
}

// NOTE: This component is recursively used. The container nodes
// (And, Or, Not) will import and render this component for their children.
export function ConditionNode({
	path,
	condition,
	updateCondition,
	deleteNode,
}: ConditionNodeProps) {
	const {
		listeners: dragListeners,
		setNodeRef: setDraggableNodeRef,
		isDragging,
	} = useDraggable({
		id: path,
		data: { path, type: "condition" },
	});

	if (!condition) {
		return (
			<DropZone
				id={path}
				path={path}
				label={"Drag a condition from the panel to start"}
			/>
		);
	}

	const styles = kindStyles[condition.kind];

	const setNodeRef = (node: HTMLElement | null) => {
		setDraggableNodeRef(node);
	};

	// This helper creates an immer recipe function to pass to child components.
	const handleUpdate = (updater: (draft: any) => void) => {
		updateCondition(produce(condition, updater));
	};

	const renderHeader = () => (
		<div
			className={`flex items-center justify-between p-2 rounded-t-lg ${styles.bg.replace("30", "50").replace("50", "60")}`}
		>
			<div className="flex items-center gap-1">
				<span
					{...dragListeners}
					className={`p-1 ${"cursor-grab text-slate-500 hover:text-white"}`}
				>
					<GripVerticalIcon />
				</span>
				<span className={`font-bold ${styles.text}`}>{styles.label}</span>
			</div>
			<button
				onClick={deleteNode}
				className="p-1 text-rose-400 hover:text-white hover:bg-rose-500 rounded-full w-6 h-6 flex items-center justify-center"
			>
				<Trash2Icon />
			</button>
		</div>
	);

	const renderBody = () => {
		switch (condition.kind) {
			case "and":
				return (
					<AndConditionNode
						condition={condition}
						path={path}
						handleUpdate={handleUpdate}
					/>
				);
			case "or":
				return (
					<OrConditionNode
						condition={condition}
						path={path}
						handleUpdate={handleUpdate}
					/>
				);
			case "not":
				return (
					<NotConditionNode
						condition={condition}
						path={path}
						handleUpdate={handleUpdate}
					/>
				);
			case "animation":
				return (
					<AnimationConditionNode
						condition={condition}
						handleUpdate={handleUpdate}
					/>
				);
			case "render":
				return (
					<RenderConditionNode
						condition={condition}
						handleUpdate={handleUpdate}
					/>
				);
			case "script":
				return (
					<ScriptConditionNode
						condition={condition}
						handleUpdate={handleUpdate}
					/>
				);
			case "variable":
				return (
					<VariableConditionNode
						condition={condition}
						handleUpdate={handleUpdate}
					/>
				);
			default:
				return null;
		}
	};

	return (
		<div
			ref={setNodeRef}
			style={{ opacity: isDragging ? 0.4 : 1 }}
			className={`rounded-lg border transition-shadow ${styles.border} ${styles.bg}`}
		>
			{renderHeader()}
			{renderBody()}
		</div>
	);
}