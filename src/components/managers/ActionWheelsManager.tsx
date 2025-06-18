import { useEffect, useState } from "react";
import { ActionEditor } from "@/components/editors/ActionEditor";
import { ActionWheelVisualizer } from "@/components/ui/ActionWheelVisualizer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PlusIcon } from "@/components/ui/icons";
import { useAvatarStore } from "@/store/avatarStore";
import type { Action, UUID } from "@/types";
import { generateUUID } from "@/utils/uuid";

interface ActionWheelsManagerProps {
	addActionWheel: () => void;
	viewedWheelUuid: UUID | null;
	setViewedWheelUuid: (uuid: UUID | null) => void;
}

const MAX_ACTIONS_PER_WHEEL = 8;

export function ActionWheelsManager({
	addActionWheel,
	viewedWheelUuid,
	setViewedWheelUuid,
}: ActionWheelsManagerProps) {
	const { avatar, updateAvatar } = useAvatarStore();
	const [selectedActionIndex, setSelectedActionIndex] = useState<number | null>(
		null,
	);

	// Reset selection when the viewed wheel changes
	useEffect(() => {
		setSelectedActionIndex(null);
	}, []);

	if (!avatar) return null; // Should not happen if App component handles loading state

	const allActionWheels = Object.values(avatar.actionWheels);
	const currentWheel = viewedWheelUuid
		? avatar.actionWheels[viewedWheelUuid]
		: null;

	const setMainWheel = (uuid: UUID | undefined) => {
		updateAvatar((draft) => {
			draft.mainActionWheel = uuid;
		});
	};

	const deleteActionWheel = (uuid: UUID) => {
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

	const updateWheelTitle = (uuid: UUID, title: string) => {
		updateAvatar((draft) => {
			if (draft.actionWheels[uuid]) {
				draft.actionWheels[uuid].title = title;
			}
		});
	};

	const addAction = (wheelUuid: UUID) => {
		updateAvatar((draft) => {
			const wheel = draft.actionWheels[wheelUuid];
			if (wheel && wheel.actions.length < MAX_ACTIONS_PER_WHEEL) {
				const newAction: Action = {
					uuid: generateUUID(),
					icon: { type: "item", id: "minecraft:air" },
					label: `Action ${wheel.actions.length + 1}`,
					color: [80, 80, 80],
				};
				wheel.actions.push(newAction);
				setSelectedActionIndex(wheel.actions.length - 1);
			} else if (wheel) {
				alert(
					`A wheel can have a maximum of ${MAX_ACTIONS_PER_WHEEL} actions.`,
				);
			}
		});
	};

	const selectedActionData = (() => {
		if (!currentWheel || selectedActionIndex === null) return null;
		const action = currentWheel.actions[selectedActionIndex];
		if (!action) return null;
		return {
			wheel: currentWheel,
			action,
			wheelUuid: currentWheel.uuid,
			actionIndex: selectedActionIndex,
		};
	})();

	const updateSelectedAction = (newAction: Action) => {
		if (!selectedActionData) return;
		const { wheelUuid, actionIndex } = selectedActionData;
		updateAvatar((draft) => {
			draft.actionWheels[wheelUuid].actions[actionIndex] = newAction;
		});
	};

	const deleteSelectedAction = () => {
		if (!selectedActionData) return;
		const { wheelUuid, actionIndex } = selectedActionData;
		updateAvatar((draft) => {
			draft.actionWheels[wheelUuid].actions.splice(actionIndex, 1);
		});
		setSelectedActionIndex(null);
	};

	const moveSelectedAction = (targetWheelUuid: UUID) => {
		if (!selectedActionData) return;
		const {
			action,
			wheelUuid: sourceWheelUuid,
			actionIndex,
		} = selectedActionData;
		const targetWheel = avatar.actionWheels[targetWheelUuid];
		if (targetWheel && targetWheel.actions.length >= MAX_ACTIONS_PER_WHEEL) {
			alert(`Cannot move action. Wheel "${targetWheel.title}" is full.`);
			return;
		}
		updateAvatar((draft) => {
			draft.actionWheels[sourceWheelUuid].actions.splice(actionIndex, 1);
			draft.actionWheels[targetWheelUuid].actions.push(action);
		});
		setSelectedActionIndex(null);
	};

	const handleReorder = (
		oldIndex: number,
		newIndex: number,
		preDragSelection: number | null,
	) => {
		if (!currentWheel) return;
		updateAvatar((draft) => {
			const wheel = draft.actionWheels[currentWheel.uuid];
			const [moved] = wheel.actions.splice(oldIndex, 1);
			wheel.actions.splice(newIndex, 0, moved);
		});
		if (preDragSelection === oldIndex) {
			setSelectedActionIndex(newIndex);
		} else {
			setSelectedActionIndex(preDragSelection);
		}
	};

	return (
		<div className="flex flex-col md:flex-row gap-6 h-full">
			{/* Left Panel: Wheels List */}
			<div className="md:w-1/3 lg:w-1/4 flex-shrink-0 flex flex-col gap-4">
				<div className="flex justify-between items-center pb-3 border-b border-slate-700">
					<h2 className="text-2xl font-bold text-slate-100">Action Wheels</h2>
					<Button
						onClick={addActionWheel}
						className="bg-violet-600 hover:bg-violet-500"
					>
						<PlusIcon className="w-5 h-5 mr-2" />
						Add
					</Button>
				</div>
				<div className="space-y-2 flex-grow overflow-y-auto -mr-2 pr-2">
					{allActionWheels.map((wheel) => (
						<button
							key={wheel.uuid}
							onClick={() => setViewedWheelUuid(wheel.uuid)}
							className={`w-full text-left p-3 rounded-lg transition-colors duration-150 flex items-center gap-2 ${viewedWheelUuid === wheel.uuid ? "bg-violet-500/20 ring-2 ring-violet-500" : "bg-slate-800 hover:bg-slate-700"}`}
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
					))}
					{allActionWheels.length === 0 && (
						<div className="text-center text-slate-500 pt-10">
							No action wheels found.
						</div>
					)}
				</div>
			</div>

			{/* Right Panel: Wheel Editor */}
			<div className="flex-grow bg-slate-800/50 rounded-lg p-4 ring-1 ring-slate-700 overflow-y-auto">
				{currentWheel ? (
					<div className="space-y-6">
						{/* Wheel Header Controls */}
						<div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
							<Input
								type="text"
								aria-label="Wheel Title"
								value={currentWheel.title}
								onChange={(e) =>
									updateWheelTitle(currentWheel.uuid, e.target.value)
								}
								className="text-xl font-semibold bg-slate-700/80 border-slate-600"
							/>
							<div className="flex gap-2 flex-shrink-0">
								<Button
									onClick={() =>
										setMainWheel(
											avatar.mainActionWheel === currentWheel.uuid
												? undefined
												: currentWheel.uuid,
										)
									}
									className="bg-amber-500 hover:bg-amber-400 focus-visible:ring-amber-300"
								>
									{avatar.mainActionWheel !== currentWheel.uuid
										? "Set as Main"
										: "Unset Main"}
								</Button>
								{allActionWheels.length > 1 && (
									<Button
										onClick={() => deleteActionWheel(currentWheel.uuid)}
										className="bg-rose-600 hover:bg-rose-500"
									>
										Delete Wheel
									</Button>
								)}
							</div>
						</div>

						{/* Main Content */}
						<div className="flex flex-col gap-8">
							<div className="flex justify-center items-center py-4">
								<ActionWheelVisualizer
									key={currentWheel.uuid}
									actions={currentWheel.actions}
									onSelectAction={setSelectedActionIndex}
									onAddAction={() => addAction(currentWheel.uuid)}
									selectedActionIndex={selectedActionIndex}
									wheelTitle={currentWheel.title}
									onReorder={(oldIndex, newIndex) =>
										handleReorder(oldIndex, newIndex, selectedActionIndex)
									}
								/>
							</div>

							<div>
								{selectedActionData ? (
									<ActionEditor
										key={`${selectedActionData.wheelUuid}-${selectedActionData.action.uuid}`}
										action={selectedActionData.action}
										updateAction={updateSelectedAction}
										deleteAction={deleteSelectedAction}
										currentWheelUuid={selectedActionData.wheelUuid}
										onMoveAction={moveSelectedAction}
									/>
								) : (
									<div className="flex flex-col items-center justify-center h-full bg-slate-800/50 rounded-lg p-8 text-slate-500 ring-1 ring-slate-700 min-h-[400px]">
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
											className="w-12 h-12 mb-4 text-slate-600"
										>
											<path d="m21.1 16.3-4.2-4.2a2 2 0 0 0-2.8 0L3.7 22a2 2 0 0 1-2.8-2.8l10.4-10.4a2 2 0 0 0 0-2.8L7.1 1.7a2 2 0 0 1 2.8 0l11.2 11.2a2 2 0 0 1 0 2.8z" />
											<path d="m22 22-2.5-2.5" />
											<path d="m3.5 3.5 2.5 2.5" />
										</svg>
										<p className="font-medium">Select an action to edit</p>
										<p className="text-sm text-center">
											Click a slot on the wheel, or drag to reorder.
										</p>
									</div>
								)}
							</div>
						</div>
					</div>
				) : (
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
						<h3 className="text-lg font-semibold">
							Select an action wheel to edit
						</h3>
						<p className="text-sm">
							Choose a wheel from the list, or add a new one.
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
