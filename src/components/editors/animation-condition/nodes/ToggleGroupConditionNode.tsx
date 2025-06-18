import { ToggleGroupControls } from "@/components/shared/ToggleGroupControls";
import { Select } from "@/components/ui/Select";
import { useAvatarStore } from "@/store/avatarStore";
import type { ConditionToggleGroup, UUID } from "@/types";

interface ToggleGroupConditionNodeProps {
	condition: ConditionToggleGroup;
	handleUpdate: (updater: (draft: ConditionToggleGroup) => void) => void;
}

export function ToggleGroupConditionNode({
	condition,
	handleUpdate,
}: ToggleGroupConditionNodeProps) {
	const { avatar } = useAvatarStore();
	if (!avatar) return null;
	const allToggleGroups = Object.values(avatar.toggleGroups);
	const selectedGroup = allToggleGroups.find(
		(g) => g.uuid === condition.toggleGroup,
	);

	return (
		<div className="space-y-2 text-slate-300 p-3 text-sm">
			<div className="flex items-center gap-2">
				<span className="flex-shrink-0 pr-2">When</span>
				<div className="flex-grow">
					<ToggleGroupControls
						selectedGroupUUID={condition.toggleGroup}
						onGroupChange={(newUUID) => {
							handleUpdate((draft) => {
								draft.toggleGroup = newUUID;
								draft.value = undefined;
							});
						}}
					/>
				</div>
			</div>
			<div className="flex items-center gap-2">
				<span className="font-semibold flex-shrink-0 pr-6">is</span>
				<Select
					value={condition.value ?? ""}
					onChange={(e) =>
						handleUpdate((draft) => {
							draft.value = e.target.value
								? (e.target.value as UUID)
								: undefined;
						})
					}
					disabled={!selectedGroup}
					className="w-auto flex-grow bg-slate-800/80"
				>
					<option value="">
						<em>None</em>
					</option>
					{selectedGroup &&
						Object.entries(selectedGroup.options).map(([uuid, option]) => (
							<option key={uuid} value={uuid}>
								{option.name}
							</option>
						))}
				</Select>
			</div>
		</div>
	);
}
