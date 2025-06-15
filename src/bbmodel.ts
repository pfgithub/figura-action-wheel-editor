export type BBModel = {
    meta: {
        format_version: "4.10",
    },
    outliner: BBModelOutliner[],
    animations: BBModelAnimation[],
};
export type BBModelOutliner = {
    name: string,
    children: BBModelOutliner[],
};
export type BBModelAnimation = {
    name?: string, // id for this animation
    loop?: "once" | "hold" | "loop",
    length?: number, // seconds
};