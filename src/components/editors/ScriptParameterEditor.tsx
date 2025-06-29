import { FormRow } from "@/components/ui/FormRow";
import { Input } from "@/components/ui/Input";
import { MinecraftItemPicker } from "@/components/ui/MinecraftItemPicker";
import { Select } from "@/components/ui/Select";
import { useAvatarStore } from "@/store/avatarStore";
import type {
	AnimationRef,
	ModelPartRef,
	ScriptDataInstanceParameter,
	UUID,
} from "@/types";

interface ScriptParameterEditorProps {
	parameters: ScriptDataInstanceParameter[];
	values: Record<string, any>;
	onChange: (newValues: Record<string, any>) => void;
}

const displayAnimationRef = (ref: AnimationRef) => {
	const loop = ref.loop ? ` (${ref.loop})` : "";
	return `${ref.model}.${ref.animation}${loop}`;
};
const displayModelPartRef = (ref: ModelPartRef) =>
	`${ref.model}.${ref.partPath.join(".")}`;

export function ScriptParameterEditor({
	parameters,
	values,
	onChange,
}: ScriptParameterEditorProps) {
	const { avatar, modelElements, animations } = useAvatarStore();

	if (!avatar) return null;
	const allActionWheels = Object.values(avatar.actionWheels);

	const handleValueChange = (paramName: string, newValue: any) => {
		onChange({ ...values, [paramName]: newValue });
	};

	const renderInputForParam = (param: ScriptDataInstanceParameter) => {
		const value = values[param.name];

		switch (param.type.kind) {
			case "string":
				return (
					<Input
						type="text"
						value={value ?? ""}
						onChange={(e) => handleValueChange(param.name, e.target.value)}
					/>
				);

			case "boolean":
				return (
					<input
						type="checkbox"
						checked={!!value}
						onChange={(e) => handleValueChange(param.name, e.target.checked)}
						className="w-5 h-5 rounded bg-slate-700 border-slate-600 text-violet-500 focus:ring-violet-500"
					/>
				);

			case "vec3": {
				const vec =
					Array.isArray(value) && value.length === 3 ? value : [0, 0, 0];
				return (
					<div className="flex gap-2">
						{["X", "Y", "Z"].map((axis, i) => (
							<div key={axis} className="flex-1">
								<Input
									type="number"
									value={vec[i]}
									onChange={(e) => {
										const newVec = [...vec];
										newVec[i] = parseFloat(e.target.value) || 0;
										handleValueChange(param.name, newVec);
									}}
									placeholder={axis}
								/>
							</div>
						))}
					</div>
				);
			}

			case "ModelPart":
				return (
					<Select
						value={value ? JSON.stringify(value) : ""}
						onChange={(e) =>
							handleValueChange(
								param.name,
								e.target.value ? JSON.parse(e.target.value) : undefined,
							)
						}
					>
						<option value="">-- Select a part --</option>
						{modelElements.map((part) => (
							<option key={JSON.stringify(part)} value={JSON.stringify(part)}>
								{displayModelPartRef(part)}
							</option>
						))}
					</Select>
				);

			case "Animation":
				return (
					<Select
						value={value ? JSON.stringify(value) : ""}
						onChange={(e) =>
							handleValueChange(
								param.name,
								e.target.value ? JSON.parse(e.target.value) : undefined,
							)
						}
					>
						<option value="">-- Select an animation --</option>
						{animations.map((anim) => (
							<option key={JSON.stringify(anim)} value={JSON.stringify(anim)}>
								{displayAnimationRef(anim)}
							</option>
						))}
					</Select>
				);

			case "ActionWheel":
				return (
					<Select
						value={value ?? ""}
						onChange={(e) =>
							handleValueChange(
								param.name,
								(e.target.value as UUID) || undefined,
							)
						}
					>
						<option value="">-- Select a wheel --</option>
						{allActionWheels.map((wheel) => (
							<option key={wheel.uuid} value={wheel.uuid}>
								{wheel.title}
							</option>
						))}
					</Select>
				);

			case "item":
				return (
					<MinecraftItemPicker
						value={value ?? ""}
						onChange={(id) => handleValueChange(param.name, id)}
					/>
				);

			// TODO: Implement table and list types
			case "table":
			case "list":
				return (
					<div className="text-xs text-amber-400 p-2 bg-amber-900/20 rounded-md">
						Editing for this complex type is not yet implemented.
					</div>
				);

			default:
				return (
					<div className="text-xs text-rose-400">Unknown parameter type</div>
				);
		}
	};

	return (
		<div className="space-y-4">
			{parameters.map((param) => (
				<FormRow key={param.uuid} label={param.name}>
					<div>
						{renderInputForParam(param)}
						{param.helpText && (
							<p className="text-xs text-slate-400 mt-1.5">{param.helpText}</p>
						)}
					</div>
				</FormRow>
			))}
		</div>
	);
}
