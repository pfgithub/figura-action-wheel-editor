import { useCallback, useMemo, useState } from "react";
import { AnimationSettingEditor } from "@/components/editors/AnimationSettingEditor";
import { MasterDetailManager } from "@/components/layout/MasterDetailManager";
import { Button } from "@/components/ui/Button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { PlusIcon, WarningIcon } from "@/components/ui/icons";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { renderSettings } from "@/data/renderSettings";
import {
	useScriptInstanceMap,
	useScriptInstancesWithDefine,
} from "@/hooks/useScriptData";
import { useAvatarStore } from "@/store/avatarStore";
import type {
	Condition,
	ConditionalSetting,
	HideElementSetting,
	ModelPartRef,
	RenderSetting,
	RenderSettingID,
	ScriptSetting,
	UUID,
} from "@/types";
import { generateUUID } from "@/utils/uuid";

type SettingView = "hide_element" | "render" | "script";

const displayModelPartRef = (ref: ModelPartRef) =>
	`${ref.model}.${ref.partPath.join(".")}`;

const summarizeCondition = (condition?: Condition): string => {
	if (!condition) return "Always active";
	const countLeafConditions = (c: any): number => {
		if (!c) return 0;
		if (Array.isArray(c.conditions))
			return c.conditions.reduce(
				(sum: number, sub: any) => sum + countLeafConditions(sub),
				0,
			);
		if (c.kind === "not")
			return c.condition ? countLeafConditions(c.condition) : 0;
		return 1;
	};
	const count = countLeafConditions(condition);
	if (count === 0) return "Not configured";
	return count === 1 ? "1 Condition" : `${count} Conditions`;
};

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
			<path d="M12.22 2h-4.44A2 2 0 0 0 6 4v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-8.88" />
			<path d="M16 16h2" />
			<path d="M12 11h6" />
			<path d="M12 16h2" />
			<path d="M18 2l-3.4 3.4a1 1 0 0 0 0 1.4l2.1 2.1a1 1 0 0 0 1.4 0L22 5.4Z" />
		</svg>
		<h3 className="text-lg font-semibold">Select a setting to edit</h3>
		<p className="text-sm">Choose a setting from the list, or add a new one.</p>
	</div>
);

// --- Add Setting Dialog Content ---
interface AddSettingDialogContentProps {
	onAdd: (id: string, kind: SettingView) => void;
}
function AddSettingDialogContent({ onAdd }: AddSettingDialogContentProps) {
	const { avatar, modelElements } = useAvatarStore();
	const scriptInstancesWithSettings = useScriptInstancesWithDefine("settings");
	const [view, setView] = useState<SettingView>("hide_element");
	const [filter, setFilter] = useState("");
	const lowerFilter = filter.toLowerCase();

	const unconfiguredItems = useMemo(() => {
		if (!avatar) return [];
		const allSettings = Object.values(avatar.conditionalSettings);
		if (view === "hide_element") {
			const configured = new Set(
				allSettings
					.filter((s): s is HideElementSetting => s.kind === "hide_element")
					.map((s) => JSON.stringify(s.element)),
			);
			return modelElements
				.filter((ref) => {
					const name = displayModelPartRef(ref);
					return (
						!configured.has(JSON.stringify(ref)) &&
						name.toLowerCase().includes(lowerFilter)
					);
				})
				.map((ref) => ({
					id: JSON.stringify(ref),
					name: displayModelPartRef(ref),
				}));
		}
		if (view === "render") {
			const configured = new Set(
				allSettings
					.filter((s): s is RenderSetting => s.kind === "render")
					.map((s) => s.render),
			);
			return Array.from(renderSettings.values())
				.filter(
					(rs) =>
						!configured.has(rs.id) &&
						rs.name.toLowerCase().includes(lowerFilter),
				)
				.map((rs) => ({ id: rs.id, name: rs.name }));
		}
		if (view === "script") {
			const configured = new Set(
				allSettings
					.filter((s): s is ScriptSetting => s.kind === "script")
					.map((s) => `${s.scriptInstance}:${s.setting}`),
			);
			const available: { id: string; name: string }[] = [];
			scriptInstancesWithSettings.forEach(({ instance, script, type }) => {
				Object.values(type.defines.settings).forEach((def) => {
					const compositeId = `${instance.uuid}:${def.uuid}`;
					if (!configured.has(compositeId))
						available.push({
							id: compositeId,
							name: `${script.name} - ${instance.name}: ${def.name}`,
						});
				});
			});
			return available.filter((item) =>
				item.name.toLowerCase().includes(lowerFilter),
			);
		}
		return [];
	}, [view, avatar, modelElements, lowerFilter, scriptInstancesWithSettings]);

	const viewConfig = {
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

	return (
		<div className="space-y-4">
			<SegmentedControl
				value={view}
				onChange={(v) => {
					setView(v as SettingView);
					setFilter("");
				}}
				options={[
					{ label: "Element", value: "hide_element" },
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
					unconfiguredItems.map((item) => (
						<div
							key={item.id}
							className="rounded-lg border border-slate-700 p-3 flex justify-between items-center text-slate-400 hover:border-violet-500 hover:bg-violet-900/10 transition-colors"
						>
							<h4
								className="font-semibold text-slate-300 truncate"
								title={item.name}
							>
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
					))
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
	const { avatar, modelElements, updateAvatar } = useAvatarStore();
	const [filter, setFilter] = useState("");
	const [selectedId, setSelectedId] = useState<UUID | null>(null);
	const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
	const allScriptInstances = useScriptInstanceMap();

	const { conditionalSettings } = avatar ?? {
		conditionalSettings: {} as Record<UUID, ConditionalSetting>,
	};

	const modelElementSet = useMemo(
		() => new Set(modelElements.map((el) => JSON.stringify(el))),
		[modelElements],
	);

	const getSettingInfo = useCallback(
		(s: ConditionalSetting): { title: string; warning: string | null } => {
			let title: string,
				warning: string | null = null;
			switch (s.kind) {
				case "hide_element":
					title = displayModelPartRef(s.element);
					if (!modelElementSet.has(JSON.stringify(s.element)))
						warning = "Element not found in any loaded model.";
					break;
				case "render":
					title = renderSettings.get(s.render)?.name ?? s.render;
					if (!renderSettings.has(s.render))
						warning = "Invalid render setting.";
					break;
				case "script": {
					const i = allScriptInstances.get(s.scriptInstance);
					if (i) {
						const def = i.type.defines.settings[s.setting];
						title = def
							? `${i.script.name} - ${i.instance.name}: ${def.name}`
							: "Unknown Script Setting";
						if (!def) warning = "Setting definition not found in script.";
					} else {
						title = "Unknown Script Setting";
						warning = "Script instance not found.";
					}
					break;
				}
				default:
					title = (s as ConditionalSetting).kind;
					warning = "Unknown conditional setting type";
			}
			return { title, warning };
		},
		[allScriptInstances, modelElementSet],
	);

	const allConfiguredSettings = useMemo(
		() =>
			Object.values(conditionalSettings).sort((a, b) =>
				getSettingInfo(a).title.localeCompare(getSettingInfo(b).title),
			),
		[conditionalSettings, getSettingInfo],
	);

	const filteredSettings = useMemo(() => {
		const lowerFilter = filter.toLowerCase();
		if (!lowerFilter) return allConfiguredSettings;
		return allConfiguredSettings.filter((s) =>
			getSettingInfo(s).title.toLowerCase().includes(lowerFilter),
		);
	}, [allConfiguredSettings, filter, getSettingInfo]);

	if (!avatar) return null;

	const handleAddSetting = (id: string, kind: SettingView) => {
		const uuid = generateUUID();
		let newSetting: ConditionalSetting;
		switch (kind) {
			case "hide_element":
				newSetting = { uuid, kind, element: JSON.parse(id) };
				break;
			case "render":
				newSetting = { uuid, kind, render: id as RenderSettingID };
				break;
			case "script": {
				const [instanceUuid, settingUuid] = id.split(":");
				newSetting = {
					uuid,
					kind,
					scriptInstance: instanceUuid as UUID,
					setting: settingUuid as UUID,
				};
				break;
			}
		}
		updateAvatar((d) => {
			d.conditionalSettings[uuid] = newSetting;
		});
		setIsAddDialogOpen(false);
		setSelectedId(uuid);
	};

	const handleDelete = (settingToDelete: ConditionalSetting) => {
		if (!settingToDelete) return;
		updateAvatar((d) => {
			delete d.conditionalSettings[settingToDelete.uuid];
		});
		if (selectedId === settingToDelete.uuid) setSelectedId(null);
	};

	const updateSetting = (s: ConditionalSetting) => {
		updateAvatar((d) => {
			d.conditionalSettings[s.uuid] = s;
		});
	};

	return (
		<>
			<MasterDetailManager<ConditionalSetting>
				items={filteredSettings}
				selectedId={selectedId}
				onSelectId={setSelectedId}
				title="Settings"
				searchPlaceholder={`Search ${allConfiguredSettings.length} settings...`}
				filterText={filter}
				onFilterTextChange={setFilter}
				onAddItem={() => setIsAddDialogOpen(true)}
				onDeleteItem={handleDelete}
				editorTitle={(setting) => getSettingInfo(setting).title}
				renderListItem={(setting, isSelected) => {
					const { title, warning } = getSettingInfo(setting);
					return (
						<button
							className={`w-full text-left p-3 rounded-lg transition-colors duration-150 ${isSelected ? "bg-violet-500/20 ring-2 ring-violet-500" : "bg-slate-800 hover:bg-slate-700"}`}
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
				}}
				renderEditor={(setting) => (
					<AnimationSettingEditor
						key={setting.uuid}
						setting={setting}
						updateSetting={updateSetting}
					/>
				)}
				renderEmptyState={EmptyState}
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
		</>
	);
}
