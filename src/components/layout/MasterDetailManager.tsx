import type React from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PlusIcon, TrashIcon } from "@/components/ui/icons";
import type { UUID } from "@/types";

interface MasterDetailManagerProps<T extends { uuid: UUID }> {
	// Data
	items: T[];
	selectedId: UUID | null;

	// Configuration
	title: string;
	addText?: string;
	deleteText?: string;
	searchPlaceholder?: string;

	// Renderers
	renderListItem: (item: T, isSelected: boolean) => React.ReactNode;
	renderEditor: (item: T) => React.ReactNode;
	renderEmptyState: () => React.ReactNode;

	// Actions
	onSelectId: (id: UUID | null) => void;
	onAddItem: () => void;
	onDeleteItem?: (item: T) => void;
	rightButtons?: (item: T) => React.ReactNode;

	// Filtering
	filterText?: string;
	onFilterTextChange?: (text: string) => void;

	// Header slot
	editorTitle?: (item: T) => ReactNode;
}

export function MasterDetailManager<T extends { uuid: UUID }>({
	items,
	selectedId,
	title,
	addText = "Add",
	deleteText = "Delete",
	searchPlaceholder,
	renderListItem,
	renderEditor,
	renderEmptyState,
	onSelectId,
	onAddItem,
	onDeleteItem,
	rightButtons,
	filterText,
	onFilterTextChange,
	editorTitle,
}: MasterDetailManagerProps<T>) {
	const selectedItem = items.find((item) => item.uuid === selectedId) ?? null;

	return (
		<div className="flex flex-col md:flex-row gap-6 h-full">
			{/* Left Panel: Master List */}
			<div className="md:w-1/3 lg:w-1/4 flex-shrink-0 flex flex-col gap-4">
				<div className="flex justify-between items-center pb-3 border-b border-slate-700">
					<h2 className="text-2xl font-bold text-slate-100">{title}</h2>
					<Button
						onClick={onAddItem}
						className="bg-violet-600 hover:bg-violet-500"
					>
						<PlusIcon className="w-5 h-5 mr-2" />
						{addText}
					</Button>
				</div>
				{onFilterTextChange && (
					<Input
						placeholder={searchPlaceholder ?? `Search ${items.length} items...`}
						value={filterText ?? ""}
						onChange={(e) => onFilterTextChange(e.target.value)}
					/>
				)}
				<div className="space-y-2 flex-grow overflow-y-auto -mr-2 pr-2">
					{items.map((item) => (
						<div key={item.uuid} onClick={() => onSelectId(item.uuid)}>
							{renderListItem(item, item.uuid === selectedId)}
						</div>
					))}
					{items.length === 0 && (
						<div className="text-center text-slate-500 pt-10">
							No {title.toLowerCase()} configured.
						</div>
					)}
				</div>
			</div>

			{/* Right Panel: Detail Editor */}
			<div className="flex-grow bg-slate-800/50 rounded-lg p-4 md:p-6 ring-1 ring-slate-700 overflow-y-auto flex flex-row">
				{selectedItem ? (
					<div className="flex-1">
						<div className="flex gap-4 justify-between items-center mb-6 pb-4 border-b border-slate-700">
							<h3 className="flex-1 text-xl font-bold text-slate-100 truncate">
								{editorTitle ? editorTitle(selectedItem) : "Edit Item"}
							</h3>
							{rightButtons?.(selectedItem)}
							{onDeleteItem && (
								<Button
									onClick={() => onDeleteItem(selectedItem)}
									className="bg-rose-600 hover:bg-rose-500"
								>
									<TrashIcon className="w-5 h-5 sm:mr-2" />
									<span className="hidden sm:inline">{deleteText}</span>
								</Button>
							)}
						</div>
						{renderEditor(selectedItem)}
					</div>
				) : (
					renderEmptyState()
				)}
			</div>
		</div>
	);
}
