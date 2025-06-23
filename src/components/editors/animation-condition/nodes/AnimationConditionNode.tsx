import { Select } from "@/components/ui/Select";
import { useAvatarStore } from "@/store/avatarStore";
import type { AnimationRef, ConditionAnimation } from "@/types";

interface AnimationConditionNodeProps {
	condition: ConditionAnimation;
	handleUpdate: (updater: (draft: ConditionAnimation) => void) => void;
}

const displayAnimationRef = (ref: AnimationRef) => {
	const loop = ref.loop ? ` (${ref.loop})` : "";
	return `${ref.model}.${ref.animation}${loop}`;
};

export function AnimationConditionNode({
	condition,
	handleUpdate,
}: AnimationConditionNodeProps) {
	const { animations } = useAvatarStore();
	const allAnimations = animations;
	const animationModes = ["PLAYING", "PAUSED", "STOPPED"];

	return (
		<div className="space-y-2 text-slate-300 p-3 text-sm">
			<div className="flex items-center gap-2">
				<span className="flex-shrink-0 pr-2">When animation</span>
				<div className="flex-grow">
					<Select
						value={
							condition.animation ? JSON.stringify(condition.animation) : ""
						}
						onChange={(e) =>
							handleUpdate((draft) => {
								draft.animation = e.target.value
									? JSON.parse(e.target.value)
									: undefined;
							})
						}
						className="w-auto flex-grow bg-slate-800/80"
					>
						<option value="">-- Select an animation --</option>
						{allAnimations.map((anim) => (
							<option key={JSON.stringify(anim)} value={JSON.stringify(anim)}>
								{displayAnimationRef(anim)}
							</option>
						))}
					</Select>
				</div>
			</div>
			<div className="flex items-center gap-2">
				<span className="font-semibold flex-shrink-0 pr-6">is</span>
				<Select
					value={condition.mode ?? "PLAYING"}
					onChange={(e) =>
						handleUpdate((draft) => {
							draft.mode = e.target.value as any;
						})
					}
					className="w-auto flex-grow bg-slate-800/80"
				>
					{animationModes.map((mode) => (
						<option key={mode} value={mode}>
							{mode}
						</option>
					))}
				</Select>
			</div>
		</div>
	);
}