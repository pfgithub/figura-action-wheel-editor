import { useState } from "react";
import { LayerEditor } from "@/components/editors/LayerEditor";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PlusIcon, TrashIcon } from "@/components/ui/icons";
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
	const selectedLayer = allLayers.find((l) => l.uuid === selectedId);

	if (!avatar) return null;

	const handleAddLayer = () => {
		const newUuid = generateUUID();
		const newLayer: Layer = {
			uuid: newUuid,
			name: `Layer ${Object.keys(avatar.layers ?? {}).length + 1}`,
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

	const renderListItem = (layer: Layer, isSelected: boolean) => (
		<button
			onClick={() => setSelectedId(layer.uuid)}
			className={`w-full text-left p-3 rounded-lg transition-colors duration-150 flex items-center gap-3 ${
				isSelected
					? "bg-violet-500/20 ring-2 ring-violet-500"
					: "bg-slate-800 hover:bg-slate-700"
			}`}
		>
			<div className="flex-grow">
				<h3 className="font-semibold text-slate-100 truncate">{layer.name}</h3>
				<p className="text-sm text-slate-400">
					{Object.keys(layer.nodes).length} nodes,{" "}
					{Object.keys(layer.transitions).length} transitions
				</p>
			</div>
		</button>
	);

	return (
		<div className="flex flex-col md:flex-row gap-6 h-full">
			{/* Left Panel: Master List */}
			<div className="md:w-1/3 lg:w-1/4 flex-shrink-0 flex flex-col gap-4">
				<div className="flex justify-between items-center pb-3 border-b border-slate-700">
					<h2 className="text-2xl font-bold text-slate-100">
						Animation Layers
					</h2>
					<Button
						onClick={handleAddLayer}
						className="bg-violet-600 hover:bg-violet-500"
					>
						<PlusIcon className="w-5 h-5 mr-2" />
						Add Layer
					</Button>
				</div>
				<div className="space-y-2 flex-grow overflow-y-auto -mr-2 pr-2">
					{allLayers.map((layer) => (
						<div key={layer.uuid}>
							{renderListItem(layer, layer.uuid === selectedId)}
						</div>
					))}
					{allLayers.length === 0 && (
						<div className="text-center text-slate-500 pt-10">
							No layers configured.
						</div>
					)}
				</div>
			</div>

			{/* Right Panel: Detail Editor */}
			<div className="flex-grow flex flex-col min-h-0">
				{selectedLayer ? (
					<>
						<div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-700 flex-shrink-0">
							<h3 className="text-xl font-bold text-slate-100 truncate w-full">
								<Input
									value={selectedLayer.name}
									onChange={(e) =>
										updateLayerName(selectedLayer.uuid, e.target.value)
									}
									className="border-none p-0 h-auto text-xl font-bold w-full focus:ring-0 focus:bg-slate-700"
								/>
							</h3>
							<Button
								onClick={() => handleDeleteLayer(selectedLayer)}
								className="bg-rose-600 hover:bg-rose-500 ml-4 flex-shrink-0"
							>
								<TrashIcon className="w-5 h-5 sm:mr-2" />
								<span className="hidden sm:inline">Delete Layer</span>
							</Button>
						</div>
						<div className="flex-grow min-h-0">
							<LayerEditor key={selectedLayer.uuid} layer={selectedLayer} />
						</div>
					</>
				) : (
					<div className="bg-slate-800/50 rounded-lg p-4 md:p-6 ring-1 ring-slate-700 h-full">
						<EmptyState />
					</div>
				)}
			</div>
		</div>
	);
}
