import type { Condition } from "@/types";
import { generateUUID } from "@/utils/uuid";

export const kindStyles: {
	[key in PaletteItemKind]: {
		label: string;
		border: string;
		bg: string;
		text: string;
	};
} = {
	and: {
		label: "AND (All Of)",
		border: "border-sky-500",
		bg: "bg-sky-900/30",
		text: "text-sky-300",
	},
	or: {
		label: "OR (Any Of)",
		border: "border-emerald-500",
		bg: "bg-emerald-900/30",
		text: "text-emerald-300",
	},
	not: {
		label: "NOT",
		border: "border-amber-500",
		bg: "bg-amber-900/30",
		text: "text-amber-300",
	},
	toggleGroup: {
		label: "Group State",
		border: "border-violet-500",
		bg: "bg-violet-900/30",
		text: "text-violet-300",
	},
	render: {
		label: "Other State",
		border: "border-rose-500",
		bg: "bg-rose-900/30",
		text: "text-rose-300",
	},
	animation: {
		label: "Animation State",
		border: "border-fuchsia-500",
		bg: "bg-fuchsia-900/30",
		text: "text-fuchsia-300",
	},
	custom: {
		label: "Custom Lua",
		border: "border-slate-500",
		bg: "bg-slate-700/50",
		text: "text-slate-300",
	},
	script: {
		label: "Script Condition",
		border: "border-teal-500",
		bg: "bg-teal-900/30",
		text: "text-teal-300",
	},
};

export type PaletteItemKind = Condition["kind"];

export function getParentAndFinalKey(path: string): {
	parentPath: string | null;
	finalKey: string | number;
} {
	const parts = path.split(".");
	if (parts.length === 1) return { parentPath: null, finalKey: parts[0] };
	const finalKeyStr = parts.pop()!;
	const finalKey = /^\d+$/.test(finalKeyStr)
		? parseInt(finalKeyStr, 10)
		: finalKeyStr;
	return { parentPath: parts.join("."), finalKey };
}

export function getIn(obj: any, path: string): any {
	// This helper assumes 'obj' is the wrapper { root: ... } and 'path' starts with "root"
	if (!obj || !("root" in obj)) {
		// If the root condition is undefined, obj.root will be undefined, so we return that.
		// This handles the case of dragging onto the initial empty dropzone.
		if (path === "root") return obj?.root;
		return undefined;
	}
	if (path === "root") {
		return obj.root;
	}

	// Paths are like "root.conditions.0", so we skip the 'root' part
	const parts = path.split(".").slice(1);
	let current = obj.root;

	for (const part of parts) {
		if (current === undefined || current === null) {
			return undefined;
		}
		const key = /^\d+$/.test(part) ? parseInt(part, 10) : part;
		current = (current as any)[key];
	}
	return current;
}

export const createNewConditionNode = (kind: PaletteItemKind): Condition => {
	const id = generateUUID();
	switch (kind) {
		case "and":
			return { id, kind: "and", conditions: [] };
		case "or":
			return { id, kind: "or", conditions: [] };
		case "not":
			return { id, kind: "not" };
		case "toggleGroup":
			return { id, kind: "toggleGroup" };
		case "render":
			return { id, kind: "render" };
		case "animation":
			return { id, kind: "animation", mode: "PLAYING" };
		case "script":
			return { id, kind: "script" };
		case "custom":
			return { id, kind: "custom", expression: "" };
	}
};
