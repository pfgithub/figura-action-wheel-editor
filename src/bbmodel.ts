import type { UUID } from "@/types";

export type BBModel = {
    meta: {
        format_version: "4.10",
    },
    elements: BBModelElement[],
    outliner: BBModelOutliner[],
    animations: BBModelAnimation[],
    textures: BBModelTexture[],
};
export type BBModelTexture = {
    name: string,
    source: string,
};
export type BBModelElement = {
    name: string,
    uuid: UUID,
};
export type BBModelOutliner = {
    name: string,
    uuid: UUID,
    children: (UUID | BBModelOutliner)[],
};
export type BBModelAnimation = {
    name?: string, // id for this animation
    loop?: "once" | "hold" | "loop",
    length?: number, // seconds
};