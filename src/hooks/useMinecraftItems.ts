import type { MinecraftItem } from "@/types";
import { useState, useEffect } from "react";

export type MinecraftItemsData = Record<string, MinecraftItem>;

// Global cache for item data to avoid refetching
let itemsCache: MinecraftItemsData | null = null;
let fetchPromise: Promise<{ default: MinecraftItemsData }> | null = null;

export function useMinecraftItems() {
	const [items, setItems] = useState<MinecraftItemsData | null>(itemsCache);
	const [loading, setLoading] = useState(!itemsCache);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (itemsCache) {
			setItems(itemsCache);
			setLoading(false);
			return;
		}

		if (!fetchPromise) {
			fetchPromise = import("@/data/items/1.21.5.json").then((data) => {
				itemsCache = data.default;
				return data;
			});
		}

		fetchPromise
			.then((data) => {
				setItems(data.default);
			})
			.catch((err) => {
				setError(err.message);
			})
			.finally(() => {
				setLoading(false);
			});
	}, []);

	return { items, loading, error };
}
