import { useState, useEffect } from "react";

export type MinecraftItem = {
    id: string;
    name: string;
    imageUrl: string;
};

export type MinecraftItemsData = Record<string, MinecraftItem>;

// Global cache for item data to avoid refetching
let itemsCache: MinecraftItemsData | null = null;
let fetchPromise: Promise<MinecraftItemsData> | null = null;

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
            fetchPromise = fetch('/minecraft-items.json')
                .then(res => {
                    if (!res.ok) {
                        throw new Error(`Failed to fetch items: ${res.statusText}`);
                    }
                    return res.json();
                })
                .then(data => {
                    itemsCache = data;
                    return data;
                });
        }
        
        fetchPromise
            .then(data => {
                setItems(data);
            })
            .catch(err => {
                setError(err.message);
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    return { items, loading, error };
}