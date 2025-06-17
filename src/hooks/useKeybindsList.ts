import type { KeybindListItem } from "@/types";
import { useState, useEffect } from "react";

export type KeybindsListData = KeybindListItem[];

// Global cache for keybinds list to avoid refetching
let keybindsCache: KeybindsListData | null = null;
let fetchPromise: Promise<{ default: KeybindsListData }> | null = null;

export function useKeybindsList() {
	const [keybinds, setKeybinds] = useState<KeybindsListData | null>(
		keybindsCache,
	);
	const [loading, setLoading] = useState(!keybindsCache);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (keybindsCache) {
			setKeybinds(keybindsCache);
			setLoading(false);
			return;
		}

		if (!fetchPromise) {
			// The JSON file is large, so we use a dynamic import.
			fetchPromise = import("@/data/keys/KeybindsList.json");
		}

		fetchPromise
			.then((data) => {
				keybindsCache = data.default;
				setKeybinds(data.default);
			})
			.catch((err) => {
				console.error("Failed to load keybinds list:", err);
				setError("Could not load keybinds list.");
			})
			.finally(() => {
				setLoading(false);
			});
	}, []);

	return { keybinds, loading, error };
}
