
import { useDroppable } from "@dnd-kit/core";

export const GripVerticalIcon = () => (
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
		className="w-4 h-4"
	>
		<circle cx="9" cy="12" r="1" />
		<circle cx="9" cy="5" r="1" />
		<circle cx="9" cy="19" r="1" />
		<circle cx="15" cy="12" r="1" />
		<circle cx="15" cy="5" r="1" />
		<circle cx="15" cy="19" r="1" />
	</svg>
);
export const Trash2Icon = () => (
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
		className="w-4 h-4"
	>
		<path d="M3 6h18" />
		<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
		<line x1="10" y1="11" x2="10" y2="17" />
		<line x1="14" y1="11" x2="14" y2="17" />
	</svg>
);

export function DropZone({
	id,
	path,
	label = "Drop condition here",
}: {
	id: string;
	path: string;
	label?: string;
}) {
	const { setNodeRef, isOver } = useDroppable({
		id,
		data: { path, accepts: ["palette", "condition"] },
	});
	return (
		<div
			ref={setNodeRef}
			className={`w-full text-center p-4 my-2 border-2 border-dashed rounded-lg transition-colors ${
				isOver
					? "bg-violet-500/30 border-violet-400"
					: "bg-slate-800/50 border-slate-600"
			}`}
		>
			<p className="text-slate-400 text-sm">{label}</p>
		</div>
	);
}
