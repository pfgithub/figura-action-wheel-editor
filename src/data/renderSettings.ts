import type { RenderSettingData, RenderSettingID, RenderValueData, RenderValueID } from "@/types";

export const renderSettings: Map<RenderSettingID, RenderSettingData> = new Map();
function addRenderSetting(lua: string, name: string) {
    renderSettings.set(lua as RenderSettingID, {id: lua as RenderSettingID, name});
}

const playerPart = [
    "ALL",
    "PLAYER",
    "OUTER_LAYER",
    "INNER_LAYER",
    "CAPE",
    "ARMOR",
    "HELMET",
    "CHESTPLATE",
    "LEGGINGS",
    "BOOTS",
    "ELYTRA",
    "HELD_ITEMS",
    "PARROTS",
];
for (const layer of playerPart) {
    addRenderSetting(`vanilla_model.${layer}.setVisible(%cond%)`, "Hide vanilla_model." + layer + " (Group)");
}
const playerParts = [
    "HEAD",
    "BODY",
    "LEFT_ARM",
    "RIGHT_ARM",
    "LEFT_LEG",
    "RIGHT_LEG",
    "HAT",
    "JACKET",
    "LEFT_SLEEVE",
    "RIGHT_SLEEVE",
    "LEFT_PANTS",
    "RIGHT_PANTS",
    "CAPE_MODEL",
    "FAKE_CAPE",
    "HELMET_ITEM",
    "HELMET_HEAD",
    "HELMET_HAT",
    "CHESTPLATE_BODY",
    "CHESTPLATE_LEFT_ARM",
    "CHESTPLATE_RIGHT_ARM",
    "LEGGINGS_BODY",
    "LEGGINGS_LEFT_LEG",
    "LEGGINGS_RIGHT_LEG",
    "BOOTS_LEFT_LEG",
    "BOOTS_RIGHT_LEG",
    "LEFT_ELYTRA",
    "RIGHT_ELYTRA",
    "LEFT_ITEM",
    "RIGHT_ITEM",
    "LEFT_PARROT",
    "RIGHT_PARROT",
];
for (const part of playerParts) {
    addRenderSetting(`vanilla_model.${part}.setVisible(%cond%)`, "Hide vanilla_model." + part + " (Part)");
}

addRenderSetting("renderer:setForcePaperdoll(%cond%)", "Force Paperdoll");
addRenderSetting("renderer:setRenderCrosshair(not (%cond%))", "Hide Crosshair");
addRenderSetting("renderer:setRenderVehicle(not (%cond%))", "Hide Vehicle");
addRenderSetting("renderer:setUpsideDown(%cond%)", "Upside Down");




export const renderValues: Map<RenderValueID, RenderValueData> = new Map();
function addRenderValue(lua: string, name: string) {
    renderValues.set(lua as RenderValueID, {id: lua as RenderValueID, name});
}


const playerDoing = [
    ["crouching", `player:getPose() == "CROUCHING"`],
    ["sprinting", `player:isSprinting()`],
    ["blocking", `player:isBlocking()`],
    ["climbing", `player:isClimbing()`],
    ["gliding", `player:isGliding()`],
    ["sneaking", `player:isSneaking()`], // if holding shift
    ["fishing", `player:isFishing()`],
    ["sleeping", `player:getPose() == "SLEEPING"`],
    ["swimming", `player:getPose() == "SWIMMING"`],
    ["visually swimming", `player:isVisuallySwimming()`],
    ["riptide spinning", `player:riptideSpinning()`],
    ["creative flight", `playerIsFlying`],
    ["walking", `player:getVelocity().xz:length() > .01`],
    ["alive", `player:isAlive()`],
    ["glowing", `player:isGlowing()`],
    ["in lava", `player:isInLava()`],
    ["in rain", `player:isInRain()`],
    ["in water", `player:isInWater()`],
    ["invisible", `player:isInvisible()`],
    ["on fire", `player:isOnFire()`],
    ["on ground", `player:isOnGround()`],
    ["block below is solid", `world.getBlockState(player:getPos():add(0, -0.1, 0)):isSolidBlock()`],
    ["underwater", `player:isUnderwater()`],
    ["wet", `player:isWet()`],
];
for(const [name, value] of playerDoing) {
    addRenderValue(value, "Player is " + name);
}


addRenderValue(`context == "FIRST_PERSON"`, "Rendering in First Person");
addRenderValue(`context == "PAPERDOLL"`, "Rendering Paperdoll");
addRenderValue(`context == "OTHER"`, "Rendering Other");

addRenderValue(`renderer:isFirstPerson()`, "Camera is First Person");
addRenderValue(`renderer:isCameraBackwards()`, "Camera is Backwards");
