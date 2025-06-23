import { FormRow } from "@/components/ui/FormRow";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useAvatarStore } from "@/store/avatarStore";
import type { AnimationRef, Layer, LayerTransition, UUID } from "@/types";

interface LayerTransitionEditorProps {
	transition: LayerTransition;
	layer: Layer;
	onUpdate: (updatedTransition: LayerTransition) => void;
}

export function LayerTransitionEditor({
	transition,
	layer,
	onUpdate,
}: LayerTransitionEditorProps) {
	const { animations: allAnims } = useAvatarStore();
	const layerNodes = Object.values(layer.nodes);

	const displayAnimationRef = (ref: AnimationRef) =>
		`${ref.model}.${ref.animation}`;

	const handleUpdate = <K extends keyof LayerTransition>(
		key: K,
		value: LayerTransition[K],
	) => {
		onUpdate({ ...transition, [key]: value });
	};

	return (
		<div className="space-y-4">
			<FormRow label="From Node">
				<Select
					value={transition.fromNode}
					onChange={(e) => handleUpdate("fromNode", e.target.value as UUID)}
				>
					{layerNodes.map((n) => (
						<option key={n.uuid} value={n.uuid}>
							{n.name}
						</option>
					))}
				</Select>
			</FormRow>
			<FormRow label="To Node">
				<Select
					value={transition.toNode}
					onChange={(e) => handleUpdate("toNode", e.target.value as UUID)}
				>
					{layerNodes.map((n) => (
						<option key={n.uuid} value={n.uuid}>
							{n.name}
						</option>
					))}
				</Select>
			</FormRow>
			<FormRow label="Animation">
				<Select
					value={transition.animation ? JSON.stringify(transition.animation) : ""}
					onChange={(e) =>
						handleUpdate(
							"animation",
							e.target.value ? JSON.parse(e.target.value) : undefined,
						)
					}
				>
					<option value="">(Instant)</option>
					{allAnims.map((anim) => (
						<option key={JSON.stringify(anim)} value={JSON.stringify(anim)}>
							{displayAnimationRef(anim)}
						</option>
					))}
				</Select>
				<p className="text-xs text-slate-400 mt-1">
					'Loop' animations are not allowed and will not work.
				</p>
			</FormRow>
			<FormRow label="Weight">
				<Input
					type="number"
					step="0.1"
					value={transition.weight}
					onChange={(e) => handleUpdate("weight", parseFloat(e.target.value) || 1.0)}
				/>
			</FormRow>
			<FormRow label="Reverse">
				<input
					type="checkbox"
					checked={transition.reverse}
					onChange={(e) => handleUpdate("reverse", e.target.checked)}
					className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-violet-500 focus:ring-violet-500"
				/>
			</FormRow>
			<FormRow label="Allow Cancel">
				<input
					type="checkbox"
					checked={transition.allowCancel}
					onChange={(e) => handleUpdate("allowCancel", e.target.checked)}
					className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-violet-500 focus:ring-violet-500"
				/>
			</FormRow>
		</div>
	);
}