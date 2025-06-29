import {
	DialogPanel,
	DialogTitle,
	Dialog as HeadlessDialog,
	Transition,
} from "@headlessui/react";
import type React from "react";
import { Fragment } from "react";
import { twMerge } from "tailwind-merge";

export const Dialog = ({
	children,
	open,
	onClose,
	className,
	dismissable = true,
}: {
	children: React.ReactNode;
	open: boolean;
	onClose: () => void;
	className?: string;
	dismissable?: boolean;
}) => {
	// Headless UI's Dialog handles Escape key and backdrop clicks.
	// The `onClose` is only called if the user interacts with a closing mechanism.
	// To control dismissability, we can conditionally pass the onClose handler.
	// The empty function `() => {}` prevents closing when dismissable is false.
	const handleClose = dismissable ? onClose : () => {};

	return (
		<Transition appear show={open} as={Fragment}>
			<HeadlessDialog as="div" className="relative z-50" onClose={handleClose}>
				{/* The backdrop, rendered as a fixed sibling to the panel container */}
				<Transition.Child
					as={Fragment}
					enter="ease-out duration-200"
					enterFrom="opacity-0"
					enterTo="opacity-100"
					leave="ease-in duration-150"
					leaveFrom="opacity-100"
					leaveTo="opacity-0"
				>
					<div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm" />
				</Transition.Child>

				{/* Full-screen container to center the panel */}
				<div className="fixed inset-0 overflow-y-auto">
					<div className="flex min-h-full items-center justify-center p-4">
						<Transition.Child
							as={Fragment}
							enter="ease-out duration-200"
							enterFrom="opacity-0 scale-95"
							enterTo="opacity-100 scale-100"
							leave="ease-in duration-150"
							leaveFrom="opacity-100 scale-100"
							leaveTo="opacity-0 scale-95"
						>
							<DialogPanel
								className={twMerge(
									`bg-slate-800 rounded-lg shadow-2xl w-full max-w-md p-6 ring-1 ring-slate-700 transform transition-all`,
									className,
								)}
							>
								{children}
							</DialogPanel>
						</Transition.Child>
					</div>
				</div>
			</HeadlessDialog>
		</Transition>
	);
};

// Use Headless UI's DialogTitle for better accessibility.
export const DialogHeader = ({ children }: { children: React.ReactNode }) => (
	<DialogTitle as="h2" className="text-xl font-bold text-slate-100 mb-4">
		{children}
	</DialogTitle>
);

// This component can remain a simple styled div.
export const DialogContent = ({ children }: { children: React.ReactNode }) => (
	<div className="text-slate-300">{children}</div>
);

// This component can also remain a simple styled div.
export const DialogFooter = ({ children }: { children: React.ReactNode }) => (
	<div className="mt-6 flex justify-end items-center gap-3">{children}</div>
);
