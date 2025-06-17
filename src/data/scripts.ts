import type { ScriptData, ScriptDataInstanceType, UUID } from "@/types";
import offsetCameraPivot from "./scripts/offsetCameraPivot.lua" with {type: "text"};

export const scripts: Record<UUID, ScriptData> = {};

async function hashUUID(data: Uint8Array): Promise<UUID> {
    const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", data));
    const toHex = (seg: Uint8Array) => [...seg].map(x => x.toString(16).padStart(2, '0')).join('');
    const uuid = `${toHex(hash.subarray(0, 4))}-${toHex(hash.subarray(4,6))}-${toHex(hash.subarray(6, 8))}-${toHex(hash.subarray(8, 10))}-${toHex(hash.subarray(10, 16))}` as UUID;
    return uuid;
}
async function addScript(name: string, text: string, instances: (cb: (sub: string) => Promise<UUID>) => Promise<ScriptDataInstanceType[]>) {
    const uuid = await hashUUID(new TextEncoder().encode(text));
    scripts[uuid] = {
        uuid,
        name,
        instanceTypes: Object.fromEntries((await instances((sub: string) => hashUUID(new TextEncoder().encode(`[${sub}]` + text)))).map(q => [q.uuid, q])),
    };
}

await addScript("Camera Pivot", offsetCameraPivot, async (sub): Promise<ScriptDataInstanceType[]> => [
    {
        uuid: await sub("CameraPivot"),
        name: "Camera Pivot",
        mode: "one",
        parameters: [
            {
                uuid: await sub("CameraPivot/modelPart"),
                name: "Model Root",
                type: {
                    kind: "ModelPart",      
                },
            },
            {
                uuid: await sub("CameraPivot/offset"),
                name: "Offset",
                type: {kind: "vec3"},
                defaultValue: [0, 27.648, 0],
            },
        ],
        defines: {
            conditions: {},
            settings: {
                [await sub("CameraPivot/Disable")]: {
                    uuid: await sub("CameraPivot/Disable"),
                    name: "Disable",
                },
                [await sub("CameraPivot/Allow Rotate Camera")]: {
                    uuid: await sub("CameraPivot/Allow Rotate Camera"),
                    name: "Allow Rotate Camera",
                },
                [await sub("CameraPivot/Move Crosshair")]: {
                    uuid: await sub("CameraPivot/Move Crosshair"),
                    name: "Fix Crosshair (May trigger AntiCheat in multiplayer)",
                },
            },
            actionWheels: {},
        },
    },
]);

/*
TODO:
- need to be able to add RenderSetting from script
  - it will be ($ScriptName.$ComponentName: $ComponentProp)
- need to be able to add RenderValue from script
  - it will be (dropdown: Component List) (dropdown: Render Value)
- need to be able to add action wheel from script
*/