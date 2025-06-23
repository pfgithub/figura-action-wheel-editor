import { FormRow } from "@/components/ui/FormRow";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useAvatarStore } from "@/store/avatarStore";
import type { AnimationRef, Layer, LayerNode } from "@/types";

interface LayerNodeEditorProps {
	node: LayerNode;
	layer: Layer;
	onUpdate: (updatedNode: LayerNode) => void;
}

export function LayerNodeEditor({
	node,
	layer,
	onUpdate,
}: LayerNodeEditorProps) {
	const { animations: allAnims } = useAvatarStore();

	const displayAnimationRef = (ref: AnimationRef) => {
		const loop = ref.loop ? ` (${ref.loop})` : "";
		return `${ref.model}.${ref.animation}${loop}`;
	};

	const handleUpdate = <K extends keyof LayerNode>(
		key: K,
		value: LayerNode[K],
	) => {
		onUpdate({ ...node, [key]: value });
	};

	return (
		<div className="space-y-4">
			<FormRow label="Name">
				<Input
					value={node.name}
					onChange={(e) => handleUpdate("name", e.target.value)}
				/>
			</FormRow>
			<FormRow label="Animation">
				<Select
					value={node.animation ? JSON.stringify(node.animation) : ""}
					onChange={(e) =>
						handleUpdate(
							"animation",
							e.target.value ? JSON.parse(e.target.value) : undefined,
						)
					}
				>
					<option value="">(None)</option>
					{allAnims.map((anim) => (
						<option key={JSON.stringify(anim)} value={JSON.stringify(anim)}>
							{displayAnimationRef(anim)}
						</option>
					))}
				</Select>
				<p className="text-xs text-slate-400 mt-1">
					'Once' animations are not allowed and will not work.
				</p>
			</FormRow>
		</div>
	);
}