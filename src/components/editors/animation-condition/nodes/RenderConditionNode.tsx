import { Select } from "@/components/ui/Select";
import { renderValues } from "@/data/renderSettings";
import type { ConditionRender, RenderValueID } from "@/types";

interface RenderConditionNodeProps {
	condition: ConditionRender;
	handleUpdate: (updater: (draft: ConditionRender) => void) => void;
}

export function RenderConditionNode({
	condition,
	handleUpdate,
}: RenderConditionNodeProps) {
	return (
		<div className="flex items-center gap-2 text-slate-300 p-3 text-sm flex-wrap">
			<Select
				value={condition.render ?? ""}
				onChange={(e) =>
					handleUpdate((draft) => {
						draft.render = e.target.value
							? (e.target.value as RenderValueID)
							: undefined;
					})
				}
				className="w-auto flex-grow bg-slate-800/80"
			>
				<option value="">-- Select state --</option>
				{Array.from(renderValues.values()).map((v) => (
					<option key={v.id} value={v.id}>
						{v.name}
					</option>
				))}
			</Select>
		</div>
	);
}
