import { WheelEditor } from "@/components/editors/WheelEditor";
import { MasterDetailManager } from "@/components/layout/MasterDetailManager";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PlusIcon } from "@/components/ui/icons";
import { useAvatarStore } from "@/store/avatarStore";
import type { ActionWheel, UUID } from "@/types";

interface ActionWheelsManagerProps {
	addActionWheel: () => void;
	viewedWheelUuid: UUID | null;
	setViewedWheelUuid: (uuid: UUID | null) => void;
}

const NoWheelsEmptyState = ({ onAdd }: { onAdd: () => void }) => (
	<div className="flex flex-col items-center justify-center h-full text-center text-slate-500 bg-slate-800/50 rounded-lg p-8 ring-1 ring-slate-700">
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
			<circle cx="12" cy="12" r="3" />
		</svg>
		<h3 className="text-lg font-semibold text-slate-200">
			No Action Wheels Created Yet
		</h3>
		<p className="text-sm mb-6 max-w-sm">
			Action wheels let you perform actions from an in-game radial menu. Get
			started by creating your first wheel.
		</p>
		<Button
			onClick={onAdd}
			className="bg-violet-600 hover:bg-violet-500 text-base py-2 px-6"
		>
			<PlusIcon className="w-5 h-5 mr-2" />
			Create First Wheel
		</Button>
	</div>
);

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
			<circle cx="12" cy="12" r="3" />
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

	if (!avatar) return null;

	const allActionWheels = Object.values(avatar.actionWheels).sort((a, b) =>
		a.title.localeCompare(b.title),
	);

	const handleDeleteWheel = (wheelToDelete: ActionWheel) => {
		const uuid = wheelToDelete.uuid;
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

		if (viewedWheelUuid === uuid) {
			setViewedWheelUuid(null);
		}
	};

	const setMainWheel = (uuid: UUID | undefined) => {
		updateAvatar((draft) => {
			draft.mainActionWheel = uuid;
		});
	};

	const updateWheelTitle = (uuid: UUID, title: string) => {
		updateAvatar((draft) => {
			if (draft.actionWheels[uuid]) {
				draft.actionWheels[uuid].title = title;
			}
		});
	};

	if (allActionWheels.length === 0) {
		return <NoWheelsEmptyState onAdd={addActionWheel} />;
	}

	return (
		<MasterDetailManager<ActionWheel>
			items={allActionWheels}
			selectedId={viewedWheelUuid}
			onSelectId={setViewedWheelUuid}
			title="Action Wheels"
			onAddItem={addActionWheel}
			onDeleteItem={handleDeleteWheel}
			addText="Add Wheel"
			deleteText="Delete Wheel"
			editorTitle={(wheel) => (
				<Input
					value={wheel.title}
					onChange={(e) => updateWheelTitle(wheel.uuid, e.target.value)}
					className="bg-transparent border-none p-0 h-auto text-xl font-bold w-full focus:ring-0 focus:bg-slate-700"
				/>
			)}
			rightButtons={(wheel) => (
				<Button
					onClick={() =>
						setMainWheel(
							avatar.mainActionWheel === wheel.uuid ? undefined : wheel.uuid,
						)
					}
					className={
						avatar.mainActionWheel === wheel.uuid
							? "bg-amber-500 focus-visible:ring-amber-300"
							: "bg-slate-600 hover:bg-slate-500 focus-visible:ring-slate-400"
					}
				>
					{avatar.mainActionWheel !== wheel.uuid ? "Set as Main" : "Unset Main"}
				</Button>
			)}
			renderListItem={(wheel, isSelected) => (
				<button
					className={`w-full text-left p-3 rounded-lg transition-colors duration-150 flex items-center gap-3 ${
						isSelected
							? "bg-violet-500/20 ring-2 ring-violet-500"
							: "bg-slate-800 hover:bg-slate-700"
					}`}
				>
					{avatar.mainActionWheel === wheel.uuid && (
						<span className="text-amber-400 font-bold" title="Main Wheel">
							★
						</span>
					)}
					<div className="flex-grow">
						<h3 className="font-semibold text-slate-100 truncate">
							{wheel.title}
						</h3>
						<p className="text-sm text-slate-400">
							{wheel.actions.length} action
							{wheel.actions.length !== 1 && "s"}
						</p>
					</div>
				</button>
			)}
			renderEditor={(wheel) => <WheelEditor key={wheel.uuid} wheel={wheel} />}
			renderEmptyState={EmptyState}
		/>
	);
}