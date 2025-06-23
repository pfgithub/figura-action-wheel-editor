import { useState } from "react";
import { LayerEditor } from "@/components/editors/LayerEditor";
import { MasterDetailManager } from "@/components/layout/MasterDetailManager";
import { Input } from "@/components/ui/Input";
import { useAvatarStore } from "@/store/avatarStore";
import type { Layer, UUID } from "@/types";
import { generateUUID } from "@/utils/uuid";

const EmptyState = () => (
	<div className="flex flex-col items-center justify-center h-full text-slate-500">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			className="w-16 h-16 mb-4"
		>
			<path d="M12 2L2 7l10 5 10-5-10-5z" />
			<path d="M2 17l10 5 10-5" />
			<path d="M2 12l10 5 10-5" />
		</svg>
		<h3 className="text-lg font-semibold">Select a layer to edit</h3>
		<p className="text-sm">Choose a layer from the list, or add a new one.</p>
	</div>
);

export function LayersManager() {
	const { avatar, updateAvatar } = useAvatarStore();
	const [selectedId, setSelectedId] = useState<UUID | null>(null);

	// TODO: Layers should be reorderable for priority. For now, sort by name.
	const allLayers = Object.values(avatar?.layers ?? {}).sort((a, b) =>
		a.name.localeCompare(b.name),
	);

	const handleAddLayer = () => {
		const newUuid = generateUUID();
		const newLayer: Layer = {
			uuid: newUuid,
			name: `Layer ${Object.keys(avatar?.layers ?? {}).length + 1}`,
			nodes: {},
			transitions: {},
			conditions: [],
		};
		updateAvatar((draft) => {
			draft.layers ??= {};
			draft.layers[newUuid] = newLayer;
		});
		setSelectedId(newUuid);
	};

	const handleDeleteLayer = (layer: Layer) => {
		updateAvatar((draft) => {
			if (draft.layers) {
				delete draft.layers[layer.uuid];
			}
		});
		if (selectedId === layer.uuid) {
			setSelectedId(null);
		}
	};

	const updateLayerName = (uuid: UUID, name: string) => {
		updateAvatar((draft) => {
			if (draft.layers?.[uuid]) {
				draft.layers[uuid].name = name;
			}
		});
	};

	if (!avatar) return null;

	return (
		<MasterDetailManager<Layer>
			items={allLayers}
			selectedId={selectedId}
			onSelectId={setSelectedId}
			title="Animation Layers"
			onAddItem={handleAddLayer}
			onDeleteItem={handleDeleteLayer}
			addText="Add Layer"
			deleteText="Delete Layer"
			editorTitle={(layer) => (
				<Input
					value={layer.name}
					onChange={(e) => updateLayerName(layer.uuid, e.target.value)}
					className="bg-transparent border-none p-0 h-auto text-xl font-bold w-full focus:ring-0 focus:bg-slate-700"
				/>
			)}
			renderListItem={(layer, isSelected) => (
				<button
					className={`w-full text-left p-3 rounded-lg transition-colors duration-150 flex items-center gap-3 ${
						isSelected
							? "bg-violet-500/20 ring-2 ring-violet-500"
							: "bg-slate-800 hover:bg-slate-700"
					}`}
				>
					<div className="flex-grow">
						<h3 className="font-semibold text-slate-100 truncate">
							{layer.name}
						</h3>
						<p className="text-sm text-slate-400">
							{Object.keys(layer.nodes).length} nodes,{" "}
							{Object.keys(layer.transitions).length} transitions
						</p>
					</div>
				</button>
			)}
			renderEditor={(layer) => <LayerEditor key={layer.uuid} layer={layer} />}
			renderEmptyState={EmptyState}
		/>
	);
}