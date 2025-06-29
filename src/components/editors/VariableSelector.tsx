import { Combobox as HeadlessCombobox, Transition } from "@headlessui/react";
import { Fragment, useState } from "react";
import { FormRow } from "@/components/ui/FormRow";
import { PlusIcon } from "@/components/ui/icons";
import { useAvatarStore } from "@/store/avatarStore";
import type { UUID, Variable, VariableValue } from "@/types";
import { generateUUID } from "@/utils/uuid";

interface VariableSelectorProps {
	selectedVariableId?: UUID;
	selectedValueId?: UUID | null;
	onVariableChange: (variableId: UUID | undefined) => void;
	onValueChange: (valueId: UUID | undefined | null) => void;
}

export function VariableSelector({
	selectedVariableId,
	selectedValueId,
	onVariableChange,
	onValueChange,
}: VariableSelectorProps) {
	const { avatar, updateAvatar } = useAvatarStore();
	const [variableQuery, setVariableQuery] = useState("");
	const [valueQuery, setValueQuery] = useState("");

	if (!avatar) return null;

	const variables = Object.values(avatar.variables ?? {});
	const trimmedVarQuery = variableQuery.trim().toLowerCase();
	const filteredVariables =
		trimmedVarQuery === ""
			? variables
			: variables.filter((v) => v.name.toLowerCase().includes(trimmedVarQuery));

	const canCreateVariable =
		trimmedVarQuery.length > 0 &&
		!variables.some((v) => v.name.toLowerCase() === trimmedVarQuery);

	const handleCreateVariable = () => {
		if (!canCreateVariable) return;
		const newVar = {
			uuid: generateUUID(),
			name: variableQuery.trim(),
			values: {},
		};
		updateAvatar((draft) => {
			draft.variables ??= {};
			draft.variables[newVar.uuid] = newVar;
		});
		onVariableChange(newVar.uuid);
		setVariableQuery("");
	};

	const selectedVariable = selectedVariableId
		? avatar.variables?.[selectedVariableId]
		: null;
	const selectedValue =
		selectedVariable && selectedValueId
			? selectedVariable.values[selectedValueId]
			: null;

	const variableValues = selectedVariable
		? Object.values(selectedVariable.values)
		: [];
	const trimmedValQuery = valueQuery.trim().toLowerCase();
	const filteredValues =
		trimmedValQuery === ""
			? variableValues
			: variableValues.filter((v) =>
					v.label.toLowerCase().includes(trimmedValQuery),
				);

	const canCreateValue =
		selectedVariable &&
		trimmedValQuery.length > 0 &&
		!variableValues.some((v) => v.label.toLowerCase() === trimmedValQuery);

	const handleCreateValue = () => {
		if (!canCreateValue || !selectedVariable) return;
		const newValue = { uuid: generateUUID(), label: valueQuery.trim() };
		updateAvatar((draft) => {
			const v = draft.variables?.[selectedVariable.uuid];
			if (v) {
				v.values[newValue.uuid] = newValue;
			}
		});
		onValueChange(newValue.uuid);
		setValueQuery("");
	};

	return (
		<div className="space-y-4">
			<FormRow label="Variable">
				<HeadlessCombobox
					value={selectedVariable}
					onChange={(v: Variable | null) => {
						onVariableChange(v?.uuid);
					}}
					nullable
					immediate
				>
					<div className="relative">
						<HeadlessCombobox.Input
							className="bg-slate-700/50 border border-slate-600 rounded-md px-3 py-2 w-full text-slate-100 placeholder:text-slate-400 focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
							onChange={(e) => setVariableQuery(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									e.preventDefault();
									handleCreateVariable();
								}
							}}
							displayValue={(v: Variable | null) => v?.name ?? ""}
							placeholder="Select or create a variable..."
						/>
						<HeadlessCombobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
							<svg
								className="h-5 w-5 text-gray-400"
								viewBox="0 0 20 20"
								fill="none"
								stroke="currentColor"
							>
								<path
									d="M7 7l3-3 3 3m0 6l-3 3-3-3"
									strokeWidth="1.5"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
						</HeadlessCombobox.Button>
						<Transition
							as={Fragment}
							leave="transition ease-in duration-100"
							leaveFrom="opacity-100"
							leaveTo="opacity-0"
							afterLeave={() => setVariableQuery("")}
						>
							<HeadlessCombobox.Options
								portal
								anchor="bottom"
								className="mt-1 max-h-60 w-[var(--input-width)] overflow-auto rounded-md bg-slate-800 py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm z-10"
							>
								{filteredVariables.map((v) => (
									<HeadlessCombobox.Option
										key={v.uuid}
										value={v}
										className={({ active }) =>
											`cursor-default select-none relative py-2 pl-4 pr-4 ${
												active ? "text-white bg-violet-600" : "text-slate-200"
											}`
										}
									>
										<span className="block truncate font-normal">{v.name}</span>
									</HeadlessCombobox.Option>
								))}
								{canCreateVariable && (
									<HeadlessCombobox.Option
										value={{ uuid: "create", name: "" } as any}
										onClick={handleCreateVariable}
										className={({ active }) =>
											`relative cursor-pointer select-none py-2 pl-4 pr-4 ${
												active ? "bg-emerald-600/50" : ""
											} text-emerald-300`
										}
									>
										<span className="flex items-center">
											<PlusIcon className="w-4 h-4 mr-2" />
											Create "{variableQuery.trim()}"
										</span>
									</HeadlessCombobox.Option>
								)}
							</HeadlessCombobox.Options>
						</Transition>
					</div>
				</HeadlessCombobox>
			</FormRow>
			<FormRow label="Value">
				<HeadlessCombobox
					value={selectedValue}
					onChange={(v: VariableValue | null) => {
						onValueChange(v?.uuid ?? null);
					}}
					disabled={!selectedVariable}
					nullable
					immediate
				>
					<div className="relative">
						<HeadlessCombobox.Input
							className="bg-slate-700/50 border border-slate-600 rounded-md px-3 py-2 w-full text-slate-100 placeholder:text-slate-400 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 disabled:bg-slate-800/50 disabled:cursor-not-allowed"
							onChange={(e) => setValueQuery(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									e.preventDefault();
									handleCreateValue();
								}
							}}
							displayValue={(v: VariableValue | null) => v?.label ?? ""}
							placeholder="Select or create a value..."
						/>
						<HeadlessCombobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
							<svg
								className="h-5 w-5 text-gray-400"
								viewBox="0 0 20 20"
								fill="none"
								stroke="currentColor"
							>
								<path
									d="M7 7l3-3 3 3m0 6l-3 3-3-3"
									strokeWidth="1.5"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
						</HeadlessCombobox.Button>
						<Transition
							as={Fragment}
							leave="transition ease-in duration-100"
							leaveFrom="opacity-100"
							leaveTo="opacity-0"
							afterLeave={() => setValueQuery("")}
						>
							<HeadlessCombobox.Options
								portal
								anchor="bottom"
								className="mt-1 max-h-60 w-[var(--input-width)] overflow-auto rounded-md bg-slate-800 py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm z-10"
							>
								<HeadlessCombobox.Option
									value={null}
									className={({ active }) =>
										`cursor-default select-none relative py-2 pl-4 pr-4 ${
											active ? "text-white bg-violet-600" : "text-slate-400"
										}`
									}
								>
									<span className="block truncate font-normal italic">
										(None)
									</span>
								</HeadlessCombobox.Option>

								{filteredValues.map((v) => (
									<HeadlessCombobox.Option
										key={v.uuid}
										value={v}
										className={({ active }) =>
											`cursor-default select-none relative py-2 pl-4 pr-4 ${
												active ? "text-white bg-violet-600" : "text-slate-200"
											}`
										}
									>
										<span className="block truncate font-normal">
											{v.label}
										</span>
									</HeadlessCombobox.Option>
								))}
								{canCreateValue && (
									<HeadlessCombobox.Option
										value={{ uuid: "create", label: "" } as any}
										onClick={handleCreateValue}
										className={({ active }) =>
											`relative cursor-pointer select-none py-2 pl-4 pr-4 ${
												active ? "bg-emerald-600/50" : ""
											} text-emerald-300`
										}
									>
										<span className="flex items-center">
											<PlusIcon className="w-4 h-4 mr-2" />
											Create "{valueQuery.trim()}"
										</span>
									</HeadlessCombobox.Option>
								)}
							</HeadlessCombobox.Options>
						</Transition>
					</div>
				</HeadlessCombobox>
			</FormRow>
		</div>
	);
}
