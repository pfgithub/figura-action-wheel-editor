import type { Condition, ConditionAnd } from "@/types";
import { ConditionNode } from "../ConditionNode";
import { DropZone } from "../ui";

interface AndConditionNodeProps {
	condition: ConditionAnd;
	path: string;
	handleUpdate: (updater: (draft: ConditionAnd) => void) => void;
}

export function AndConditionNode({
	condition,
	path,
	handleUpdate,
}: AndConditionNodeProps) {
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
