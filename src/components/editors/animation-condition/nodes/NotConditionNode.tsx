import type { ConditionNot } from "@/types";
import { ConditionNode } from "../ConditionNode";

interface NotConditionNodeProps {
	condition: ConditionNot;
	path: string;
	handleUpdate: (updater: (draft: ConditionNot) => void) => void;
}

export function NotConditionNode({
	condition,
	path,
	handleUpdate,
}: NotConditionNodeProps) {
	return (
		<div className="p-2">
			<ConditionNode
				path={`${path}.condition`}
				condition={condition.condition}
				updateCondition={(newCond) =>
					handleUpdate((draft) => {
						draft.condition = newCond;
					})
				}
				deleteNode={() =>
					handleUpdate((draft) => {
						draft.condition = undefined;
					})
				}
			/>
		</div>
	);
}
