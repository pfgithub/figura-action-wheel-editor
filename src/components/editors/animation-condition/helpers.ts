// src/components/editors/animation-condition/helpers.ts
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
	script: {
		label: "Script Condition",
		border: "border-teal-500",
		bg: "bg-teal-900/30",
		text: "text-teal-300",
	},
	variable: {
		label: "Variable State",
		border: "border-indigo-500",
		bg: "bg-indigo-900/30",
		text: "text-indigo-300",
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
		case "render":
			return { id, kind: "render" };
		case "animation":
			return { id, kind: "animation", mode: "PLAYING" };
		case "script":
			return { id, kind: "script" };
		case "variable":
			return { id, kind: "variable" };
	}
};

export const countLeafConditions = (c: Condition | undefined): number => {
	if (!c) {
		return 0;
	}

	if (c.kind === "and" || c.kind === "or") {
		return c.conditions.reduce((sum, sub) => sum + countLeafConditions(sub), 0);
	}

	if (c.kind === "not") {
		return countLeafConditions(c.condition);
	}

	// Any other kind is a leaf
	return 1;
};

export const summarizeCondition = (condition?: Condition): string => {
	if (!condition) return "Always Active";
	const count = countLeafConditions(condition);
	if (count === 0) return "Not Configured";
	return count === 1 ? "1 Condition" : `${count} Conditions`;
};
