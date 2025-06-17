// src/components/ui/ConfirmationDialog.tsx
import type React from "react";
import { Dialog, DialogHeader, DialogContent, DialogFooter } from "./Dialog";
import { Button } from "./Button";
import { WarningIcon } from "./icons";

interface ConfirmationDialogProps {
	open: boolean;
	title: string;
	message: React.ReactNode;
	confirmText?: string;
	onConfirm: () => void;
	onCancel: () => void;
	variant?: "default" | "danger";
}

export function ConfirmationDialog({
	open,
	title,
	message,
	confirmText = "Confirm",
	onConfirm,
	onCancel,
	variant = "default",
}: ConfirmationDialogProps) {
	const confirmButtonClass =
		variant === "danger"
			? "bg-rose-600 hover:bg-rose-500 focus-visible:ring-rose-400"
			: "bg-violet-600 hover:bg-violet-500 focus-visible:ring-violet-400";

	return (
		<Dialog open={open} onClose={onCancel}>
			<DialogHeader>
				<div className="flex items-center gap-2">
					{variant === "danger" && (
						<WarningIcon className="w-6 h-6 text-rose-400" />
					)}
					{title}
				</div>
			</DialogHeader>
			<DialogContent>
				<div className="text-slate-300">{message}</div>
			</DialogContent>
			<DialogFooter>
				<Button onClick={onCancel} className="bg-slate-600 hover:bg-slate-500">
					Cancel
				</Button>
				<Button onClick={onConfirm} className={confirmButtonClass}>
					{confirmText}
				</Button>
			</DialogFooter>
		</Dialog>
	);
}

interface UsageWarningDialogProps {
	open: boolean;
	title: string;
	usages: string[];
	onClose: () => void;
}

export function UsageWarningDialog({
	open,
	title,
	usages,
	onClose,
}: UsageWarningDialogProps) {
	return (
		<Dialog open={open} onClose={onClose}>
			<DialogHeader>
				<div className="flex items-center gap-2">
					<WarningIcon className="w-6 h-6 text-amber-400" />
					{title}
				</div>
			</DialogHeader>
			<DialogContent>
				<p className="text-slate-300 mb-3">
					Remove it from the following locations before deleting:
				</p>
				<ul className="list-disc list-inside bg-slate-800/50 p-3 rounded-md text-slate-300 space-y-1 max-h-60 overflow-y-auto">
					{usages.map((u, i) => (
						<li key={i}>{u}</li>
					))}
				</ul>
			</DialogContent>
			<DialogFooter>
				<Button
					onClick={onClose}
					className="bg-slate-600 hover:bg-slate-500 w-full"
				>
					OK
				</Button>
			</DialogFooter>
		</Dialog>
	);
}
