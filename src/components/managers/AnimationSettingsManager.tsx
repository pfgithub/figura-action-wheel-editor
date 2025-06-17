import React, { useState, useMemo } from "react";
import type {
	UUID,
	ConditionalSetting,
	PlayAnimationSetting,
	HideElementSetting,
	RenderSetting,
	RenderSettingID,
	AnimationID,
	Script,
	ScriptSetting,
	ScriptInstance,
	ScriptDataInstanceType,
} from "@/types";
import { useAvatarStore } from "@/store/avatarStore";
import { AnimationSettingEditor } from "@/components/editors/AnimationSettingEditor";
import { PlusIcon, TrashIcon, WarningIcon } from "@/components/ui/icons";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { generateUUID } from "@/utils/uuid";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { renderSettings } from "@/data/renderSettings";
import {
	Dialog,
	DialogHeader,
	DialogContent,
	DialogFooter,
} from "@/components/ui/Dialog";

type SettingView = "play_animation" | "hide_element" | "render" | "script";

// Helper to summarize the condition for display in the UI
const summarizeCondition = (setting?: ConditionalSetting): string => {
	if (!setting?.activationCondition) {
		return "Always active";
	}
	const countLeafConditions = (c: any): number => {
		if (!c) return 0;
		switch (c.kind) {
			case "and":
			case "or":
				return c.conditions.reduce(
					(sum: number, sub: any) => sum + countLeafConditions(sub),
					0,
				);
			case "not":
				return c.condition ? countLeafConditions(c.condition) : 0;
			case "toggleGroup":
			case "render":
			case "animation":
			case "custom":
			case "script":
				return 1;
			default:
				return 0;
		}
	};
	const count = countLeafConditions(setting.activationCondition);
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
			className="rounded-lg border-2 border-dashed border-slate-700 p-3 flex justify-between items-center text-slate-400 hover:border-violet-500 hover:bg-violet-900/10 transition-colors duration-200"
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

// --- AnimationSettingsManager Component ---

export function AnimationSettingsManager() {
	const { avatar, animations, modelElements, updateAvatar } = useAvatarStore();

	const [filter, setFilter] = useState("");
	const [expandedId, setExpandedId] = useState<UUID | null>(null);
	const [deletingId, setDeletingId] = useState<UUID | null>(null);
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

	if (!avatar) return null;

	const { conditionalSettings, scripts: allScripts } = avatar;

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

	const lowerFilter = filter.toLowerCase();

	const allConfiguredSettings = useMemo(() => {
		return Object.values(conditionalSettings).sort((a, b) => {
			const getName = (s: ConditionalSetting): string => {
				switch (s.kind) {
					case "play_animation":
						return s.animation;
					case "hide_element":
						return s.element;
					case "render":
						return renderSettings.get(s.render)?.name ?? s.render;
					case "script":
						const instanceData = allScriptInstances.get(s.scriptInstance);
						if (instanceData) {
							const settingDef = instanceData.type.defines.settings[s.setting];
							if (settingDef)
								return `${instanceData.script.name} - ${instanceData.instance.name}: ${settingDef.name}`;
						}
						return "Unknown Script Setting";
				}
			};
			return getName(a).localeCompare(getName(b));
		});
	}, [conditionalSettings, allScriptInstances]);

	const filteredSettings = useMemo(() => {
		if (!lowerFilter) return allConfiguredSettings;
		return allConfiguredSettings.filter((setting) => {
			let name: string;
			switch (setting.kind) {
				case "play_animation":
					name = setting.animation;
					break;
				case "hide_element":
					name = setting.element;
					break;
				case "render":
					name = renderSettings.get(setting.render)?.name ?? setting.render;
					break;
				case "script":
					const instanceData = allScriptInstances.get(setting.scriptInstance);
					if (instanceData) {
						const settingDef =
							instanceData.type.defines.settings[setting.setting];
						name = settingDef
							? `${instanceData.script.name} - ${instanceData.instance.name}: ${settingDef.name}`
							: "";
					} else {
						name = "";
					}
					break;
				default:
					name = "";
			}
			return name.toLowerCase().includes(lowerFilter);
		});
	}, [allConfiguredSettings, lowerFilter, allScriptInstances]);

	const toggleExpand = (uuid: UUID) => {
		setExpandedId((prev) => (prev === uuid ? null : uuid));
	};

	const handleAddSetting = (id: string, kind: SettingView) => {
		const newUuid = generateUUID();
		let newSetting: ConditionalSetting;

		if (kind === "play_animation") {
			newSetting = {
				uuid: newUuid,
				kind: "play_animation",
				animation: id as AnimationID,
			};
		} else if (kind === "hide_element") {
			newSetting = { uuid: newUuid, kind: "hide_element", element: id };
		} else if (kind === "script") {
			const [instanceUuid, settingUuid] = id.split(":");
			newSetting = {
				uuid: newUuid,
				kind: "script",
				scriptInstance: instanceUuid as UUID,
				setting: settingUuid as UUID,
			};
		} else {
			// render
			newSetting = {
				uuid: newUuid,
				kind: "render",
				render: id as RenderSettingID,
			};
		}

		updateAvatar((draft) => {
			draft.conditionalSettings[newUuid] = newSetting;
		});
		setIsAddDialogOpen(false);
		setExpandedId(newUuid);
	};

	const handleDeleteRequest = (uuid: UUID) => {
		setDeletingId(uuid);
	};

	const handleDeleteConfirm = () => {
		if (!deletingId) return;
		updateAvatar((draft) => {
			delete draft.conditionalSettings[deletingId];
		});
		if (expandedId === deletingId) {
			setExpandedId(null);
		}
		setDeletingId(null);
	};

	const updateSetting = (updatedSetting: ConditionalSetting) => {
		updateAvatar((draft) => {
			draft.conditionalSettings[updatedSetting.uuid] = updatedSetting;
		});
	};

	const renderItem = (setting: ConditionalSetting) => {
		const isExpanded = expandedId === setting.uuid;
		const id = setting.uuid;
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
			case "render":
				const renderSetting = renderSettings.get(setting.render);
				if (!renderSetting) warning = "Invalid render setting";
				title = renderSetting?.name ?? setting.render;
				break;
			case "script":
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

		return (
			<div
				key={id}
				className="bg-slate-800 rounded-lg ring-1 ring-slate-700 overflow-hidden transition-all duration-300"
			>
				<div
					role="button"
					tabIndex={0}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === " ") toggleExpand(id);
					}}
					onClick={() => toggleExpand(id)}
					className="w-full text-left p-4 flex justify-between items-center hover:bg-slate-700/40 transition-colors cursor-pointer"
					aria-expanded={isExpanded}
				>
					<div className="flex-grow min-w-0 pr-4 flex items-center gap-3">
						{warning && (
							<span title={warning}>
								<WarningIcon className="w-5 h-5 text-amber-400 flex-shrink-0" />
							</span>
						)}
						<h4
							className="font-semibold text-lg text-slate-100 truncate"
							title={title}
						>
							{title}
						</h4>
					</div>
					<div className="flex items-center gap-2 flex-shrink-0">
						<span className="hidden sm:inline-block text-sm text-slate-300 bg-slate-700 px-3 py-1 rounded-full">
							{summarizeCondition(setting)}
						</span>
						<button
							onClick={(e) => {
								e.stopPropagation();
								handleDeleteRequest(id);
							}}
							className="p-2 rounded-md hover:bg-rose-600/40 text-rose-300 z-10 relative"
							title="Delete Setting"
						>
							<TrashIcon className="w-5 h-5" />
						</button>
						<svg
							className={`flex-shrink-0 w-6 h-6 text-slate-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : "rotate-0"}`}
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<path d="m6 9 6 6 6-6" />
						</svg>
					</div>
				</div>
				{isExpanded && (
					<div className="p-4 border-t border-slate-700 bg-slate-800/50">
						<AnimationSettingEditor
							setting={setting}
							updateSetting={updateSetting}
						/>
					</div>
				)}
			</div>
		);
	};

	return (
		<div className="space-y-4">
			<div className="flex flex-col sm:flex-row gap-4 items-center">
				<Input
					className="w-full"
					placeholder={`Search ${allConfiguredSettings.length} configured settings...`}
					value={filter}
					onChange={(e) => setFilter(e.target.value)}
				/>
				<Button
					onClick={() => setIsAddDialogOpen(true)}
					className="bg-violet-600 hover:bg-violet-500 flex-shrink-0 w-full sm:w-auto"
				>
					<PlusIcon className="w-5 h-5 mr-2" />
					Add Setting
				</Button>
			</div>

			<div className="space-y-2">
				{filteredSettings.length > 0 ? (
					filteredSettings.map(renderItem)
				) : (
					<div className="flex flex-col items-center justify-center h-24 bg-slate-800/50 rounded-lg p-8 text-slate-500 ring-1 ring-slate-700">
						<p className="text-center font-medium">
							{allConfiguredSettings.length > 0
								? `No results for "${filter}"`
								: `No conditional settings configured.`}
						</p>
						{allConfiguredSettings.length === 0 && (
							<p className="text-sm">Click "Add Setting" to get started.</p>
						)}
					</div>
				)}
			</div>

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
				className="max-w-4xl"
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
