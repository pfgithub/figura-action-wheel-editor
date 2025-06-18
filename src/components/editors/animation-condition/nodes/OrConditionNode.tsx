import type { Condition, ConditionOr } from "@/types";
import { ConditionNode } from "../ConditionNode";
import { DropZone } from "../ui";

interface OrConditionNodeProps {
	condition: ConditionOr;
	path: string;
	handleUpdate: (updater: (draft: ConditionOr) => void) => void;
}

export function OrConditionNode({
	condition,
	path,
	handleUpdate,
}: OrConditionNodeProps) {
	return (
		<div className="p-2 space-y-2">
			{condition.conditions.map((cond, i) => (
				<ConditionNode
					key={cond.id}
					path={`${path}.conditions.${i}`}
					condition={cond}
					updateCondition={(newCond?: Condition) =>
						handleUpdate((draft) => {
							draft.conditions[i] = newCond!;
						})
					}
					deleteNode={() =>
						handleUpdate((draft) => {
							draft.conditions.splice(i, 1);
						})
					}
				/>
			))}
			<DropZone id={`${path}.add`} path={path} label="Add sub-condition" />
		</div>
	);
}
