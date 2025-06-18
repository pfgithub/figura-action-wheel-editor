import { FormRow } from "@/components/ui/FormRow";
import { Select } from "@/components/ui/Select";
import { renderSettings } from "@/data/renderSettings";
import { useScriptInstancesWithDefine } from "@/hooks/useScriptData";
import { useAvatarStore } from "@/store/avatarStore";
import type {
	ConditionalSetting,
	RenderSettingID,
	UUID,
} from "@/types";
import { AnimationConditionEditor } from "./AnimationConditionEditor";

interface AnimationSettingEditorProps {
	setting: ConditionalSetting;
	updateSetting: (s: ConditionalSetting) => void;
}

export function AnimationSettingEditor({
	setting,
	updateSetting,
}: AnimationSettingEditorProps) {
	const { modelElements } = useAvatarStore();
	const allScriptInstancesWithSettings =
		useScriptInstancesWithDefine("settings");

	const handleUpdate = <K extends keyof ConditionalSetting>(
		key: K,
		value: ConditionalSetting[K],
	) => {
		updateSetting({ ...setting, [key]: value });
	};

	const renderKindSpecificEditor = () => {
		switch (setting.kind) {
			case "hide_element":
				return (
					<FormRow label="Element">
						<Select
							value={setting.element}
							onChange={(e) => handleUpdate("element", e.target.value)}
						>
							{modelElements.map((elemId) => (
								<option key={elemId} value={elemId}>
									{elemId}
								</option>
							))}
						</Select>
					</FormRow>
				);
			case "render":
				return (
					<FormRow label="Render Setting">
						<Select
							value={setting.render}
							onChange={(e) =>
								handleUpdate("render", e.target.value as RenderSettingID)
							}
						>
							{Array.from(renderSettings.values()).map((rs) => (
								<option key={rs.id} value={rs.id}>
									{rs.name}
								</option>
							))}
						</Select>
					</FormRow>
				);
			case "script": {
				const selectedInstanceData = allScriptInstancesWithSettings.find(
					(i) => i.instance.uuid === setting.scriptInstance,
				);
				const availableSettings = selectedInstanceData
					? Object.values(selectedInstanceData.type.defines.settings)
					: [];
				return (
					<>
						<FormRow label="Script Instance">
							<Select
								value={setting.scriptInstance ?? ""}
								onChange={(e) => {
									const newInstanceUuid = e.target.value
										? (e.target.value as UUID)
										: undefined;
									updateSetting({
										...setting,
										scriptInstance: newInstanceUuid!,
										setting: undefined!, // Reset setting when instance changes
									});
								}}
							>
								<option value="">-- Select an instance --</option>
								{allScriptInstancesWithSettings.map(({ instance, script }) => (
									<option key={instance.uuid} value={instance.uuid}>
										{script.name} - {instance.name}
									</option>
								))}
							</Select>
						</FormRow>
						<FormRow label="Setting">
							<Select
								value={setting.setting ?? ""}
								onChange={(e) =>
									handleUpdate("setting", e.target.value as UUID)
								}
								disabled={!setting.scriptInstance}
							>
								<option value="">
									{setting.scriptInstance
										? "-- Select a setting --"
										: "-- First select an instance --"}
								</option>
								{availableSettings.map((s) => (
									<option key={s.uuid} value={s.uuid}>
										{s.name}
									</option>
								))}
							</Select>
						</FormRow>
					</>
				);
			}
			default:
				return null;
		}
	};

	return (
		<div className="space-y-6">
			<div>
				<h4 className="text-lg font-semibold text-slate-300 border-b border-slate-700 pb-2 mb-4">
					Configuration
				</h4>
				<div className="space-y-4">{renderKindSpecificEditor()}</div>
			</div>

			<div>
				<h4 className="text-lg font-semibold text-slate-300 border-b border-slate-700 pb-2 mb-4">
					Activation Condition
				</h4>
				<p className="text-slate-400 text-xs mb-3">
					This setting will be active when the following condition is true.
				</p>
				<div className="bg-slate-900/50 p-4 rounded-lg ring-1 ring-slate-700">
					<AnimationConditionEditor
						condition={setting.activationCondition}
						updateCondition={(newCond) =>
							updateSetting({ ...setting, activationCondition: newCond })
						}
					/>
				</div>
			</div>
		</div>
	);
}