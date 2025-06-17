import type React from "react";
import { useEffect } from "react";
import { twMerge } from "tailwind-merge";

export const Dialog = ({
	children,
	open,
	onClose,
	className,
}: {
	children: React.ReactNode;
	open: boolean;
	onClose: () => void;
	className?: string;
}) => {
	useEffect(() => {
		const handleEsc = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				onClose();
			}
		};
		if (open) {
			window.addEventListener("keydown", handleEsc);
		}
		return () => {
			window.removeEventListener("keydown", handleEsc);
		};
	}, [open, onClose]);

	if (!open) return null;

	return (
		<div
			className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4"
			onClick={onClose}
			aria-modal="true"
			role="dialog"
		>
			<div
				className={twMerge(
					`bg-slate-800 rounded-lg shadow-2xl w-full max-w-md p-6 ring-1 ring-slate-700`,
					className,
				)}
				onClick={(e) => e.stopPropagation()}
			>
				{children}
			</div>
		</div>
	);
};

export const DialogHeader = ({ children }: { children: React.ReactNode }) => (
	<div className="mb-4">
		<h2 className="text-xl font-bold text-slate-100">{children}</h2>
	</div>
);

export const DialogContent = ({ children }: { children: React.ReactNode }) => (
	<div className="space-y-4 text-slate-300">{children}</div>
);

export const DialogFooter = ({ children }: { children: React.ReactNode }) => (
	<div className="mt-6 flex justify-end items-center gap-3">{children}</div>
);
