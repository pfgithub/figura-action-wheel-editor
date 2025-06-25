import { Combobox as HeadlessCombobox, ComboboxOptions, ComboboxOption, Transition } from "@headlessui/react";
import React, { Fragment, useMemo, useState } from "react";
import { PlusIcon } from "./icons";

export interface ComboboxOption {
	id: string;
	label: string;
}

interface ComboboxProps {
	options: ComboboxOption[];
	value: string[]; // array of selected IDs
	onChange: (value: string[]) => void;
	onCreate: (newLabel: string) => void;
	placeholder?: string;
	className?: string;
}

export function Combobox({
	options,
	value,
	onChange,
	onCreate,
	placeholder,
	className,
}: ComboboxProps) {
	const [query, setQuery] = useState("");

	const optionsById = useMemo(() => {
		return new Map(options.map((opt) => [opt.id, opt]));
	}, [options]);

	const selectedOptions = useMemo(
		() => value.map((id) => optionsById.get(id)!).filter(Boolean),
		[value, optionsById],
	);

	const trimmedQuery = query.trim();
	const unselectedOptions = useMemo(
		() => options.filter((opt) => !value.includes(opt.id)),
		[options, value],
	);

	const filteredOptions =
		trimmedQuery === ""
			? unselectedOptions
			: unselectedOptions.filter((option) =>
					option.label.toLowerCase().includes(trimmedQuery.toLowerCase()),
				);

	const canCreate =
		trimmedQuery.length > 0 &&
		!options.some(
			(opt) => opt.label.toLowerCase() === trimmedQuery.toLowerCase(),
		);

	const handleCreate = () => {
		if (!canCreate) return;
		onCreate(trimmedQuery);
		setQuery("");
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" && canCreate) {
			e.preventDefault();
			handleCreate();
		}
		if (e.key === "Backspace" && query === "" && value.length > 0) {
			onChange(value.slice(0, -1));
		}
	};

	return (
		<HeadlessCombobox
			as="div"
			className={className}
			value={selectedOptions}
			onChange={(newSelectedOptions: ComboboxOption[]) => {
				onChange(newSelectedOptions.map((opt) => opt.id));
			}}
			multiple
            immediate
		>
			<div className="relative">
				<div className="flex flex-wrap gap-1.5 p-2 pr-10 rounded-md border border-slate-600 bg-slate-700/50 focus-within:border-violet-500 focus-within:ring-1 focus-within:ring-violet-500">
					{selectedOptions.map((option) => (
						<div
							key={option.id}
							className="flex items-center gap-1.5 bg-violet-500/20 text-violet-300 text-sm font-medium pl-2.5 pr-1 py-0.5 rounded-full"
						>
							<span>{option.label}</span>
							<button
								type="button"
								onClick={() => onChange(value.filter((id) => id !== option.id))}
								className="bg-violet-500/20 hover:bg-violet-500/50 rounded-full w-5 h-5 flex items-center justify-center text-violet-200 hover:text-white"
							>
								×
							</button>
						</div>
					))}
					<HeadlessCombobox.Input
						as="input"
						className="flex-grow bg-transparent border-none p-0 focus:ring-0 text-slate-100 placeholder:text-slate-400 min-w-[120px] h-6"
						onChange={(event) => setQuery(event.target.value)}
						placeholder={selectedOptions.length === 0 ? placeholder : undefined}
						value={query}
						onKeyDown={handleKeyDown}
					/>
				</div>
				<HeadlessCombobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
					<svg
						className="h-5 w-5 text-slate-400"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 20 20"
						fill="currentColor"
						aria-hidden="true"
					>
						<path
							fillRule="evenodd"
							d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.24a.75.75 0 011.06.04l2.7 2.908 2.7-2.908a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01.04-1.06z"
							clipRule="evenodd"
						/>
					</svg>
				</HeadlessCombobox.Button>
				<Transition
					as={Fragment}
					leave="transition ease-in duration-100"
					leaveFrom="opacity-100"
					leaveTo="opacity-0"
					afterLeave={() => setQuery("")}
				>
					<ComboboxOptions portal anchor="bottom" className="mt-1 max-h-60 w-(--input-width) overflow-auto rounded-md bg-slate-800 py-1 text-base shadow-lg ring-1 ring-slate-700/50 focus:outline-none sm:text-sm z-10">
						{filteredOptions.length === 0 && !canCreate ? (
							<div className="relative cursor-default select-none py-2 px-4 text-slate-400">
								{trimmedQuery ? "No results found." : "Nothing to select."}
							</div>
						) : (
							filteredOptions.map((option) => (
								<ComboboxOption
									key={option.id}
									className={({ active }) =>
										`relative cursor-default select-none py-2 pl-4 pr-4 ${
											active ? "bg-violet-600 text-white" : "text-slate-100"
										}`
									}
									value={option}
								>
									{({ selected }) => (
										<span
											className={`block truncate ${
												selected ? "font-medium" : "font-normal"
											}`}
										>
											{option.label}
										</span>
									)}
								</ComboboxOption>
							))
						)}
						{canCreate && (
							<div
								onClick={handleCreate}
								className="relative cursor-pointer select-none py-2 pl-4 pr-4 text-emerald-300 hover:bg-emerald-600/50 hover:text-white"
							>
								<span className="flex items-center">
									<PlusIcon className="w-4 h-4 mr-2" />
									Create tag "{trimmedQuery}"
								</span>
							</div>
						)}
					</ComboboxOptions>
				</Transition>
			</div>
		</HeadlessCombobox>
	);
}