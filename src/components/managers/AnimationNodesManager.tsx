import { useState } from "react";
import { AnimationLayerEditor } from "@/components/editors/AnimationLayerEditor";
import { MasterDetailManager } from "@/components/layout/MasterDetailManager";
import { useAvatarStore } from "@/store/avatarStore";
import type { AnimationLayer, AnimationNode, UUID } from "@/types";
import { generateUUID } from "@/utils/uuid";
import { Input } from "../ui/Input";

const EmptyState = () => (
	<div className="flex flex-col items-center justify-center h-full text-slate-500">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className="w-16 h-16 mb-4"
		>
			<path d="M12 20s-8-4.5-8-12V5l8-3 8 3v3" />
			<path d="M12 20v-7.5" />
			<path d="M12 12.5L4 8" />
			<path d="m20 8-8 4.5" />
			<path d="M20 11v3.5a2.5 2.5 0 0 1-5 0V11a2.5 2.5 0 0 1 5 0Z" />
			<path d="M17.5 14.5V11" />
		</svg>
		<h3 className="text-lg font-semibold">Select an animation layer to edit</h3>
		<p className="text-sm">
			Choose a layer from the list, or add a new one.
		</p>
	</div>
);

export function AnimationNodesManager() {
	const { avatar, updateAvatar } = useAvatarStore();
	const [selectedId, setSelectedId] = useState<UUID | null>(null);

	if (!avatar) return null;

	const allLayers = Object.values(avatar.animationLayers ?? {}).sort((a, b) =>
		a.name.localeCompare(b.name),
	);

	const handleAddLayer = () => {
		const layerUuid = generateUUID();
		const noneNodeUuid = generateUUID();

		const noneNode: AnimationNode = {
			uuid: noneNodeUuid,
			name: "None",
			animation: undefined,
			transitions: [],
		};

		const newLayer: AnimationLayer = {
			uuid: layerUuid,
			name: `New Layer ${allLayers.length + 1}`,
			nodes: { [noneNodeUuid]: noneNode },
			noneNode: noneNodeUuid,
		};
		updateAvatar((draft) => {
			draft.animationLayers ??= {};
			draft.animationLayers[layerUuid] = newLayer;
		});
		setSelectedId(layerUuid);
	};

	const handleDelete = (itemToDelete: AnimationLayer) => {
		updateAvatar((draft) => {
			if (draft.animationLayers) {
				delete draft.animationLayers[itemToDelete.uuid];
			}
		});
		if (selectedId === itemToDelete.uuid) {
			setSelectedId(null);
		}
	};

	const updateLayer = (updatedLayer: AnimationLayer) => {
		updateAvatar((draft) => {
			if (draft.animationLayers) {
				draft.animationLayers[updatedLayer.uuid] = updatedLayer;
			}
		});
	};

	return (
		<MasterDetailManager<AnimationLayer>
			items={allLayers}
			selectedId={selectedId}
			onSelectId={setSelectedId}
			title="Animation Layers"
			onAddItem={handleAddLayer}
			onDeleteItem={handleDelete}
			addText="Add Layer"
			deleteText="Delete Layer"
			editorTitle={(layer) => (
				<Input
					value={layer.name}
					onChange={(e) => updateLayer({ ...layer, name: e.target.value })}
					className="bg-transparent border-none p-0 h-auto text-xl font-bold w-auto focus:ring-0 focus:bg-slate-700"
				/>
			)}
			renderListItem={(layer, isSelected) => (
				<button
					className={`w-full text-left p-3 rounded-lg transition-colors duration-150 ${
						isSelected
							? "bg-violet-500/20 ring-2 ring-violet-500"
							: "bg-slate-800 hover:bg-slate-700"
					}`}
				>
					<h3 className="font-semibold text-slate-100 truncate">{layer.name}</h3>
					<p className="text-sm text-slate-400">
						{Object.keys(layer.nodes).length} nodes
					</p>
				</button>
			)}
			renderEditor={(layer) => (
				<AnimationLayerEditor key={layer.uuid} layer={layer} />
			)}
			renderEmptyState={EmptyState}
		/>
	);
}