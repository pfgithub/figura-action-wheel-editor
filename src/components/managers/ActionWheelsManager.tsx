import { useState } from "react";
import { WheelEditor } from "@/components/editors/WheelEditor";
import { MasterDetailManager } from "@/components/layout/MasterDetailManager";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { useAvatarStore } from "@/store/avatarStore";
import type { ActionWheel, UUID } from "@/types";

interface ActionWheelsManagerProps {
	addActionWheel: () => void;
	viewedWheelUuid: UUID | null;
	setViewedWheelUuid: (uuid: UUID | null) => void;
}

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
			<circle cx="12" cy="12" r="10" />
			<path d="M12 8v4l2 2" />
		</svg>
		<h3 className="text-lg font-semibold">Select an action wheel to edit</h3>
		<p className="text-sm">Choose a wheel from the list, or add a new one.</p>
	</div>
);

export function ActionWheelsManager({
	addActionWheel,
	viewedWheelUuid,
	setViewedWheelUuid,
}: ActionWheelsManagerProps) {
	const { avatar, updateAvatar } = useAvatarStore();
	const [deletingItem, setDeletingItem] = useState<ActionWheel | null>(null);

	if (!avatar) return null;

	const allActionWheels = Object.values(avatar.actionWheels);

	const handleDeleteConfirm = () => {
		if (!deletingItem) return;
		const uuid = deletingItem.uuid;

		updateAvatar((draft) => {
			delete draft.actionWheels[uuid];
			if (draft.mainActionWheel === uuid) {
				const nextWheel = Object.values(draft.actionWheels)[0];
				draft.mainActionWheel = nextWheel ? nextWheel.uuid : undefined;
			}
			// Clear references from other wheels and keybinds
			Object.values(draft.actionWheels).forEach((wheel) => {
				wheel.actions.forEach((action) => {
					if (
						action.effect?.kind === "switchPage" &&
						action.effect.actionWheel === uuid
					) {
						action.effect.actionWheel = undefined;
					}
				});
			});
			Object.values(draft.keybinds ?? {}).forEach((keybind) => {
				if (
					keybind.effect?.kind === "switchPage" &&
					keybind.effect.actionWheel === uuid
				) {
					keybind.effect.actionWheel = undefined;
				}
			});
		});

		// After deletion, select the first available wheel or null
		const remainingWheels = Object.values(avatar.actionWheels).filter(
			(w) => w.uuid !== uuid,
		);
		setViewedWheelUuid(remainingWheels[0]?.uuid ?? null);
		setDeletingItem(null);
	};

	return (
		<>
			<MasterDetailManager<ActionWheel>
				items={allActionWheels}
				selectedId={viewedWheelUuid}
				onSelectId={setViewedWheelUuid}
				title="Action Wheels"
				onAddItem={addActionWheel}
				onDeleteItem={setDeletingItem}
				deleteText="Delete Wheel"
				renderListItem={(wheel, isSelected) => (
					<button
						className={`w-full text-left p-3 rounded-lg transition-colors duration-150 flex items-center gap-2 ${isSelected ? "bg-violet-500/20 ring-2 ring-violet-500" : "bg-slate-800 hover:bg-slate-700"}`}
					>
						{avatar.mainActionWheel === wheel.uuid && (
							<span className="text-amber-400" title="Main Wheel">
								★
							</span>
						)}
						<span className="font-semibold text-slate-100 truncate flex-grow">
							{wheel.title}
						</span>
						<span className="text-xs text-slate-400 bg-slate-700 rounded-full px-2 py-0.5">
							{wheel.actions.length}
						</span>
					</button>
				)}
				renderEditor={(wheel) => <WheelEditor key={wheel.uuid} wheel={wheel} />}
				renderEmptyState={EmptyState}
			/>
			<ConfirmationDialog
				open={!!deletingItem}
				onCancel={() => setDeletingItem(null)}
				onConfirm={handleDeleteConfirm}
				title="Delete Action Wheel?"
				message={
					<>
						Are you sure you want to delete the wheel{" "}
						<strong>"{deletingItem?.title}"</strong>? This will also clear any
						references to it from other actions or keybinds. This action is
						permanent.
					</>
				}
				variant="danger"
				confirmText="Delete"
			/>
		</>
	);
}
