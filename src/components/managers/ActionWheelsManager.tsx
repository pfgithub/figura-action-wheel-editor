import { WheelEditor } from "@/components/editors/WheelEditor";
import { Button } from "@/components/ui/Button";
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
			<path d="M12 8v4l2 2" />
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

export function ActionWheelsManager({
	addActionWheel,
	viewedWheelUuid,
	setViewedWheelUuid,
}: ActionWheelsManagerProps) {
	const { avatar, updateAvatar } = useAvatarStore();

	if (!avatar) return null;

	const allActionWheels = Object.values(avatar.actionWheels);
	const viewedWheel = viewedWheelUuid
		? avatar.actionWheels[viewedWheelUuid]
		: null;

	const handleDeleteWheel = (uuid: UUID) => {
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
	};

	if (allActionWheels.length === 0) {
		return <NoWheelsEmptyState onAdd={addActionWheel} />;
	}

	return (
		<div className="flex flex-col h-full">
			{/* Horizontal Wheel Navigation */}
			<div className="flex-shrink-0 flex items-center gap-4 border-b border-slate-700 pb-3 mb-6">
				<div className="flex-grow flex items-center gap-2 overflow-x-auto -mb-3 pb-3">
					{allActionWheels.map((wheel) => (
						<button
							key={wheel.uuid}
							onClick={() => setViewedWheelUuid(wheel.uuid)}
							className={`flex-shrink-0 flex items-center gap-2.5 py-2.5 px-4 rounded-t-lg transition-colors duration-200 border-b-2 ${
								viewedWheelUuid === wheel.uuid
									? "bg-slate-800/60 border-violet-500 text-white"
									: "border-transparent text-slate-400 hover:text-white hover:bg-slate-800/60"
							}`}
						>
							{avatar.mainActionWheel === wheel.uuid && (
								<span className="text-amber-400 text-lg" title="Main Wheel">
									★
								</span>
							)}
							<span className="font-semibold text-sm">{wheel.title}</span>
							<span className="text-xs text-slate-300 bg-slate-700 rounded-full px-2 py-0.5">
								{wheel.actions.length}
							</span>
						</button>
					))}
				</div>
				<Button
					onClick={addActionWheel}
					className="bg-violet-600 hover:bg-violet-500 flex-shrink-0"
				>
					<PlusIcon className="w-5 h-5 mr-2" />
					Add Wheel
				</Button>
			</div>

			{/* Editor Content */}
			<div className="flex-grow min-h-0">
				{viewedWheel && (
					<WheelEditor
						key={viewedWheel.uuid}
						wheel={viewedWheel}
						onDeleteWheel={() => handleDeleteWheel(viewedWheel.uuid)}
					/>
				)}
			</div>
		</div>
	);
}