import { useMemo, useState } from "react";
import { AnimationSettingEditor } from "@/components/editors/AnimationSettingEditor";
import { Button } from "@/components/ui/Button";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { PlusIcon, TrashIcon, WarningIcon } from "@/components/ui/icons";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { renderSettings } from "@/data/renderSettings";
import { useAvatarStore } from "@/store/avatarStore";
import type {
	AnimationID,
	Condition,
	ConditionalSetting,
	HideElementSetting,
	PlayAnimationSetting,
	RenderSetting,
	RenderSettingID,
	Script,
	ScriptDataInstanceType,
	ScriptInstance,
	ScriptSetting,
	UUID,
} from "@/types";
import { generateUUID } from "@/utils/uuid";

type SettingView = "play_animation" | "hide_element" | "render" | "script";

// Helper to summarize the condition for display in the UI
const summarizeCondition = (condition?: Condition): string => {
	if (!condition) {
		return "Always active";
	}
	const countLeafConditions = (c: any): number => {
		if (!c) return 0;
		if (Array.isArray(c.conditions)) {
			return c.conditions.reduce(
				(sum: number, sub: any) => sum + countLeafConditions(sub),
				0,
			);
		}
		if (c.kind === "not") {
			return c.condition ? countLeafConditions(c.condition) : 0;
		}
		return 1;
	};
	const count = countLeafConditions(condition);
	if (count === 0) return "Not configured";
	if (count === 1) return "1 Condition";
	return `${count} Conditions`;
};

// --- Add Setting Dialog Content ---
interface AddSettingDialogContentProps {
	onAdd: (id: string, kind: SettingView) => void;
}

function AddSettingDialogContent({ onAdd }: AddSettingDialogContentProps) {
	const { avatar, animations, modelElements } = useAvatarStore();
	const [view, setView] = useState<SettingView>("play_animation");
	const [filter, setFilter] = useState("");

	const lowerFilter = filter.toLowerCase();

	const unconfiguredItems = useMemo(() => {
		if (!avatar) return [];
		const allSettings = Object.values(avatar.conditionalSettings);
		const allScripts = avatar.scripts;

		if (view === "play_animation") {
			const configuredAnims = new Set(
				allSettings
					.filter((s): s is PlayAnimationSetting => s.kind === "play_animation")
					.map((s) => s.animation),
			);
			return animations
				.filter(
					(animId) =>
						!configuredAnims.has(animId) &&
						animId.toLowerCase().includes(lowerFilter),
				)
				.map((id) => ({ id, name: id }));
		}
		if (view === "hide_element") {
			const configuredElems = new Set(
				allSettings
					.filter((s): s is HideElementSetting => s.kind === "hide_element")
					.map((s) => s.element),
			);
			return modelElements
				.filter(
					(elemId) =>
						!configuredElems.has(elemId) &&
						elemId.toLowerCase().includes(lowerFilter),
				)
				.map((id) => ({ id, name: id }));
		}
		if (view === "render") {
			const configuredKinds = new Set(
				allSettings
					.filter((s): s is RenderSetting => s.kind === "render")
					.map((s) => s.render),
			);
			return Array.from(renderSettings.values())
				.filter(
					(rs) =>
						!configuredKinds.has(rs.id) &&
						rs.name.toLowerCase().includes(lowerFilter),
				)
				.map((rs) => ({ id: rs.id, name: rs.name }));
		}
		if (view === "script") {
			const configuredScriptSettings = new Set(
				allSettings
					.filter((s): s is ScriptSetting => s.kind === "script")
					.map((s) => `${s.scriptInstance}:${s.setting}`),
			);
			const available: { id: string; name: string }[] = [];
			Object.values(allScripts).forEach((script) => {
				Object.entries(script.instances).forEach(([typeUuid, instances]) => {
					const type = script.data.instanceTypes[typeUuid as UUID];
					if (type?.defines?.settings) {
						instances.forEach((instance) => {
							Object.values(type.defines.settings).forEach((settingDef) => {
								const compositeId = `${instance.uuid}:${settingDef.uuid}`;
								if (!configuredScriptSettings.has(compositeId)) {
									available.push({
										id: compositeId,
										name: `${script.name} - ${instance.name}: ${settingDef.name}`,
									});
								}
							});
						});
					}
				});
			});
			return available.filter((item) =>
				item.name.toLowerCase().includes(lowerFilter),
			);
		}
		return [];
	}, [view, avatar, animations, modelElements, lowerFilter]);

	const viewConfig = {
		play_animation: {
			placeholder: `Search ${animations.length} animations...`,
			emptyText: "No unconfigured animations found.",
		},
		hide_element: {
			placeholder: `Search ${modelElements.length} elements...`,
			emptyText: "No unconfigured elements found.",
		},
		render: {
			placeholder: "Search render settings...",
			emptyText: "All render settings are configured.",
		},
		script: {
			placeholder: "Search script settings...",
			emptyText: "No unconfigured script settings found.",
		},
	};

	const renderUnconfiguredItem = (item: { id: string; name: string }) => (
		<div
			key={item.id}
			className="rounded-lg border border-slate-700 p-3 flex justify-between items-center text-slate-400 hover:border-violet-500 hover:bg-violet-900/10 transition-colors duration-200"
		>
			<h4 className="font-semibold text-slate-300 truncate" title={item.name}>
				{item.name}
			</h4>
			<Button
				onClick={() => onAdd(item.id, view)}
				className="bg-violet-600 hover:bg-violet-500 flex-shrink-0"
			>
				<PlusIcon className="w-5 h-5 mr-2" />
				Add
			</Button>
		</div>
	);

	return (
		<div className="space-y-4">
			<SegmentedControl
				value={view}
				onChange={(newView) => {
					setView(newView as SettingView);
					setFilter("");
				}}
				options={[
					{ label: "Play Animation", value: "play_animation" },
					{ label: "Hide Element", value: "hide_element" },
					{ label: "Render", value: "render" },
					{ label: "Script", value: "script" },
				]}
			/>
			<Input
				className="w-full"
				placeholder={viewConfig[view].placeholder}
				value={filter}
				onChange={(e) => setFilter(e.target.value)}
				autoFocus
			/>
			<div className="space-y-2 max-h-96 overflow-y-auto -mr-2 pr-2">
				{unconfiguredItems.length > 0 ? (
					unconfiguredItems.map(renderUnconfiguredItem)
				) : (
					<div className="text-center p-8 text-slate-500">
						{filter ? `No results for "${filter}"` : viewConfig[view].emptyText}
					</div>
				)}
			</div>
		</div>
	);
}

export function AnimationSettingsManager() {
	const { avatar, animations, modelElements, updateAvatar } = useAvatarStore();
	const [filter, setFilter] = useState("");
	const [selectedId, setSelectedId] = useState<UUID | null>(null);
	const [deletingId, setDeletingId] = useState<UUID | null>(null);
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

	const { conditionalSettings, scripts: allScripts } = avatar ?? {
		conditionalSettings: {},
		scripts: {},
	};

	const allScriptInstances = useMemo(() => {
		const instances: Map<
			UUID,
			{ instance: ScriptInstance; script: Script; type: ScriptDataInstanceType }
		> = new Map();
		Object.values(allScripts).forEach((script) => {
			Object.entries(script.instances).forEach(([typeUuid, insts]) => {
				const type = script.data.instanceTypes[typeUuid as UUID];
				if (type) {
					insts.forEach((instance) =>
						instances.set(instance.uuid, { instance, script, type }),
					);
				}
			});
		});
		return instances;
	}, [allScripts]);

	const getSettingInfo = useCallback(
		(
			setting: ConditionalSetting,
		): { title: string; warning: string | null } => {
			let title: string,
				warning: string | null = null;
			switch (setting.kind) {
				case "play_animation":
					title = setting.animation;
					if (!animations.includes(setting.animation))
						warning = "Animation not found in loaded .bbmodel files.";
					break;
				case "hide_element":
					title = setting.element;
					if (!modelElements.includes(setting.element))
						warning = "Element not found in loaded .bbmodel files.";
					break;
				case "render": {
					const renderSetting = renderSettings.get(setting.render);
					if (!renderSetting) warning = "Invalid render setting";
					title = renderSetting?.name ?? setting.render;
					break;
				}
				case "script": {
					const instanceData = allScriptInstances.get(setting.scriptInstance);
					if (instanceData) {
						const settingDef =
							instanceData.type.defines.settings[setting.setting];
						if (settingDef) {
							title = `${instanceData.script.name} - ${instanceData.instance.name}: ${settingDef.name}`;
						} else {
							title = "Unknown Script Setting";
							warning = "Setting definition not found in script.";
						}
					} else {
						title = "Unknown Script Setting";
						warning = "Script instance not found.";
					}
					break;
				}
			}
			return { title, warning };
		},
	);

	const allConfiguredSettings = useMemo(() => {
		return Object.values(conditionalSettings).sort((a, b) => {
			return getSettingInfo(a).title.localeCompare(getSettingInfo(b).title);
		});
	}, [conditionalSettings, getSettingInfo]);

	const lowerFilter = filter.toLowerCase();
	const filteredSettings = useMemo(() => {
		if (!lowerFilter) return allConfiguredSettings;
		return allConfiguredSettings.filter((setting) => {
			const { title } = getSettingInfo(setting);
			return title.toLowerCase().includes(lowerFilter);
		});
	}, [allConfiguredSettings, lowerFilter, getSettingInfo]);

	const selectedSetting = useMemo(
		() => (selectedId ? conditionalSettings[selectedId] : null),
		[selectedId, conditionalSettings],
	);

	if (!avatar) return null;

	const handleAddSetting = (id: string, kind: SettingView) => {
		const newUuid = generateUUID();
		let newSetting: ConditionalSetting;
		switch (kind) {
			case "play_animation":
				newSetting = {
					uuid: newUuid,
					kind,
					animation: id as AnimationID,
				};
				break;
			case "hide_element":
				newSetting = { uuid: newUuid, kind, element: id };
				break;
			case "render":
				newSetting = { uuid: newUuid, kind, render: id as RenderSettingID };
				break;
			case "script": {
				const [instanceUuid, settingUuid] = id.split(":");
				newSetting = {
					uuid: newUuid,
					kind,
					scriptInstance: instanceUuid as UUID,
					setting: settingUuid as UUID,
				};
				break;
			}
		}
		updateAvatar((draft) => {
			draft.conditionalSettings[newUuid] = newSetting;
		});
		setIsAddDialogOpen(false);
		setSelectedId(newUuid);
	};

	const handleDeleteConfirm = () => {
		if (!deletingId) return;
		updateAvatar((draft) => {
			delete draft.conditionalSettings[deletingId];
		});
		if (selectedId === deletingId) {
			setSelectedId(null);
		}
		setDeletingId(null);
	};

	const updateSetting = (updatedSetting: ConditionalSetting) => {
		updateAvatar((draft) => {
			draft.conditionalSettings[updatedSetting.uuid] = updatedSetting;
		});
	};

	return (
		<div className="flex flex-col md:flex-row gap-6 h-full">
			{/* Left Panel */}
			<div className="md:w-1/3 lg:w-1/4 flex-shrink-0 flex flex-col gap-4">
				<div className="flex justify-between items-center pb-3 border-b border-slate-700">
					<h2 className="text-2xl font-bold text-slate-100">Settings</h2>
					<Button
						onClick={() => setIsAddDialogOpen(true)}
						className="bg-violet-600 hover:bg-violet-500"
					>
						<PlusIcon className="w-5 h-5 mr-2" /> Add
					</Button>
				</div>
				<Input
					placeholder={`Search ${allConfiguredSettings.length} settings...`}
					value={filter}
					onChange={(e) => setFilter(e.target.value)}
				/>
				<div className="space-y-2 flex-grow overflow-y-auto -mr-2 pr-2">
					{filteredSettings.map((setting) => {
						const { title, warning } = getSettingInfo(setting);
						return (
							<button
								key={setting.uuid}
								onClick={() => setSelectedId(setting.uuid)}
								className={`w-full text-left p-3 rounded-lg transition-colors duration-150 ${selectedId === setting.uuid ? "bg-violet-500/20 ring-2 ring-violet-500" : "bg-slate-800 hover:bg-slate-700"}`}
							>
								<div className="flex items-center gap-2">
									{warning && (
										<span title={warning}>
											<WarningIcon className="w-4 h-4 text-amber-400 flex-shrink-0" />
										</span>
									)}
									<h3
										className="font-semibold text-slate-100 truncate"
										title={title}
									>
										{title}
									</h3>
								</div>
								<p className="text-sm text-slate-400 pl-6">
									{summarizeCondition(setting.activationCondition)}
								</p>
							</button>
						);
					})}
					{filteredSettings.length === 0 && (
						<div className="text-center text-slate-500 pt-10">
							{allConfiguredSettings.length > 0
								? `No results for "${filter}"`
								: "No settings configured."}
						</div>
					)}
				</div>
			</div>

			{/* Right Panel */}
			<div className="flex-grow bg-slate-800/50 rounded-lg p-6 ring-1 ring-slate-700 overflow-y-auto">
				{selectedSetting ? (
					<div>
						<div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-700">
							<h3
								className="text-xl font-bold text-slate-100 truncate"
								title={getSettingInfo(selectedSetting).title}
							>
								{getSettingInfo(selectedSetting).title}
							</h3>
							<Button
								onClick={() => setDeletingId(selectedSetting.uuid)}
								className="bg-rose-600 hover:bg-rose-500"
							>
								<TrashIcon className="w-5 h-5 sm:mr-2" />
								<span className="hidden sm:inline">Delete</span>
							</Button>
						</div>
						<AnimationSettingEditor
							key={selectedSetting.uuid}
							setting={selectedSetting}
							updateSetting={updateSetting}
						/>
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
							<path d="M12.22 2h-4.44A2 2 0 0 0 6 4v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-8.88" />
							<path d="M16 16h2" />
							<path d="M12 11h6" />
							<path d="M12 16h2" />
							<path d="M18 2l-3.4 3.4a1 1 0 0 0 0 1.4l2.1 2.1a1 1 0 0 0 1.4 0L22 5.4Z" />
						</svg>
						<h3 className="text-lg font-semibold">Select a setting to edit</h3>
						<p className="text-sm">
							Choose a setting from the list, or add a new one.
						</p>
					</div>
				)}
			</div>

			{/* Dialogs */}
			<ConfirmationDialog
				open={!!deletingId}
				onCancel={() => setDeletingId(null)}
				onConfirm={handleDeleteConfirm}
				title="Delete Setting?"
				message={
					<>
						Are you sure you want to delete this setting? This action cannot be
						undone.
					</>
				}
				variant="danger"
				confirmText="Delete"
			/>
			<Dialog
				open={isAddDialogOpen}
				onClose={() => setIsAddDialogOpen(false)}
				className="max-w-2xl"
			>
				<DialogHeader>Add Conditional Setting</DialogHeader>
				<DialogContent>
					<AddSettingDialogContent onAdd={handleAddSetting} />
				</DialogContent>
				<DialogFooter>
					<Button
						onClick={() => setIsAddDialogOpen(false)}
						className="bg-slate-600 hover:bg-slate-500"
					>
						Close
					</Button>
				</DialogFooter>
			</Dialog>
		</div>
	);
}
