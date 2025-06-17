import React, { useState, useMemo, useEffect } from "react";
import { useMinecraftItems } from "@/hooks/useMinecraftItems";
import {
	Dialog,
	DialogHeader,
	DialogContent,
	DialogFooter,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface MinecraftItemPickerDialogProps {
	open: boolean;
	onClose: () => void;
	onSelect: (itemId: string) => void;
}

export function MinecraftItemPickerDialog({
	open,
	onClose,
	onSelect,
}: MinecraftItemPickerDialogProps) {
	const { items, loading, error } = useMinecraftItems();
	const [filter, setFilter] = useState("");

	useEffect(() => {
		if (open) {
			setFilter("");
		}
	}, [open]);

	const filteredItems = useMemo(() => {
		if (!items) return [];
		const trimmedFilter = filter.trim().toLowerCase();
		if (!trimmedFilter) return Object.values(items);

		return Object.values(items).filter(
			(item) =>
				item.name.toLowerCase().includes(trimmedFilter) ||
				item.id.toLowerCase().includes(trimmedFilter),
		);
	}, [items, filter]);

	return (
		<Dialog open={open} onClose={onClose} className="max-w-4xl">
			<DialogHeader>Choose an Item</DialogHeader>
			<DialogContent>
				<div className="mb-4">
					<Input
						type="text"
						placeholder="Search by name or ID..."
						value={filter}
						onChange={(e) => setFilter(e.target.value)}
						autoFocus
						className="bg-slate-900/50 w-full"
					/>
				</div>
				{error && <p className="p-4 text-center text-red-400">{error}</p>}
				{loading && (
					<div className="flex h-64 items-center justify-center text-slate-400">
						Loading items...
					</div>
				)}

				<div className="max-h-[60vh] overflow-y-auto -mr-4 pr-4">
					{items && !error && (
						<div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
							{filteredItems.slice(0, 300).map((item) => (
								<button
									key={item.id}
									type="button"
									onClick={() => onSelect(item.id)}
									title={`${item.name}\n(${item.id})`}
									className="aspect-square flex flex-col items-center justify-center p-1 rounded-md hover:bg-violet-500/30 focus:bg-violet-500/50 focus:outline-none transition-colors group"
								>
									<img
										src={`https://lfs.pfg.pw/source/${item.image.uuid}.png`}
										alt={item.name}
										className="w-8 h-8 image-pixelated transition-transform group-hover:scale-110"
									/>
									<span className="text-xs text-center text-slate-400 truncate w-full block mt-1">
										{item.name}
									</span>
								</button>
							))}
						</div>
					)}
					{items && filteredItems.length === 0 && !loading && !error && (
						<p className="p-4 text-center text-slate-400">
							No items found for "{filter}".
						</p>
					)}
					{items && filteredItems.length > 300 && (
						<p className="p-2 text-center text-xs text-slate-500">
							More than 300 results, please refine your search.
						</p>
					)}
				</div>
			</DialogContent>
			<DialogFooter>
				<Button
					onClick={onClose}
					className="bg-slate-600 hover:bg-slate-500 focus-visible:ring-slate-400"
				>
					Close
				</Button>
			</DialogFooter>
		</Dialog>
	);
}
