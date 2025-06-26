import type { ConditionVariable } from "@/types";
import { VariableSelector } from "../../../editors/VariableSelector";

interface VariableConditionNodeProps {
	condition: ConditionVariable;
	handleUpdate: (updater: (draft: ConditionVariable) => void) => void;
}

export function VariableConditionNode({
	condition,
	handleUpdate,
}: VariableConditionNodeProps) {
	return (
		<div className="p-3 text-sm">
			<VariableSelector
				selectedVariableId={condition.variable}
				selectedValueId={condition.value}
				onVariableChange={(variableId) => {
					handleUpdate((draft) => {
						draft.variable = variableId;
						draft.value = null; // Reset value on variable change
					});
				}}
				onValueChange={(valueId) => {
					handleUpdate((draft) => {
						draft.value = valueId;
					});
				}}
			/>
		</div>
	);
}