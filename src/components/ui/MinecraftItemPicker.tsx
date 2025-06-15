import { useMinecraftItems } from "@/hooks/useMinecraftItems";
import { useState } from "react";
import { Button } from "./Button";
import { Input } from "./Input";
import { MinecraftItemPickerDialog } from "@/components/dialogs/MinecraftItemPickerDialog";

interface MinecraftItemPickerProps {
    value: string;
    onChange: (value: string) => void;
}

export function MinecraftItemPicker({ value, onChange }: MinecraftItemPickerProps) {
    const { items, loading } = useMinecraftItems();
    const [isPickerOpen, setPickerOpen] = useState(false);

    const handleSelect = (itemId: string) => {
        onChange(itemId);
        setPickerOpen(false);
    };

    const selectedItem = items?.[value];

    return (
        <>
            <div className="flex items-center gap-2">
                <Button
                    type="button"
                    onClick={() => setPickerOpen(true)}
                    className="p-0 w-10 h-10 flex-shrink-0 flex items-center justify-center bg-slate-700/50 border border-slate-600 hover:bg-slate-600"
                    aria-label="Choose item"
                >
                    {loading ? (
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    ) : selectedItem ? (
                        <img src={selectedItem.imageUrl} alt={selectedItem.name} className="w-6 h-6 image-pixelated" />
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-slate-400"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="m3.27 6.96 8.73 5.05 8.73-5.05"/><path d="M12 22.08V12"/></svg>
                    )}
                </Button>
                <Input
                    type="text"
                    placeholder="minecraft:stone"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    className="flex-grow"
                />
            </div>
            
            <MinecraftItemPickerDialog
                open={isPickerOpen}
                onClose={() => setPickerOpen(false)}
                onSelect={handleSelect}
            />
        </>
    );
}