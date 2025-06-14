export type BBModel = {
    meta: {
        format_version: "4.10",
    },
    animations: BBModelAnimation[],
};
export type BBModelAnimation = {
    name?: string, // id for this animation
    loop?: "once" | "hold" | "loop",
    length?: number, // seconds
};